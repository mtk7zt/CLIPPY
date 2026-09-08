import { Router } from 'express';
import { randomUUID, randomInt } from 'node:crypto';
import { isIP } from 'node:net';
import { join } from 'node:path';
import { capabilities } from '../store/seed.js';
import { record, requireValue, bodyFields, text, fail } from '../services/errors.js';
import { createUploads } from '../services/uploads.js';
import { nativeRoutes } from './native.js';
import { publicDevice, pairingState, queueClip, envelope } from '../services/native.js';

export function routes(store, events, maxSize) {
  const router = Router();
  const uploads = createUploads(store, events, maxSize);
  const get = (collection, id) => record(store.read(), collection, id);
  const mutate = async (type, id, fn) => { const result = await store.mutate(fn); events.publish(type, id || result?.id); return result; };
  const send = (res, data, status = 200) => res.status(status).json({ data });
  const now = () => new Date().toISOString();
  router.use('/native', nativeRoutes(store, events));
  router.get(['/health', '/healthz'], (req, res) => res.json({ status: 'ok', version: 1, maxUploadBytes: maxSize }));
  router.get('/events', (req, res) => events.subscribe(req, res));
  router.get('/devices', (req, res) => send(res, store.read().devices.map(publicDevice)));
  router.post('/devices/discover', (req, res) => res.json({ data: store.read().devices.filter(d => d.development), development: true, networkDiscoveryPerformed: false, message: 'Development examples only. No physical device was contacted or discovered.' }));
  router.post('/devices/manual', async (req, res) => {
    bodyFields(req.body, ['host', 'name']);
    const { host, name } = req.body;
    requireValue(text(host, 253) && (isIP(host) || /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(host)), 'Enter a valid IP address or hostname.');
    requireValue(name === undefined || text(name, 100), 'Invalid device name.');
    send(res, await mutate('device.updated', null, data => {
      requireValue(!data.devices.some(d => d.host?.toLowerCase() === host.toLowerCase()), 'Host is already saved.', 409, 'CONFLICT');
      const d = { id: randomUUID(), name: name || host, host, status: 'offline', trusted: false, development: false, kind: 'devices', capabilities: capabilities() };
      data.devices.push(d); return d;
    }), 201);
  });
  router.get('/devices/:id', (req, res) => send(res, publicDevice(get('devices', req.params.id))));
  router.get('/devices/:id/capabilities', (req, res) => {
    const data = store.read(); const device = record(data, 'devices', req.params.id);
    const result = structuredClone(device.capabilities);
    if (device.id === 'local') for (const key of ['clipboard', 'files']) {
      if (!data.settings.permissions[key]) result[key] = { status: 'permissionRequired', reason: 'Enable this local permission in Settings.' };
      else if (!device.trusted || device.status !== 'connected') result[key] = { status: 'unavailable', reason: 'Reconnect and establish local trust first.' };
    }
    if (device.native && result.clipboard?.status === 'supported') {
      if (!data.settings.permissions.clipboard) result.clipboard = { status: 'permissionRequired', reason: 'Enable clipboard in workspace Settings.' };
      else if (!device.trusted || publicDevice(device).status !== 'connected') result.clipboard = { status: 'unavailable', reason: 'Approve trust and open the connected Android companion.' };
    }
    send(res, result);
  });
  for (const action of ['connect', 'disconnect', 'revoke-trust']) router.post(`/devices/:id/${action}`, async (req, res) => {
    send(res, await mutate('device.updated', req.params.id, data => {
      const d = record(data, 'devices', req.params.id);
      if (action === 'connect') {
        requireValue(d.id === 'local', 'Native connection transport is unavailable. No device was contacted.', 409, 'UNSUPPORTED');
        requireValue(d.trusted, 'Local trust is required.', 409, 'TRUST_REQUIRED'); d.status = 'connected';
      } else if (action === 'disconnect') { d.status = 'disconnected'; }
      else { d.trusted = false; d.status = 'disconnected'; if (d.native) { delete d.deviceTokenHash; delete d.deviceToken; } for (const p of data.pairing) if (p.deviceId === d.id && p.status === 'pending') p.status = 'rejected'; }
      return publicDevice(d);
    }));
    if (action === 'revoke-trust') events.publish('pairing.updated', req.params.id);
  });
  router.get('/pairing/requests', (req, res) => send(res, store.read().pairing.map(p => p.status === 'pending' && Date.parse(p.expiresAt) <= Date.now() ? { ...p, status: 'expired' } : p)));
  router.post('/pairing/requests', async (req, res) => {
    bodyFields(req.body, ['deviceId']);
    send(res, await mutate('pairing.updated', null, data => {
      const d = record(data, 'devices', req.body.deviceId);
      requireValue(!d.trusted, 'Device already trusted locally.', 409, 'INVALID_STATE');
      requireValue(!data.pairing.some(p => p.deviceId === d.id && p.status === 'pending' && Date.parse(p.expiresAt) > Date.now()), 'A pairing request is already pending.', 409, 'CONFLICT');
      const p = { id: randomUUID(), deviceId: d.id, code: String(randomInt(1000, 10000)), status: 'pending', development: true, expiresAt: new Date(Date.now() + 300000).toISOString() };
      data.pairing.push(p); return p;
    }), 201);
  });
  for (const action of ['approve', 'reject']) router.post(`/pairing/:id/${action}`, async (req, res) => {
    const item = await mutate('pairing.updated', req.params.id, data => {
      const p = record(data, 'pairing', req.params.id);
      requireValue(p.status === 'pending' && Date.parse(p.expiresAt) > Date.now(), 'Pairing request is no longer pending.', 409, 'INVALID_STATE');
      if (action === 'approve') { bodyFields(req.body, ['code']); requireValue(req.body.code === p.code, 'Verification code does not match.', 422); }
      const d = record(data, 'devices', p.deviceId);
      p.status = action === 'approve' ? 'approved' : 'rejected';
      if (action === 'approve') { d.trusted = true; if (d.native) { d.status = 'connected'; d.lastSeenAt = now(); } }
      else if (d.native) d.status = 'disconnected';
      return p;
    });
    events.publish('device.updated', item.deviceId); send(res, item);
  });
  router.get('/clipboard/export', (req, res) => { res.attachment('clippy-clipboard.json'); res.json(store.read().clipboard); });
  router.get('/clipboard', (req, res) => send(res, store.read().clipboard));
  router.post('/clipboard', async (req, res) => {
    bodyFields(req.body, ['text', 'deviceId']); requireValue(text(req.body.text, 65536), 'Clip must contain 1–65536 characters.');
    send(res, await mutate('clipboard.updated', null, data => {
      const d = record(data, 'devices', req.body.deviceId || 'local');
      requireValue(d.id === 'local', 'Only local clips can be created.', 409, 'UNSUPPORTED');
      requireValue(d.trusted && d.status === 'connected', 'Local workspace is disconnected or not trusted.', 409, 'UNAVAILABLE');
      requireValue(data.settings.permissions.clipboard, 'Clipboard permission is disabled.', 403, 'PERMISSION_REQUIRED');
      const clip = queueClip(data, { id: randomUUID(), text: req.body.text, deviceId: d.id, source: d.name, createdAt: now(), pinned: false, archived: false });
      data.clipboard.unshift(clip); return clip;
    }), 201);
  });
  router.patch('/clipboard/:id', async (req, res) => {
    bodyFields(req.body, ['text', 'pinned', 'archived']);
    requireValue(req.body.text === undefined || text(req.body.text, 65536), 'Invalid clipboard text.');
    for (const key of ['pinned', 'archived']) requireValue(req.body[key] === undefined || typeof req.body[key] === 'boolean', 'Invalid clip flag.');
    send(res, await mutate('clipboard.updated', req.params.id, data => {
      const clip = record(data, 'clipboard', req.params.id);
      requireValue(req.body.text === undefined || req.body.text === clip.text || !Object.keys(clip.sync?.deliveries || {}).length, 'Create a new clip to change text already queued for a device. Its receipt belongs to the original text.', 409, 'SYNC_ITEM_IMMUTABLE');
      requireValue(req.body.archived !== true || data.settings.archive, 'Enable Local archive in Settings first.', 403, 'PERMISSION_REQUIRED');
      Object.assign(clip, req.body); return envelope(data, clip);
    }));
  });
  router.delete('/clipboard/:id', async (req, res) => {
    await mutate('clipboard.updated', req.params.id, data => { record(data, 'clipboard', req.params.id); data.clipboard = data.clipboard.filter(c => c.id !== req.params.id); }); res.sendStatus(204);
  });
  router.post('/clipboard/:id/push', async (req, res) => {
    bodyFields(req.body, ['deviceId']);
    send(res, await mutate('clipboard.updated', req.params.id, data => {
      const clip = record(data, 'clipboard', req.params.id);
      const d = record(data, 'devices', req.body.deviceId);
      requireValue(d.native && d.capabilities.clipboard?.status === 'supported', 'No compatible Android clipboard companion is available.', 409, 'UNSUPPORTED');
      requireValue(d.trusted && publicDevice(d).status === 'connected', 'Open the trusted Android companion and reconnect first.', 409, 'DEVICE_OFFLINE');
      requireValue(data.settings.permissions.clipboard, 'Enable clipboard in Settings.', 403, 'PERMISSION_REQUIRED');
      requireValue(clip.deviceId !== d.id, 'This item came from the destination device.', 409, 'RELATIONSHIP_INVALID');
      clip.sync ||= { acknowledgements: [], deliveries: {} };
      clip.sync.deliveries ||= {};
      // Repeated pushes are idempotent, including after a confirmed receipt.
      clip.sync.deliveries[d.id] ||= { status: 'pending', requestedAt: now() };
      return clip;
    }), 202);
  });
  router.get('/transfers', (req, res) => send(res, store.read().transfers));
  router.get('/transfers/:id', (req, res) => send(res, get('transfers', req.params.id)));
  router.post('/transfers', async (req, res) => {
    bodyFields(req.body, ['name', 'size', 'deviceId', 'expectedChecksum']);
    requireValue(text(req.body.name, 255) && !/[\x00-\x1f\x7f]/.test(req.body.name), 'Invalid file name.');
    requireValue(Number.isSafeInteger(req.body.size) && req.body.size >= 0 && req.body.size <= maxSize, 'File size exceeds the allowed range.', 413);
    requireValue(req.body.expectedChecksum === undefined || /^[a-f0-9]{64}$/.test(req.body.expectedChecksum), 'Invalid SHA-256 checksum.');
    send(res, await mutate('transfer.updated', null, data => {
      const t = { id: randomUUID(), name: req.body.name, size: req.body.size, deviceId: req.body.deviceId || 'local', expectedChecksum: req.body.expectedChecksum, status: 'queued', createdAt: now() };
      uploads.destination(data, t); data.transfers.unshift(t); return t;
    }), 201);
  });
  router.post('/transfers/:id/upload', (req, res) => uploads.upload(req, res));
  router.get('/transfers/:id/download', (req, res, next) => {
    const t = get('transfers', req.params.id);
    requireValue(t.status === 'uploaded_locally' && t.storageId === t.id && /^[\w-]+$/.test(t.storageId), 'No verified local file is available.', 409, 'INVALID_STATE');
    res.set('X-Content-Type-Options', 'nosniff');
    res.download(join(store.directory, 'uploads', t.storageId), t.name, error => { if (error) next(error); });
  });
  router.post('/transfers/:id/retry', async (req, res) => send(res, await mutate('transfer.updated', req.params.id, data => {
    const t = record(data, 'transfers', req.params.id); uploads.destination(data, t);
    requireValue(t.status === 'failed', 'Only failed uploads can be retried.', 409, 'INVALID_STATE');
    t.status = 'queued'; t.error = null; return t;
  })));
  router.post('/transfers/:id/cancel', async (req, res) => send(res, await uploads.cancel(req.params.id)));
  for (const collection of ['activity', 'notifications', 'messages']) router.get(`/${collection}`, (req, res) => send(res, store.read()[collection]));
  router.post('/activity/mark-all-read', async (req, res) => send(res, await mutate('activity.created', null, data => { data.activity.forEach(a => a.read = true); return data.activity; })));
  router.post('/activity/:id/read', async (req, res) => send(res, await mutate('activity.created', req.params.id, data => { const a = record(data, 'activity', req.params.id); a.read = true; return a; })));
  router.get('/settings', (req, res) => send(res, store.read().settings));
  router.patch('/settings', async (req, res) => {
    bodyFields(req.body, ['theme', 'archive', 'compact', 'permissions']);
    requireValue(req.body.theme === undefined || ['system', 'dark', 'light'].includes(req.body.theme), 'Invalid theme.');
    for (const key of ['archive', 'compact']) requireValue(req.body[key] === undefined || typeof req.body[key] === 'boolean', 'Invalid setting.');
    if (req.body.permissions !== undefined) { bodyFields(req.body.permissions, ['clipboard', 'files']); requireValue(Object.values(req.body.permissions).every(v => typeof v === 'boolean'), 'Permissions must be boolean.'); }
    send(res, await mutate('permission.updated', 'settings', data => { const permissions = { ...data.settings.permissions, ...req.body.permissions }; Object.assign(data.settings, req.body, { permissions }); return data.settings; }));
  });
  return router;
}
