import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const statusValues = new Set(['loading', 'realtime', 'delayed', 'closed', 'recent-effective', 'unavailable', 'failed']);
const itemKeys = ['id', 'group', 'value', 'change', 'changePct', 'asOf', 'fetchedAt', 'source', 'status', 'detail'];

const read = path => readFileSync(new URL(path, root), 'utf8');
const envValue = (contents, name) => new RegExp(`^${name}=(.+)$`, 'm').exec(contents)?.[1]?.trim() ?? '';
const expectedWorkerVersion = () => /^const VERSION = '([^']+)'/m.exec(read('workers/market-data/src/index.js'))?.[1] ?? '';

export const runtimeConfig = environment => {
  assert.ok(environment === 'preview' || environment === 'production', 'environment must be preview or production');
  const envFile = environment === 'preview' ? '.env.preview-deploy' : '.env.production';
  const endpoint = envValue(read(envFile), 'VITE_MARKET_DATA_WORKER_URL');
  assert.ok(endpoint, `${environment} Market Worker endpoint is missing`);
  assert.equal(endpoint.includes('preview'), environment === 'preview', `${environment} endpoint/environment mismatch`);
  return { environment, endpoint, version: expectedWorkerVersion() };
};

const safeFetch = async (fetchFn, url, init, label) => {
  try { return await fetchFn(url, init); } catch { throw new Error(`Market Worker ${label} request failed`); }
};

const readJson = async (response, label) => {
  assert.equal(response.status, 200, `Market Worker ${label} must return HTTP 200`);
  try { return await response.json(); } catch { throw new Error(`Market Worker ${label} must return JSON`); }
};

const assertSnapshotContract = (snapshot, version, label) => {
  assert.ok(snapshot && typeof snapshot === 'object', `Market Worker ${label} response must be an object`);
  assert.equal(snapshot.version, version, `Market Worker ${label} version mismatch`);
  assert.equal(typeof snapshot.fetchedAt, 'string', `Market Worker ${label} fetchedAt is missing`);
  assert.ok(statusValues.has(snapshot.status), `Market Worker ${label} status is invalid`);
  assert.ok(Array.isArray(snapshot.items), `Market Worker ${label} items are missing`);
  for (const item of snapshot.items) {
    assert.ok(item && typeof item === 'object', `Market Worker ${label} item is invalid`);
    for (const key of itemKeys) assert.ok(key in item, `Market Worker ${label} item.${key} is missing`);
    assert.ok('sourceUrl' in item || item.sourceUrl === undefined, `Market Worker ${label} item.sourceUrl contract is invalid`);
  }
};

export async function assertMarketWorkerRuntimeContract({ environment, fetchFn = fetch, requestNonce = 1700000000000 }) {
  const config = runtimeConfig(environment);
  const base = config.endpoint.replace(/\/$/, '');
  const health = await readJson(await safeFetch(fetchFn, `${base}/health`, { headers: { accept: 'application/json' } }, 'health'), 'health');
  assert.equal(health.ok, true, 'Market Worker health must report ok');
  assert.equal(health.environment, config.environment, 'Market Worker health environment mismatch');
  assert.equal(health.version, config.version, 'Market Worker health version mismatch');

  const normal = await readJson(await safeFetch(fetchFn, `${base}/market-summary`, { headers: { accept: 'application/json' } }, 'normal'), 'normal');
  assertSnapshotContract(normal, config.version, 'normal');

  const manualUrl = `${base}/market-summary?refresh=1&request=${requestNonce}`;
  const manualResponse = await safeFetch(fetchFn, manualUrl, { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } }, 'manual refresh');
  assert.match(manualResponse.headers.get('cache-control') || '', /(^|,)\s*no-store\s*(,|$)/i, 'Market Worker manual refresh cache-control must be no-store');
  const manual = await readJson(manualResponse, 'manual refresh');
  assertSnapshotContract(manual, config.version, 'manual refresh');
  return { environment: config.environment, endpoint: config.endpoint, version: config.version, fetchedAt: manual.fetchedAt };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const environment = process.argv[2];
  assertMarketWorkerRuntimeContract({ environment }).then(result => {
    console.log(`Market Worker ${result.environment} runtime contract verified: ${result.version} (${result.endpoint}) at ${result.fetchedAt}`);
  }).catch(error => {
    console.error(error instanceof Error ? error.message : 'Market Worker runtime contract failed');
    process.exitCode = 1;
  });
}
