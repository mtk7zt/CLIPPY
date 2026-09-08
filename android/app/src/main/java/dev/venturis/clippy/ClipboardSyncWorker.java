package dev.venturis.clippy;

import java.util.*;
import java.util.concurrent.*;

/** Three independent lanes; each poll schedules its successor only after it completes. */
final class ClipboardSyncWorker implements AutoCloseable {
    static final class Clip {
        final String id, text;
        final long revision;
        Clip(String id, String text) { this(id,text,0); }
        Clip(String id, String text, long revision) { this.id = id; this.text = text; this.revision=revision; }
    }
    interface Transport extends AutoCloseable {
        List<Clip> poll() throws Exception;
        void upload(String text) throws Exception;
        default void upload(String text, String eventId) throws Exception { upload(text); }
        void acknowledge(String id) throws Exception;
        void close();
    }
    interface Sink { void apply(Clip clip) throws Exception; }
    interface Observer { void update(String operation, String detail); }
    private Observer observer = (operation, detail) -> {};
    synchronized void observe(Observer observer) { this.observer = observer; }
    private void report(String operation, String detail) { if (active()) observer.update(operation, detail); }
    private interface Operation { void run() throws Exception; }
    private final ScheduledThreadPoolExecutor polls = lane("clippy-poll"), uploads = lane("clippy-upload"), acks = lane("clippy-ack");
    private final Transport transport;
    private final Sink sink;
    private final long interval, initialBackoff, maxBackoff;
    private final int maxAttempts;
    private final LinkedHashSet<String> received = new LinkedHashSet<>();
    private final Set<String> awaitingAck = new HashSet<>();
    private final Set<String> sending = new HashSet<>();
    private final Map<String,Long> retryAfter = new HashMap<>();
    private boolean started, closed;
    private String lastObserved;
    private SyncJournal journal;
    ClipboardSyncWorker(Transport transport, Sink sink) { this(transport, sink, 3000, 1000, 30000, 5); }
    ClipboardSyncWorker(Transport transport, Sink sink, SyncJournal journal) {this(transport,sink,journal,3000,1000,30000,5);}
    ClipboardSyncWorker(Transport transport, Sink sink, SyncJournal journal, long interval, long initialBackoff, long maxBackoff, int maxAttempts) {
        this(transport,sink,interval,initialBackoff,maxBackoff,maxAttempts);this.journal=journal;
    }
    ClipboardSyncWorker(Transport transport, Sink sink, long interval, long initialBackoff, long maxBackoff, int maxAttempts) {
        this.transport = transport; this.sink = sink; this.interval = interval;
        this.initialBackoff = initialBackoff; this.maxBackoff = maxBackoff; this.maxAttempts = maxAttempts;
    }
    private static ScheduledThreadPoolExecutor lane(String name) {
        ScheduledThreadPoolExecutor lane = new ScheduledThreadPoolExecutor(1, r -> new Thread(r, name));
        lane.setRemoveOnCancelPolicy(true);
        lane.setExecuteExistingDelayedTasksAfterShutdownPolicy(false);
        lane.setContinueExistingPeriodicTasksAfterShutdownPolicy(false);
        return lane;
    }
    synchronized void start() {
        if (closed || started) return;
        started = true; schedule(polls, () -> poll(0), 0);
        if(journal!=null) for(Map.Entry<String,String> e:journal.outgoing().entrySet()) send(e.getValue(),e.getKey());
    }
    synchronized void localChanged(String text, boolean remoteMarker) {
        if (closed || text == null || text.isEmpty() || text.length() > 65536) return;
        boolean duplicate = text.equals(lastObserved); lastObserved = text;
        if (remoteMarker || duplicate) { report("echo", "Duplicate event suppressed"); return; }
        try {send(text,journal==null?UUID.randomUUID().toString():journal.enqueue(text));}
        catch(Exception error){lastObserved=null;report("error","Could not save outgoing text. Retry sync; pending data is retained.");}
    }
    private synchronized void send(String text,String eventId) {
        if(eventId==null){report("echo","Duplicate event suppressed across restart");return;}
        if(closed||!sending.add(eventId))return;
        retry(uploads, () -> { transport.upload(text, eventId); if(journal!=null)journal.sent(eventId);report("sent", text); }, 0, () -> {
            synchronized(ClipboardSyncWorker.this){sending.remove(eventId);retryAfter.put(eventId,System.nanoTime()+TimeUnit.MILLISECONDS.toNanos(maxBackoff));}
        });
    }
    private synchronized void resumePending(){
        if(journal==null||closed)return;
        Map<String,String> pending=journal.outgoing();retryAfter.keySet().retainAll(pending.keySet());
        for(Map.Entry<String,String> entry:pending.entrySet())
            if(System.nanoTime()>=retryAfter.getOrDefault(entry.getKey(),Long.MIN_VALUE))send(entry.getValue(),entry.getKey());
    }
    private synchronized boolean active() { return !closed; }
    private synchronized void schedule(ScheduledThreadPoolExecutor lane, Runnable work, long delay) {
        if (!closed) lane.schedule(() -> { if (active()) work.run(); }, delay, TimeUnit.MILLISECONDS);
    }
    private long backoff(int failures) { return Math.min(maxBackoff, initialBackoff * (1L << Math.min(failures, 20))); }
    private void poll(int failures) {
        int nextFailures = 0;
        try {
            List<Clip> clips = transport.poll();
            resumePending(); // Healthy transport can retry retained outbox after a bounded cooldown.
            report("poll", "Connected");
            // Endpoint returns newest first; leave the newest text on the clipboard.
            for (int i = clips.size() - 1; i >= 0 && active(); i--) {
                Clip clip = clips.get(i);
                if (!(journal==null?received.contains(clip.id):journal.hasReceived(clip.id))) {
                    synchronized (this) { if (closed) return; lastObserved = clip.text; }
                    sink.apply(clip);
                    if(journal!=null)journal.received(clip.id,clip.revision,clip.text);
                    report("received", clip.text);
                    received.add(clip.id);
                    if (received.size() > 2048) received.remove(received.iterator().next());
                }
                synchronized (this) {
                    if (!closed && awaitingAck.add(clip.id)) retry(acks, () -> { transport.acknowledge(clip.id); if(journal!=null)journal.acknowledged(clip.id,clip.revision);report("ack", "Receipt acknowledged"); }, 0, () -> {
                        synchronized (ClipboardSyncWorker.this) { awaitingAck.remove(clip.id); }
                    });
                }
            }
        } catch (Exception error) {
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
            nextFailures = Math.min(failures + 1, 20);
            report("error", "Connection interrupted. Retrying with bounded backoff.");
        }
        final int next = nextFailures;
        schedule(polls, () -> poll(next), next == 0 ? interval : backoff(next - 1));
    }
    private void retry(ScheduledThreadPoolExecutor lane, Operation operation, int attempt, Runnable done) {
        schedule(lane, () -> {
            try { operation.run(); done.run(); }
            catch (Exception error) {
                report("error", attempt + 1 < maxAttempts ? "Temporary failure. Retrying…" : "Retry burst paused. Pending work resumes after cooldown or Retry sync.");
                if (error instanceof InterruptedException) Thread.currentThread().interrupt();
                if (active() && attempt + 1 < maxAttempts) retry(lane, operation, attempt + 1, done);
                else done.run();
            }
        }, attempt == 0 ? 0 : backoff(attempt - 1));
    }
    @Override public synchronized void close() {
        if (closed) return;
        closed = true;
        polls.shutdownNow(); uploads.shutdownNow(); acks.shutdownNow(); transport.close();
    }
    boolean awaitStopped(long timeout, TimeUnit unit) throws InterruptedException {
        long end = System.nanoTime() + unit.toNanos(timeout);
        for (ScheduledThreadPoolExecutor lane : Arrays.asList(polls, uploads, acks))
            if (!lane.awaitTermination(Math.max(0, end - System.nanoTime()), TimeUnit.NANOSECONDS)) return false;
        return true;
    }
}
