package dev.venturis.clippy;

import android.content.Context;
import android.content.SharedPreferences;

final class DeviceConfig {
    private static final String STORE = "clippy-companion";
    static SharedPreferences store(Context context) { return context.getSharedPreferences(STORE, Context.MODE_PRIVATE); }
    static boolean isPaired(Context context) { return store(context).contains("deviceId") && (store(context).contains("tokenEncrypted") || store(context).contains("token")); }
    static String api(Context context) { return store(context).getString("api", ""); }
    static String deviceId(Context context) { return store(context).getString("deviceId", ""); }
    static String token(Context context) {
        try {
            SharedPreferences prefs = store(context);
            if (prefs.contains("token")) { String legacy = prefs.getString("token", ""); saveToken(context, legacy); return legacy; }
            String encoded = prefs.getString("tokenEncrypted", "");
            if (encoded.isEmpty()) return "";
            byte[] bytes = android.util.Base64.decode(encoded, android.util.Base64.NO_WRAP);
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE, key(), new javax.crypto.spec.GCMParameterSpec(128, java.util.Arrays.copyOf(bytes, 12)));
            return new String(cipher.doFinal(java.util.Arrays.copyOfRange(bytes, 12, bytes.length)), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception error) { throw new IllegalStateException("Saved pairing is unavailable. Clear local pairing and pair again."); }
    }
    static void saveToken(Context context, String token) throws Exception {
        byte[] bytes=encrypt(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        if (!store(context).edit().putString("tokenEncrypted", android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)).remove("token").commit()) throw new IllegalStateException("Could not save pairing.");
    }
    static byte[] encrypt(byte[] plain) throws Exception {
        javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, key());
        byte[] encrypted = cipher.doFinal(plain);
        return java.nio.ByteBuffer.allocate(12 + encrypted.length).put(cipher.getIV()).put(encrypted).array();
    }
    static byte[] decrypt(byte[] bytes) throws Exception {
        javax.crypto.Cipher cipher=javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE,key(),new javax.crypto.spec.GCMParameterSpec(128,java.util.Arrays.copyOf(bytes,12)));
        return cipher.doFinal(java.util.Arrays.copyOfRange(bytes,12,bytes.length));
    }
    private static javax.crypto.SecretKey key() throws Exception {
        java.security.KeyStore keys = java.security.KeyStore.getInstance("AndroidKeyStore"); keys.load(null);
        String alias = "clippy-pairing-token";
        if (!keys.containsAlias(alias)) {
            javax.crypto.KeyGenerator generator = javax.crypto.KeyGenerator.getInstance("AES", "AndroidKeyStore");
            generator.init(new android.security.keystore.KeyGenParameterSpec.Builder(alias, android.security.keystore.KeyProperties.PURPOSE_ENCRYPT | android.security.keystore.KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes("GCM").setEncryptionPaddings("NoPadding").build()); generator.generateKey();
        }
        return (javax.crypto.SecretKey) keys.getKey(alias, null);
    }
    static void clear(Context context) {
        new EncryptedSyncStorage(context).clear();
        store(context).edit().putBoolean("syncEnabled",false).remove("syncPauseReason").apply();
        store(context).edit().remove("deviceId").remove("token").remove("tokenEncrypted").remove("pairingId").remove("pairingCode").remove("pairingExpiry").remove("approved").remove("lastSync").apply();
    }
}
