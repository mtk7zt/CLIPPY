package dev.venturis.clippy;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;
import org.json.JSONObject;
import java.util.concurrent.*;

/** Native views keep the companion small and match Clippy's dark workspace. */
public final class MainActivity extends Activity {
    private final int NAVY = Color.rgb(7,18,37), SURFACE = Color.rgb(16,29,52), TEXT = Color.rgb(231,240,255),
        MUTED = Color.rgb(159,181,211), BLUE = Color.rgb(120,173,255), TEAL = Color.rgb(107,221,187), RED = Color.rgb(255,135,142);
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ScheduledExecutorService network = Executors.newSingleThreadScheduledExecutor();
    private ClippyApi.Session session;
    private ScheduledFuture<?> statusJob;
    private LinearLayout content;
    private ScrollView scrollView;
    private String renderedScreen="";
    private EditText serverInput, nameInput, clipInput;
    private TextView feedback, connectionBadge, syncLabel, sentLabel, receivedLabel, ackLabel, timeLabel, echoLabel;
    private TextView serviceLabel, accessLabel, detailLabel;
    private Button connectButton;
    private String screen = "Connection", serverDraft = "", nameDraft = "", clipDraft = "", connection = "Not paired", pairing = "pending";
    private boolean approved, connected, busy, destroyed;
    private int generation;
    private String notice = "";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        SyncStatus.lastSync = DeviceConfig.store(this).getLong("lastSync", SyncStatus.lastSync);
        serverDraft = state == null ? DeviceConfig.api(this) : state.getString("server", "");
        nameDraft = state == null ? DeviceConfig.store(this).getString("name", Build.MODEL) : state.getString("name", Build.MODEL);
        clipDraft = state == null ? "" : state.getString("clip", "");
        connection = DeviceConfig.isPaired(this) ? "Checking connection…" : "Not paired";
        session = new ClippyApi.Session(this);
        render();
    }
    @Override protected void onResume() { super.onResume(); scheduleStatus(); main.post(tick); }
    @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);SyncStatus.focused=focused;}
    @Override protected void onPause() { super.onPause();SyncStatus.focused=false; if (statusJob != null) statusJob.cancel(true); main.removeCallbacks(tick); }
    @Override protected void onDestroy() { destroyed = true; generation++; if (session != null) session.close(); network.shutdownNow(); main.removeCallbacksAndMessages(null); super.onDestroy(); }
    @Override protected void onSaveInstanceState(Bundle out) {
        captureDrafts(); out.putString("server", serverDraft); out.putString("name", nameDraft); out.putString("clip", clipDraft); super.onSaveInstanceState(out);
    }
    private void captureDrafts() {
        if (serverInput != null) serverDraft = serverInput.getText().toString();
        if (nameInput != null) nameDraft = nameInput.getText().toString();
        if (clipInput != null) clipDraft = clipInput.getText().toString();
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private GradientDrawable shape(int color, int radius) {
        GradientDrawable d = new GradientDrawable(); d.setColor(color); d.setCornerRadius(dp(radius)); d.setStroke(dp(1), Color.rgb(40,62,88)); return d;
    }
    private TextView text(String value, int size, int color) {
        TextView v = new TextView(this); v.setText(value); v.setTextSize(size); v.setTextColor(color);
        v.setPadding(0, dp(5), 0, dp(5)); v.setLineSpacing(dp(3),1);
        return v;
    }
    private TextView heading(String value, int size) { TextView v = text(value, size, TEXT); v.setTypeface(null, Typeface.BOLD); return v; }
    private LinearLayout card(String eyebrow, String title) {
        LinearLayout c = new LinearLayout(this); c.setOrientation(LinearLayout.VERTICAL); c.setPadding(dp(20),dp(18),dp(20),dp(18));
        c.setBackground(shape(SURFACE,22));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1,-2); p.bottomMargin = dp(16); c.setLayoutParams(p);
        TextView e = text(eyebrow.toUpperCase(java.util.Locale.ROOT),10,BLUE); e.setLetterSpacing(.16f); c.addView(e); c.addView(heading(title,22)); content.addView(c); return c;
    }
    private void vitals(LinearLayout parent){
        LinearLayout row=new LinearLayout(this);row.setPadding(0,dp(14),0,dp(6));
        for(int i=0;i<2;i++){
            LinearLayout tile=new LinearLayout(this);tile.setOrientation(1);tile.setPadding(dp(14),dp(10),dp(14),dp(10));tile.setBackground(shape(Color.rgb(20,38,65),16));
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,-2,1);if(i==0)p.rightMargin=dp(10);tile.setLayoutParams(p);
            tile.addView(text(i==0?"FOREGROUND SERVICE":"LAST SYNC",9,MUTED));
            TextView value=heading(i==0?(SyncStatus.running?"Running":"Stopped"):syncTime(),17);value.setTextColor(i==0&&SyncStatus.running?TEAL:TEXT);tile.addView(value);
            if(i==0)serviceLabel=value;else timeLabel=value;row.addView(tile);
        }parent.addView(row);
    }
    private String syncTime(){return SyncStatus.lastSync==0?"Not yet":android.text.format.DateFormat.format("HH:mm:ss",SyncStatus.lastSync).toString();}
    private String access(){return SyncStatus.locked?"Screen locked · receipts wait for unlock":SyncPolicy.canRead(Build.VERSION.SDK_INT,SyncStatus.focused,false)?"Clipboard reads available while focused":"Background reads restricted by Android";}
    private Button button(LinearLayout parent, String label, boolean primary, Runnable action) {
        Button b = new Button(this); b.setText(label); b.setAllCaps(false); b.setTextSize(14); b.setTypeface(null,Typeface.BOLD);
        b.setTextColor(primary ? NAVY : TEXT); b.setBackground(shape(primary ? BLUE : Color.rgb(25,43,67),14));
        b.setMinHeight(dp(50)); b.setPadding(dp(14),dp(10),dp(14),dp(10));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1,-2); p.topMargin=dp(12); b.setLayoutParams(p);
        b.setOnClickListener(v -> action.run()); parent.addView(b); return b;
    }
    private EditText input(LinearLayout parent, String label, String hint, String value, int id) {
        TextView caption = text(label,12,MUTED); caption.setLabelFor(id); parent.addView(caption);
        EditText v = new EditText(this); v.setId(id); v.setTextColor(TEXT); v.setHintTextColor(MUTED); v.setTextSize(15);
        v.setSingleLine(true); v.setHint(hint); v.setText(value); v.setPadding(dp(14),dp(12),dp(14),dp(12)); v.setMinHeight(dp(52));
        v.setBackground(shape(NAVY,12)); v.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO);
        parent.addView(v,new LinearLayout.LayoutParams(-1,-2)); return v;
    }
    private void render() {
        boolean same=screen.equals(renderedScreen);int scrollY=same&&scrollView!=null?scrollView.getScrollY():0;
        View focus=getCurrentFocus();int focusId=same&&focus!=null?focus.getId():View.NO_ID;
        int cursor=focus instanceof EditText?((EditText)focus).getSelectionStart():-1;renderedScreen=screen;
        captureDrafts();
        serverInput=null; nameInput=null; clipInput=null; syncLabel=null; sentLabel=null; receivedLabel=null; ackLabel=null; timeLabel=null; echoLabel=null;serviceLabel=null;accessLabel=null;detailLabel=null;
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
        root.setBackground(new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{Color.rgb(14,35,60),NAVY,Color.rgb(8,29,40)}));
        root.setPadding(dp(16),dp(18),dp(16),dp(10));
        root.setOnApplyWindowInsetsListener((v,insets)-> { root.setPadding(dp(16),dp(10)+insets.getSystemWindowInsetTop(),dp(16),dp(8)+insets.getSystemWindowInsetBottom()); return insets; });
        LinearLayout brand = new LinearLayout(this); brand.setGravity(Gravity.CENTER_VERTICAL); brand.setPadding(dp(4),dp(2),dp(4),dp(12));
        View mark = new View(this) {
            final Paint paint = new Paint(3);
            @Override protected void onDraw(Canvas c) {
                paint.setColor(BLUE); c.drawRoundRect(0,0,getWidth(),getHeight(),dp(14),dp(14),paint);
                c.save(); c.rotate(35,getWidth()/2f,getHeight()/2f); paint.setColor(NAVY); paint.setStyle(Paint.Style.STROKE); paint.setStrokeWidth(dp(2.5f));
                c.drawRoundRect(getWidth()*.3f,getHeight()*.17f,getWidth()*.65f,getHeight()*.82f,dp(8),dp(8),paint);
                c.drawLine(getWidth()*.46f,getHeight()*.3f,getWidth()*.46f,getHeight()*.67f,paint); paint.setStyle(Paint.Style.FILL); c.restore();
            }
            private float dp(float value) { return value*getResources().getDisplayMetrics().density; }
        };
        mark.setContentDescription("Clippy mark"); brand.addView(mark,new LinearLayout.LayoutParams(dp(38),dp(38)));
        LinearLayout lockup = new LinearLayout(this); lockup.setOrientation(1); lockup.setPadding(dp(12),0,0,0);
        lockup.addView(heading("Clippy",23)); lockup.addView(text("Venturis Labs · Android companion",11,MUTED)); brand.addView(lockup);
        root.addView(brand);
        ScrollView scroll = new ScrollView(this); scroll.setFillViewport(true);
        scrollView=scroll;
        LinearLayout centering = new LinearLayout(this); centering.setGravity(Gravity.TOP|Gravity.CENTER_HORIZONTAL);
        content = new LinearLayout(this); content.setOrientation(1);
        int width = Math.min(getResources().getDisplayMetrics().widthPixels-dp(32),dp(640));
        centering.addView(content,new LinearLayout.LayoutParams(width,-2)); scroll.addView(centering); root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        connectionBadge = text("●  "+connection,12,connected?TEAL:RED); connectionBadge.setPadding(dp(12),dp(7),dp(12),dp(7));connectionBadge.setBackground(shape(Color.rgb(20,38,57),40));
        LinearLayout.LayoutParams badgeParams=new LinearLayout.LayoutParams(-2,-2);badgeParams.bottomMargin=dp(14);content.addView(connectionBadge,badgeParams);
        feedback = text(notice,13,RED); feedback.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); feedback.setPadding(dp(6),0,dp(6),dp(12)); content.addView(feedback);
        feedback.setVisibility(notice.isEmpty()?View.GONE:View.VISIBLE);
        if (screen.equals("Connection")) connectionScreen(); else if (screen.equals("Clipboard")) clipboardScreen(); else settingsScreen();
        LinearLayout tabs = new LinearLayout(this); tabs.setPadding(dp(4),dp(8),dp(4),dp(2)); tabs.setBackground(shape(SURFACE,20));
        for (String name : new String[]{"Connection","Clipboard","Settings"}) {
            Button tab = new Button(this); tab.setText(name); tab.setAllCaps(false); tab.setTextSize(12); tab.setMinHeight(dp(52));
            tab.setTextColor(name.equals(screen)?BLUE:MUTED); tab.setBackgroundColor(Color.TRANSPARENT); tab.setSelected(name.equals(screen));
            tab.setOnClickListener(v->{ screen=name; notice=""; render(); }); tabs.addView(tab,new LinearLayout.LayoutParams(0,-2,1));
        }
        root.addView(tabs); setContentView(root); root.requestApplyInsets();
        View restored=focusId==View.NO_ID?null:findViewById(focusId);if(restored!=null){restored.requestFocus();if(restored instanceof EditText&&cursor>=0)((EditText)restored).setSelection(Math.min(cursor,((EditText)restored).length()));}scroll.post(()->scroll.scrollTo(0,scrollY));
    }
    private void connectionScreen() {
        if (!DeviceConfig.isPaired(this)) {
            LinearLayout c = card("Your devices, together","Connect your workspace");
            c.addView(text("Clipboard, carried with you. Start with the Clippy server running on your computer.",14,MUTED));
            serverInput = input(c,"Server URL","http://10.0.2.2:4173",serverDraft,R.id.server_url);
            serverInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_URI);
            nameInput = input(c,"Device name",Build.MODEL,nameDraft,R.id.device_name);
            connectButton = button(c,busy?"Connecting…":"Connect and pair",true,this::register);
            connectButton.setEnabled(!busy);
            LinearLayout help = card("Connection guide","Find your computer");
            help.addView(text("Android Emulator: http://10.0.2.2:4173\n\nBlueStacks: use your computer's LAN IP, for example http://192.168.1.42:4173.\n\n127.0.0.1 inside Android points to Android itself, not your computer.",13,MUTED));
            help.addView(text(policy(),12,BLUE)); button(help,"Retry connection",false,this::register);
        } else if (!approved) {
            LinearLayout c = card("Trust boundary","Verify this connection");
            c.addView(text(nameDraft+" → "+DeviceConfig.api(this),13,MUTED));
            String code = DeviceConfig.store(this).getString("pairingCode","----");
            TextView digits = heading(code.substring(0,Math.min(2,code.length()))+"  "+code.substring(Math.min(2,code.length())),42);
            digits.setGravity(Gravity.CENTER); digits.setPadding(0,dp(24),0,dp(24)); digits.setTextColor(BLUE); c.addView(digits);
            c.addView(text(pairing.equals("pending")?"Waiting for approval":pairing.equals("expired")?"Pairing code expired":pairing.equals("rejected")?"Pairing rejected":"Checking pairing",18,pairing.equals("pending")?BLUE:RED));
            c.addView(text("Open Devices in your web workspace. Compare this code and approve only if both devices belong to you. No trust is granted until the backend confirms approval.",13,MUTED));
            c.addView(text("Expires: "+DeviceConfig.store(this).getString("pairingExpiry","—"),11,MUTED));
            button(c,"Check approval",true,this::checkNow);
            if (pairing.equals("pending")) button(c,"Cancel pairing",false,()->cancelPairing());
            else button(c,"Retry pairing",false,()->{ clearLocal(); register(); });
        } else {
            LinearLayout c = card("Trusted workspace","Everything, in reach");
            c.addView(text(nameDraft,18,TEXT)); c.addView(text(DeviceConfig.api(this),13,MUTED));
            c.addView(text(connected?"Connected · trust approved":"Disconnected · trust retained",14,connected?TEAL:RED));
            vitals(c);syncLabel=heading(SyncStatus.summary(),18);c.addView(syncLabel);accessLabel=text(access(),12,MUTED);c.addView(accessLabel);
            button(c,SyncStatus.running?"Disable clipboard sync":"Enable clipboard sync",true,this::toggleSync).setEnabled(connected || SyncStatus.running);
            button(c,"Open clipboard",false,()->{screen="Clipboard";render();});
            button(c,connected?"Disconnect":"Retry connection",false,()->deviceAction(connected?"disconnect":"connect"));
            LinearLayout trust = card("Privacy","You control the connection");
            trust.addView(text("Text passes through your local Clippy server. "+policy()+"\nThis connection is not end-to-end encrypted.",13,MUTED));
            button(trust,"Revoke trust",false,()->confirm("Revoke trust?","This companion will need to pair again.",()->deviceAction("revoke-trust")));
        }
    }
    private void clipboardScreen() {
        LinearLayout c = card("Clipboard center","A shared notebook");
        syncLabel=heading(SyncStatus.summary(),24);syncLabel.setTextColor(TEAL);c.addView(syncLabel);
        accessLabel=text(access(),12,BLUE);c.addView(accessLabel);
        c.addView(text("Receive with this screen closed while the foreground service runs. On Android 10+, keep Clippy focused to read clipboard changes. No extra clipboard permission bypasses this restriction.",13,MUTED));
        button(c,SyncStatus.running?"Disable clipboard sync":"Enable clipboard sync",true,this::toggleSync).setEnabled(connected && approved || SyncStatus.running);
        clipInput=input(c,"Text to copy and sync","Write a short note…",clipDraft,R.id.clip_text);
        clipInput.setSingleLine(false); clipInput.setMinLines(2);
        button(c,"Copy and sync text",false,()->{
            if (!SyncStatus.running) { showError("Enable clipboard sync while connected first."); return; }
            String value=clipInput.getText().toString();
            if (value.trim().isEmpty() || value.length()>65536) { showError("Enter 1–65536 characters."); return; }
            getSystemService(ClipboardManager.class).setPrimaryClip(ClipData.newPlainText("Clippy local",value));
            showMessage("Copied locally. Waiting for the workspace response.");
        });
        LinearLayout latest=card("Latest activity","Your clipboard, in motion");
        detailLabel=text(SyncStatus.status,13,BLUE);latest.addView(detailLabel);
        sentLabel=text("Last sent · "+preview(SyncStatus.lastSent),14,TEXT); latest.addView(sentLabel);
        receivedLabel=text("Last received · "+preview(SyncStatus.lastReceived),14,TEXT); latest.addView(receivedLabel);
        ackLabel=text(SyncStatus.acknowledgement,12,TEAL); latest.addView(ackLabel);
        echoLabel=text(SyncStatus.echo,12,MUTED); latest.addView(echoLabel);
        timeLabel=text(lastSync(),12,MUTED); latest.addView(timeLabel);
        button(latest,"Retry sync",false,()->{if(connected && approved){stopSync();startSync();}else checkNow();});
    }
    private void settingsScreen() {
        LinearLayout c=card("Settings & diagnostics","Your connection");
        c.addView(text("Server\n"+(DeviceConfig.api(this).isEmpty()?"Not configured":DeviceConfig.api(this)),14,TEXT));
        c.addView(text("Device\n"+nameDraft,14,TEXT));
        c.addView(text("Status\n"+connection+"\n\n"+policy(),13,MUTED));
        c.addView(text("Foreground service: "+(SyncStatus.running?"Running":"Stopped")+"\nClipboard: "+SyncStatus.status,13,MUTED));
        syncLabel=text(SyncStatus.summary(),15,TEAL);c.addView(syncLabel);accessLabel=text(access(),12,MUTED);c.addView(accessLabel);
        String pause=DeviceConfig.store(this).getString("syncPauseReason","");if(!pause.isEmpty())c.addView(text(pause,13,RED));
        button(c,"Retry connection",true,()->{if(approved)deviceAction("connect");else checkNow();});
        button(c,SyncStatus.running?"Disable clipboard sync":"Enable clipboard sync",false,this::toggleSync).setEnabled(connected&&approved||SyncStatus.running);
        button(c,"Clear local pairing data",false,()->confirm("Clear local pairing?","This removes Android credentials and its pending outgoing queue. Server history remains. Revoke trust first to also remove server authorization.",this::clearLocal));
        if(approved)button(c,"Revoke trust",false,()->confirm("Revoke trust?","This companion will need to pair again.",()->deviceAction("revoke-trust")));
        LinearLayout permissions=card("Permissions & battery","Visible, on your terms");
        permissions.addView(text("Sync notification · "+(ClipboardSyncService.notificationsAllowed(this)?"Allowed":"Permission required")+"\n\nAndroid 10+ restricts background clipboard reads. The foreground service can receive; it cannot read other apps' clipboard changes without focus. Locked-screen receipts wait for unlock.",13,MUTED));
        button(permissions,"Notification settings",false,()->startActivity(new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(android.provider.Settings.EXTRA_APP_PACKAGE,getPackageName())));
        permissions.addView(text("Battery restrictions and Doze may delay sync. Android 15+ limits data-sync foreground services to six background hours per day; opening Clippy resets the allowance. At the limit, sync pauses until you reopen and retry. After reboot, open Clippy to resume; no boot-time service is started.",13,MUTED));
        button(permissions,"Battery settings",false,()->startActivity(new Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)));
        LinearLayout limited=card("Privacy & capabilities","Only what you enable");
        limited.addView(text("Pending clipboard events are encrypted on this Android device. Server history remains plaintext locally. No clipboard values or credentials are written to diagnostic logs.\n\nFile delivery · unavailable\nNotification mirroring · unavailable\nSMS, remote input, media control · unavailable\nLAN discovery · unavailable; enter a server URL",13,MUTED));
        limited.addView(text("Clippy "+BuildConfig.VERSION_NAME+" · "+(BuildConfig.DEBUG?"Debug":"Release")+"\nAndroid "+Build.VERSION.RELEASE,12,BLUE));
    }
    private String policy(){ return BuildConfig.DEBUG?"Debug build · HTTP is allowed for local testing; prefer HTTPS.":"Release build · secure HTTPS is required."; }
    private String preview(String value){ return value.length()>140?value.substring(0,140)+"…":value; }
    private String lastSync(){return SyncStatus.lastSync==0?"Last sync · not yet": "Last sync · "+android.text.format.DateFormat.format("HH:mm:ss",SyncStatus.lastSync);}
    private void showError(String message){ notice=message;if(feedback!=null){feedback.setVisibility(View.VISIBLE);feedback.setText(message);feedback.setTextColor(RED);} }
    private void showMessage(String message){notice=message;if(feedback!=null){feedback.setVisibility(View.VISIBLE);feedback.setText(message);feedback.setTextColor(TEAL);} }
    private void confirm(String title,String detail,Runnable action){new AlertDialog.Builder(this).setTitle(title).setMessage(detail).setNegativeButton("Cancel",null).setPositiveButton("Continue",(d,w)->action.run()).show();}
    private interface Job { void run() throws Exception; }
    private void submit(Job job) {
        final int epoch=generation;
        network.execute(()->{ try { job.run(); } catch(Exception error) { main.post(()->{if(!destroyed&&epoch==generation){busy=false;if(connectButton!=null){connectButton.setEnabled(true);connectButton.setText("Connect and pair");}showError(ClippyApi.explain(error));}}); } });
    }
    private void register() {
        if(busy || DeviceConfig.isPaired(this))return;
        captureDrafts(); final String endpoint;
        try {endpoint=ServerUrl.normalize(serverDraft,BuildConfig.DEBUG); if(nameDraft.trim().isEmpty()||nameDraft.length()>100)throw new IllegalArgumentException("Enter a device name of 1–100 characters.");}
        catch(IllegalArgumentException error){showError(error.getMessage());if(serverInput!=null)serverInput.setError(error.getMessage());return;}
        busy=true;showMessage("Connecting to your workspace…");if(connectButton!=null){connectButton.setEnabled(false);connectButton.setText("Connecting…");}
        submit(()->{
            JSONObject result=ClippyApi.register(endpoint,nameDraft.trim()); JSONObject p=result.getJSONObject("pairing");
            DeviceConfig.saveToken(this,result.getString("deviceToken"));
            DeviceConfig.store(this).edit().putString("api",endpoint).putString("name",nameDraft.trim()).putString("deviceId",result.getJSONObject("device").getString("id"))
                .putString("pairingId",p.getString("id")).putString("pairingCode",p.getString("code")).putString("pairingExpiry",p.getString("expiresAt")).apply();
            main.post(()->{if(destroyed)return;busy=false;pairing="pending";connection="Waiting for approval";notice="";serverDraft=endpoint;render();scheduleStatus();});
        });
    }
    private void scheduleStatus() {
        if(statusJob!=null)statusJob.cancel(false);
        statusJob=network.scheduleWithFixedDelay(()->{if(!destroyed&&DeviceConfig.isPaired(this)&&!busy)checkStatus();},0,3,TimeUnit.SECONDS);
    }
    private void checkNow(){if(DeviceConfig.isPaired(this))submit(this::checkStatus);else {screen="Connection";render();}}
    private void checkStatus(){
        final int epoch=generation;
        try{
            JSONObject result=session.request("/api/native/status","GET",null).getJSONObject("data");
            JSONObject d=result.getJSONObject("device"), p=result.optJSONObject("pairing");
            String ps=p==null?"rejected":p.optString("status","pending");
            boolean trust=d.getBoolean("trusted");
            if(trust&&d.optString("status").equals("offline")&&DeviceConfig.store(this).getBoolean("syncEnabled",false)&&DeviceConfig.store(this).getString("syncPauseReason","").isEmpty()){
                session.request("/api/native/devices/connect","POST",new JSONObject().put("resume",true));d.put("status","connected");
            }
            if(trust&&!DeviceConfig.store(this).getBoolean("approved",false)&&p!=null){
                session.request("/api/native/pairing/approve","POST",new JSONObject().put("pairingId",p.getString("id")).put("code",p.getString("code")));
                DeviceConfig.store(this).edit().putBoolean("approved",true).apply();
            }
            boolean online=trust && d.optString("status").equals("connected");
            main.post(()->{if(destroyed||epoch!=generation)return;boolean changed=approved!=trust||!pairing.equals(ps)||connected!=online;
                approved=trust;connected=online;pairing=ps;connection=trust?(online?"Connected · trusted":"Disconnected · trusted"):(ps.equals("pending")?"Waiting for approval":"Pairing "+ps);
                if(online&&!SyncStatus.running&&DeviceConfig.store(this).getBoolean("syncEnabled",false)&&DeviceConfig.store(this).getString("syncPauseReason","").isEmpty())startSync();
                if(changed){if(!trust || d.optString("status").equals("disconnected")){stopSync();SyncStatus.stopReason="Status response: trust="+trust+", state="+d.optString("status");}render();}else if(connectionBadge!=null)connectionBadge.setText("●  "+connection);
            });
        }catch(Exception error){main.post(()->{if(destroyed||epoch!=generation)return;connected=false;connection="Backend unavailable";if(connectionBadge!=null){connectionBadge.setText("●  "+connection);connectionBadge.setTextColor(RED);}showError(ClippyApi.explain(error));});}
    }
    private void cancelPairing(){submit(()->{session.request("/api/native/pairing/cancel","POST",new JSONObject().put("pairingId",DeviceConfig.store(this).getString("pairingId","")));main.post(this::clearLocal);});}
    private void deviceAction(String action){submit(()->{
        if(!action.equals("connect"))main.post(this::stopSync);
        session.request("/api/native/devices/"+action,"POST",new JSONObject());
        if(action.equals("revoke-trust"))main.post(this::clearLocal);else checkStatus();
    });}
    private void startSync(){
        if(!connected||!approved){showError("Connect to an approved workspace first.");return;}
        if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED){showError("Allow the sync notification so the foreground service stays visible. This does not grant background clipboard reads.");requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},71);return;}
        if(!ClipboardSyncService.notificationsAllowed(this)){showError("Permission required: enable Clippy's clipboard-sync notification channel in Android Settings, then Retry.");return;}
        DeviceConfig.store(this).edit().putBoolean("syncEnabled",true).remove("syncPauseReason").apply();
        try{startForegroundService(new Intent(this,ClipboardSyncService.class));main.postDelayed(this::render,350);}catch(RuntimeException error){showError("Foreground service unavailable. Keep Clippy open and retry.");}
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(code==71){if(results.length>0&&results[0]==android.content.pm.PackageManager.PERMISSION_GRANTED)startSync();else showError("Sync paused. Notification permission is required to keep the service visible.");}}
    private void stopSync(){SyncStatus.stopReason="User stop/retry action";DeviceConfig.store(this).edit().putBoolean("syncEnabled",false).remove("syncPauseReason").apply();stopService(new Intent(this,ClipboardSyncService.class));SyncStatus.running=false;SyncStatus.status="Sync disabled";if(approved&&!network.isShutdown())submit(()->session.request("/api/native/sync/status","POST",SyncStatus.payload(this)));}
    private void toggleSync(){if(SyncStatus.running){stopSync();render();}else startSync();}
    private void clearLocal(){
        generation++;stopSync();session.close();DeviceConfig.clear(this);SyncStatus.clear();session=new ClippyApi.Session(this);
        approved=false;connected=false;pairing="pending";connection="Not paired";notice="";screen="Connection";render();
    }
    private final Runnable tick=new Runnable(){public void run(){
        if(destroyed)return;
        if(syncLabel!=null)syncLabel.setText(SyncStatus.summary());
        if(serviceLabel!=null)serviceLabel.setText(SyncStatus.running?"Running":"Stopped");
        if(accessLabel!=null)accessLabel.setText(access());
        if(detailLabel!=null)detailLabel.setText(SyncStatus.status);
        if(sentLabel!=null)sentLabel.setText("Last sent · "+preview(SyncStatus.lastSent));
        if(receivedLabel!=null)receivedLabel.setText("Last received · "+preview(SyncStatus.lastReceived));
        if(ackLabel!=null)ackLabel.setText(SyncStatus.acknowledgement);
        if(echoLabel!=null)echoLabel.setText(SyncStatus.echo);
        if(timeLabel!=null)timeLabel.setText(screen.equals("Connection")?syncTime():lastSync());
        main.postDelayed(this,700);
    }};
}
