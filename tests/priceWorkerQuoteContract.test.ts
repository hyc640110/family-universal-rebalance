import assert from 'node:assert/strict';
import test from 'node:test';
import { parseYahoo, resolveTwsePreviousClose, selectTwsePreviousClose, selectVerifiedPreviousClose, taipeiQuoteStamp, upstreamStatus } from '../worker/index.js';

const marketTime = Math.floor(new Date('2026-07-13T16:05:06.000Z').getTime() / 1000);
const payload = (overrides: Record<string, unknown> = {}) => ({ chart: { result: [{ meta: { regularMarketPrice: 101.5, previousClose: 100, regularMarketChange: 1.5, regularMarketChangePercent: 1.5, regularMarketVolume: 200, regularMarketTime: marketTime, ...overrides }, indicators: { quote: [{ close: [99.5, 101.5] }] } }] } });

test('converts marketTime to Taiwan quoteDate and quoteTime across UTC midnight', () => {
  assert.deepEqual(taipeiQuoteStamp(new Date('2026-07-13T16:05:06.000Z')), { quoteDate: '2026-07-14', quoteTime: '00:05:06' });
});

test('successful ETF, stock, and OTC quotes share the date contract without trusting chartPreviousClose', () => {
  for (const symbol of ['00631L.TW', '2330.TW', '8069.TWO']) {
    const quote = parseYahoo(symbol, payload({ previousClose: undefined, chartPreviousClose: 97 }));
    assert.equal(quote.quoteDate, '2026-07-14');
    assert.equal(quote.quoteTime, '00:05:06');
    assert.equal(quote.marketTime, '2026-07-13T16:05:06.000Z');
    assert.equal(quote.previousClose, null);
    assert.equal(quote.previousCloseDate, null);
    assert.equal(quote.previousCloseSource, 'unavailable');
    assert.equal(quote.previousCloseTrusted, false);
    assert.equal(quote.change, null);
  }
});

test('selects the latest official TWSE close strictly before quoteDate instead of Yahoo chartPreviousClose', () => {
  const previous = selectTwsePreviousClose('00631L.TW', '2026-07-22', [{
    stat: 'OK',
    title: '115年07月 00631L 元大台灣50正2 各日成交資訊',
    fields: ['日期', '收盤價'],
    data: [
      ['115/07/16', '37.19'],
      ['115/07/17', '32.17'],
      ['115/07/20', '32.06'],
      ['115/07/21', '34.34'],
    ],
  }]);
  assert.deepEqual(previous, {
    previousClose: 34.34,
    previousCloseDate: '2026-07-21',
    previousCloseSource: 'twse_official_previous_close',
    previousCloseTrusted: true,
    previousCloseReason: null,
  });
});

test('official TWSE rows with a wrong symbol, invalid price, or no date before quoteDate safely degrade to unavailable', () => {
  const previous = selectTwsePreviousClose('00631L.TW', '2026-07-22', [{
    stat: 'OK',
    title: '115年07月 0050 元大台灣50 各日成交資訊',
    fields: ['日期', '收盤價'],
    data: [['115/07/21', '0']],
  }]);
  assert.deepEqual(previous, {
    previousClose: null,
    previousCloseDate: null,
    previousCloseSource: 'unavailable',
    previousCloseTrusted: false,
    previousCloseReason: 'twse_official_previous_close_unavailable',
  });
});

test('uses Yahoo regularMarketPreviousClose only when the official latest prior close verifies the same date and price basis', () => {
  const official = { previousClose: 34.34, previousCloseDate: '2026-07-21', previousCloseSource: 'twse_official_previous_close', previousCloseTrusted: true, previousCloseReason: null };
  assert.deepEqual(selectVerifiedPreviousClose('2026-07-22', { regularMarketPreviousClose: 34.34, regularMarketPreviousCloseDate: '2026-07-21' }, official), {
    previousClose: 34.34,
    previousCloseDate: '2026-07-21',
    previousCloseSource: 'yahoo_regular_market_previous_close',
    previousCloseTrusted: true,
    previousCloseReason: null,
  });
  assert.deepEqual(selectVerifiedPreviousClose('2026-07-22', { regularMarketPreviousClose: 37.19, regularMarketPreviousCloseDate: '2026-07-16' }, official), official);
});

test('official fallback obtains the latest valid close per symbol and a failed symbol safely becomes unknown', async () => {
  const calls: string[] = [];
  const fetchOfficial = async (url: string) => {
    calls.push(url);
    return new Response(JSON.stringify({
      stat: 'OK',
      title: '115年07月 00631L 元大台灣50正2 各日成交資訊',
      fields: ['日期', '收盤價'],
      data: [['115/07/21', '34.34']],
    }), { status: 200 });
  };
  const resolved = await resolveTwsePreviousClose('00631L.TW', '2026-07-22', fetchOfficial);
  assert.equal(calls.length, 2);
  assert.equal(resolved.previousClose, 34.34);
  assert.equal(resolved.previousCloseDate, '2026-07-21');
  const unavailable = await resolveTwsePreviousClose('00895.TW', '2026-07-22', async () => { throw new Error('timeout'); });
  assert.deepEqual(unavailable, {
    previousClose: null,
    previousCloseDate: null,
    previousCloseSource: 'unavailable',
    previousCloseTrusted: false,
    previousCloseReason: 'twse_official_previous_close_unavailable',
  });
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
