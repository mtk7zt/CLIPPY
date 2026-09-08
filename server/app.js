import express from 'express';
import { resolve } from 'node:path';
import { createStore } from './store/index.js';
import { createEvents } from './events/index.js';
import { routes } from './routes/index.js';
export async function createApp({ directory = resolve(import.meta.dirname, 'store'), maxSize = Number(process.env.MAX_UPLOAD_BYTES || 100 * 1024 * 1024) } = {}) {
  if (!Number.isSafeInteger(maxSize) || maxSize < 1) throw new Error('MAX_UPLOAD_BYTES must be a positive integer.');
  const store = await createStore(directory);
  const events = createEvents(store);
  const app = express(); app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.headers.origin && req.headers.origin !== `${req.protocol}://${req.get('host')}` && req.headers.origin !== `https://${req.get('host')}`) return res.status(403).json({ error: { code: 'ORIGIN_DENIED', message: 'Use the same origin as Clippy.', details: {} } });
    next();
  }, express.json({ limit: '512kb' }), routes(store, events, maxSize));
  app.use('/api', (req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found.', details: {} } }));
  const root = resolve(import.meta.dirname, '..');
  for (const file of ['index.html', 'app.js', 'styles.css', 'sw.js', 'manifest.webmanifest', 'icon.svg']) app.get(file === 'index.html' ? ['/', '/index.html'] : `/${file}`, (req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(resolve(root, file)); });
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    res.status(status).json({ error: { code: error.code || (status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST'), message: status >= 500 ? 'Local backend could not complete the operation.' : error.type === 'entity.parse.failed' ? 'Malformed JSON request body.' : error.message, details: error.details || {} } });
  });
  return { app, store, events };
}
