export function createEvents(store) {
  const clients = new Set();
  return {
    publish(type, id) {
      const revision = store.read().revision;
      const message = `id: ${revision}\nevent: ${type}\ndata: ${JSON.stringify({ id, revision })}\n\n`;
      for (const client of clients) if (!client.write(message)) { client.end(); clients.delete(client); }
    },
    subscribe(req, res) {
      res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.flushHeaders(); res.write(': connected\n\n'); clients.add(res);
      const timer = setInterval(() => res.write(': heartbeat\n\n'), 15000);
      req.on('close', () => { clearInterval(timer); clients.delete(res); });
    },
    close() { for (const client of clients) client.end(); clients.clear(); },
  };
}
