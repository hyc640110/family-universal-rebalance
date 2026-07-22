import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDailyProfitLoss, calculateQuoteChange, deriveTrustedDailyChange, isTodayQuote, quoteDateStatus, taipeiDate } from '../src/lib/quoteMath';

const today = new Date('2026-07-13T04:00:00.000Z');
const time = '13:30:00';

test('quote change uses latest price minus previous close with correct sign', () => {
  assert.equal(calculateQuoteChange(106, 105.8), 0.2);
  assert.equal(calculateQuoteChange(36.86, 36.78), 0.08);
  assert.equal(calculateQuoteChange(48.89, 48.9), -0.01);
});

test('trusted previous close derives the Taiwan-market direction and never accepts an untrusted comparison', () => {
  assert.deepEqual(deriveTrustedDailyChange({ currentPrice: 35.19, previousClose: 34.34, previousCloseDate: '2026-07-21', quoteDate: '2026-07-22', previousCloseTrusted: true }), {
    currentPrice: 35.19,
    previousClose: 34.34,
    previousCloseDate: '2026-07-21',
    change: 0.85,
    changePercent: 2.47524752,
    direction: 'up',
    isTrusted: true,
    reason: null,
  });
  assert.deepEqual(deriveTrustedDailyChange({ currentPrice: 35.01, previousClose: 37.19, previousCloseDate: '2026-07-16', quoteDate: '2026-07-22', previousCloseTrusted: false }), {
    currentPrice: 35.01,
    previousClose: null,
    previousCloseDate: null,
    change: null,
    changePercent: null,
    direction: 'unknown',
    isTrusted: false,
    reason: 'previous_close_untrusted',
  });
});

test('trusted daily direction supports down and flat while invalid prices stay unknown', () => {
  assert.equal(deriveTrustedDailyChange({ currentPrice: 49.3, previousClose: 49.44, previousCloseDate: '2026-07-21', quoteDate: '2026-07-22', previousCloseTrusted: true }).direction, 'down');
  assert.equal(deriveTrustedDailyChange({ currentPrice: 49.44, previousClose: 49.44, previousCloseDate: '2026-07-21', quoteDate: '2026-07-22', previousCloseTrusted: true }).direction, 'flat');
  assert.equal(deriveTrustedDailyChange({ currentPrice: Number.NaN, previousClose: 49.44, previousCloseDate: '2026-07-21', quoteDate: '2026-07-22', previousCloseTrusted: true }).direction, 'unknown');
});

test('daily profit and loss is shares multiplied by same-day price change', () => {
  const change0050 = calculateQuoteChange(106, 105.8);
  const change00631L = calculateQuoteChange(36.86, 36.78);
  assert.equal(calculateDailyProfitLoss(1000, change0050, '2026-07-13', time, today), 200);
  assert.equal(calculateDailyProfitLoss(2000, change00631L, '2026-07-13', time, today), 160);
});

test('Dashboard daily profit never treats an untrusted daily change as flat or valid', () => {
  assert.equal(calculateDailyProfitLoss(1_000, -2.18, '2026-07-13', time, today, false), null);
});

test('missing timestamps and stale quote dates never count as today profit and loss', () => {
  assert.equal(isTodayQuote('2026-07-12', time, today), false);
  assert.equal(calculateDailyProfitLoss(1000, 0.2, '2026-07-12', time, today), null);
  assert.equal(calculateDailyProfitLoss(1000, 0.2, '2026-07-13', undefined, today), null);
});

test('quote date status uses Asia/Taipei across a UTC date boundary, never updatedAt', () => {
  const utcEvening = new Date('2026-07-13T16:30:00.000Z');
  assert.equal(taipeiDate(utcEvening), '2026-07-14');
  assert.equal(quoteDateStatus('2026-07-14', time, utcEvening), 'today');
  assert.equal(quoteDateStatus('2026-07-13', time, utcEvening), 'stale');
});

test('Saturday and Sunday identify the immediately preceding Friday as the recent trading day', () => {
  assert.equal(quoteDateStatus('2026-07-10', time, new Date('2026-07-11T04:00:00.000Z')), 'recent-trading-day');
  assert.equal(quoteDateStatus('2026-07-10', time, new Date('2026-07-12T04:00:00.000Z')), 'recent-trading-day');
  assert.equal(quoteDateStatus('2026-07-09', time, new Date('2026-07-12T04:00:00.000Z')), 'stale');
});

test('official Taiwan market holidays and continuous holidays resolve to the latest confirmed trading day', () => {
  assert.equal(quoteDateStatus('2026-02-11', time, new Date('2026-02-18T04:00:00.000Z')), 'recent-trading-day');
  assert.equal(quoteDateStatus('2026-02-11', time, new Date('2026-02-22T04:00:00.000Z')), 'recent-trading-day');
  assert.equal(quoteDateStatus('2026-04-02', time, new Date('2026-04-06T04:00:00.000Z')), 'recent-trading-day');
  assert.equal(quoteDateStatus('2026-02-10', time, new Date('2026-02-18T04:00:00.000Z')), 'stale');
});

test('missing, malformed, and unsupported-calendar dates are never reported as today', () => {
  assert.equal(quoteDateStatus(undefined, time, today), 'unknown');
  assert.equal(quoteDateStatus('2026/07/13', time, today), 'unknown');
  assert.equal(quoteDateStatus('2026-02-30', time, today), 'unknown');
  assert.equal(quoteDateStatus('2026-07-13', undefined, today), 'unknown');
  assert.equal(quoteDateStatus('2027-01-02', time, new Date('2027-01-02T04:00:00.000Z')), 'unavailable');
});
