/**
 * UR-TODO-076: pure data-transform helpers for the redesigned "資產配置" (Asset Allocation)
 * section on the Assets page. Desktop and Mobile presentation both consume the exact same
 * functions here so neither breakpoint can drift into its own financial semantics — only the
 * JSX/CSS around these results may differ per breakpoint.
 *
 * These helpers deliberately do not recompute totalAssets, growth/defensive classification, or
 * target allocation — callers must pass in values already derived from the existing SSOT
 * (`calculateMetrics()`/`rebalance()` in App.tsx and `getEffectiveTargetPercent()`/`getCashTarget()`
 * from `rebalanceOrderHelper`). See AI_CONTEXT/008_TODO_BACKLOG.md UR-TODO-076 for the Contract
 * Audit that established this boundary.
 */

export type AllocationTone = 'up' | 'down' | 'hold';

/** Mirrors the existing generic `tone()` helper in App.tsx (positive=up/red, negative=down/green,
 * zero=hold) — the same convention already used for per-holding "配置偏離" in HoldingDetailContent. */
export function allocationTone(value: number): AllocationTone {
  return value > 0 ? 'up' : value < 0 ? 'down' : 'hold';
}

export type AllocationLegendItem = {
  symbol: string;
  name: string;
  value: number;
  percent: number;
  color: string;
};

export type AllocationRowInput = { symbol: string; name: string; marketValue: number };

/**
 * Builds the donut/legend item list: every holding with a positive market value plus a synthetic
 * `CASH` row, sorted by percent descending. This is the same composition `AllocationDonut` (the
 * existing Analytics-page donut) already used inline — extracted here so the redesigned Assets-page
 * panel and `AllocationDonut` share one implementation instead of two independent computations.
 */
export function deriveAllocationLegendItems(
  rows: readonly AllocationRowInput[],
  cashValue: number,
  totalAssets: number,
  colorOf: (symbol: string) => string
): AllocationLegendItem[] {
  const total = Math.max(0, totalAssets);
  const items = [
    ...rows.map(row => ({ symbol: row.symbol, name: row.name, value: Math.max(0, row.marketValue) })),
    { symbol: 'CASH', name: '台幣現金', value: Math.max(0, cashValue) }
  ].filter(item => item.value > 0);
  return items
    .map(item => ({ ...item, percent: total > 0 ? (item.value / total) * 100 : 0, color: colorOf(item.symbol) }))
    .sort((a, b) => b.percent - a.percent);
}

export type AllocationDetailRow = AllocationLegendItem & {
  classLabel: string;
  targetPercent: number;
  deviationPercent: number;
  deviationTone: AllocationTone;
};

export type AllocationHoldingInput = { symbol: string; assetClass: 'growth' | 'defensive' };

/**
 * Adds target/deviation columns for the Desktop "資產明細（目前 vs 目標）" table, reusing whatever
 * effective target each holding already has (`effectiveTargetOf`) and the existing cash-target
 * semantics (`cashTargetPercent` = `getCashTarget(holdings)`, i.e. 100 minus all holding targets).
 * Never invents a second deviation formula — deviation is always `currentPercent - targetPercent`,
 * the same shape as `HoldingDetailContent`'s existing "配置偏離". Generic over `H` (rather than a
 * fixed `AllocationHoldingInput`) so callers can pass the real `Holding` rows straight through to
 * their own `effectiveTargetOf` (e.g. App.tsx's `getEffectiveTargetPercent`) without re-narrowing.
 */
export function deriveAllocationDetailRows<H extends AllocationHoldingInput>(
  legendItems: readonly AllocationLegendItem[],
  holdings: readonly H[],
  cashTargetPercent: number,
  effectiveTargetOf: (holding: H) => number,
  classLabelOf: (assetClass: 'growth' | 'defensive') => string
): AllocationDetailRow[] {
  return legendItems.map(item => {
    if (item.symbol === 'CASH') {
      const target = cashTargetPercent;
      const deviation = item.percent - target;
      return { ...item, classLabel: '防守', targetPercent: target, deviationPercent: deviation, deviationTone: allocationTone(deviation) };
    }
    const holding = holdings.find(h => h.symbol === item.symbol);
    const target = holding ? effectiveTargetOf(holding) : 0;
    const deviation = item.percent - target;
    return { ...item, classLabel: holding ? classLabelOf(holding.assetClass) : '—', targetPercent: target, deviationPercent: deviation, deviationTone: allocationTone(deviation) };
  });
}

export type SparklinePoint = { date: string; value: number };

/**
 * Maps a real persisted `NetWorthSnapshot[]` history (already filtered to the desired range by the
 * caller, e.g. via `historyForRange(history, '30d')`) into `{date, value}` points for one numeric
 * field. Only `totalAssets` and `cash` are backed by real per-day history today (see UR-TODO-076
 * Contract Audit) — callers must not pass a field that isn't actually persisted daily.
 */
export function sparklinePointsFromHistory<T extends { date: string }>(
  history: readonly T[] | undefined,
  field: keyof T
): SparklinePoint[] {
  if (!history || !history.length) return [];
  return history
    .map(row => ({ date: row.date, value: row[field] as unknown }))
    .filter((point): point is { date: string; value: number } => typeof point.value === 'number' && Number.isFinite(point.value));
}

export type SparklineChange = { delta: number; deltaPct: number | null };

/** First-vs-last point change within whatever range was already passed in. Returns null when there
 * are fewer than 2 real points — never fabricates a change from a single snapshot. */
export function deriveSparklineChange(points: readonly SparklinePoint[]): SparklineChange | null {
  if (points.length < 2) return null;
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / first) * 100 : null;
  return { delta, deltaPct };
}
