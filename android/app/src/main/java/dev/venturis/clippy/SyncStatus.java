package dev.venturis.clippy;

/** Session-only UI state. Clipboard content and tokens are never logged or persisted here. */
final class SyncStatus {
    static volatile boolean running;
    static volatile boolean focused, locked, backend, network=true, allowed=true;
    static volatile String stopReason="Not started";
    static volatile String status = "Sync disabled", lastSent = "No text sent yet", lastReceived = "No text received yet", acknowledgement = "Waiting for a receipt", echo = "Echo suppression enabled";
    static volatile long lastSync;
    static String summary(){return !running?"Sync paused":!network?"Network unavailable":!backend?"Reconnecting":!allowed?"Permission required":locked?"Screen locked":!SyncPolicy.canRead(android.os.Build.VERSION.SDK_INT,focused,locked)?"Receiving · reads restricted":"Sync active";}
    static org.json.JSONObject payload(android.content.Context context) throws org.json.JSONException {
        boolean enabled=DeviceConfig.store(context).getBoolean("syncEnabled",false);
        boolean paused=!DeviceConfig.store(context).getString("syncPauseReason","").isEmpty();
        String access=locked?"locked":SyncPolicy.canRead(android.os.Build.VERSION.SDK_INT,focused,false)?"available":"restricted";
        return new org.json.JSONObject().put("enabled",enabled).put("serviceRunning",running&&enabled).put("clipboardAccess",access)
            .put("state",SyncPolicy.state(enabled,running,ClipboardSyncService.notificationsAllowed(context),network,backend,allowed,paused)).put("androidVersion",android.os.Build.VERSION.SDK_INT);
    }
    static void update(String operation, String detail) {
        switch (operation) {
            case "sent": lastSent = detail; status = "Text stored on the workspace"; lastSync = System.currentTimeMillis(); break;
            case "received": lastReceived = detail; acknowledgement = "Acknowledgement pending"; break;
            case "ack": acknowledgement = detail; status = "Clipboard connected"; lastSync = System.currentTimeMillis(); break;
            case "echo": echo = detail; break;
            case "error": status = detail; break;
            case "poll": if (status.contains("interrupted")) status = "Clipboard connected"; break;
        }
    }
    static void clear() { lastSent = "No text sent yet"; lastReceived = "No text received yet"; lastSync = 0; acknowledgement = "Waiting for a receipt"; }
}
