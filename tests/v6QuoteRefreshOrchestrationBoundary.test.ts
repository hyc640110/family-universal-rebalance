import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createQuoteRefreshController } from '../src/lib/quoteRefreshController';
import { quoteRefreshRequestInit, refreshUrl } from '../src/lib/dataRefresh';

type Holding = { symbol: string; name?: string; archived?: boolean };
type Quote = { symbol: string; source: string; price: number; quoteDate?: string; quoteTime?: string; error?: string };

const quote = (symbol: string, patch: Partial<Quote> = {}): Quote => ({ symbol, source: 'Price Worker', price: 100, quoteDate: '2026-07-17', quoteTime: '13:30:00', ...patch });

test('controller injects the endpoint, retains manual semantics, and guards overlapping automatic/manual refreshes', async () => {
  let release: (() => void) | undefined;
  const wait = new Promise<void>(resolve => { release = resolve; });
  const requests: Array<{ symbol: string; endpoint: string; manual: boolean }> = [];
  const events: string[] = [];
  const controller = createQuoteRefreshController<Holding, string, Quote>({
    endpoint: 'https://preview-price.example',
    getSnapshot: () => ({ holdings: [{ symbol: '2330' }], symbols: ['2330'] }),
    findHolding: (holdings, symbol) => holdings.find(holding => holding.symbol === symbol),
    requestQuote: async (symbol, _holding, options) => { requests.push({ symbol, ...options }); await wait; return quote(symbol); },
    setQuotes: () => {}, setHasUpdatedQuotes: () => {}, setStatus: value => events.push(value), setIsRefreshing: value => events.push(`refresh:${value}`),
    formatRefreshTime: () => '臺北時間', applyNameAutofill: () => {},
  });
  const automatic = controller.refresh();
  const duplicate = controller.refresh(true);
  assert.equal(controller.isInFlight(), true);
  assert.deepEqual(requests, [{ symbol: '2330', endpoint: 'https://preview-price.example', manual: false }]);
  release?.();
  await Promise.all([automatic, duplicate]);
  assert.deepEqual(events, ['refresh:true', '股價更新中…', '股價更新成功（1/1）：臺北時間', 'refresh:false']);
  await controller.refresh(true);
  assert.deepEqual(requests.at(-1), { symbol: '2330', endpoint: 'https://preview-price.example', manual: true });
});

test('controller merges successful, partial, and failed responses deterministically without persistence fields', async () => {
  let quotes: Record<string, Quote> = { '2330': quote('2330', { price: 99 }), '0050': quote('0050', { price: 88, source: '前次有效報價' }) };
  const statuses: string[] = [];
  const controller = createQuoteRefreshController<Holding, string, Quote>({
    endpoint: 'https://price.example',
    getSnapshot: () => ({ holdings: [{ symbol: '2330' }, { symbol: '0050' }], symbols: ['2330', '0050'] }),
    findHolding: (holdings, symbol) => holdings.find(holding => holding.symbol === symbol),
    requestQuote: async symbol => symbol === '2330' ? quote(symbol, { price: 101 }) : quote(symbol, { source: '離線備援 / Worker 更新失敗', price: 0, quoteDate: undefined, quoteTime: undefined, error: 'HTTP 429' }),
    setQuotes: updater => { quotes = updater(quotes); }, setHasUpdatedQuotes: () => {}, setStatus: value => statuses.push(value), setIsRefreshing: () => {},
    formatRefreshTime: () => '臺北時間', applyNameAutofill: () => {},
  });
  await controller.refresh();
  assert.equal(quotes['2330']?.price, 101);
  assert.deepEqual(quotes['0050'], quote('0050', { source: '前次有效報價 / 更新失敗', price: 88, error: 'HTTP 429' }));
  assert.match(statuses.at(-1) || '', /部分更新成功（1\/2）/);
  const source = readFileSync(new URL('../src/lib/quoteRefreshController.ts', import.meta.url), 'utf8');
  assert.match(source, /mergeQuoteRefresh\(current\[symbol\], quote\)/);
  assert.doesNotMatch(source, /localStorage|firebase|window\.location|workers\.dev/);
});

test('App delegates quote orchestration and preserves the existing request, timestamp, and name-autofill contracts', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /createQuoteRefreshController/);
  assert.match(app, /endpoint: DEFAULT_WORKER_URL/);
  assert.match(app, /requestQuote: fetchQuote/);
  assert.match(app, /refreshUrl\(endpoint,/);
  assert.match(app, /quoteRefreshRequestInit\(manual\)/);
  assert.match(app, /isValidQuoteTimestamp/);
  assert.match(app, /canAutofillName/);
  assert.doesNotMatch(app, /quoteRefreshInFlightRef/);
});

test('cross-origin quote requests use cache modes and manual URL parameters without non-safelisted request headers', () => {
  assert.match(refreshUrl('https://preview-price.example', '/?symbol=2330', true, 99), /refresh=1.*request=99/);
  const automatic = quoteRefreshRequestInit(false);
  const manual = quoteRefreshRequestInit(true);
  assert.deepEqual(automatic, { cache: 'default' });
  assert.deepEqual(manual, { cache: 'no-store' });
  assert.equal(new Headers(manual.headers).has('cache-control'), false);
  assert.equal(new Headers(manual.headers).has('pragma'), false);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const fetchQuoteSource = app.match(/async function fetchQuote[\s\S]*?\n}\n\nfunction derivedHoldings/)?.[0] || '';
  assert.doesNotMatch(fetchQuoteSource, /headers:/);
  assert.doesNotMatch(fetchQuoteSource, /cache-control|pragma/);
});
