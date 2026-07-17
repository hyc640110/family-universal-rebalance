import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fetchMarketSnapshot } from '../src/lib/marketData';
import { isValidQuoteTimestamp, marketContentSignature, marketRefreshMessage, marketRefreshOutcome, quoteRefreshStatus, refreshUrl } from '../src/lib/dataRefresh';

const snapshot = (patch: Record<string, unknown> = {}) => ({ fetchedAt: '2026-07-17T08:00:00.000Z', status: 'recent-effective', items: [{ id: 'taiex', value: 23000, change: 10, changePct: .04, asOf: '2026-07-17T08:00:00+08:00', status: 'closed' }], ...patch });

test('date controls retain native iPhone picker behavior while remaining bounded by their grid column', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.financial-account-fields input\[type="date"\],\.dividend-fields input\[type="date"\]\{width:100%;max-width:100%;min-width:0;box-sizing:border-box;-webkit-appearance:auto;appearance:auto/);
  assert.doesNotMatch(css, /input\[type="date"\][^{]*\{[^}]*overflow:hidden/);
});

test('archived liquidated assets remain selectable for dividends without participating in quote refresh or portfolio calculations', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const dividend = readFileSync(new URL('../src/pages/DividendCenterPage.tsx', import.meta.url), 'utf8');
  assert.match(app, /filter\(h => !h\.isArchived\)/);
  assert.match(app, /isArchived: true, targetWeight: 0/);
  assert.match(app, /仍有持股，請先將總股數調整為 0 後才能封存/);
  assert.match(dividend, /assetOptions\.map/);
  assert.match(dividend, /holding\.isArchived \? '（已清倉）' : ''/);
});

test('quote refresh contracts distinguish successful, partial, and failed upstream responses and require a Taiwan timestamp', () => {
  assert.equal(isValidQuoteTimestamp('2026-07-17', '13:30:01'), true);
  assert.equal(isValidQuoteTimestamp('2026-07-17', null), false);
  assert.equal(isValidQuoteTimestamp('bad', '13:30'), false);
  assert.match(refreshUrl('https://price.example', '/?symbol=2330', true, 77), /symbol=2330.*refresh=1.*request=77/);
  assert.match(quoteRefreshStatus([{ symbol: '2330' }, { symbol: '0050' }], '臺北時間').message, /2\/2/);
  assert.match(quoteRefreshStatus([{ symbol: '2330' }, { symbol: '0050', error: 'HTTP 502' }], '臺北時間').message, /部分更新成功（1\/2）/);
  assert.match(quoteRefreshStatus([{ symbol: '2330', error: 'HTTP 502' }], '臺北時間').message, /股價更新失敗/);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /缺少有效報價日期／時間/);
  assert.match(app, /quote\.error && previous \? \{ \.\.\.previous, error: quote\.error/);
  assert.match(app, /setHasUpdatedQuotes\(summary\.succeeded > 0\)/);
});

test('manual market refresh uses an isolated no-cache request, reports unchanged content, and prevents a parallel request', async () => {
  const originalFetch = globalThis.fetch;
  let request: Request | undefined;
  let init: RequestInit | undefined;
  globalThis.fetch = async (input, options) => {
    request = new Request(input);
    init = options;
    return new Response(JSON.stringify(snapshot()), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  };
  try {
    const result = await fetchMarketSnapshot('https://market.example', { manual: true, requestId: 88 });
    assert.equal(request?.url, 'https://market.example/market-summary?refresh=1&request=88');
    assert.equal(new Headers(init?.headers).get('cache-control'), 'no-cache');
    const signature = marketContentSignature(result);
    assert.equal(marketRefreshOutcome(signature, result), 'unchanged');
    assert.match(marketRefreshMessage('unchanged', result.fetchedAt, value => value), /資料內容未變/);
    assert.equal(marketRefreshOutcome(signature, { ...result, fetchedAt: null, status: 'failed' }), 'failed');
  } finally { globalThis.fetch = originalFetch; }
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const worker = readFileSync(new URL('../workers/market-data/src/index.js', import.meta.url), 'utf8');
  assert.match(app, /marketRefreshInFlightRef\.current/);
  assert.match(worker, /refresh \? 'no-store' : 'public, max-age=300, s-maxage=900'/);
  assert.match(worker, /url\.searchParams\.get\('refresh'\) === '1'/);
});
