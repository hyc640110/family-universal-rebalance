import { canonicalCalendarDay, isCanonicalCalendarDay, selectLastOccurrenceByDate, shiftCanonicalCalendarDay } from './calendarDay';
import type { SymbolCode } from './rebalanceOrderHelper';

/**
 * UR-TODO-078 Phase A: App-observed per-holding historical snapshot (not a background
 * scheduler, not exchange daily-close history). A day only has a snapshot if the App
 * successfully refreshed quotes that day; a missing day is absent, never backfilled.
 */
export type HoldingHistoryAssetClass = 'growth' | 'defensive';

export type HoldingHistoryEntry = {
  symbol: SymbolCode;
  shares: number;
  price: number;
  marketValue: number;
  assetClass: HoldingHistoryAssetClass;
  /**
   * true when `price` is a genuine market-observed value (fresh quote or a preserved prior
   * quote); false when it fell back to the holding's avgCost because no usable quote was
   * available that day. `price`/`marketValue` are always written either way — this flag is
   * provenance only, never a reason to drop the entry (UR-TODO-078 §3.8 Contract Audit).
   */
  quoteAvailable: boolean;
};

export type HoldingHistorySnapshot = {
  date: string;
  holdings: HoldingHistoryEntry[];
};

/** Input row shape a producer (e.g. calculateMetrics() rows) supplies for one symbol. */
export type HoldingHistoryRow = {
  symbol: SymbolCode;
  shares: number;
  price: number;
  marketValue: number;
  assetClass: HoldingHistoryAssetClass;
  quoteAvailable: boolean;
};

const RETENTION_DAYS = 365;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isHoldingHistoryAssetClass(value: unknown): value is HoldingHistoryAssetClass {
  return value === 'growth' || value === 'defensive';
}

/** Malformed entry fields fail closed at entry granularity — never fabricated, never coerced. */
function normalizeHoldingHistoryEntry(raw: unknown): HoldingHistoryEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Record<keyof HoldingHistoryEntry, unknown>>;
  if (typeof r.symbol !== 'string' || r.symbol.trim() === '') return null;
  if (!isFiniteNumber(r.shares)) return null;
  if (!isFiniteNumber(r.price)) return null;
  if (!isFiniteNumber(r.marketValue)) return null;
  if (!isHoldingHistoryAssetClass(r.assetClass)) return null;
  if (typeof r.quoteAvailable !== 'boolean') return null;
  return { symbol: r.symbol, shares: r.shares, price: r.price, marketValue: r.marketValue, assetClass: r.assetClass, quoteAvailable: r.quoteAvailable };
}

/**
 * A malformed snapshot (invalid date, non-array holdings) is dropped entirely; a malformed
 * entry only drops that one entry — one bad row for one symbol must not take down the rest of
 * that day's otherwise-healthy entries (UR-TODO-078 §5 read-boundary grain decision).
 */
export function normalizeHoldingHistorySnapshot(raw: unknown): HoldingHistorySnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { date?: unknown; holdings?: unknown };
  if (!isCanonicalCalendarDay(r.date)) return null;
  if (!Array.isArray(r.holdings)) return null;
  const holdings = r.holdings
    .map(normalizeHoldingHistoryEntry)
    .filter((entry): entry is HoldingHistoryEntry => entry !== null);
  return { date: r.date, holdings };
}

/** Duplicate dates resolve deterministically to the last occurrence, matching netWorthHistory. */
export function normalizeHoldingHistory(raw: unknown): HoldingHistorySnapshot[] {
  if (!Array.isArray(raw)) return [];
  const rows = raw
    .map(normalizeHoldingHistorySnapshot)
    .filter((snapshot): snapshot is HoldingHistorySnapshot => snapshot !== null);
  return selectLastOccurrenceByDate(rows);
}

/** Builds today's snapshot from already-computed canonical rows (e.g. calculateMetrics() rows). */
export function holdingHistorySnapshotFromRows(rows: readonly HoldingHistoryRow[], date = canonicalCalendarDay()): HoldingHistorySnapshot {
  return {
    date,
    holdings: rows.map(row => ({
      symbol: row.symbol,
      shares: row.shares,
      price: row.price,
      marketValue: row.marketValue,
      assetClass: row.assetClass,
      quoteAvailable: row.quoteAvailable
    }))
  };
}

/**
 * Exact boundary formula reused from `historyForRange()` (netWorthHistory.ts): keep
 * `[today - 364, today]` inclusive, i.e. exactly 365 canonical calendar days. The 365th day
 * back is kept; the 366th is dropped. No second date-window formula is introduced.
 */
export function pruneHoldingHistoryRetention(history: readonly HoldingHistorySnapshot[], now = new Date()): HoldingHistorySnapshot[] {
  const cutoff = shiftCanonicalCalendarDay(canonicalCalendarDay(now), -(RETENTION_DAYS - 1));
  return history.filter(snapshot => snapshot.date >= cutoff);
}

/** Same-day producer calls overwrite the whole day's snapshot; retention is enforced on every upsert. */
export function upsertHoldingHistorySnapshot(history: HoldingHistorySnapshot[] | undefined, snapshot: HoldingHistorySnapshot, now = new Date()): HoldingHistorySnapshot[] {
  const rows = normalizeHoldingHistory(history);
  const index = rows.findIndex(item => item.date === snapshot.date);
  if (index >= 0) rows[index] = snapshot; else rows.push(snapshot);
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return pruneHoldingHistoryRetention(rows, now);
}

/** Structural equality used to skip redundant same-day writes (avoids churn on every quote poll). */
export function holdingHistorySnapshotsEqual(a: HoldingHistorySnapshot | undefined, b: HoldingHistorySnapshot): boolean {
  if (!a) return false;
  if (a.date !== b.date || a.holdings.length !== b.holdings.length) return false;
  return a.holdings.every((entry, index) => {
    const other = b.holdings[index];
    return entry.symbol === other.symbol && entry.shares === other.shares && entry.price === other.price &&
      entry.marketValue === other.marketValue && entry.assetClass === other.assetClass && entry.quoteAvailable === other.quoteAvailable;
  });
}
