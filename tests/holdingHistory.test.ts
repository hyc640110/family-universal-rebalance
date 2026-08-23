import assert from 'node:assert/strict';
import test from 'node:test';
import {
  holdingHistorySnapshotFromRows,
  holdingHistorySnapshotsEqual,
  normalizeHoldingHistory,
  normalizeHoldingHistorySnapshot,
  pruneHoldingHistoryRetention,
  upsertHoldingHistorySnapshot,
  type HoldingHistoryEntry,
  type HoldingHistorySnapshot
} from '../src/lib/holdingHistory';

const entry = (overrides: Partial<HoldingHistoryEntry> = {}): HoldingHistoryEntry => ({
  symbol: '00662',
  shares: 1000,
  price: 30,
  marketValue: 30000,
  assetClass: 'growth',
  quoteAvailable: true,
  ...overrides
});

const snapshot = (date: string, holdings: HoldingHistoryEntry[] = [entry()]): HoldingHistorySnapshot => ({ date, holdings });

// ---- Normalize: snapshot-level ----

test('normalizeHoldingHistorySnapshot keeps a valid snapshot unchanged', () => {
  const s = snapshot('2026-08-23');
  assert.deepEqual(normalizeHoldingHistorySnapshot(s), s);
});

test('normalizeHoldingHistorySnapshot drops a snapshot with an invalid date', () => {
  assert.equal(normalizeHoldingHistorySnapshot({ date: '2026-13-40', holdings: [] }), null);
  assert.equal(normalizeHoldingHistorySnapshot({ date: 'not-a-date', holdings: [] }), null);
  assert.equal(normalizeHoldingHistorySnapshot({ date: undefined, holdings: [] }), null);
});

test('normalizeHoldingHistorySnapshot drops a snapshot whose holdings is not an array', () => {
  assert.equal(normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: 'not-an-array' }), null);
  assert.equal(normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: undefined }), null);
});

test('normalizeHoldingHistorySnapshot drops non-object raw input', () => {
  assert.equal(normalizeHoldingHistorySnapshot(null), null);
  assert.equal(normalizeHoldingHistorySnapshot('string'), null);
  assert.equal(normalizeHoldingHistorySnapshot(42), null);
});

test('normalizeHoldingHistorySnapshot keeps a valid date with all-malformed holdings as an empty-holdings snapshot (date validity is independent of entry validity; never fabricates a missing day)', () => {
  const result = normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: [{ symbol: 123 }] });
  assert.deepEqual(result, { date: '2026-08-23', holdings: [] });
});

// ---- Normalize: entry-level (malformed entry only drops that entry) ----

test('malformed entry is skipped without dropping the rest of the snapshot', () => {
  const good = entry({ symbol: '00662' });
  const result = normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: [good, { symbol: 'BAD' }, { ...good, symbol: '00670L', shares: 'not-a-number' }] });
  assert.deepEqual(result, { date: '2026-08-23', holdings: [good] });
});

test('non-finite shares/price/marketValue are rejected at entry granularity', () => {
  for (const field of ['shares', 'price', 'marketValue'] as const) {
    for (const bad of [NaN, Infinity, -Infinity, 'not-a-number', undefined, null]) {
      const result = normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: [{ ...entry(), [field]: bad }] });
      assert.deepEqual(result?.holdings, [], `field=${field} bad=${String(bad)}`);
    }
  }
});

test('invalid assetClass is rejected', () => {
  const result = normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: [{ ...entry(), assetClass: 'aggressive' }] });
  assert.deepEqual(result?.holdings, []);
});

test('invalid quoteAvailable is rejected (must be a strict boolean)', () => {
  for (const bad of ['true', 1, 0, null, undefined]) {
    const result = normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: [{ ...entry(), quoteAvailable: bad }] });
    assert.deepEqual(result?.holdings, [], `bad=${String(bad)}`);
  }
});

test('invalid symbol is rejected', () => {
  for (const bad of ['', '  ', 42, null, undefined]) {
    const result = normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: [{ ...entry(), symbol: bad }] });
    assert.deepEqual(result?.holdings, [], `bad=${String(bad)}`);
  }
});

test('quoteAvailable=false entries are preserved by normalization, not stripped', () => {
  const fallback = entry({ quoteAvailable: false, price: 25, marketValue: 25000 });
  const result = normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: [fallback] });
  assert.deepEqual(result?.holdings, [fallback]);
});

// ---- Normalize: history array ----

test('normalizeHoldingHistory rejects non-array input as empty history', () => {
  assert.deepEqual(normalizeHoldingHistory(undefined), []);
  assert.deepEqual(normalizeHoldingHistory(null), []);
  assert.deepEqual(normalizeHoldingHistory('not-an-array'), []);
  assert.deepEqual(normalizeHoldingHistory({}), []);
});

test('normalizeHoldingHistory duplicate dates: last occurrence wins', () => {
  const first = snapshot('2026-08-23', [entry({ price: 10 })]);
  const second = snapshot('2026-08-23', [entry({ price: 99 })]);
  const result = normalizeHoldingHistory([first, second]);
  assert.equal(result.length, 1);
  assert.equal(result[0].holdings[0].price, 99);
});

test('normalizeHoldingHistory sorts by date', () => {
  const result = normalizeHoldingHistory([snapshot('2026-08-23'), snapshot('2026-08-01'), snapshot('2026-08-15')]);
  assert.deepEqual(result.map(s => s.date), ['2026-08-01', '2026-08-15', '2026-08-23']);
});

// ---- Producer ----

test('holdingHistorySnapshotFromRows builds a snapshot from canonical rows using the given date', () => {
  const rows = [
    { symbol: '00662', shares: 1000, price: 30, marketValue: 30000, assetClass: 'growth' as const, quoteAvailable: true },
    { symbol: '00865B', shares: 500, price: 32, marketValue: 16000, assetClass: 'defensive' as const, quoteAvailable: false }
  ];
  const result = holdingHistorySnapshotFromRows(rows, '2026-08-23');
  assert.deepEqual(result, { date: '2026-08-23', holdings: rows });
});

test('holdingHistorySnapshotFromRows defaults to today (canonicalCalendarDay) when no date is given', () => {
  const result = holdingHistorySnapshotFromRows([]);
  assert.match(result.date, /^\d{4}-\d{2}-\d{2}$/);
});

// ---- Same-day upsert ----

test('upsert appends a new date', () => {
  const result = upsertHoldingHistorySnapshot([snapshot('2026-08-22')], snapshot('2026-08-23'), new Date('2026-08-23T12:00:00Z'));
  assert.deepEqual(result.map(s => s.date), ['2026-08-22', '2026-08-23']);
});

test('upsert overwrites the same day wholesale, not merged, without increasing row count', () => {
  const original = snapshot('2026-08-23', [entry({ symbol: '00662', price: 10 })]);
  const updated = snapshot('2026-08-23', [entry({ symbol: '00670L', price: 20 })]);
  const result = upsertHoldingHistorySnapshot([original], updated, new Date('2026-08-23T12:00:00Z'));
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], updated);
});

test('upsert result is date-ordered deterministically', () => {
  const result = upsertHoldingHistorySnapshot(
    [snapshot('2026-08-23'), snapshot('2026-08-01')],
    snapshot('2026-08-15'),
    new Date('2026-08-23T12:00:00Z')
  );
  assert.deepEqual(result.map(s => s.date), ['2026-08-01', '2026-08-15', '2026-08-23']);
});

// ---- Retention (365-day boundary, exact formula parity with historyForRange) ----

test('retention keeps today', () => {
  const now = new Date('2026-08-23T12:00:00Z');
  const result = pruneHoldingHistoryRetention([snapshot('2026-08-23')], now);
  assert.deepEqual(result.map(s => s.date), ['2026-08-23']);
});

test('retention keeps exactly the 365th day back (today - 364) and drops the 366th (today - 365)', () => {
  const now = new Date('2026-08-23T12:00:00Z'); // canonical Asia/Taipei day 2026-08-23
  const day365 = '2025-08-24'; // today - 364 days
  const day366 = '2025-08-23'; // today - 365 days
  const result = pruneHoldingHistoryRetention([snapshot(day366), snapshot(day365), snapshot('2026-08-23')], now);
  assert.deepEqual(result.map(s => s.date), [day365, '2026-08-23']);
});

test('retention boundary crosses a leap year (2028-02-29) without an off-by-one', () => {
  // today = 2028-08-23 (2028 is a leap year); today - 364 lands before 2/29, exercising the leap day in the window.
  const now = new Date('2028-08-23T12:00:00Z');
  const day365 = '2027-08-25';
  const day366 = '2027-08-24';
  const result = pruneHoldingHistoryRetention([snapshot(day366), snapshot(day365)], now);
  assert.deepEqual(result.map(s => s.date), [day365]);
});

test('retention is applied automatically on every upsert', () => {
  const now = new Date('2026-08-23T12:00:00Z');
  const day366 = '2025-08-23';
  const result = upsertHoldingHistorySnapshot([snapshot(day366)], snapshot('2026-08-23'), now);
  assert.deepEqual(result.map(s => s.date), ['2026-08-23']);
});

test('retention never fabricates or backfills missing days — pruning only removes, never adds', () => {
  const now = new Date('2026-08-23T12:00:00Z');
  const result = pruneHoldingHistoryRetention([snapshot('2026-08-01'), snapshot('2026-08-23')], now);
  assert.deepEqual(result.map(s => s.date), ['2026-08-01', '2026-08-23']);
});

// ---- Availability contract ----

test('quoteAvailable=true and quoteAvailable=false entries both persist through the full normalize/upsert pipeline', () => {
  const available = entry({ symbol: '00662', quoteAvailable: true });
  const unavailable = entry({ symbol: '00670L', quoteAvailable: false, price: 12, marketValue: 12000 });
  const result = upsertHoldingHistorySnapshot(undefined, snapshot('2026-08-23', [available, unavailable]), new Date('2026-08-23T12:00:00Z'));
  assert.deepEqual(result[0].holdings, [available, unavailable]);
});

test('quoteAvailable=false is never auto-dropped by Phase A normalization (Phase A only stores observation, does not filter)', () => {
  const unavailable = entry({ quoteAvailable: false });
  const result = normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: [unavailable] });
  assert.deepEqual(result?.holdings, [unavailable]);
});

// ---- Historical integrity ----

test('archived/closed holdings do not get their history retroactively removed — normalization is symbol-agnostic', () => {
  const historicalOnly = entry({ symbol: '00685L', shares: 0 });
  const result = normalizeHoldingHistorySnapshot({ date: '2026-08-23', holdings: [historicalOnly] });
  assert.deepEqual(result?.holdings, [historicalOnly]);
});

// ---- Equality helper (used to skip redundant same-day writes) ----

test('holdingHistorySnapshotsEqual: false when previous is undefined', () => {
  assert.equal(holdingHistorySnapshotsEqual(undefined, snapshot('2026-08-23')), false);
});

test('holdingHistorySnapshotsEqual: true for structurally identical same-day snapshots', () => {
  const a = snapshot('2026-08-23', [entry({ symbol: '00662' }), entry({ symbol: '00670L', price: 50 })]);
  const b = snapshot('2026-08-23', [entry({ symbol: '00662' }), entry({ symbol: '00670L', price: 50 })]);
  assert.equal(holdingHistorySnapshotsEqual(a, b), true);
});

test('holdingHistorySnapshotsEqual: false when any field differs', () => {
  const a = snapshot('2026-08-23', [entry({ price: 30 })]);
  const b = snapshot('2026-08-23', [entry({ price: 31 })]);
  assert.equal(holdingHistorySnapshotsEqual(a, b), false);
  assert.equal(holdingHistorySnapshotsEqual(a, snapshot('2026-08-24')), false);
  assert.equal(holdingHistorySnapshotsEqual(snapshot('2026-08-23', []), snapshot('2026-08-23', [entry()])), false);
});
