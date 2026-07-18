import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fetchMarketSnapshot, marketRefreshRequestInit, mergeMarketSnapshot, type MarketSnapshot } from '../src/lib/marketData';
import { isValidQuoteTimestamp, marketContentSignature, marketRefreshMessage, marketRefreshOutcome, mergeQuoteRefresh, quoteRefreshErrorLabel, quoteRefreshRequestInit, quoteRefreshStatus, refreshUrl } from '../src/lib/dataRefresh';

const snapshot = (patch: Record<string, unknown> = {}) => ({ fetchedAt: '2026-07-17T08:00:00.000Z', status: 'recent-effective', items: [{ id: 'taiex', value: 23000, change: 10, changePct: .04, asOf: '2026-07-17T08:00:00+08:00', status: 'closed' }], ...patch });

test('date controls declare a WebKit bounded-width contract without clipping the native picker', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const dividend = readFileSync(new URL('../src/pages/DividendCenterPage.tsx', import.meta.url), 'utf8');
  const dateSelector = '.financial-account-fields input[type="date"],.dividend-fields input[type="date"],.loan-list input[type="date"]';
  assert.match(css, /\.financial-account-fields label,\.dividend-fields label,\.loan-list \.list-row label\{inline-size:100%;max-inline-size:100%;min-inline-size:0}/);
  assert.match(css, new RegExp(`${dateSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\{[^}]*inline-size:100%;width:100%;max-inline-size:100%;max-width:100%;min-inline-size:0;min-width:0;[^}]*box-sizing:border-box;[^}]*font-size:16px`));
  assert.match(css, /@supports \(-webkit-touch-callout:none\)/);
  assert.match(css, /\.loan-list input\[type="date"\]::-webkit-date-and-time-value\{min-inline-size:0;text-align:left}/);
  assert.match(css, /\.loan-list input\[type="date"\]::-webkit-calendar-picker-indicator\{margin:0;padding:0;min-inline-size:0/);
  assert.doesNotMatch(css, /input\[type="date"\][^{]*\{[^}]*overflow:hidden/);
  assert.doesNotMatch(css, /input\[type="date"\][^{]*\{[^}]*width:\d+px/);
  assert.doesNotMatch(css, /input\[type="date"\][^{]*\{[^}]*transform:/);
  assert.match(app, /<label>日期<input type="date" value=\{occurredAt\}/);
  assert.match(app, /DraftInput type="date" value=\{item\.startDate\}/);
  assert.match(dividend, /className="dividend-field--date dividend-field--wide dividend-field--horizontal">收款日期<input type="date" value=\{occurredAt\} max=\{today\}/);
  assert.match(dividend, /className="dividend-field--account dividend-field--wide dividend-field--horizontal">收款帳戶<select value=\{accountId\}/);
  assert.match(css, /\.dividend-fields \.dividend-field--wide\{grid-column:1\/-1}/);
  assert.match(css, /\.dividend-fields \.dividend-field--horizontal\{grid-template-columns:minmax\(112px,150px\) minmax\(0,1fr\);align-items:center;gap:12px}/);
  assert.match(css, /\.dividend-fields \.dividend-field--horizontal input,\.dividend-fields \.dividend-field--horizontal select\{inline-size:100%;width:100%;max-inline-size:100%;max-width:100%;min-inline-size:0;min-width:0;box-sizing:border-box}/);
  assert.match(css, /@media \(max-width:700px\)\{[\s\S]*?\.dividend-fields \.dividend-field--horizontal\{grid-template-columns:1fr;align-items:stretch;gap:5px}/);
  assert.doesNotMatch(css, /dividend-field--(?:date|account)[^{]*:nth-child/);
});

test('archived liquidated assets remain selectable for dividends without participating in quote refresh or portfolio calculations', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const dividend = readFileSync(new URL('../src/pages/DividendCenterPage.tsx', import.meta.url), 'utf8');
  const references = readFileSync(new URL('../src/lib/dividendAssetReferences.ts', import.meta.url), 'utf8');
  assert.match(app, /filter\(h => !h\.isArchived\)/);
  assert.match(app, /isArchived: true, targetWeight: 0/);
  assert.match(app, /仍有持股，請先將總股數調整為 0 後才能封存/);
  assert.match(dividend, /DividendAssetReferenceSelect value=\{assetSymbol\} options=\{assetOptions\}/);
  assert.match(dividend, /dividendAssetReferenceOptions\(holdings, transactions\)/);
  assert.match(references, /status === 'archived' \? '（已清倉）'/);
  assert.match(app, /VITE_PREVIEW_ARCHIVED_FIXTURE/);
  assert.match(app, /isPreviewFixture: true/);
  assert.match(readFileSync(new URL('../.env.preview-deploy', import.meta.url), 'utf8'), /VITE_PREVIEW_ARCHIVED_FIXTURE=TEST-ARCHIVED/);
  assert.doesNotMatch(readFileSync(new URL('../.env.production', import.meta.url), 'utf8'), /VITE_PREVIEW_ARCHIVED_FIXTURE/);
});

test('quote refresh contracts distinguish successful, partial, and failed upstream responses and require a Taiwan timestamp', () => {
  assert.equal(isValidQuoteTimestamp('2026-07-17', '13:30:01'), true);
  assert.equal(isValidQuoteTimestamp('2026-07-17', null), false);
  assert.equal(isValidQuoteTimestamp('bad', '13:30'), false);
  assert.match(refreshUrl('https://price.example', '/?symbol=2330', true, 77), /symbol=2330.*refresh=1.*request=77/);
  assert.deepEqual(quoteRefreshRequestInit(false), { cache: 'default' });
  assert.deepEqual(quoteRefreshRequestInit(true), { cache: 'no-store' });
  assert.equal(new Headers(quoteRefreshRequestInit(true).headers).has('cache-control'), false);
  assert.equal(new Headers(quoteRefreshRequestInit(true).headers).has('pragma'), false);
  assert.match(quoteRefreshStatus([{ symbol: '2330' }, { symbol: '0050' }], '臺北時間').message, /2\/2/);
  assert.match(quoteRefreshStatus([{ symbol: '2330' }, { symbol: '0050', error: 'HTTP 502' }], '臺北時間').message, /部分更新成功（1\/2）/);
  assert.match(quoteRefreshStatus([{ symbol: '2330', error: 'HTTP 502' }], '臺北時間').message, /股價更新失敗/);
  assert.match(quoteRefreshErrorLabel('HTTP 429'), /請求過於頻繁/);
  assert.match(quoteRefreshErrorLabel('quoteDate missing'), /日期格式異常/);
  assert.match(quoteRefreshErrorLabel('upstream timeout'), /上游暫時無回應/);
  const previous = { source: 'Price Worker', price: 100, previousClose: 99, change: 1, quoteDate: '2026-07-17', quoteTime: '13:30:00' };
  assert.deepEqual(mergeQuoteRefresh(previous, { ...previous, source: '離線備援 / Worker 更新失敗', price: 0, previousClose: 0, change: 0, quoteDate: undefined, quoteTime: undefined, error: 'HTTP 429' }), { ...previous, source: 'Price Worker / 更新失敗', error: 'HTTP 429' });
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const controller = readFileSync(new URL('../src/lib/quoteRefreshController.ts', import.meta.url), 'utf8');
  assert.match(app, /缺少有效報價日期／時間/);
  assert.match(app, /hasPreservedQuote/);
  assert.match(app, /createQuoteRefreshController/);
  assert.match(controller, /mergeQuoteMap\(current, Object\.fromEntries\(entries\)/);
  assert.match(controller, /setHasUpdatedQuotes\(summary\.succeeded > 0\)/);
  assert.match(controller, /if \(inFlight\) return/);
  assert.match(app, /disabled=\{isRefreshingQuotes\}/);
  assert.match(app, /quoteRefreshErrorLabel\(row\.quote\.error\)/);
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
    assert.equal(init?.cache, 'no-store');
    assert.equal(new Headers(init?.headers).has('cache-control'), false);
    assert.equal(new Headers(marketRefreshRequestInit(true).headers).has('pragma'), false);
    const signature = marketContentSignature(result);
    assert.equal(marketRefreshOutcome(signature, result), 'unchanged');
    assert.match(marketRefreshMessage('unchanged', result.fetchedAt, value => value), /目前市場內容沒有變化/);
    assert.match(marketRefreshMessage('unchanged', result.fetchedAt, value => value), /本次服務確認時間/);
    assert.equal(marketRefreshOutcome(signature, { ...result, fetchedAt: null, status: 'failed' }), 'failed');
  } finally { globalThis.fetch = originalFetch; }
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const worker = readFileSync(new URL('../workers/market-data/src/index.js', import.meta.url), 'utf8');
  assert.match(app, /marketRefreshInFlightRef\.current/);
  assert.match(worker, /refresh \? 'no-store' : 'public, max-age=300, s-maxage=900'/);
  assert.match(worker, /url\.searchParams\.get\('refresh'\) === '1'/);
});

test('market refresh preserves each previous usable section when a 200 response is partial, empty, or degraded', () => {
  const point = (id: string, group: 'taiwan' | 'global' | 'treasury' | 'event', value: number | null, status = 'recent-effective') => ({ id, group, name: id, value, change: 1, changePct: .1, asOf: '2026-07-17T08:00:00+08:00', fetchedAt: '2026-07-17T08:00:00.000Z', source: 'test', status }) as const;
  const previous: MarketSnapshot = { fetchedAt: '2026-07-17T08:00:00.000Z', status: 'recent-effective', items: [point('taiex', 'taiwan', 23000), point('sp500', 'global', 6000), point('event', 'event', 1)] };
  const incoming: MarketSnapshot = { fetchedAt: '2026-07-17T08:01:00.000Z', status: 'recent-effective', items: [point('taiex', 'taiwan', 23001), point('sp500', 'global', null, 'unavailable')] };
  const merged = mergeMarketSnapshot(previous, incoming);
  assert.equal(merged.incomplete, true);
  assert.deepEqual(merged.reusedGroups.sort(), ['event', 'global']);
  assert.equal(merged.snapshot.items.find(item => item.id === 'sp500')?.value, 6000);
  assert.equal(merged.snapshot.items.find(item => item.id === 'event')?.value, 1);
  assert.match(marketRefreshMessage('partial', merged.snapshot.fetchedAt, value => value, '沿用前次：global'), /沿用前次/);
  assert.doesNotMatch(marketRefreshMessage('unchanged', merged.snapshot.fetchedAt, value => value, '本次受管理：taiwan'), /尚未接入資料來源/);
  const marketPage = readFileSync(new URL('../src/pages/MarketIntelligencePage.tsx', import.meta.url), 'utf8');
  assert.match(marketPage, /VISIBLE_MARKET_SECTIONS\.map/);
});
