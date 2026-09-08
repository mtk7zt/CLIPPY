package dev.venturis.clippy;

import android.app.*;
import android.content.*;
import android.os.*;
import android.net.*;
import java.util.concurrent.*;
import org.json.JSONObject;

/** User-enabled foreground transport; reading and receiving have different OS boundaries. */
public final class ClipboardSyncService extends Service {
    static final String STOP="dev.venturis.clippy.STOP_SYNC";
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ScheduledThreadPoolExecutor recovery=new ScheduledThreadPoolExecutor(1);
    private ClipboardSyncWorker worker;
    private ClipboardManager clipboard;
    private ClippyApi.Session monitor;
    private volatile boolean stopped;
    private int failures;
    private static final String REMOTE_LABEL="Clippy remote:";
    private final ClipboardManager.OnPrimaryClipChangedListener listener=this::publishLocalClip;
    @Override public void onCreate(){super.onCreate();
        getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel("clippy-sync","Clippy clipboard sync",NotificationManager.IMPORTANCE_LOW));
        recovery.setRemoveOnCancelPolicy(true);recovery.setExecuteExistingDelayedTasksAfterShutdownPolicy(false);
    }
    private Notification notification(){
        PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop=PendingIntent.getService(this,1,new Intent(this,ClipboardSyncService.class).setAction(STOP),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this,"clippy-sync").setSmallIcon(android.R.drawable.ic_menu_share)
            .setContentTitle("Clippy · "+SyncStatus.summary()).setContentText("Receive with sync on. Open Clippy to share clipboard changes.")
            .setContentIntent(open).setOngoing(true).setOnlyAlertOnce(true).setVisibility(Notification.VISIBILITY_SECRET)
            .addAction(new Notification.Action.Builder(null,"Stop sync",stop).build()).build();
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent!=null&&STOP.equals(intent.getAction())){DeviceConfig.store(this).edit().putBoolean("syncEnabled",false).apply();SyncStatus.stopReason="Stopped from notification";stopSelf();return START_NOT_STICKY;}
        if(!DeviceConfig.isPaired(this)||!DeviceConfig.store(this).getBoolean("syncEnabled",false)||!DeviceConfig.store(this).getString("syncPauseReason","").isEmpty()){
            stopSelf();return START_NOT_STICKY;
        }
        if(worker!=null)return START_STICKY;
        SyncStatus.running=true;SyncStatus.stopReason="Running";SyncStatus.backend=false;
        startForeground(1,notification());
        try{
            SyncJournal journal=new SyncJournal(new EncryptedSyncStorage(this));
            clipboard=getSystemService(ClipboardManager.class);
            monitor=new ClippyApi.Session(this);
            worker=new ClipboardSyncWorker(new ClippyApi.Session(this),clip->{
                FutureTask<Void> apply=new FutureTask<>(()->{
                    if(stopped)throw new InterruptedException("Sync stopped");
                    if(screenLocked())throw new IllegalStateException("Screen locked; receipt waits for unlock.");
                    clipboard.setPrimaryClip(ClipData.newPlainText(REMOTE_LABEL+clip.id,clip.text));
                    return null;
                });
                main.post(apply);
                try{apply.get(5,TimeUnit.SECONDS);}finally{main.removeCallbacks(apply);apply.cancel(false);}
            },journal);
            clipboard.addPrimaryClipChangedListener(listener);
            worker.observe((operation,detail)->{
                SyncStatus.update(operation,detail);
                if(SyncStatus.lastSync>0)DeviceConfig.store(this).edit().putLong("lastSync",SyncStatus.lastSync).apply();
            });
            worker.start();recovery.execute(this::heartbeat);
        }catch(Exception error){
            DeviceConfig.store(this).edit().putString("syncPauseReason","Saved sync state could not be opened. Pending data was not reset.").apply();
            SyncStatus.status="Sync paused · saved state unavailable";stopSelf();return START_NOT_STICKY;
        }
        return START_STICKY; // OS may recover a killed service, only while user intent remains enabled.
    }
    static boolean notificationsAllowed(Context context){
        NotificationManager manager=context.getSystemService(NotificationManager.class);
        NotificationChannel channel=manager.getNotificationChannel("clippy-sync");
        return manager.areNotificationsEnabled()&&(channel==null||channel.getImportance()!=NotificationManager.IMPORTANCE_NONE);
    }
    private boolean screenLocked(){
        KeyguardManager keyguard=getSystemService(KeyguardManager.class);
        return keyguard.isDeviceLocked()||keyguard.isKeyguardLocked()||!getSystemService(PowerManager.class).isInteractive();
    }
    private void heartbeat(){
        if(stopped)return;
        try{
            if(!notificationsAllowed(this)){DeviceConfig.store(this).edit().putString("syncPauseReason","Enable the sync notification in Android Settings, then retry.").apply();main.post(this::stopSelf);return;}
            SyncStatus.network=getSystemService(ConnectivityManager.class).getActiveNetwork()!=null;
            SyncStatus.locked=screenLocked();
            JSONObject status=monitor.request("/api/native/status","GET",null).getJSONObject("data");
            JSONObject device=status.getJSONObject("device");
            SyncStatus.allowed=status.optBoolean("clipboardAllowed",false);
            if(!device.getBoolean("trusted")||device.optString("status").equals("disconnected")){
                DeviceConfig.store(this).edit().putString("syncPauseReason","Connection paused or trust revoked. Reconnect from Clippy.").apply();
                main.post(this::stopSelf);return;
            }
            if(device.optString("status").equals("offline"))monitor.request("/api/native/devices/connect","POST",new JSONObject().put("resume",true));
            SyncStatus.backend=true;failures=0;
            monitor.request("/api/native/sync/status","POST",SyncStatus.payload(this));
        }catch(Exception error){
            SyncStatus.backend=false;failures=Math.min(failures+1,5);
            if(error instanceof ClippyApi.ApiException&&((ClippyApi.ApiException)error).code.equals("AUTH_REQUIRED")){
                DeviceConfig.store(this).edit().putString("syncPauseReason","Pairing is no longer authorized. Pair again.").apply();main.post(this::stopSelf);return;
            }
        }
        main.post(()->{if(!stopped)getSystemService(NotificationManager.class).notify(1,notification());});
        if(!stopped)try{recovery.schedule(this::heartbeat,failures==0?3:Math.min(30,1L<<failures),TimeUnit.SECONDS);}catch(RejectedExecutionException ignored){}
    }
    private void publishLocalClip(){
        if(stopped||worker==null||!SyncPolicy.canRead(Build.VERSION.SDK_INT,SyncStatus.focused,screenLocked()))return;
        try{
            ClipData data=clipboard.getPrimaryClip();
            if(data==null||data.getItemCount()==0)return;
            CharSequence value=data.getItemAt(0).getText(),label=data.getDescription().getLabel();
            worker.localChanged(value==null?null:value.toString(),label!=null&&label.toString().startsWith(REMOTE_LABEL));
        }catch(SecurityException restricted){SyncStatus.status="Clipboard access restricted by Android";}
    }
    @Override public void onTimeout(int startId,int foregroundServiceType){
        DeviceConfig.store(this).edit().putString("syncPauseReason","Android background time limit reached. Open Clippy and retry sync.").apply();
        SyncStatus.stopReason="Android foreground-service time limit";stopSelf();
    }
    @Override public IBinder onBind(Intent intent){return null;}
    @Override public void onDestroy(){
        stopped=true;SyncStatus.running=false;
        SyncStatus.status=DeviceConfig.store(this).getBoolean("syncEnabled",false)?"Sync paused · reopen Clippy to resume":"Sync disabled";
        if(clipboard!=null)clipboard.removePrimaryClipChangedListener(listener);
        if(worker!=null)worker.close();
        recovery.shutdownNow();if(monitor!=null)monitor.close();
        main.removeCallbacksAndMessages(null);stopForeground(STOP_FOREGROUND_REMOVE);super.onDestroy();
    }
}
