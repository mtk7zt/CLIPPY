import { Router } from 'express';
import { randomUUID, randomBytes, randomInt, createHash } from 'node:crypto';
import { capabilities } from '../store/seed.js';
import { authenticate, tokenHash, publicDevice, pairingState, queueClip } from '../services/native.js';
import { bodyFields, requireValue, record, text } from '../services/errors.js';

export function nativeRoutes(store, events) {
  const router = Router();
  const now = () => new Date().toISOString();
  const commit = async (type, fn) => { const result = await store.mutate(fn); events.publish(type, result?.id || result?.device?.id); return result; };
  router.post('/devices/register', async (req, res) => {
    bodyFields(req.body, ['name', 'platform', 'capabilities']);
    requireValue(text(req.body.name, 100), 'Enter a device name.');
    requireValue(req.body.platform === 'android', 'Only Android registration is supported.', 422, 'PLATFORM_UNSUPPORTED');
    requireValue(Array.isArray(req.body.capabilities) && req.body.capabilities.length === 1 && req.body.capabilities[0] === 'clipboard', 'Only the clipboard capability is currently available.', 422, 'CAPABILITY_UNAVAILABLE');
    const deviceToken = randomBytes(32).toString('hex');
    const result = await commit('pairing.updated', data => {
      const device = { id: randomUUID(), name: req.body.name.trim(), native: true, platform: 'android', kind: 'devices', host: null, trusted: false, development: false, status: 'pairing', deviceTokenHash: tokenHash(deviceToken), lastSeenAt: now(), capabilities: { ...capabilities(), clipboard: { status: 'supported', reason: 'Text sync while the Android companion is visible.' } } };
      const pairing = { id: randomUUID(), deviceId: device.id, code: String(randomInt(1000, 10000)), status: 'pending', development: false, expiresAt: new Date(Date.now() + 300000).toISOString() };
      data.devices.push(device); data.pairing.push(pairing);
      return { device: publicDevice(device), pairing };
    });
    events.publish('device.updated', result.device.id);
    res.status(201).json({ data: { ...result, deviceToken } });
  });
  router.get('/status', async (req, res) => {
    const device = authenticate(store.read(), req, { trusted: false, connected: false });
    const data = await store.mutate(data => {
      const d = authenticate(data, req, { trusted: false, connected: false });
      d.lastSeenAt = now();
      return { device: publicDevice(d), pairing: pairingState([...data.pairing].reverse().find(p => p.deviceId === d.id)), clipboardAllowed: data.settings.permissions.clipboard };
    });
    res.json({ data });
  });
  router.post('/sync/status', async (req, res) => {
    bodyFields(req.body, ['enabled', 'serviceRunning', 'clipboardAccess', 'state', 'androidVersion']);
    requireValue(typeof req.body.enabled === 'boolean' && typeof req.body.serviceRunning === 'boolean', 'Sync flags must be boolean.');
    requireValue(!req.body.serviceRunning || req.body.enabled, 'A disabled service cannot be running.');
    requireValue(['available', 'restricted', 'locked'].includes(req.body.clipboardAccess), 'Invalid clipboard-access state.');
    requireValue(['active', 'disabled', 'paused', 'reconnecting', 'permission_required', 'network_unavailable', 'backend_unavailable'].includes(req.body.state), 'Invalid sync state.');
    requireValue(Number.isInteger(req.body.androidVersion) && req.body.androidVersion >= 26 && req.body.androidVersion <= 100, 'Invalid Android version.');
    res.json({ data: await commit('device.updated', data => {
      const d = authenticate(data, req, { connected: false });
      d.lastSeenAt = now(); d.sync = { ...d.sync, ...req.body, updatedAt: now() };
      return publicDevice(d);
    }) });
  });
  // Compatibility confirmation: the companion may confirm only an already browser-approved request.
  router.post('/pairing/approve', async (req, res) => {
    bodyFields(req.body, ['pairingId', 'code']);
    const data = await commit('device.updated', data => {
      const d = authenticate(data, req, { trusted: false, connected: false });
      const p = record(data, 'pairing', req.body.pairingId);
      requireValue(p.deviceId === d.id, 'Pairing belongs to another device.', 403, 'RELATIONSHIP_INVALID');
      requireValue(req.body.code === p.code, 'Verification code does not match.', 422, 'INVALID_PAIRING_CODE');
      requireValue(pairingState(p).status === 'approved' && d.trusted, 'Approve this code in the web workspace first.', 409, 'TRUST_REQUIRED');
      d.status = 'connected'; d.lastSeenAt = now(); return publicDevice(d);
    });
    res.json({ data });
  });
  router.post('/pairing/cancel', async (req, res) => {
    bodyFields(req.body, ['pairingId']);
    const data = await commit('pairing.updated', data => {
      const d = authenticate(data, req, { trusted: false, connected: false });
      const p = record(data, 'pairing', req.body.pairingId);
      requireValue(p.deviceId === d.id, 'Pairing belongs to another device.', 403, 'RELATIONSHIP_INVALID');
      requireValue(p.status === 'pending', 'Only a pending request can be cancelled.', 409, 'INVALID_STATE');
      p.status = 'rejected'; d.status = 'disconnected'; return p;
    });
    events.publish('device.updated', data.deviceId); res.json({ data });
  });
  for (const action of ['connect', 'disconnect', 'revoke-trust']) router.post(`/devices/${action}`, async (req, res) => {
    bodyFields(req.body, action === 'connect' ? ['resume'] : []);
    requireValue(req.body.resume === undefined || typeof req.body.resume === 'boolean', 'Resume must be a boolean.');
    res.json({ data: await commit('device.updated', data => {
      const d = authenticate(data, req, { connected: false });
      if (req.body.resume) requireValue(['offline', 'connected'].includes(d.status), 'Connection paused by you. Reconnect explicitly to resume.', 409, 'SYNC_PAUSED');
      d.status = action === 'connect' ? 'connected' : 'disconnected'; d.lastSeenAt = now();
      if (action === 'revoke-trust') { d.trusted = false; delete d.deviceTokenHash; delete d.deviceToken; }
      return publicDevice(d);
    }) });
  });
  router.post(['/clipboard', '/clipboard/publish'], async (req, res) => {
    bodyFields(req.body, ['text', 'eventId']);
    requireValue(text(req.body.text, 65536), 'Clip must contain 1–65536 characters.');
    requireValue(req.body.eventId === undefined || (typeof req.body.eventId === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(req.body.eventId)), 'Invalid clipboard event identifier.');
    const result = await commit('clipboard.updated', data => {
      const d = authenticate(data, req, { clipboard: true });
      d.lastSeenAt = now();
      const eventId = req.body.eventId;
      const hash = createHash('sha256').update(req.body.text).digest('hex');
      data.clipboardEvents ||= {};
      const key = `${d.id}:${eventId}`;
      if (eventId && data.clipboardEvents[key]) {
        const saved = data.clipboardEvents[key];
        requireValue(saved.hash === hash, 'Event identifier was already used for different text.', 409, 'EVENT_CONFLICT');
        return { ...saved.response, duplicate: true };
      }
      const clip = queueClip(data, { id: randomUUID(), text: req.body.text, eventId, deviceId: d.id, source: d.name, createdAt: now(), pinned: false, archived: false });
      data.clipboard.unshift(clip);
      if (eventId) data.clipboardEvents[key] = { hash, response: { id: clip.id, deviceId: d.id, createdAt: clip.createdAt } };
      return clip;
    });
    res.status(result.duplicate ? 200 : 201).json({ data: result });
  });
  router.get('/clipboard/pending', async (req, res) => {
    const data = await store.mutate(data => {
      const d = authenticate(data, req, { clipboard: true }); d.lastSeenAt = now();
      const waiting = data.clipboard.filter(c => c.deviceId !== d.id && c.sync?.deliveries?.[d.id]?.status === 'pending').reverse();
      const clips = []; let characters = 0;
      for (const clip of waiting) { if (clips.length === 100 || characters + clip.text.length > 262144) break; clips.push(clip); characters += clip.text.length; }
      clips.reverse(); // Oldest bounded batch, newest first for legacy clients.
      for (const c of clips) c.sync.deliveries[d.id].offeredAt ||= now();
      return clips.map(c => ({ ...c, targetDeviceId: d.id }));
    });
    if (data.length) events.publish('clipboard.updated', data[0].id);
    res.json({ data });
  });
  router.post('/clipboard/:id/ack', async (req, res) => {
    if (req.body !== undefined) bodyFields(req.body, []);
    const data = await commit('clipboard.updated', data => {
      const d = authenticate(data, req, { clipboard: true });
      const clip = record(data, 'clipboard', req.params.id);
      const delivery = clip.sync?.deliveries?.[d.id];
      requireValue(clip.deviceId !== d.id && delivery?.offeredAt, 'This clipboard item was not offered to your device.', 409, 'RELATIONSHIP_INVALID');
      if (delivery.status !== 'acknowledged') {
        delivery.status = 'acknowledged'; delivery.acknowledgedAt = now();
        clip.sync.acknowledgements.push(d.id);
        data.activity.unshift({ id: randomUUID(), text: `Clipboard receipt acknowledged by ${d.name}.`, read: false, createdAt: now() });
      }
      d.sync ||= {};
      d.sync.lastAcknowledgedRevision = Math.max(d.sync.lastAcknowledgedRevision || 0, clip.revision);
      d.sync.lastSyncAt = delivery.acknowledgedAt;
      d.lastSeenAt = now(); return clip;
    });
    events.publish('activity.created', data.id); res.json({ data });
  });
  return router;
}
