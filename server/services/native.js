import { createHash, timingSafeEqual } from 'node:crypto';
import { record, requireValue } from './errors.js';

export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export function publicDevice({ deviceToken, deviceTokenHash, ...device }) {
  if (device.native && device.status === 'connected' && (!device.lastSeenAt || Date.now() - Date.parse(device.lastSeenAt) > 30000)) device.status = 'offline';
  if (device.sync && Date.now() - Date.parse(device.sync.updatedAt || 0) > 15000) device.sync = { ...device.sync, serviceRunning: false, state: device.sync.enabled ? 'unavailable' : 'disabled' };
  return device;
}
export function authenticate(data, req, { trusted = true, connected = true, clipboard = false } = {}) {
  const id = req.get('X-Clippy-Device-Id');
  const token = req.get('Authorization')?.replace(/^Bearer\s+/i, '');
  requireValue(typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id) && typeof token === 'string' && /^[a-f0-9]{64}$/.test(token), 'Paired device credentials are required.', 401, 'AUTH_REQUIRED');
  const d = record(data, 'devices', id);
  const expected = d.deviceTokenHash || (d.deviceToken ? tokenHash(d.deviceToken) : '');
  requireValue(d.native && /^[a-f0-9]{64}$/.test(expected) && timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(tokenHash(token), 'hex')), 'Device credentials are not valid. Pair again.', 401, 'AUTH_REQUIRED');
  if (trusted) requireValue(d.trusted, 'Approve this device in the web workspace first.', 409, 'TRUST_REQUIRED');
  if (connected) requireValue(d.status === 'connected', 'Device is disconnected. Retry connection.', 409, 'DEVICE_OFFLINE');
  if (clipboard) {
    requireValue(d.capabilities.clipboard?.status === 'supported', 'Clipboard is not supported by this device.', 409, 'CAPABILITY_UNAVAILABLE');
    requireValue(data.settings.permissions.clipboard, 'Enable clipboard in workspace Settings.', 403, 'PERMISSION_REQUIRED');
  }
  return d;
}
export function pairingState(p) { return p && p.status === 'pending' && Date.parse(p.expiresAt) <= Date.now() ? { ...p, status: 'expired' } : p; }
export function queueClip(data, clip) {
  envelope(data, clip);
  clip.sync = { acknowledgements: [], deliveries: {} };
  for (const d of data.devices) if (d.native && d.trusted && d.capabilities.clipboard?.status === 'supported' && d.id !== clip.deviceId && publicDevice(d).status === 'connected')
    clip.sync.deliveries[d.id] = { status: 'pending', requestedAt: new Date().toISOString() };
  return clip;
}
// Additive v1.1 envelope; legacy text/deviceId/id fields remain available.
export function envelope(data, clip) {
  clip.eventId ||= clip.id;
  clip.sourceDeviceId = clip.deviceId;
  clip.targetDeviceId ??= null;
  clip.content = clip.text;
  clip.contentHash = createHash('sha256').update(clip.text).digest('hex');
  clip.revision ||= data.revision + 1;
  return clip;
}
