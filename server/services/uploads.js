import Busboy from 'busboy';
import { createWriteStream } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';
import { record, requireValue } from './errors.js';

export function createUploads(store, events, maxSize) {
  const active = new Map();
  function destination(data, transfer) {
    const device = record(data, 'devices', transfer.deviceId);
    requireValue(device.id === 'local' && device.capabilities.files.status === 'supported', 'Native device delivery is unavailable.', 409, 'UNSUPPORTED');
    requireValue(data.settings.permissions.files, 'Local file permission is disabled.', 403, 'PERMISSION_REQUIRED');
    requireValue(device.trusted && device.status === 'connected', 'Local workspace is disconnected or not trusted.', 409, 'UNAVAILABLE');
  }
  return {
    destination,
    async cancel(id) {
      const item = await store.mutate(data => {
        const t = record(data, 'transfers', id);
        requireValue(['queued', 'uploading'].includes(t.status), 'Only queued or uploading transfers can be cancelled.', 409, 'INVALID_STATE');
        t.status = 'cancelled'; return t;
      });
      active.get(id)?.abort();
      events.publish('transfer.updated', id); return item;
    },
    async upload(req, res) {
      const id = req.params.id;
      requireValue(req.is('multipart/form-data'), 'A multipart/form-data upload is required.', 415);
      let parser;
      try { parser = Busboy({ headers: req.headers, limits: { fileSize: maxSize + 1, files: 1, fields: 0, parts: 2 } }); }
      catch { requireValue(false, 'Malformed multipart boundary.'); }
      const controller = new AbortController();
      const transfer = await store.mutate(data => {
        const t = record(data, 'transfers', id); destination(data, t);
        requireValue(t.status === 'queued' && !active.has(id), 'Transfer must be queued.', 409, 'INVALID_STATE');
        t.status = 'uploading'; t.error = null; return t;
      });
      active.set(id, controller);
      events.publish('transfer.updated', id);
      const temporary = join(store.directory, 'uploads', `${id}.part`);
      const final = join(store.directory, 'uploads', id);
      let bytes = 0, fileCount = 0, streamTask, stored = false;
      const hash = createHash('sha256');
      const abort = () => controller.abort();
      req.once('aborted', abort);
      const stopParser = () => { req.unpipe(parser); parser.destroy(new Error('Upload cancelled or interrupted.')); req.resume(); };
      controller.signal.addEventListener('abort', stopParser, { once: true });
      try {
        await new Promise((resolve, reject) => {
          parser.on('error', reject);
          parser.on('filesLimit', () => reject(Object.assign(new Error('Only one file is allowed.'), { status: 400 })));
          parser.on('fieldsLimit', () => reject(Object.assign(new Error('Unexpected multipart field.'), { status: 400 })));
          parser.on('partsLimit', () => reject(Object.assign(new Error('Only one multipart part is allowed.'), { status: 400 })));
          parser.on('file', (field, stream) => {
            fileCount++;
            if (field !== 'file') { stream.resume(); reject(Object.assign(new Error('Use the file multipart field.'), { status: 400 })); return; }
            const measure = new Transform({ transform(chunk, encoding, callback) {
              bytes += chunk.length;
              if (bytes > maxSize) return callback(Object.assign(new Error('File exceeds upload limit.'), { status: 413 }));
              hash.update(chunk); callback(null, chunk);
            } });
            streamTask = pipeline(stream, measure, createWriteStream(temporary, { flags: 'wx' }), { signal: controller.signal });
            streamTask.catch(reject);
          });
          parser.on('close', resolve);
          requireValue(!req.aborted && !controller.signal.aborted, 'Upload was interrupted.', 400, 'UPLOAD_FAILED');
          req.pipe(parser);
        });
        if (streamTask) await streamTask;
        requireValue(fileCount === 1, 'Exactly one file is required.');
        requireValue(bytes === transfer.size, 'Uploaded byte count does not match declared size.', 422, 'SIZE_MISMATCH');
        const checksum = hash.digest('hex');
        requireValue(!transfer.expectedChecksum || transfer.expectedChecksum === checksum, 'Checksum mismatch.', 422, 'CHECKSUM_MISMATCH');
        const item = await store.mutate(async data => {
          const t = record(data, 'transfers', id); destination(data, t);
          requireValue(t.status === 'uploading' && !controller.signal.aborted, 'Upload cancelled.', 409, 'INVALID_STATE');
          await rename(temporary, final); stored = true;
          Object.assign(t, { status: 'uploaded_locally', checksum, storageId: id, uploadedAt: new Date().toISOString(), error: null });
          data.activity.unshift({ id: `upload-${id}`, text: 'File uploaded locally. No native delivery occurred.', read: false, createdAt: t.uploadedAt });
          return t;
        });
        events.publish('transfer.updated', id); events.publish('activity.created', `upload-${id}`);
        res.json({ data: item });
      } catch (error) {
        controller.abort();
        if (streamTask) await streamTask.catch(() => {});
        await rm(temporary, { force: true });
        if (stored) await rm(final, { force: true });
        await store.mutate(data => {
          const t = record(data, 'transfers', id);
          if (t.status === 'uploading') { t.status = 'failed'; t.error = error.status ? error.message : 'Upload interrupted or could not be stored.'; }
        });
        events.publish('transfer.updated', id);
        throw Object.assign(error, { status: error.status || 400, code: error.code || 'UPLOAD_FAILED' });
      } finally {
        active.delete(id); req.removeListener('aborted', abort); controller.signal.removeEventListener('abort', stopParser);
      }
    },
  };
}
