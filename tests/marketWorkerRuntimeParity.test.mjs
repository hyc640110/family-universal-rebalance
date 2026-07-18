import assert from 'node:assert/strict';
import test from 'node:test';
import { assertMarketWorkerRuntimeContract, runtimeConfig } from '../scripts/market-worker-runtime-contract-check.mjs';

const item = { id: 'taiex', group: 'taiwan', value: 23000, change: 1, changePct: 0.01, asOf: '2026-07-18T08:00:00+08:00', fetchedAt: '2026-07-18T01:00:00.000Z', source: 'TWSE', sourceUrl: 'https://example.test/source', status: 'closed', detail: 'official close' };
const json = (value, headers = {}) => new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json', ...headers } });
const fetchFor = ({ environment = 'preview', version = runtimeConfig('preview').version, cacheControl = 'no-store' } = {}) => {
  const calls = [];
  const fetchFn = async (url, init) => { calls.push({ url: String(url), init }); if (String(url).endsWith('/health')) return json({ ok: true, version, environment }); return json({ version, fetchedAt: '2026-07-18T01:00:00.000Z', status: 'recent-effective', items: [item] }, String(url).includes('refresh=1') ? { 'cache-control': cacheControl } : {}); };
  return { calls, fetchFn };
};

test('runtime config keeps Preview and Production Market Worker endpoints isolated', () => {
  const preview = runtimeConfig('preview'); const production = runtimeConfig('production');
  assert.match(preview.endpoint, /preview/); assert.doesNotMatch(production.endpoint, /preview/);
  assert.equal(preview.version, production.version);
});

test('Preview runtime contract requires health, nonce, no-store, and the unchanged item contract', async () => {
  const fake = fetchFor();
  const result = await assertMarketWorkerRuntimeContract({ environment: 'preview', fetchFn: fake.fetchFn, requestNonce: 88 });
  assert.equal(result.environment, 'preview'); assert.equal(fake.calls.length, 3);
  const manual = fake.calls[2];
  assert.match(manual.url, /refresh=1&request=88/);
  assert.equal(manual.init.cache, 'no-store');
  assert.equal(new Headers(manual.init.headers).get('cache-control'), 'no-cache');
});

test('runtime parity rejects a mismatched Production version without exposing response content', async () => {
  const fake = fetchFor({ environment: 'production', version: 'market-data-worker-v5.4.1' });
  await assert.rejects(() => assertMarketWorkerRuntimeContract({ environment: 'production', fetchFn: fake.fetchFn }), /health version mismatch/);
});

test('runtime parity rejects a manual refresh cache contract mismatch', async () => {
  const fake = fetchFor({ cacheControl: 'public, max-age=300' });
  await assert.rejects(() => assertMarketWorkerRuntimeContract({ environment: 'preview', fetchFn: fake.fetchFn }), /cache-control must be no-store/);
});

test('runtime parity rejects an environment mismatch', async () => {
  const fake = fetchFor({ environment: 'production' });
  await assert.rejects(() => assertMarketWorkerRuntimeContract({ environment: 'preview', fetchFn: fake.fetchFn }), /health environment mismatch/);
});
