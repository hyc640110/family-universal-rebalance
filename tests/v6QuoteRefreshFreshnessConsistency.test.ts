import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { mergeQuoteMap, mergeQuoteRefresh } from '../src/lib/dataRefresh';
import { taiwanTradingCalendarStatus, taiwanTradingCalendarYears } from '../src/lib/taiwanTradingCalendar';

type Quote = { symbol: string; source: string; price: number; previousClose: number; change: number; changePct: number; quoteDate?: string; quoteTime?: string; updatedAt: string; error?: string };
const quote = (patch: Partial<Quote> = {}): Quote => ({ symbol: '00631L', source: 'Price Worker', price: 100, previousClose: 99, change: 1, changePct: 1.01, quoteDate: '2026-07-17', quoteTime: '13:30:00', updatedAt: '2026-07-17T05:30:01.000Z', ...patch });

test('calendar has explicit multiple-year coverage and rejects dates outside it', () => {
  assert.deepEqual(taiwanTradingCalendarYears(), [2025, 2026]);
  assert.equal(taiwanTradingCalendarStatus('2026-02-18'), 'closed');
  assert.equal(taiwanTradingCalendarStatus('2026-07-17'), 'trading');
  assert.equal(taiwanTradingCalendarStatus('2027-01-02'), 'unavailable');
});

test('newer market quotes replace older quotes while late older responses cannot overwrite them', () => {
  const older = quote({ price: 100, quoteTime: '13:20:00' });
  const newer = quote({ price: 102, quoteTime: '13:30:00' });
  assert.equal(mergeQuoteRefresh(older, newer).price, 102);
  assert.equal(mergeQuoteRefresh(newer, older).price, 102);
});

test('same market timestamp deterministically accepts the controller\'s later response without using receipt time', () => {
  const left = quote({ price: 100, updatedAt: '2026-07-17T05:31:00.000Z' });
  const right = quote({ price: 101, updatedAt: '2026-07-17T05:29:00.000Z' });
  assert.equal(mergeQuoteRefresh(left, right).price, 101);
  assert.equal(mergeQuoteRefresh(left, { ...right, updatedAt: '2099-01-01T00:00:00.000Z' }).price, 101);
});

test('failed or invalid replies preserve the previous usable market quote and its original timestamp', () => {
  const previous = quote({ quoteDate: '2026-07-16', quoteTime: '13:30:00' });
  const failed = quote({ price: 0, quoteDate: undefined, quoteTime: undefined, source: '離線備援 / Worker 更新失敗', error: 'HTTP 429' });
  const merged = mergeQuoteRefresh(previous, failed);
  assert.equal(merged.price, 100);
  assert.equal(merged.quoteDate, '2026-07-16');
  assert.equal(merged.quoteTime, '13:30:00');
  assert.match(merged.source, /更新失敗/);
  assert.equal(merged.error, 'HTTP 429');
});

test('partial quote maps preserve each successful quote and do not mutate either input', () => {
  const current = { '00631L': quote({ symbol: '00631L', price: 100, quoteTime: '13:20:00' }), '00865B': quote({ symbol: '00865B', price: 50, quoteTime: '13:20:00' }) };
  const incoming = { '00631L': quote({ symbol: '00631L', price: 101, quoteTime: '13:30:00' }), '00865B': quote({ symbol: '00865B', price: 0, quoteDate: undefined, quoteTime: undefined, error: 'timeout' }) };
  const before = JSON.stringify({ current, incoming });
  const merged = mergeQuoteMap(current, incoming);
  assert.equal(merged['00631L'].price, 101);
  assert.equal(merged['00865B'].price, 50);
  assert.equal(JSON.stringify({ current, incoming }), before);
});

test('the four supported symbols, market suffix normalization, and one quote map remain wired through the App boundary', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  for (const symbol of ['00631L', '00865B', '00685L', '00895']) assert.match(app, new RegExp(`'${symbol}'`));
  assert.match(app, /replace\(\/\\\.\(TW\|TWO\)\$\//);
  assert.match(app, /const \[quotes, setQuotes\] = useState<Record<SymbolCode, Quote>>/);
  assert.match(app, /quoteDateStatus\(row\.quote\.quoteDate, row\.quote\.quoteTime\)/);
  assert.match(app, /mergeQuoteMap\(current, importedQuotes\)/);
});

test('quote cache stays outside Firebase canonical sync state', () => {
  const sync = readFileSync(new URL('../tests/syncBaseline.test.ts', import.meta.url), 'utf8');
  assert.match(sync, /quote cache and fetchedAt stay outside AppState and cannot change its fingerprint/);
});
