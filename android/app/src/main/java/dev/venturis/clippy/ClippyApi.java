package dev.venturis.clippy;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

final class ClippyApi {
    static final class ApiException extends Exception {
        final String code;
        ApiException(String code, String message) { super(message); this.code = code; }
    }
    static final class Session implements ClipboardSyncWorker.Transport {
        private final Context context;
        private final java.util.Set<HttpURLConnection> active = new java.util.HashSet<>();
        private boolean closed;
        Session(Context context) { this.context = context.getApplicationContext(); }
        JSONObject request(String path, String method, JSONObject body) throws Exception {
            return call(DeviceConfig.api(context), path, method, body, DeviceConfig.deviceId(context), DeviceConfig.token(context), this);
        }
        private JSONObject syncRequest(String path, String method, JSONObject body) throws Exception {
            try { return request(path, method, body); }
            catch (ApiException error) {
                if (!error.code.equals("DEVICE_OFFLINE")) throw error;
                request("/api/native/devices/connect", "POST", new JSONObject().put("resume", true));
                return request(path, method, body);
            }
        }
        public java.util.List<ClipboardSyncWorker.Clip> poll() throws Exception {
            JSONArray items = syncRequest("/api/native/clipboard/pending", "GET", null).getJSONArray("data");
            java.util.List<ClipboardSyncWorker.Clip> clips = new java.util.ArrayList<>();
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                String value=item.getString("text");
                if(item.has("contentHash") && !SyncPolicy.hash(value).equals(item.getString("contentHash")))throw new IllegalStateException("Clipboard checksum mismatch; receipt withheld.");
                clips.add(new ClipboardSyncWorker.Clip(item.getString("id"), value, item.optLong("revision",0)));
            }
            return clips;
        }
        public void upload(String text) throws Exception { upload(text, java.util.UUID.randomUUID().toString()); }
        public void upload(String text, String eventId) throws Exception { syncRequest("/api/native/clipboard/publish", "POST", new JSONObject().put("text", text).put("eventId", eventId)); }
        public void acknowledge(String id) throws Exception { syncRequest("/api/native/clipboard/" + id + "/ack", "POST", null); }
        synchronized void track(HttpURLConnection connection) throws InterruptedException {
            if (closed) throw new InterruptedException("Sync stopped");
            active.add(connection);
        }
        synchronized void untrack(HttpURLConnection connection) { active.remove(connection); }
        public void close() {
            java.util.List<HttpURLConnection> connections;
            synchronized (this) { closed = true; connections = new java.util.ArrayList<>(active); active.clear(); }
            for (HttpURLConnection connection : connections) connection.disconnect();
        }
    }
    static JSONObject register(String api, String deviceName) throws Exception {
        JSONObject body = new JSONObject(); body.put("name", deviceName); body.put("platform", "android"); body.put("capabilities", new JSONArray().put("clipboard"));
        return call(api, "/api/native/devices/register", "POST", body, null, null).getJSONObject("data");
    }
    static void publish(Context context, String text) throws Exception {
        call(DeviceConfig.api(context), "/api/native/clipboard/publish", "POST", new JSONObject().put("text", text).put("eventId", java.util.UUID.randomUUID().toString()), DeviceConfig.deviceId(context), DeviceConfig.token(context));
    }
    static JSONArray pending(Context context) throws Exception {
        return call(DeviceConfig.api(context), "/api/native/clipboard/pending", "GET", null, DeviceConfig.deviceId(context), DeviceConfig.token(context)).getJSONArray("data");
    }
    static void acknowledge(Context context, String clipId) throws Exception {
        call(DeviceConfig.api(context), "/api/native/clipboard/" + clipId + "/ack", "POST", null, DeviceConfig.deviceId(context), DeviceConfig.token(context));
    }
    private static JSONObject call(String api, String path, String method, JSONObject body, String deviceId, String token) throws Exception {
        return call(api, path, method, body, deviceId, token, null);
    }
    private static JSONObject call(String api, String path, String method, JSONObject body, String deviceId, String token, Session session) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(ServerUrl.endpoint(api, path, BuildConfig.DEBUG)).openConnection();
        // Do not follow a redirect that could downgrade HTTPS or disclose the bearer token.
        connection.setInstanceFollowRedirects(false);
        try {
        if (session != null) session.track(connection);
        connection.setRequestMethod(method); connection.setConnectTimeout(10000); connection.setReadTimeout(15000); connection.setRequestProperty("Accept", "application/json");
        if (deviceId != null) { connection.setRequestProperty("X-Clippy-Device-Id", deviceId); connection.setRequestProperty("Authorization", "Bearer " + token); }
        if (body != null) { connection.setDoOutput(true); connection.setRequestProperty("Content-Type", "application/json; charset=utf-8"); try (OutputStream output = connection.getOutputStream()) { output.write(body.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)); } }
        int code = connection.getResponseCode();
        if (code >= 300 && code < 400) throw new IllegalStateException("The server redirected this request. Enter its final server URL.");
        java.io.InputStream stream = code < 400 ? connection.getInputStream() : connection.getErrorStream();
        if (stream == null) throw new IllegalStateException("Backend returned an empty response (HTTP " + code + ").");
        StringBuilder response = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new java.io.InputStreamReader(stream, java.nio.charset.StandardCharsets.UTF_8))) {
            char[] buffer = new char[4096]; int count;
            while ((count = reader.read(buffer)) != -1) { response.append(buffer, 0, count); if (response.length() > 8 * 1024 * 1024) throw new IllegalStateException("Backend response is too large."); }
        }
        JSONObject json;
        try { json = new JSONObject(response.toString()); } catch (org.json.JSONException error) { throw new IllegalStateException("This address did not return the Clippy API. Check the server URL and port."); }
        if (code >= 400) { JSONObject error = json.optJSONObject("error"); throw new ApiException(error == null ? "HTTP_ERROR" : error.optString("code", "HTTP_ERROR"), error == null ? "Backend request failed (HTTP " + code + ")." : error.optString("message", "Backend request failed.")); } return json;
        } finally {
            if (session != null) session.untrack(connection);
            connection.disconnect();
        }
    }
    static String explain(Exception error) {
        if (error instanceof java.net.SocketTimeoutException) return "Connection timed out. Check the server address and network, then Retry.";
        if (error instanceof java.net.ConnectException || error instanceof java.net.UnknownHostException || error instanceof java.net.NoRouteToHostException)
            return "Backend unavailable. Start Clippy on your computer and check the server URL, HOST binding, and network.";
        if (error instanceof javax.net.ssl.SSLException) return "Secure connection failed. Check the server's HTTPS certificate.";
        return error.getMessage() == null ? "Connection failed. Please retry." : error.getMessage();
    }
}
