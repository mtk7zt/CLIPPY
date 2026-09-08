import { defineConfig } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
export default defineConfig({
  testDir: './tests', workers: 1, timeout: 45000,
  outputDir: join(tmpdir(), 'clippy-playwright-results'), reporter: 'list',
  use: { channel: 'chrome', headless: true, viewport: { width: 1440, height: 960 }, colorScheme: 'dark', serviceWorkers: 'block' },
});
