import assert from 'node:assert/strict';
import test from 'node:test';
import { parseYahoo, taipeiQuoteStamp, upstreamStatus } from '../worker/index.js';

const marketTime = Math.floor(new Date('2026-07-13T16:05:06.000Z').getTime() / 1000);
const payload = (overrides: Record<string, unknown> = {}) => ({ chart: { result: [{ meta: { regularMarketPrice: 101.5, previousClose: 100, regularMarketChange: 1.5, regularMarketChangePercent: 1.5, regularMarketVolume: 200, regularMarketTime: marketTime, ...overrides }, indicators: { quote: [{ close: [99.5, 101.5] }] } }] } });

test('converts marketTime to Taiwan quoteDate and quoteTime across UTC midnight', () => {
  assert.deepEqual(taipeiQuoteStamp(new Date('2026-07-13T16:05:06.000Z')), { quoteDate: '2026-07-14', quoteTime: '00:05:06' });
});

test('successful ETF, stock, and OTC quotes share the date contract', () => {
  for (const symbol of ['00631L.TW', '2330.TW', '8069.TWO']) {
    const quote = parseYahoo(symbol, payload());
    assert.equal(quote.quoteDate, '2026-07-14');
    assert.equal(quote.quoteTime, '00:05:06');
    assert.equal(quote.marketTime, '2026-07-13T16:05:06.000Z');
    assert.equal(quote.previousClose, 100);
    assert.equal(quote.change, 1.5);
  }
});

test('close-price fallback still requires and returns a valid market timestamp', () => {
  const quote = parseYahoo('00662.TW', payload({ regularMarketPrice: undefined, regularMarketChange: undefined, regularMarketChangePercent: undefined }));
  assert.equal(quote.price, 101.5);
  assert.equal(quote.quoteDate, '2026-07-14');
});

test('missing or invalid marketTime never fabricates quoteDate or quoteTime', () => {
  assert.throws(() => parseYahoo('00631L.TW', payload({ regularMarketTime: undefined })), /missing market time/);
  assert.throws(() => parseYahoo('00631L.TW', payload({ regularMarketTime: 'bad' })), /missing market time/);
  assert.throws(() => taipeiQuoteStamp(new Date('bad')), /invalid market time/);
});

test('upstream rate limits remain explicit instead of being rewritten as a generic successful response', () => {
  assert.equal(upstreamStatus(Object.assign(new Error('Yahoo status 429'), { status: 429 })), 429);
  assert.equal(upstreamStatus(new Error('unknown')), 500);
});
