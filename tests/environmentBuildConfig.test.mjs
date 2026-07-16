import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { assertEnvironmentBoundary, parseEnv } from '../scripts/environment-boundary-check.mjs';

const production = parseEnv(readFileSync(new URL('../.env.production', import.meta.url), 'utf8'));
const preview = parseEnv(readFileSync(new URL('../.env.preview-deploy', import.meta.url), 'utf8'));

test('Preview and Production build contracts have separate storage and Worker identities', () => {
  assertEnvironmentBoundary('production', production);
  assertEnvironmentBoundary('preview', preview);
  for (const key of ['VITE_FIREBASE_BASE_PATH', 'VITE_STORAGE_KEY', 'VITE_WORKER_URL', 'VITE_MARKET_DATA_WORKER_URL']) assert.notEqual(production[key], preview[key]);
  assert.equal(preview.VITE_GMAIL_OAUTH_BROKER_URL, 'https://universal-rebalance-gmail-oauth-preview.hyc640110.workers.dev');
  assert.equal(preview.VITE_GMAIL_OAUTH_ENABLED, 'true');
});

test('Wrong Firebase roots and incomplete environment configuration fail before build', () => {
  assert.throws(() => assertEnvironmentBoundary('preview', { ...preview, VITE_FIREBASE_BASE_PATH: production.VITE_FIREBASE_BASE_PATH }), /Invalid environment boundary configuration/);
  assert.throws(() => assertEnvironmentBoundary('production', { ...production, VITE_FIREBASE_BASE_PATH: preview.VITE_FIREBASE_BASE_PATH }), /Invalid environment boundary configuration/);
  assert.throws(() => assertEnvironmentBoundary('preview', { ...preview, VITE_FIREBASE_BASE_PATH: ' ' }), /Invalid environment boundary configuration/);
});
