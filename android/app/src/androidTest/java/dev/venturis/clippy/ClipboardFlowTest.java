package dev.venturis.clippy;

import android.app.*;
import android.content.*;
import android.os.Bundle;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

/** Real-device regression runner, with no production test endpoints or test-only permissions. */
public final class ClipboardFlowTest extends Instrumentation {
    private String server;
    private Activity activity;
    private int passed;
    private boolean recovery;
    private boolean resumeOutbox;
    @Override public void onCreate(Bundle args) { super.onCreate(args); server = args.getString("serverUrl", ""); recovery = "true".equals(args.getString("recovery")); resumeOutbox="true".equals(args.getString("resumeOutbox")); start(); }
    interface Check { boolean ok() throws Exception; }
    private void require(boolean value, String message) { if (!value) throw new AssertionError(message); }
    private void until(Check check, String message) throws Exception {
        long end = System.currentTimeMillis() + 60000;
        while (System.currentTimeMillis() < end) { try { if (check.ok()) return; } catch(java.io.IOException unavailable) { /* Allow documented network backoff to recover. */ } Thread.sleep(100); }
        throw new AssertionError(message);
    }
    private View find(View root, String label) {
        if (root instanceof Button && ((Button)root).getText().toString().equals(label)) return root;
        if (root instanceof ViewGroup) for (int i=0;i<((ViewGroup)root).getChildCount();i++) {
            View result=find(((ViewGroup)root).getChildAt(i),label); if(result!=null)return result;
        }
        return null;
    }
    private void click(String text) {
        runOnMainSync(()-> { View button=find(activity.getWindow().getDecorView(),text); require(button!=null && button.isEnabled(),"Unavailable control: "+text); button.performClick(); });
        waitForIdleSync();
    }
    private void type(int id,String value) { runOnMainSync(()-> {EditText input=activity.findViewById(id);require(input!=null,"Missing input");input.setText(value);}); }
    private JSONObject api(String path,String method,JSONObject body) throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(ServerUrl.endpoint(server,path,true)).openConnection();
        c.setConnectTimeout(10000);c.setReadTimeout(15000);c.setRequestMethod(method);
        try {
            if(body!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type","application/json");try(java.io.OutputStream out=c.getOutputStream()){out.write(body.toString().getBytes(StandardCharsets.UTF_8));}}
            require(c.getResponseCode()<300,"API response failed: "+path);
            try(java.io.InputStream in=c.getInputStream();java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream()) {
                byte[] buffer=new byte[4096];int n;while((n=in.read(buffer))!=-1)bytes.write(buffer,0,n);return new JSONObject(bytes.toString("UTF-8"));
            }
        } finally {c.disconnect();}
    }
    private JSONObject clip(String value) throws Exception {
        JSONArray clips=api("/api/clipboard","GET",null).getJSONArray("data");
        for(int i=0;i<clips.length();i++)if(clips.getJSONObject(i).getString("text").equals(value))return clips.getJSONObject(i);
        return null;
    }
    private void pass(String name){passed++;Bundle b=new Bundle();b.putString("stream","PASS: "+name+"\n");sendStatus(0,b);}
    private void shell(String command) throws Exception {
        try(java.io.InputStream in=new android.os.ParcelFileDescriptor.AutoCloseInputStream(getUiAutomation().executeShellCommand(command))){byte[] buffer=new byte[1024];while(in.read(buffer)!=-1){} }
    }
    private void checkpoint(String message){Bundle b=new Bundle();b.putString("stream",message+"\n");sendStatus(0,b);}
    private void resumeDurableOutbox() throws Exception {
        require(DeviceConfig.isPaired(getTargetContext()),"Process restart lost pairing");
        String value=getContext().getSharedPreferences("recovery-test",0).getString("pending","");require(!value.isEmpty(),"No synthetic pending test event");
        SyncJournal journal=new SyncJournal(new EncryptedSyncStorage(getTargetContext()));
        String event=null;for(java.util.Map.Entry<String,String> entry:journal.outgoing().entrySet())if(entry.getValue().equals(value))event=entry.getKey();
        require(event!=null,"Process restart lost encrypted outgoing event");final String originalId=event;
        activity=startActivitySync(new Intent(getTargetContext(),MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK));
        until(()->SyncStatus.running,"Saved opt-in did not resume after process restart");
        until(()->clip(value)!=null,"Durable outbox did not upload after process restart");
        require(clip(value).getString("eventId").equals(originalId),"Process restart changed event ID");
        Thread.sleep(3500);JSONArray history=api("/api/clipboard","GET",null).getJSONArray("data");int count=0;
        for(int i=0;i<history.length();i++)if(value.equals(history.getJSONObject(i).getString("text")))count++;
        require(count==1,"Restart duplicated pending upload");pass("New Android process: encrypted outbox, stable event ID, automatic upload, no duplicate");
        recoveryRound("Post-process-restart transport");
    }
    private void recoveryRound(String name) throws Exception {
        String remote="Clippy recovery remote "+System.nanoTime();
        api("/api/clipboard","POST",new JSONObject().put("text",remote));
        until(()->clip(remote).getJSONObject("sync").getJSONArray("acknowledgements").length()==1,"Recovery receipt missing: "+name);
        runOnMainSync(()->require(remote.contentEquals(activity.getSystemService(ClipboardManager.class).getPrimaryClip().getItemAt(0).getText()),"Android clipboard mismatch"));
        String local="Clippy recovery local "+System.nanoTime();
        runOnMainSync(()->activity.getSystemService(ClipboardManager.class).setPrimaryClip(ClipData.newPlainText("Recovery local",local)));
        until(()->clip(local)!=null,"Recovery upload missing: "+name);
        Thread.sleep(3500);
        JSONArray items=api("/api/clipboard","GET",null).getJSONArray("data");int count=0;
        for(int i=0;i<items.length();i++)if(remote.equals(items.getJSONObject(i).getString("text")))count++;
        require(count==1,"Recovery echo detected");pass(name+": both directions, one receipt, no echo");
    }
    private void recoverExisting() throws Exception {
        require(DeviceConfig.isPaired(getTargetContext()),"Recovery requires the existing paired instance");
        activity=startActivitySync(new Intent(getTargetContext(),MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK));
        until(()->{AtomicReference<Boolean> ready=new AtomicReference<>(false);runOnMainSync(()->ready.set(find(activity.getWindow().getDecorView(),"Enable clipboard sync")!=null||find(activity.getWindow().getDecorView(),"Disable clipboard sync")!=null));return ready.get();},"Trusted workspace missing");
        AtomicReference<Boolean> retry=new AtomicReference<>(false);runOnMainSync(()->retry.set(find(activity.getWindow().getDecorView(),"Retry connection")!=null));
        if(retry.get()){click("Retry connection");until(()->{AtomicReference<Boolean> ready=new AtomicReference<>(false);runOnMainSync(()->{View button=find(activity.getWindow().getDecorView(),"Enable clipboard sync");ready.set(button!=null&&button.isEnabled());});return ready.get();},"Could not reconnect trusted test instance");}
        if(SyncStatus.running){click("Disable clipboard sync");until(()->!SyncStatus.running,"Cannot stop service");}
        click("Enable clipboard sync");until(()->SyncStatus.running,"Cannot re-enable service");
        recoveryRound("Re-enabled after shutdown");
        click("Disable clipboard sync");until(()->!SyncStatus.running,"Cannot stop service twice");
        click("Enable clipboard sync");until(()->SyncStatus.running,"Cannot restart service");
        recoveryRound("Second service restart");
        Bundle checkpoint=new Bundle();checkpoint.putString("stream","RESTART_BACKEND_NOW (same store; 30-second window)\n");sendStatus(0,checkpoint);
        Thread.sleep(45000);
        until(()->{try{api("/api/health","GET",null);return true;}catch(Exception unavailable){return false;}},"Backend did not return");
        until(()->SyncStatus.running,"Service did not survive backend restart: "+SyncStatus.stopReason);
        recoveryRound("Backend restart recovery");
        runOnMainSync(()->activity.finish());waitForIdleSync();
        until(()->api("/api/devices/"+DeviceConfig.deviceId(getTargetContext()),"GET",null).getJSONObject("data").getJSONObject("sync").optString("clipboardAccess").equals("restricted"),"Activity closed but service restriction not reported");
        String background="Clippy background receipt "+System.nanoTime();
        api("/api/clipboard","POST",new JSONObject().put("text",background));
        until(()->clip(background).getJSONObject("sync").getJSONArray("acknowledgements").length()==1,"Activity-closed receipt missing");
        require(SyncStatus.running,"Closing Activity stopped service");
        activity=startActivitySync(new Intent(getTargetContext(),MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));waitForIdleSync();
        runOnMainSync(()->require(background.contentEquals(activity.getSystemService(ClipboardManager.class).getPrimaryClip().getItemAt(0).getText()),"Background receipt did not reach actual clipboard"));
        pass("Activity closed: service alive, read restriction reported, remote clipboard verified on reopen");
        require(!getTargetContext().getSystemService(KeyguardManager.class).isDeviceSecure(),"Locked-screen QA requires an unsecured test emulator; no credentials are bypassed");
        String locked="Clippy locked receipt "+System.nanoTime();
        try{
            shell("input keyevent KEYCODE_SLEEP");
            until(()->SyncStatus.locked,"Screen-off restriction missing");
            api("/api/clipboard","POST",new JSONObject().put("text",locked));Thread.sleep(6500);
            require(clip(locked).getJSONObject("sync").getJSONArray("acknowledgements").length()==0,"Locked screen falsely acknowledged receipt");
        }finally{shell("input keyevent KEYCODE_WAKEUP");shell("wm dismiss-keyguard");}
        until(()->clip(locked).getJSONObject("sync").getJSONArray("acknowledgements").length()==1,"Unlock did not recover pending receipt");
        pass("Screen off/lock: receipt retained without false acknowledgement; unlock recovers");
        boolean wifi=android.provider.Settings.Global.getInt(getTargetContext().getContentResolver(),"wifi_on",0)!=0;
        boolean data=android.provider.Settings.Global.getInt(getTargetContext().getContentResolver(),"mobile_data",0)!=0;
        String offline="Clippy network recovery "+System.nanoTime();
        try{
            shell("svc wifi disable");shell("svc data disable");
            until(()->getTargetContext().getSystemService(android.net.ConnectivityManager.class).getActiveNetwork()==null,"Emulator network did not stop");
            runOnMainSync(()->activity.getSystemService(ClipboardManager.class).setPrimaryClip(ClipData.newPlainText("Network QA",offline)));
            Thread.sleep(6000);require(SyncStatus.running,"Network loss stopped the service");
        }finally{if(wifi)shell("svc wifi enable");if(data)shell("svc data enable");}
        until(()->clip(offline)!=null,"Network recovery lost outgoing clipboard event");
        recoveryRound("Emulator network reconnect");
        pass("Wi-Fi/mobile interruption: service survived and pending outgoing text recovered");
        checkpoint("HOLD_PUBLISH_FOR_PROCESS_RESTART");Thread.sleep(1500);
        String pending="Clippy durable process recovery "+System.nanoTime();
        getContext().getSharedPreferences("recovery-test",0).edit().putString("pending",pending).commit();
        runOnMainSync(()->activity.getSystemService(ClipboardManager.class).setPrimaryClip(ClipData.newPlainText("Process QA",pending)));
        until(()->SyncStatus.status.contains("Temporary failure"),"Publish fault was not observed");
        require(clip(pending)==null,"Publish fault did not retain pending work");
        pass("Process restart prepared: real clipboard change retained during upload failure");
    }
    @Override public void onStart() {
        Bundle result=new Bundle();
        try {
            server=ServerUrl.normalize(server,true);
            if(resumeOutbox){resumeDurableOutbox();result.putString("stream","\nOK ("+passed+" process recovery checks)\n");finish(Activity.RESULT_OK,result);return;}
            if(recovery){recoverExisting();result.putString("stream","\nOK ("+passed+" recovery checks)\n");finish(Activity.RESULT_OK,result);return;}
            require(!DeviceConfig.isPaired(getTargetContext()),"Use an unpaired Clippy test instance; existing credentials will not be overwritten.");
            api("/api/health","GET",null);
            Intent launch=new Intent(getTargetContext(),MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);
            activity=startActivitySync(launch);waitForIdleSync();
            for(String invalid:new String[]{"","   ","10.0.2.2:4173","/api/native/devices/register"}) {
                type(R.id.server_url,invalid);click("Connect and pair");
                runOnMainSync(()->{EditText input=activity.findViewById(R.id.server_url);require(input.getText().toString().equals(invalid)&&input.getError()!=null,"Invalid URL must remain editable with a validation message");});
                require(!DeviceConfig.isPaired(getTargetContext()),"Invalid URL triggered registration");
            }
            pass("Invalid URL guard and draft preservation");
            type(R.id.server_url,"  "+server+"/  ");type(R.id.device_name,"Clippy BlueStacks QA");click("Connect and pair");
            until(()->DeviceConfig.isPaired(getTargetContext()),"Android registration failed");
            require(DeviceConfig.api(getTargetContext()).equals(server),"Stored server URL was not normalized");
            String pairing=DeviceConfig.store(getTargetContext()).getString("pairingId","");
            String code=DeviceConfig.store(getTargetContext()).getString("pairingCode","");
            require(!DeviceConfig.store(getTargetContext()).getBoolean("approved",false),"Device trusted before web approval");
            pass("LAN registration and pending trust");
            api("/api/pairing/"+pairing+"/approve","POST",new JSONObject().put("code",code));
            until(()->DeviceConfig.store(getTargetContext()).getBoolean("approved",false),"Browser approval not received");
            until(()->{AtomicReference<Boolean> ready=new AtomicReference<>(false);runOnMainSync(()->ready.set(find(activity.getWindow().getDecorView(),"Enable clipboard sync")!=null));return ready.get();},"Connected UI missing");
            pass("Browser approval confirmed on Android");
            click("Enable clipboard sync");until(()->SyncStatus.running,"Foreground clipboard service failed to start");
            click("Clipboard");
            String sent="Clippy Android QA "+System.currentTimeMillis();
            type(R.id.clip_text,sent);click("Copy and sync text");until(()->clip(sent)!=null,"Upload blocked while polling");
            pass("Real local clipboard uploads during polling");
            String remote="Clippy browser QA "+System.currentTimeMillis();
            api("/api/clipboard","POST",new JSONObject().put("text",remote));
            until(()->{JSONObject c=clip(remote);return c!=null&&c.getJSONObject("sync").getJSONArray("acknowledgements").length()==1;},"Remote clipboard was not acknowledged");
            runOnMainSync(()->{ClipboardManager c=activity.getSystemService(ClipboardManager.class);require(c.getPrimaryClip()!=null&&remote.contentEquals(c.getPrimaryClip().getItemAt(0).getText()),"Remote text missing from actual Android clipboard");});
            pass("Remote receipt, actual Android clipboard, and acknowledgement");
            type(R.id.clip_text,sent+" next");click("Copy and sync text");until(()->clip(sent+" next")!=null,"Acknowledgement blocked next upload");
            Thread.sleep(6500);
            JSONArray history=api("/api/clipboard","GET",null).getJSONArray("data");int count=0;
            for(int i=0;i<history.length();i++)if(history.getJSONObject(i).getString("text").equals(remote))count++;
            require(count==1,"Polling created a clipboard echo");pass("Next upload and echo suppression across repeated polls");
            click("Disable clipboard sync");until(()->!SyncStatus.running,"Service did not stop");
            String stopped=sent+" stopped";
            runOnMainSync(()->activity.getSystemService(ClipboardManager.class).setPrimaryClip(ClipData.newPlainText("QA stopped",stopped)));
            Thread.sleep(3500);require(clip(stopped)==null,"Stopped service uploaded a clip");pass("Stopped service ignores new clipboard changes");
            result.putString("stream","\nOK ("+passed+" device regression checks)\n");finish(Activity.RESULT_OK,result);
        } catch(Throwable e) {result.putString("stream","\nFAIL after "+passed+" checks: "+e.getClass().getSimpleName()+": "+e.getMessage()+"\n");finish(Activity.RESULT_CANCELED,result);}
    }
}
