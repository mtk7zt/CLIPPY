package dev.venturis.clippy;
import org.junit.Test;
import static org.junit.Assert.*;

public class ServerUrlTest {
    private void invalid(String value) { assertThrows(IllegalArgumentException.class, () -> ServerUrl.normalize(value, true)); }
    @Test public void blankRejected() { invalid(""); invalid(null); }
    @Test public void whitespaceRejected() { invalid(" \n\t "); }
    @Test public void missingProtocolRejected() { invalid("10.0.2.2:4173"); invalid("localhost:4173"); }
    @Test public void relativePathRejected() { invalid("/api/native/devices/register"); invalid("//example.com"); }
    @Test public void emulatorHttpAccepted() { assertEquals("http://10.0.2.2:4173", ServerUrl.normalize("http://10.0.2.2:4173", true)); }
    @Test public void lanHttpAccepted() { assertEquals("http://192.168.1.42:4173", ServerUrl.normalize("http://192.168.1.42:4173", true)); }
    @Test public void httpsAccepted() { assertEquals("https://clippy.example.com", ServerUrl.normalize("https://clippy.example.com", false)); }
    @Test public void trailingSlashesAndWhitespaceNormalized() { assertEquals("https://clippy.example.com", ServerUrl.normalize(" https://clippy.example.com/// ", false)); }
    @Test public void releaseRejectsHttp() { assertTrue(assertThrows(IllegalArgumentException.class, () -> ServerUrl.normalize("http://10.0.2.2:4173", false)).getMessage().contains("HTTPS")); }
    @Test public void registrationConstruction() { assertEquals("http://10.0.2.2:4173/api/native/devices/register", ServerUrl.endpoint("http://10.0.2.2:4173/", "/api/native/devices/register", true)); }
    @Test public void pairingConstruction() { assertEquals("https://clippy.example.com/api/native/pairing/approve", ServerUrl.endpoint("https://clippy.example.com", "/api/native/pairing/approve", false)); }
    @Test public void publishConstruction() { assertEquals("http://10.0.2.2:4173/api/native/clipboard/publish", ServerUrl.endpoint("http://10.0.2.2:4173", "/api/native/clipboard/publish", true)); }
    @Test public void noRelativeRequestCanBeConstructed() { for (String bad : new String[]{"", " ", "/api", "localhost:4173"}) assertThrows(IllegalArgumentException.class, () -> ServerUrl.endpoint(bad, "/api/native/clipboard/pending", true)); }
    @Test public void unsupportedOrAmbiguousUrlsRejected() { for (String bad : new String[]{"ftp://example.com", "https://a/b", "https://a?x", "https://a#x", "https://user:pass@a", "http://a:99999", "https://", "http://a:0"}) invalid(bad); }
}
