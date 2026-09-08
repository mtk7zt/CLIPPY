import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../app.js';

async function setup(t) {
  const directory = await mkdtemp(join(tmpdir(), 'clippy-native-'));
  const backend = await createApp({ directory });
  const server = backend.app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  t.after(async () => { backend.events.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
  async function r(path, method = 'GET', body, status = 200, auth = {}) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...auth }, body: body === undefined ? undefined : JSON.stringify(body) });
    const json = await response.json();
    assert.equal(response.status, status, `${path}: ${JSON.stringify(json)}`);
    if (status >= 400) { assert.equal(typeof json.error.code, 'string'); assert.equal(typeof json.error.message, 'string'); assert.deepEqual(json.error.details, {}); }
    return json.data ?? json;
  }
  async function register() {
    const d = await r('/native/devices/register', 'POST', { name: 'QA Android', platform: 'android', capabilities: ['clipboard'] }, 201);
    return { ...d, auth: { 'X-Clippy-Device-Id': d.device.id, Authorization: `Bearer ${d.deviceToken}` } };
  }
  async function approve(d) {
    await r(`/pairing/${d.pairing.id}/approve`, 'POST', { code: d.pairing.code });
    return r('/native/pairing/approve', 'POST', { pairingId: d.pairing.id, code: d.pairing.code }, 200, d.auth);
  }
  return { ...backend, directory, r, register, approve, base };
}

test('health aliases, absolute API responses and credential sanitization', async t => {
  const { r, register, directory, base } = await setup(t);
  assert.deepEqual(await r('/health'), await r('/healthz'));
  const d = await register();
  assert.equal(d.device.trusted, false);
  assert.ok(!JSON.stringify(await r('/devices')).includes(d.deviceToken));
  assert.ok(!JSON.stringify(await r(`/devices/${d.device.id}`)).includes('deviceToken'));
  const disk = await readFile(join(directory, 'data.json'), 'utf8');
  assert.ok(!disk.includes(d.deviceToken)); assert.match(disk, /deviceTokenHash/);
  await r('/native/clipboard/pending', 'GET', undefined, 401);
  await r('/native/missing', 'GET', undefined, 404);
  const malformed = await fetch(base + '/native/devices/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400); assert.match((await malformed.json()).error.message, /Malformed JSON/);
  await r('/native/devices/register', 'POST', { name: '', platform: 'android', capabilities: ['clipboard'] }, 400);
  await r('/native/devices/register', 'POST', { name: 'A', platform: 'android', capabilities: ['sms'] }, 422);
});

test('pairing cannot self-approve, cross devices, use wrong codes or trust expired/rejected requests', async t => {
  const { r, register, store } = await setup(t);
  const a = await register(), b = await register();
  await r('/native/pairing/approve', 'POST', { pairingId: a.pairing.id, code: a.pairing.code }, 409, a.auth);
  await r('/native/pairing/approve', 'POST', { pairingId: b.pairing.id, code: b.pairing.code }, 403, a.auth);
  await r('/native/pairing/approve', 'POST', { pairingId: a.pairing.id, code: 'wrong' }, 422, a.auth);
  await r('/native/clipboard/publish', 'POST', { text: 'blocked' }, 409, a.auth);
  await r(`/pairing/${a.pairing.id}/reject`, 'POST', {});
  assert.equal((await r('/native/status', 'GET', undefined, 200, a.auth)).pairing.status, 'rejected');
  await r(`/pairing/${a.pairing.id}/approve`, 'POST', { code: a.pairing.code }, 409);
  await store.mutate(data => { data.pairing.find(p => p.id === b.pairing.id).expiresAt = '2000-01-01T00:00:00Z'; });
  assert.equal((await r('/native/status', 'GET', undefined, 200, b.auth)).pairing.status, 'expired');
  await r(`/pairing/${b.pairing.id}/approve`, 'POST', { code: b.pairing.code }, 409);
  const c = await register();
  await r('/native/pairing/cancel', 'POST', { pairingId: c.pairing.id }, 200, c.auth);
  assert.equal((await r('/native/status', 'GET', undefined, 200, c.auth)).pairing.status, 'rejected');
});

test('native clipboard retries are idempotent, receipt requires an offered item and never echoes', async t => {
  const { r, register, approve, store, directory } = await setup(t);
  const d = await register(); await approve(d);
  const event = { text: 'QA outbound', eventId: 'retry-event-001' };
  const sent = await r('/native/clipboard/publish', 'POST', event, 201, d.auth);
  const duplicate = await r('/native/clipboard/publish', 'POST', event, 200, d.auth);
  assert.equal(duplicate.id, sent.id); assert.equal(duplicate.duplicate, true);
  await r('/native/clipboard/publish', 'POST', { ...event, text: 'different' }, 409, d.auth);
  assert.equal((await r('/clipboard')).filter(c => c.id === sent.id).length, 1);
  assert.ok(!(await r('/native/clipboard/pending', 'GET', undefined, 200, d.auth)).some(c => c.id === sent.id));
  const browser = await r('/clipboard', 'POST', { text: 'QA inbound' }, 201);
  assert.deepEqual(browser.sync.acknowledgements, []);
  assert.equal(browser.sync.deliveries[d.device.id].status, 'pending');
  await r(`/native/clipboard/${browser.id}/ack`, 'POST', {}, 409, d.auth);
  assert.ok((await r('/native/clipboard/pending', 'GET', undefined, 200, d.auth)).some(c => c.id === browser.id));
  const ack = await r(`/native/clipboard/${browser.id}/ack`, 'POST', {}, 200, d.auth);
  assert.deepEqual(ack.sync.acknowledgements, [d.device.id]);
  await r(`/clipboard/${browser.id}`, 'PATCH', { text: 'Changed after receipt' }, 409);
  await r(`/native/clipboard/${browser.id}/ack`, 'POST', {}, 200, d.auth);
  assert.equal(store.read().activity.filter(a => a.text.includes('receipt acknowledged')).length, 1);
  assert.equal((await r('/native/clipboard/pending', 'GET', undefined, 200, d.auth)).length, 0);
  await r(`/native/clipboard/${sent.id}/ack`, 'POST', {}, 409, d.auth);
  await r('/native/clipboard/missing/ack', 'POST', {}, 404, d.auth);
  await r(`/clipboard/${sent.id}/push`, 'POST', { deviceId: d.device.id }, 409);
  const next = await r('/native/clipboard/publish', 'POST', { text: 'Next upload', eventId: 'retry-event-002' }, 201, d.auth);
  assert.notEqual(next.id, sent.id);
  const restarted = await createApp({ directory });
  assert.equal(restarted.store.read().clipboard.find(c => c.id === browser.id).sync.deliveries[d.device.id].status, 'acknowledged');
  assert.equal(restarted.store.read().devices.find(c => c.id === d.device.id).status, 'offline'); restarted.events.close();
});

test('permissions, offline, capability and stale-presence checks gate native operations', async t => {
  const { r, register, approve, store } = await setup(t);
  const d = await register(); await approve(d);
  await r('/settings', 'PATCH', { permissions: { clipboard: false } });
  await r('/native/clipboard/pending', 'GET', undefined, 403, d.auth);
  await r('/native/clipboard/publish', 'POST', { text: 'blocked' }, 403, d.auth);
  await r('/settings', 'PATCH', { permissions: { clipboard: true } });
  await r('/native/devices/disconnect', 'POST', {}, 200, d.auth);
  await r('/native/clipboard/pending', 'GET', undefined, 409, d.auth);
  await r('/native/devices/connect', 'POST', {}, 200, d.auth);
  await store.mutate(data => { data.devices.find(c => c.id === d.device.id).capabilities.clipboard.status = 'unavailable'; });
  await r('/native/clipboard/publish', 'POST', { text: 'blocked' }, 409, d.auth);
  await store.mutate(data => { data.devices.find(c => c.id === d.device.id).lastSeenAt = '2000-01-01T00:00:00Z'; });
  assert.equal((await r(`/devices/${d.device.id}`)).status, 'offline');
  await r('/native/devices/revoke-trust', 'POST', {}, 200, d.auth);
  await r('/native/status', 'GET', undefined, 401, d.auth);
});

test('automatic resume recovers restart-offline but never overrides an explicit disconnect or revoked trust', async t => {
  const { r, register, approve, store } = await setup(t);
  const d = await register(); await approve(d);
  const clip = await r('/clipboard', 'POST', { text: 'Pending across restart' }, 201);
  await store.mutate(data => { data.devices.find(x => x.id === d.device.id).status = 'offline'; });
  await r('/native/clipboard/pending', 'GET', undefined, 409, d.auth);
  await r('/native/devices/connect', 'POST', { resume: true }, 200, d.auth);
  assert.ok((await r('/native/clipboard/pending', 'GET', undefined, 200, d.auth)).some(c => c.id === clip.id));
  await r('/native/devices/disconnect', 'POST', {}, 200, d.auth);
  await r('/native/devices/connect', 'POST', { resume: true }, 409, d.auth);
  await r('/native/devices/connect', 'POST', { resume: 'yes' }, 400, d.auth);
  await r('/native/devices/connect', 'POST', {}, 200, d.auth);
  await r('/native/devices/revoke-trust', 'POST', {}, 200, d.auth);
  await r('/native/devices/connect', 'POST', { resume: true }, 401, d.auth);
});

test('event envelopes, receipt cursors and unacknowledged delivery survive a real store reload', async t => {
  const { r, register, approve, directory } = await setup(t);
  const d=await register();await approve(d);
  const c=await r('/clipboard','POST',{text:'Event envelope'},201);
  assert.equal(c.content,'Event envelope');assert.equal(c.sourceDeviceId,'local');assert.equal(c.eventId,c.id);
  assert.match(c.contentHash,/^[a-f0-9]{64}$/);assert.ok(Number.isSafeInteger(c.revision));
  const pending=await r('/native/clipboard/pending','GET',undefined,200,d.auth);
  assert.equal(pending[0].targetDeviceId,d.device.id);
  const restart=await createApp({directory});
  const server=restart.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  t.after(async()=>{restart.events.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
  const request=async(path,method='GET',body)=>{
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/native${path}`,{method,headers:{'Content-Type':'application/json',...d.auth},body:body===undefined?undefined:JSON.stringify(body)});
    assert.equal(response.status,200);return (await response.json()).data;
  };
  await request('/devices/connect','POST',{resume:true});
  assert.equal((await request('/clipboard/pending'))[0].id,c.id);
  await request(`/clipboard/${c.id}/ack`,'POST',{});await request(`/clipboard/${c.id}/ack`,'POST',{});
  const saved=restart.store.read();assert.equal(saved.devices.find(x=>x.id===d.device.id).sync.lastAcknowledgedRevision,c.revision);
  assert.equal(saved.clipboard.find(x=>x.id===c.id).sync.acknowledgements.length,1);
});

test('service heartbeat exposes restrictions without treating a live Activity as a running sync service', async t => {
  const {r,register,approve,store}=await setup(t);const d=await register();await approve(d);
  const state={enabled:true,serviceRunning:true,clipboardAccess:'restricted',state:'active',androidVersion:36};
  await r('/native/sync/status','POST',state,200,d.auth);
  let device=await r(`/devices/${d.device.id}`);assert.equal(device.sync.serviceRunning,true);assert.equal(device.sync.clipboardAccess,'restricted');
  const clip=await r('/clipboard','POST',{text:'While Activity closed'},201);assert.equal(clip.sync.deliveries[d.device.id].status,'pending');
  await r('/native/sync/status','POST',{...state,enabled:false,serviceRunning:false,state:'disabled'},200,d.auth);
  device=await r(`/devices/${d.device.id}`);assert.equal(device.sync.state,'disabled');
  await r('/native/sync/status','POST',{...state,state:'made-up'},400,d.auth);
  await r('/native/sync/status','POST',{...state,clipboardAccess:'unrestricted'},400,d.auth);
  await store.mutate(data=>{data.devices.find(x=>x.id===d.device.id).sync.updatedAt='2000-01-01T00:00:00Z';});
  assert.equal((await r(`/devices/${d.device.id}`)).sync.serviceRunning,false);
});

test('large Unicode clipboard is accepted and pending batches do not starve older events',async t=>{
  const {r,register,approve}=await setup(t);const d=await register();await approve(d);
  const first=await r('/clipboard','POST',{text:'界'.repeat(65536)},201);
  for(let i=0;i<101;i++)await r('/clipboard','POST',{text:`Rapid ${i}`},201);
  const pending=await r('/native/clipboard/pending','GET',undefined,200,d.auth);
  assert.ok(pending.some(c=>c.id===first.id));assert.ok(pending.length<=100);
});
