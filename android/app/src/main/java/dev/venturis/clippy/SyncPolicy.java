package dev.venturis.clippy;

/** Platform decisions shared by the service and visible UI; no privilege workarounds. */
final class SyncPolicy {
    static boolean canRead(int sdk,boolean focused,boolean locked){return !locked&&(sdk<29||focused);}
    static String state(boolean enabled,boolean running,boolean notifications,boolean network,boolean backend,boolean allowed,boolean paused){
        if(!enabled)return "disabled";
        if(paused)return "paused";
        if(!notifications||!allowed)return "permission_required";
        if(!running)return "paused";
        if(!network)return "network_unavailable";
        if(!backend)return "reconnecting";
        return "active";
    }
    static String hash(String text){
        try{byte[] bytes=java.security.MessageDigest.getInstance("SHA-256").digest(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));StringBuilder out=new StringBuilder();for(byte b:bytes)out.append(String.format(java.util.Locale.ROOT,"%02x",b));return out.toString();}
        catch(java.security.NoSuchAlgorithmException impossible){throw new IllegalStateException("SHA-256 unavailable");}
    }
}
