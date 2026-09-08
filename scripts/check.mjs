import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'uploads') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (/\.(js|mjs)$/.test(entry.name)) result.push(path);
  }
  return result;
}
const targets = [resolve(root, 'app.js'), resolve(root, 'sw.js'), resolve(root, 'dist/index.js'), resolve(root, 'playwright.config.js'), ...await files(resolve(root, 'server')), ...await files(resolve(root, 'scripts')), ...await files(resolve(root, 'tests'))];
for (const path of targets) { const result = spawnSync(process.execPath, ['--check', path], { stdio: 'inherit' }); if (result.status !== 0) process.exit(result.status || 1); }
const { seed } = await import('../server/store/seed.js');
if (seed().transfers.some(t => !['queued', 'uploaded_locally', 'failed'].includes(t.status))) throw new Error('Invalid seed transfer state');
console.log(`Validated ${targets.length} JavaScript files and seed states.`);
