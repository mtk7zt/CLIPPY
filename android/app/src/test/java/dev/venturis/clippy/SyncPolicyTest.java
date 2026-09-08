package dev.venturis.clippy;
import org.junit.Test;
import static org.junit.Assert.*;
public class SyncPolicyTest {
    @Test public void foregroundServiceNeverBypassesAndroid10ReadRestriction(){
        assertTrue(SyncPolicy.canRead(28,false,false));assertFalse(SyncPolicy.canRead(29,false,false));
        assertTrue(SyncPolicy.canRead(36,true,false));assertFalse(SyncPolicy.canRead(36,true,true));
    }
    @Test public void disabledPermissionOfflineAndRecoveryAreDistinct(){
        assertEquals("disabled",SyncPolicy.state(false,false,true,true,true,true,false));
        assertEquals("permission_required",SyncPolicy.state(true,true,false,true,true,true,false));
        assertEquals("network_unavailable",SyncPolicy.state(true,true,true,false,false,true,false));
        assertEquals("reconnecting",SyncPolicy.state(true,true,true,true,false,true,false));
        assertEquals("paused",SyncPolicy.state(true,false,true,true,true,true,true));
        assertEquals("active",SyncPolicy.state(true,true,true,true,true,true,false));
    }
    @Test public void checksumUsesUtf8(){assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",SyncPolicy.hash("abc"));}
}
