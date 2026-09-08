import { createApp } from './app.js';
export function listenOptions(env = process.env) {
  const port = Number(env.PORT || 4173);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT.');
  const hosted = env.PORT || env.CI || env.NODE_ENV === 'production' || env.REPL_ID || env.RENDER || env.RAILWAY_ENVIRONMENT;
  return { port, host: env.HOST || (hosted ? '0.0.0.0' : '127.0.0.1') };
}
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const { app, events } = await createApp();
  const server = app.listen(listenOptions(), () => console.log(`Clippy listening on port ${server.address().port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { events.close(); server.close(() => process.exit(0)); });
}
