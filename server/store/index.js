import { mkdir, readFile, writeFile, rename, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { seed, sample } from './seed.js';
import { tokenHash, envelope } from '../services/native.js';
export async function createStore(directory) {
  await mkdir(join(directory, 'uploads'), { recursive: true });
  const path = join(directory, 'data.json');
  let data;
  try { data = JSON.parse(await readFile(path, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Development store is unreadable or corrupt; restore it before starting.', { cause: error });
    data = seed();
    await writeFile(join(directory, 'uploads', 'example-upload'), sample);
    await writeFile(path, JSON.stringify(data, null, 2));
  }
  if (data.version !== 1 || !['devices', 'pairing', 'clipboard', 'transfers', 'activity', 'notifications', 'messages'].every(key => Array.isArray(data[key])) || !data.settings) throw new Error('Invalid development store schema.');
  let queue = Promise.resolve();
  const store = {
    directory,
    read: () => structuredClone(data),
    mutate(operation) {
      const task = queue.then(async () => {
        const next = structuredClone(data);
        const result = await operation(next);
        next.revision++;
        await writeFile(`${path}.tmp`, JSON.stringify(next, null, 2));
        await rename(`${path}.tmp`, path);
        data = next;
        return structuredClone(result);
      });
      queue = task.catch(() => {});
      return task;
    },
  };
  await store.mutate(next => {
    for (const clip of next.clipboard) envelope(next, clip);
    for (const t of next.transfers) if (t.status === 'uploading') { t.status = 'failed'; t.error = 'Upload interrupted by server restart.'; }
    for (const d of next.devices) if (d.native) {
      if (d.deviceToken) { d.deviceTokenHash = tokenHash(d.deviceToken); delete d.deviceToken; }
      if (d.status === 'connected') d.status = 'offline';
      if (d.sync) { d.sync.serviceRunning = false; d.sync.state = d.sync.enabled ? 'reconnecting' : 'disabled'; }
    }
  });
  for (const name of await readdir(join(directory, 'uploads'))) if (name.endsWith('.part')) await unlink(join(directory, 'uploads', name));
  return store;
}
