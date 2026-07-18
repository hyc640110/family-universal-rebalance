import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fetchMarketSnapshot, marketRefreshRequestInit, mergeMarketSnapshot, type MarketSnapshot } from '../src/lib/marketData';
import { marketContentSignature, marketRefreshOutcome } from '../src/lib/dataRefresh';

const usableSnapshot = (): MarketSnapshot => ({ fetchedAt: '2026-07-18T13:00:00.000Z', status: 'recent-effective', items: [{ id: 'taiex', group: 'taiwan', name: '台灣加權指數', value: 23000, change: 10, changePct: .04, asOf: '2026-07-18T08:00:00+08:00', fetchedAt: '2026-07-18T13:00:00.000Z', source: 'TWSE', status: 'closed' }] });

test('browser manual market refresh keeps refresh and nonce while using only CORS-safelisted request headers', () => {
  const init = marketRefreshRequestInit(true);
  const headers = new Headers(init.headers);
  assert.equal(init.cache, 'no-store');
  assert.equal(headers.get('accept'), 'application/json');
  assert.equal(headers.has('cache-control'), false);
  assert.equal(headers.has('pragma'), false);
});

test('browser manual market refresh sends refresh and request nonce without treating a CORS failure as unchanged', async () => {
  const originalFetch = globalThis.fetch;
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => { request = new Request(input, init); throw new TypeError('Failed to fetch'); };
  try {
    const previous = usableSnapshot();
    const incoming = await fetchMarketSnapshot('https://market.example', { manual: true, requestId: 93 });
    assert.equal(request?.url, 'https://market.example/market-summary?refresh=1&request=93');
    assert.equal(marketRefreshOutcome(marketContentSignature(previous), incoming), 'failed');
    const merged = mergeMarketSnapshot(previous, incoming);
    assert.equal(merged.snapshot.items[0].value, 23000);
    assert.equal(merged.incomplete, true);
  } finally { globalThis.fetch = originalFetch; }
});

test('browser fetch contract stays separate from the Worker response-cache contract and environment boundary', () => {
  const worker = new URL('../workers/market-data/src/index.js', import.meta.url);
  const source = readFileSync(worker, 'utf8');
  assert.match(source, /refresh \? 'no-store' : 'public, max-age=300, s-maxage=900'/);
  assert.match(source, /url\.searchParams\.get\('refresh'\) === '1'/);
  assert.match(source, /access-control-allow-headers/);
  const preview = readFileSync(new URL('../.env.preview-deploy', import.meta.url), 'utf8');
  const production = readFileSync(new URL('../.env.production', import.meta.url), 'utf8');
  assert.match(preview, /VITE_MARKET_DATA_WORKER_URL=.*preview/);
  assert.doesNotMatch(production, /VITE_MARKET_DATA_WORKER_URL=.*preview/);
});
