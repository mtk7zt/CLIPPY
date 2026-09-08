package dev.venturis.clippy;

import org.junit.Test;
import java.nio.file.*;
import static org.junit.Assert.*;

public class SyncJournalTest {
    private SyncJournal.Storage disk(Path path) {return new SyncJournal.Storage(){
        public byte[] read() throws Exception{return Files.exists(path)?Files.readAllBytes(path):null;}
        public void write(byte[] bytes) throws Exception{Path next=path.resolveSibling("state.tmp");Files.write(next,bytes);Files.move(next,path,StandardCopyOption.REPLACE_EXISTING);}
    };}
    @Test public void lostUploadResponseRetainsStableEventAcrossRestart() throws Exception {
        Path dir=Files.createTempDirectory("clippy-journal-");Path path=dir.resolve("state");
        try {
            SyncJournal j=new SyncJournal(disk(path));String id=j.enqueue("private test text");
            SyncJournal restarted=new SyncJournal(disk(path));assertEquals("private test text",restarted.outgoing().get(id));
            restarted.sent(id);assertTrue(new SyncJournal(disk(path)).outgoing().isEmpty());
        } finally {Files.deleteIfExists(path);Files.deleteIfExists(dir);}
    }
    @Test public void receiptIsRememberedBeforeAckAndCursorSurvivesRestartWithoutSkippingHoles() throws Exception {
        Path dir=Files.createTempDirectory("clippy-receipt-");Path path=dir.resolve("state");
        try {
            SyncJournal j=new SyncJournal(disk(path));j.received("older",4);j.received("newer",8);j.acknowledged("newer",8);
            j=new SyncJournal(disk(path));assertTrue(j.hasReceived("older"));assertEquals(8,j.cursor());
            assertFalse(j.hasReceived("never-received"));j.acknowledged("older",4);assertEquals(8,j.cursor());
        } finally {Files.deleteIfExists(path);Files.deleteIfExists(dir);}
    }
    @Test public void corruptJournalFailsClosedRatherThanLosingPendingEvents() throws Exception {
        SyncJournal.Storage corrupt=new SyncJournal.Storage(){public byte[] read(){return new byte[]{9,8,7};}public void write(byte[] b){fail("Must not overwrite corrupt state");}};
        assertThrows(Exception.class,()->new SyncJournal(corrupt));
    }
    @Test public void maximumUnicodeClipRoundTripsWithoutTruncation() throws Exception {
        final byte[][] bytes={null};SyncJournal.Storage storage=new SyncJournal.Storage(){public byte[] read(){return bytes[0];}public void write(byte[] b){bytes[0]=b;}};
        String text="界".repeat(65536);SyncJournal j=new SyncJournal(storage);String id=j.enqueue(text);
        assertEquals(text,new SyncJournal(storage).outgoing().get(id));
    }
    @Test public void repeatedLocalCallbackAfterRestartDoesNotCreateANewEvent() throws Exception {
        final byte[][] bytes={null};SyncJournal.Storage storage=new SyncJournal.Storage(){public byte[] read(){return bytes[0];}public void write(byte[] b){bytes[0]=b;}};
        SyncJournal j=new SyncJournal(storage);String id=j.enqueue("same clipboard");j.sent(id);
        assertNull(new SyncJournal(storage).enqueue("same clipboard"));
    }
}
