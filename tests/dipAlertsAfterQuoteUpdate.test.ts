import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveDipAlertsAfterQuoteUpdate, type DipAlertSetting } from '../src/lib/dipAlertEngine';

// Same fixed (date, now) pair quoteMath.test.ts already relies on for a deterministic 'today'
// classification (Asia/Taipei 2026-07-13), so this file never depends on today's real date or the
// Taiwan trading calendar in any way that could make it flaky.
const NOW = new Date('2026-07-13T04:00:00.000Z');
const TIME = '13:30:00';

const quote = (overrides: Partial<{ price: number; source: string; quoteDate?: string; quoteTime?: string }> = {}) => ({
  symbol: '00631L', name: '元大台灣50正2', price: 100, previousClose: null, change: null, changePct: null,
  volume: 0, source: '報價 Worker', updatedAt: NOW.toISOString(),
  quoteDate: '2026-07-13', quoteTime: TIME,
  ...overrides,
});

const setting = (overrides: Partial<DipAlertSetting> = {}): DipAlertSetting => ({
  enabled: true, referencePrice: 0, thresholdPct: -10, highWaterMark: null, triggeredLevel: null, ...overrides,
});

test('an enabled symbol with a good-quality quote initializes highWaterMark on the first update', () => {
  const dipAlerts = { '00631L': setting() };
  const quotes = { '00631L': quote({ price: 300 }) };
  const result = deriveDipAlertsAfterQuoteUpdate(dipAlerts, quotes, NOW);
  assert.notEqual(result, dipAlerts, 'must return a new object when something changed');
  assert.equal(result['00631L'].highWaterMark, 300);
  assert.equal(result['00631L'].triggeredLevel, null);
});

test('a disabled symbol is never advanced even with a deep-drawdown quote', () => {
  const dipAlerts = { '00631L': setting({ enabled: false, highWaterMark: 300, triggeredLevel: null }) };
  const quotes = { '00631L': quote({ price: 100 }) };
  const result = deriveDipAlertsAfterQuoteUpdate(dipAlerts, quotes, NOW);
  assert.equal(result, dipAlerts, 'must be the exact same reference — nothing was touched');
});

test('a symbol with no dip alert enabled at all (missing quote) is skipped, not thrown on', () => {
  const dipAlerts = { '00631L': setting({ highWaterMark: 300, triggeredLevel: null }) };
  const result = deriveDipAlertsAfterQuoteUpdate(dipAlerts, {}, NOW);
  assert.equal(result, dipAlerts);
});

test('a level-advancing drop updates triggeredLevel, preserving other unrelated symbols untouched', () => {
  const dipAlerts = {
    '00631L': setting({ highWaterMark: 300, triggeredLevel: null }),
    '00670L': setting({ highWaterMark: 500, triggeredLevel: 1 }),
  };
  const quotes = { '00631L': quote({ price: 269 }) }; // -10.3% -> level 1
  const result = deriveDipAlertsAfterQuoteUpdate(dipAlerts, quotes, NOW);
  assert.equal(result['00631L'].triggeredLevel, 1);
  assert.equal(result['00631L'].highWaterMark, 300);
  assert.equal(result['00670L'], dipAlerts['00670L'], '00670L object identity preserved — it was never touched');
});

test('a new high advances highWaterMark and resets triggeredLevel to null', () => {
  const dipAlerts = { '00631L': setting({ highWaterMark: 300, triggeredLevel: 2 }) };
  const quotes = { '00631L': quote({ price: 320 }) };
  const result = deriveDipAlertsAfterQuoteUpdate(dipAlerts, quotes, NOW);
  assert.equal(result['00631L'].highWaterMark, 320);
  assert.equal(result['00631L'].triggeredLevel, null);
});

test('an unacceptable quote (stale) leaves the setting completely untouched, even if the price implies a new high', () => {
  const dipAlerts = { '00631L': setting({ highWaterMark: 300, triggeredLevel: 2 }) };
  const quotes = { '00631L': quote({ price: 999, quoteDate: '2020-01-02', quoteTime: TIME }) }; // far in the past -> 'stale'
  const result = deriveDipAlertsAfterQuoteUpdate(dipAlerts, quotes, NOW);
  assert.equal(result, dipAlerts);
});

test('a backup-source quote is ignored even with an otherwise acceptable date/time', () => {
  const dipAlerts = { '00631L': setting({ highWaterMark: 300, triggeredLevel: null }) };
  const quotes = { '00631L': quote({ price: 100, source: '成交均價備援' }) };
  const result = deriveDipAlertsAfterQuoteUpdate(dipAlerts, quotes, NOW);
  assert.equal(result, dipAlerts);
});

test('a price exactly equal to the recorded high produces no change at all (no new object)', () => {
  const dipAlerts = { '00631L': setting({ highWaterMark: 300, triggeredLevel: null }) };
  const quotes = { '00631L': quote({ price: 300 }) };
  const result = deriveDipAlertsAfterQuoteUpdate(dipAlerts, quotes, NOW);
  assert.equal(result, dipAlerts, 'drawdownPct is 0, no level crossed, no highWaterMark change -> truly nothing changed');
});

test('multiple enabled symbols are each advanced independently in the same call', () => {
  const dipAlerts = {
    '00631L': setting({ highWaterMark: 300, triggeredLevel: null }),
    '00670L': setting({ highWaterMark: 500, triggeredLevel: null }),
  };
  const quotes = {
    '00631L': quote({ symbol: '00631L', price: 269 }), // -10.3% -> level 1
    '00670L': quote({ symbol: '00670L', price: 500 }), // unchanged
  };
  const result = deriveDipAlertsAfterQuoteUpdate(dipAlerts, quotes, NOW);
  assert.equal(result['00631L'].triggeredLevel, 1);
  assert.equal(result['00670L'], dipAlerts['00670L']);
});
