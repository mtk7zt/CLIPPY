import { createHash } from 'node:crypto';
export const sample = Buffer.from('Clippy local upload example. No device delivery occurred.\n');
export function capabilities(local = false) {
  return Object.fromEntries(['clipboard', 'files', 'notifications', 'sms', 'remoteInput', 'mediaControl', 'presentationRemote', 'battery', 'ring', 'customCommands', 'sharedLinks', 'discovery'].map(key => [key, {
    status: local && ['clipboard', 'files', 'sharedLinks'].includes(key) ? 'supported' : 'unsupported',
    reason: local && ['clipboard', 'files', 'sharedLinks'].includes(key) ? 'Local browser/server action only.' : 'Native companion transport is unavailable.',
  }]));
}
export function seed() {
  const now = new Date().toISOString();
  return { version: 1, revision: 0,
    devices: [
      { id: 'local', name: 'Local workspace', host: null, status: 'connected', trusted: true, development: true, kind: 'laptop', capabilities: capabilities(true) },
      { id: 'example-phone', name: 'Example iPhone', host: '192.0.2.42', status: 'offline', trusted: true, development: true, kind: 'devices', capabilities: capabilities() },
      { id: 'example-tablet', name: 'Example tablet', host: '192.0.2.43', status: 'discovered', trusted: false, development: true, kind: 'devices', capabilities: capabilities() },
    ],
    pairing: [{ id: 'example-pairing', deviceId: 'example-tablet', status: 'pending', code: '4817', expiresAt: new Date(Date.now() + 86400000).toISOString(), development: true }],
    clipboard: [{ id: 'example-clip', text: 'Welcome to your Clippy notebook.', source: 'Local workspace', deviceId: 'local', pinned: false, archived: false, createdAt: now }],
    transfers: [
      { id: 'example-upload', name: 'welcome.txt', deviceId: 'local', size: sample.length, status: 'uploaded_locally', checksum: createHash('sha256').update(sample).digest('hex'), storageId: 'example-upload', createdAt: now, development: true },
      { id: 'example-queued', name: 'queued-example.txt', deviceId: 'local', size: 12, status: 'queued', createdAt: now, development: true },
      { id: 'example-failed', name: 'failed-example.txt', deviceId: 'local', size: 12, status: 'failed', error: 'Example failed upload. Select a file to retry.', createdAt: now, development: true },
    ],
    activity: [{ id: 'welcome', text: 'Local backend ready. Example devices are development records.', read: false, createdAt: now }],
    notifications: [{ id: 'example-notification', deviceId: 'example-phone', text: 'Development notification example; native capture unavailable.', createdAt: now }],
    messages: [{ id: 'example-message', deviceId: 'example-phone', text: 'Local development message. SMS delivery is unavailable.', createdAt: now }],
    settings: { theme: 'system', archive: true, compact: false, permissions: { clipboard: true, files: true } },
  };
}
