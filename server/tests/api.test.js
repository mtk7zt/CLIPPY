import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { createApp } from '../app.js';
import { listenOptions } from '../index.js';

async function setup(t, maxSize = 1048576) {
  const directory = await mkdtemp(join(tmpdir(), 'clippy-test-'));
  const backend = await createApp({ directory, maxSize });
  const server = backend.app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { backend.events.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
  const request = async (path, method = 'GET', body, expected = 200) => {
    const response = await fetch(`${base}/api${path}`, { method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const json = response.status === 204 ? null : await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(json)}`); return json;
  };
  const upload = async (id, bytes, expected = 200, field = 'file') => {
    const form = new FormData(); form.append(field, new Blob([bytes]), 'file.txt');
    const response = await fetch(`${base}/api/transfers/${id}/upload`, { method: 'POST', body: form });
    const json = await response.json(); assert.equal(response.status, expected, JSON.stringify(json)); return json;
  };
  return { ...backend, directory, base, request, upload };
}

test('all core routes, validation, relationships and persistent local workflows', async t => {
  const { request: r, store, directory, base } = await setup(t);
  assert.equal((await r('/health')).status, 'ok');
  for (const path of ['/devices', '/pairing/requests', '/clipboard', '/transfers', '/activity', '/notifications', '/messages', '/settings']) assert.ok((await r(path)).data);
  const discovery = await r('/devices/discover', 'POST', {});
  assert.equal(discovery.networkDiscoveryPerformed, false); assert.ok(discovery.data.every(d => d.development));
  assert.match(discovery.message, /No physical device/);
  await r('/devices/missing', 'GET', undefined, 404);
  await r('/devices/local/capabilities');
  await r('/devices/example-phone/connect', 'POST', {}, 409);
  await r('/devices/manual', 'POST', { host: 'http://bad/path' }, 400);
  const device = (await r('/devices/manual', 'POST', { host: 'example.local', name: 'My saved host' }, 201)).data;
  assert.equal(device.status, 'offline');
  await r('/devices/manual', 'POST', { host: 'EXAMPLE.local' }, 409);
  await r('/pairing/requests', 'POST', { deviceId: 'missing' }, 404);
  const p = (await r('/pairing/requests', 'POST', { deviceId: device.id }, 201)).data;
  await r(`/pairing/${p.id}/approve`, 'POST', { code: 'nope' }, 422);
  await r(`/pairing/${p.id}/approve`, 'POST', { code: p.code });
  assert.equal((await r(`/devices/${device.id}`)).data.trusted, true);
  await r(`/pairing/${p.id}/reject`, 'POST', {}, 409);
  await r(`/devices/${device.id}/revoke-trust`, 'POST', {});
  await r('/pairing/example-pairing/reject', 'POST', {});
  await r('/devices/local/disconnect', 'POST', {});
  await r('/devices/local/connect', 'POST', {});
  await r('/clipboard', 'POST', { text: '' }, 400);
  const c = (await r('/clipboard', 'POST', { text: '<script>untrusted</script>' }, 201)).data;
  await r(`/clipboard/${c.id}`, 'PATCH', { pinned: true, archived: true });
  await r(`/clipboard/${c.id}`, 'PATCH', { pinned: 'yes' }, 400);
  await r(`/clipboard/${c.id}/push`, 'POST', { deviceId: 'missing' }, 404);
  await r(`/clipboard/${c.id}/push`, 'POST', { deviceId: 'local' }, 409);
  const exported = await r('/clipboard/export'); assert.ok(exported.some(item => item.id === c.id));
  await r(`/clipboard/${c.id}`, 'DELETE', undefined, 204);
  await r('/activity/welcome/read', 'POST', {});
  await r('/activity/mark-all-read', 'POST', {});
  await r('/settings', 'PATCH', { theme: 'dark', compact: true, permissions: { files: false } });
  await r('/transfers', 'POST', { name: 'a', size: 1 }, 403);
  await r('/settings', 'PATCH', { permissions: { files: true } });
  await r('/settings', 'PATCH', { theme: 'other' }, 400);
  await r('/transfers', 'POST', { name: 'a', size: 1, deviceId: 'missing' }, 404);
  await r('/transfers', 'POST', { name: 'a', size: 1, deviceId: 'example-phone' }, 409);
  const saved = JSON.parse(await readFile(join(directory, 'data.json'), 'utf8'));
  assert.equal(saved.settings.theme, 'dark'); assert.equal(store.read().settings.theme, 'dark');
  const restarted = await createApp({ directory }); assert.equal(restarted.store.read().settings.theme, 'dark'); restarted.events.close();
  for (const path of ['/server/store/data.json', '/package.json', '/.git/config']) assert.equal((await fetch(base + path)).status, 404);
  assert.equal((await fetch(base + '/')).status, 200);
  await r('/not-found', 'GET', undefined, 404);
});

test('a paired Android companion can publish and acknowledge clipboard sync', async t => {
  const { request: r, base } = await setup(t);
  const registered = (await r('/native/devices/register', 'POST', {
    name: 'Mira Pixel 8',
    platform: 'android',
    capabilities: ['clipboard'],
  }, 201)).data;
  assert.equal(registered.device.status, 'pairing');
  assert.match(registered.deviceToken, /^[a-f0-9]{64}$/);
  await r(`/pairing/${registered.pairing.id}/approve`, 'POST', { code: registered.pairing.code });
  const headers = { 'Content-Type': 'application/json', 'X-Clippy-Device-Id': registered.device.id, Authorization: `Bearer ${registered.deviceToken}` };
  const publish = await fetch(`${base}/api/native/clipboard`, { method: 'POST', headers, body: JSON.stringify({ text: 'Copied from Android' }) });
  assert.equal(publish.status, 201);
  const clip = (await publish.json()).data;
  assert.equal(clip.deviceId, registered.device.id);
  const browserClip = (await r('/clipboard', 'POST', { text: 'Copied from browser' }, 201)).data;
  const sync = await fetch(`${base}/api/native/clipboard/pending`, { headers });
  assert.equal(sync.status, 200);
  const pending = (await sync.json()).data;
  assert.ok(pending.some(item => item.id === browserClip.id));
  const acknowledged = await fetch(`${base}/api/native/clipboard/${browserClip.id}/ack`, { method: 'POST', headers });
  assert.equal(acknowledged.status, 200);
  assert.equal((await acknowledged.json()).data.id, browserClip.id);
});

test('streamed uploads verify bytes, checksum, download and legal transitions', async t => {
  const { request: r, upload, base, store } = await setup(t);
  assert.ok(store.read().transfers.every(t => ['queued', 'uploaded_locally', 'failed'].includes(t.status)));
  const bytes = Buffer.from('a real file\n'.repeat(20000));
  const checksum = createHash('sha256').update(bytes).digest('hex');
  const transfer = (await r('/transfers', 'POST', { name: 'test.txt', size: bytes.length, expectedChecksum: checksum }, 201)).data;
  await r(`/transfers/${transfer.id}/download`, 'GET', undefined, 409);
  const uploaded = (await upload(transfer.id, bytes)).data;
  assert.equal(uploaded.status, 'uploaded_locally'); assert.equal(uploaded.checksum, checksum);
  const response = await fetch(`${base}/api/transfers/${transfer.id}/download`);
  assert.equal(response.status, 200); assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
  assert.equal((await r(`/transfers/${transfer.id}`)).data.size, bytes.length);
  await r(`/transfers/${transfer.id}/retry`, 'POST', {}, 409);
  await r(`/transfers/${transfer.id}/cancel`, 'POST', {}, 409);
  await upload(transfer.id, bytes, 409);
  const bad = (await r('/transfers', 'POST', { name: 'bad.txt', size: 3 }, 201)).data;
  await upload(bad.id, Buffer.from('too long'), 422);
  assert.equal((await r(`/transfers/${bad.id}`)).data.status, 'failed');
  await r(`/transfers/${bad.id}/retry`, 'POST', {});
  await upload(bad.id, Buffer.from('yes'));
  const hashBad = (await r('/transfers', 'POST', { name: 'bad.txt', size: 3, expectedChecksum: '0'.repeat(64) }, 201)).data;
  await upload(hashBad.id, Buffer.from('yes'), 422);
  await r('/transfers/example-queued/cancel', 'POST', {});
  assert.equal((await r('/transfers/example-queued')).data.status, 'cancelled');
  assert.ok(store.read().transfers.every(t => t.status !== 'delivered'));
});

test('multipart errors, limits, restart recovery and corrupted data', async t => {
  const { request: r, upload, base, directory } = await setup(t, 1024);
  await r('/transfers', 'POST', { name: 'big', size: 1025 }, 413);
  const make = async () => (await r('/transfers', 'POST', { name: 'a.txt', size: 10 }, 201)).data.id;
  await upload(await make(), Buffer.alloc(1025), 413);
  await upload(await make(), Buffer.alloc(10), 400, 'wrong');
  const id = await make();
  const malformed = await fetch(`${base}/api/transfers/${id}/upload`, { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=abc' }, body: 'invalid' });
  assert.equal(malformed.status, 400);
  await r(`/transfers/${await make()}/upload`, 'POST', {}, 415);
  const dataPath = join(directory, 'data.json');
  const saved = JSON.parse(await readFile(dataPath, 'utf8')); saved.transfers[0].status = 'uploading';
  await writeFile(dataPath, JSON.stringify(saved));
  const recovered = await createApp({ directory }); assert.equal(recovered.store.read().transfers[0].status, 'failed'); recovered.events.close();
  await writeFile(dataPath, 'bad JSON');
  await assert.rejects(createApp({ directory }), /corrupt/);
});

test('SSE receives committed revisions and settings events', async t => {
  const { request: r, base, store } = await setup(t);
  const abort = new AbortController(); t.after(() => abort.abort());
  const response = await fetch(`${base}/api/events`, { signal: abort.signal });
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  const reader = response.body.getReader(); await reader.read();
  await r('/settings', 'PATCH', { archive: false });
  const message = new TextDecoder().decode((await reader.read()).value);
  assert.match(message, /event: permission.updated/);
  assert.match(message, new RegExp(`"revision":${store.read().revision}`));
  assert.equal(store.read().settings.archive, false); await reader.cancel();
});

test('port and hosted environment configuration', () => {
  assert.deepEqual(listenOptions({}), { port: 4173, host: '127.0.0.1' });
  assert.deepEqual(listenOptions({ PORT: '4567' }), { port: 4567, host: '0.0.0.0' });
  assert.equal(listenOptions({ CI: 'true' }).host, '0.0.0.0');
  assert.equal(listenOptions({ PORT: '4567', HOST: '127.0.0.1' }).host, '127.0.0.1');
  assert.throws(() => listenOptions({ PORT: 'bad' }));
});

test('concurrent store writes retain all records and archive permissions are enforced', async t => {
  const { request: r, directory } = await setup(t);
  const clips = await Promise.all(Array.from({ length: 8 }, (_, i) => r('/clipboard', 'POST', { text: `Concurrent clip ${i}` }, 201)));
  const persisted = JSON.parse(await readFile(join(directory, 'data.json'), 'utf8'));
  for (const clip of clips) assert.ok(persisted.clipboard.some(c => c.id === clip.data.id));
  await r('/settings', 'PATCH', { archive: false, permissions: { files: false } });
  await r(`/clipboard/${clips[0].data.id}`, 'PATCH', { archived: true }, 403);
  assert.equal((await r('/devices/local/capabilities')).data.files.status, 'permissionRequired');
});

test('active cancellation, interrupted streams and concurrent upload claims', { timeout: 15000 }, async t => {
  const { request: r, base, directory } = await setup(t);
  async function begin() {
    const id = (await r('/transfers', 'POST', { name: 'partial.txt', size: 100000 }, 201)).data.id;
    const req = httpRequest(`${base}/api/transfers/${id}/upload`, { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=clippy' } });
    const response = new Promise(resolve => { req.on('response', res => { res.resume(); res.on('end', () => resolve(res.statusCode)); }); req.on('error', () => resolve(0)); });
    req.write('--clippy\r\nContent-Disposition: form-data; name="file"; filename="partial.txt"\r\nContent-Type: application/octet-stream\r\n\r\n');
    req.write(Buffer.alloc(1000));
    for (let i = 0; i < 100; i++) { if ((await r(`/transfers/${id}`)).data.status === 'uploading') break; await new Promise(resolve => setTimeout(resolve, 10)); }
    assert.equal((await r(`/transfers/${id}`)).data.status, 'uploading');
    return { id, req, response };
  }
  const current = await begin();
  const duplicate = new FormData(); duplicate.append('file', new Blob([Buffer.alloc(100000)]), 'partial.txt');
  const conflict = await fetch(`${base}/api/transfers/${current.id}/upload`, { method: 'POST', body: duplicate }); assert.equal(conflict.status, 409);
  await r(`/transfers/${current.id}/cancel`, 'POST', {});
  current.req.end(); await current.response;
  assert.equal((await r(`/transfers/${current.id}`)).data.status, 'cancelled');
  await assert.rejects(readFile(join(directory, 'uploads', `${current.id}.part`)), { code: 'ENOENT' });
  const interrupted = await begin(); interrupted.req.destroy(); await interrupted.response;
  for (let i = 0; i < 100; i++) { if ((await r(`/transfers/${interrupted.id}`)).data.status === 'failed') break; await new Promise(resolve => setTimeout(resolve, 10)); }
  assert.equal((await r(`/transfers/${interrupted.id}`)).data.status, 'failed');
  await assert.rejects(readFile(join(directory, 'uploads', `${interrupted.id}.part`)), { code: 'ENOENT' });
});

test('multiple multipart files, expired pairing, permission rejection and escaped filenames', async t => {
  const { request: r, base, store, upload } = await setup(t);
  const id = (await r('/transfers', 'POST', { name: '../example.txt', size: 3 }, 201)).data.id;
  const form = new FormData(); form.append('file', new Blob(['one']), 'a'); form.append('file', new Blob(['two']), 'b');
  const response = await fetch(`${base}/api/transfers/${id}/upload`, { method: 'POST', body: form }); assert.equal(response.status, 400);
  await r(`/transfers/${id}/retry`, 'POST', {}); await upload(id, Buffer.from('one'));
  assert.equal((await r(`/transfers/${id}`)).data.storageId, id);
  await store.mutate(data => { data.pairing[0].expiresAt = '2000-01-01T00:00:00Z'; });
  await r('/pairing/example-pairing/approve', 'POST', { code: '4817' }, 409);
  assert.equal((await r('/pairing/requests')).data[0].status, 'expired');
  await r('/settings', 'PATCH', { permissions: { clipboard: false } });
  await r('/clipboard', 'POST', { text: 'blocked' }, 403);
});
