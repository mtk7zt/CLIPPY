package dev.venturis.clippy;

import org.junit.Test;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.junit.Assert.*;

public class ClipboardSyncWorkerTest {
    @Test public void durableOutboxRecoversAfterExhaustedBurstWithoutRestartOrDuplicateInFlight() throws Exception {
        final byte[][] saved={null};SyncJournal journal=new SyncJournal(new SyncJournal.Storage(){public byte[] read(){return saved[0];}public void write(byte[] bytes){saved[0]=bytes;}});
        AtomicInteger attempts=new AtomicInteger(),inFlight=new AtomicInteger(),maxInFlight=new AtomicInteger();
        AtomicBoolean online=new AtomicBoolean();CountDownLatch exhausted=new CountDownLatch(1),recovered=new CountDownLatch(1);
        AtomicReference<String> event=new AtomicReference<>();
        Transport transport=new Transport(){public void upload(String text,String id) throws Exception {
            if(event.get()==null)event.set(id);assertEquals(event.get(),id);
            maxInFlight.accumulateAndGet(inFlight.incrementAndGet(),Math::max);
            try{if(attempts.incrementAndGet()==3)exhausted.countDown();if(!online.get())throw new IOException("offline");recovered.countDown();}
            finally{inFlight.decrementAndGet();}
        }};
        try(ClipboardSyncWorker worker=new ClipboardSyncWorker(transport,c->{},journal,10,10,100,3)){
            worker.start();worker.localChanged("durable retry",false);await(exhausted);
            online.set(true);await(recovered);Thread.sleep(100);
            assertTrue(journal.outgoing().isEmpty());assertEquals(1,maxInFlight.get());assertEquals(4,attempts.get());
        }
    }
    @Test public void serviceRestartResendsDurableOutboxWithOriginalIdAndDoesNotReapplyRemote() throws Exception {
        final byte[][] saved={null};SyncJournal.Storage storage=new SyncJournal.Storage(){public byte[] read(){return saved[0];}public void write(byte[] bytes){saved[0]=bytes;}};
        SyncJournal journal=new SyncJournal(storage);String eventId=journal.enqueue("outbox");journal.received("remote",7);
        CountDownLatch outboxSent=new CountDownLatch(1),receiptDone=new CountDownLatch(1);
        Transport transport=new Transport(){
            public List<ClipboardSyncWorker.Clip> poll(){return List.of(new ClipboardSyncWorker.Clip("remote","remote",7));}
            public void upload(String text,String id){assertEquals(eventId,id);assertEquals("outbox",text);outboxSent.countDown();}
            public void acknowledge(String id){receiptDone.countDown();}
        };
        try(ClipboardSyncWorker worker=new ClipboardSyncWorker(transport,c->fail("Reapplied a durable receipt"),new SyncJournal(storage))){worker.start();await(outboxSent);await(receiptDone);}
    }
    @Test public void retryReusesEventIdSoLostResponseCannotDuplicateClip() throws Exception {
        AtomicReference<String> id = new AtomicReference<>();
        CountDownLatch complete = new CountDownLatch(1);
        Transport t = new Transport() {
            public void upload(String text, String eventId) throws Exception {
                assertNotNull(eventId);
                if (id.compareAndSet(null, eventId)) throw new IOException("response lost");
                assertEquals(id.get(), eventId); complete.countDown();
            }
        };
        try (ClipboardSyncWorker w = worker(t, clip -> {})) { w.start(); w.localChanged("retry same event", false); await(complete); }
    }
    private static void await(CountDownLatch latch) throws Exception {
        assertTrue("Operation did not finish", latch.await(3, TimeUnit.SECONDS));
    }
    private static class Transport implements ClipboardSyncWorker.Transport {
        final CountDownLatch polled = new CountDownLatch(1), uploaded = new CountDownLatch(1), acked = new CountDownLatch(1);
        final AtomicInteger polls = new AtomicInteger(), uploads = new AtomicInteger();
        public List<ClipboardSyncWorker.Clip> poll() throws Exception { polls.incrementAndGet(); polled.countDown(); return List.of(); }
        public void upload(String text) throws Exception { uploads.incrementAndGet(); uploaded.countDown(); }
        public void acknowledge(String id) throws Exception { acked.countDown(); }
        public void close() {}
    }
    private ClipboardSyncWorker worker(Transport t, ClipboardSyncWorker.Sink sink) {
        return new ClipboardSyncWorker(t, sink, 20, 10, 40, 3);
    }

    @Test public void localUploadRunsDuringBlockedPollAndOnlyOnePollRuns() throws Exception {
        CountDownLatch release = new CountDownLatch(1);
        Transport t = new Transport() {
            public List<ClipboardSyncWorker.Clip> poll() throws Exception { super.poll(); release.await(); return List.of(); }
        };
        try (ClipboardSyncWorker w = worker(t, clip -> {})) {
            w.start(); await(t.polled); w.localChanged("local", false); await(t.uploaded);
            Thread.sleep(80); assertEquals(1, t.polls.get());
        } finally { release.countDown(); }
    }

    @Test public void remoteClipIsAppliedThenAcknowledgedWithoutEcho() throws Exception {
        AtomicReference<ClipboardSyncWorker> ref = new AtomicReference<>();
        AtomicInteger applied = new AtomicInteger();
        Transport t = new Transport() {
            public List<ClipboardSyncWorker.Clip> poll() { polls.incrementAndGet(); return List.of(new ClipboardSyncWorker.Clip("remote-id", "remote")); }
            public void acknowledge(String id) { assertEquals("remote-id", id); assertEquals(1, applied.get()); superAck(); }
            void superAck() { acked.countDown(); }
        };
        try (ClipboardSyncWorker w = worker(t, clip -> {
            applied.incrementAndGet(); ref.get().localChanged(clip.text, true);
            ref.get().localChanged(clip.text, false);
        })) {
            ref.set(w); w.start(); await(t.acked); Thread.sleep(100);
            assertTrue(t.polls.get() > 1); assertEquals(1, applied.get()); assertEquals(0, t.uploads.get());
        }
    }

    @Test public void blockedAcknowledgementDoesNotBlockUploadOrNextPoll() throws Exception {
        CountDownLatch release = new CountDownLatch(1), secondPoll = new CountDownLatch(1);
        Transport t = new Transport() {
            public List<ClipboardSyncWorker.Clip> poll() { if (polls.incrementAndGet() > 1) secondPoll.countDown(); return List.of(new ClipboardSyncWorker.Clip("id", "remote")); }
            public void acknowledge(String id) throws Exception { acked.countDown(); release.await(); }
        };
        try (ClipboardSyncWorker w = worker(t, clip -> {})) {
            w.start(); await(t.acked); w.localChanged("next upload", false); await(t.uploaded); await(secondPoll);
        } finally { release.countDown(); }
    }

    @Test public void stopInterruptsActivePollAndCancelsQueuedRetryAndFutureWork() throws Exception {
        CountDownLatch interrupted = new CountDownLatch(1);
        Transport t = new Transport() {
            public List<ClipboardSyncWorker.Clip> poll() throws Exception { polled.countDown(); try { new CountDownLatch(1).await(); } catch (InterruptedException e) { interrupted.countDown(); throw e; } return List.of(); }
            public void upload(String text) throws Exception { uploads.incrementAndGet(); uploaded.countDown(); throw new IOException("offline"); }
        };
        ClipboardSyncWorker w = new ClipboardSyncWorker(t, clip -> fail("Applied after stop"), 20, 500, 500, 3);
        w.start(); await(t.polled); w.localChanged("retry", false); await(t.uploaded); w.close(); await(interrupted);
        w.localChanged("after close", false); w.start(); Thread.sleep(600);
        assertEquals(1, t.uploads.get()); assertTrue(w.awaitStopped(1, TimeUnit.SECONDS));
    }

    @Test public void uploadFailureRetriesButDoesNotStopPollingOrLaterUploads() throws Exception {
        CountDownLatch recovered = new CountDownLatch(1), later = new CountDownLatch(1);
        Transport t = new Transport() {
            public void upload(String text) throws Exception {
                if (text.equals("later")) { later.countDown(); return; }
                if (uploads.incrementAndGet() == 1) throw new IOException("temporary");
                recovered.countDown();
            }
        };
        try (ClipboardSyncWorker w = worker(t, clip -> {})) {
            w.start(); w.localChanged("retry", false); await(recovered);
            w.localChanged("later", false); await(later); Thread.sleep(80); assertTrue(t.polls.get() > 1);
        }
    }

    @Test public void duplicatesAndPermanentUploadFailureHaveBoundedAttempts() throws Exception {
        Transport t = new Transport() { public void upload(String text) throws Exception { uploads.incrementAndGet(); throw new IOException("offline"); } };
        try (ClipboardSyncWorker w = worker(t, clip -> {})) {
            w.start(); for (int i = 0; i < 10; i++) w.localChanged("same", false);
            Thread.sleep(250); assertEquals(3, t.uploads.get()); assertTrue(t.polls.get() > 1);
        }
    }

    @Test public void pollAndAcknowledgementFailuresRecover() throws Exception {
        AtomicInteger attempts = new AtomicInteger();
        Transport t = new Transport() {
            public List<ClipboardSyncWorker.Clip> poll() throws Exception { if (polls.incrementAndGet() == 1) throw new IOException("poll failed"); return List.of(new ClipboardSyncWorker.Clip("id", "remote")); }
            public void acknowledge(String id) throws Exception { if (attempts.incrementAndGet() == 1) throw new IOException("ack failed"); acked.countDown(); }
        };
        AtomicInteger applied = new AtomicInteger();
        try (ClipboardSyncWorker w = worker(t, clip -> applied.incrementAndGet())) {
            w.start(); await(t.acked); assertEquals(2, attempts.get()); assertEquals(1, applied.get());
        }
    }
}
