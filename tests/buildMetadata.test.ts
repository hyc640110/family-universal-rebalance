import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appInfo = readFileSync(new URL('../src/constants/appInfo.ts', import.meta.url), 'utf8');
const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');

test('product version identifies the V5.10.1 diagnostics sprint instead of V4.2', () => {
  assert.match(appInfo, /APP_VERSION = 'Universal Rebalance V5\.10\.1'/);
  assert.doesNotMatch(appInfo, /Universal Rebalance V4\.2/);
});

test('Git commit and build time use independent injected metadata with an honest unavailable fallback', () => {
  assert.match(appInfo, /APP_GIT_COMMIT = import\.meta\.env\.VITE_GIT_COMMIT \|\| 'unavailable'/);
  assert.match(appInfo, /APP_BUILD_TIME = import\.meta\.env\.VITE_BUILD_TIME \|\| 'unavailable'/);
  assert.match(viteConfig, /VITE_GIT_COMMIT/);
  assert.match(viteConfig, /VITE_BUILD_TIME/);
  assert.doesNotMatch(appInfo, /2026-07-12/);
});
