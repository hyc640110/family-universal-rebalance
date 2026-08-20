import { createHash } from 'node:crypto';
import { taiwanTradingCalendarStatus } from '../src/lib/taiwanTradingCalendar';
import { runClecHistoricalBacktest, type ClecHistoricalBacktestInput, type ClecHistoricalBacktestResult, type ClecHistoricalPreset } from '../src/lib/clecHistoricalBacktest';

// UR-TODO-014-A: this module prepares the versioned, offline "clec-tw-reference-v1" fixture
// (tests/fixtures/clecTwReferenceV1.json) into the runClecHistoricalBacktest() input contract.
// It is a pure, deterministic data-preparation pipeline: no network access, no AppState,
// no Production symbol mapping. The prototype/leveraged/cash-like -> 0050/00631L/00865B mapping
// here is validation-only (see the fixture's own `mappingSemantics` field) and must never be
// read as a CLEC canonical mapping or a Production default portfolio.

export type ClecTwReferenceRawPrices = {
  '0050': ReadonlyArray<readonly [string, number]>;
  '00631L': ReadonlyArray<readonly [string, number]>;
  '00865B': ReadonlyArray<readonly [string, number]>;
};

export type ClecTwReferenceSplit = {
  ratio: string;
  lastTradingDayPreSplit: string;
  lastTradingDayPreSplitOfficialClose: number;
  suspensionStart: string;
  suspensionEnd: string;
  resumedTradingDay: string;
  resumedTradingDayOfficialClose: number;
  officialReferencePriceOnResume?: number;
};

export type ClecTwReferenceDistribution = { exDividendDate: string; amountPerUnit: number };

export type ClecTwReferenceFixture = {
  datasetId: string;
  datasetVersion: string;
  startDate: string;
  endDate: string;
  referencePortfolio: { prototype: '0050'; leveraged: '00631L'; 'cash-like': '00865B' };
  mappingSemantics: string;
  provenance: {
    corporateActions: {
      '0050': { split: ClecTwReferenceSplit; distributionsAppliedInThisDataset: ClecTwReferenceDistribution[] };
      '00631L': { distributions: unknown[] };
      '00865B': { distributions: unknown[] };
    };
  };
  rawPrices: ClecTwReferenceRawPrices;
};

export type ClecTwReferencePeriodsResult =
  | { status: 'ok'; periods: ClecHistoricalBacktestInput['periods']; commonDateCount: number }
  | { status: 'invalid_input'; issues: string[] };

const SPLIT_FACTOR: Record<'4:1' | '22:1', number> = { '4:1': 4, '22:1': 22 };

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** SHA-256 of the exact fixture file bytes, as committed to the repository. */
export function computeDatasetHash(rawFileText: string): string {
  return createHash('sha256').update(rawFileText, 'utf8').digest('hex');
}

function priceMap(entries: ReadonlyArray<readonly [string, number]>): Map<string, number> {
  const map = new Map<string, number>();
  for (const [date, price] of entries) {
    if (map.has(date)) throw new Error(`duplicate raw price date: ${date}`);
    map.set(date, price);
  }
  return map;
}

function allCalendarDaysBetween(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  let cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor.getTime() <= end.getTime()) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return out;
}

const withinSplitSuspension = (split: ClecTwReferenceSplit | undefined, date: string) =>
  Boolean(split && date >= split.suspensionStart && date <= split.suspensionEnd);

/**
 * Builds the split-adjusted (post-split-equivalent basis) price map for one reference symbol.
 * Prices on or after `split.resumedTradingDay` are left as-is; prices strictly before the split
 * are divided by the split factor so the whole series is on one consistent unit basis.
 */
function splitAdjustedPriceMap(rawPrices: ReadonlyArray<readonly [string, number]>, split: ClecTwReferenceSplit | undefined): Map<string, number> {
  const map = priceMap(rawPrices);
  if (!split) return map;
  const factor = SPLIT_FACTOR[split.ratio as '4:1' | '22:1'];
  if (!factor) throw new Error(`unsupported split ratio: ${split.ratio}`);
  const adjusted = new Map<string, number>();
  for (const [date, price] of map) adjusted.set(date, date < split.resumedTradingDay ? price / factor : price);
  return adjusted;
}

/**
 * Derives the common-valid-trading-date period list and each period's returnPctByRole, per the
 * dataset's fail-closed missing-data policy: a date is only ever skipped (not a period) if it is
 * a documented weekend/holiday (taiwanTradingCalendarStatus !== 'trading') or falls inside a
 * documented corporate-action suspension window for one of the three reference symbols. Any other
 * missing price on an otherwise-trading day is treated as an integrity failure (fail closed),
 * never silently interpolated or forward-filled.
 */
export function deriveClecTwReferencePeriods(fixture: ClecTwReferenceFixture): ClecTwReferencePeriodsResult {
  const issues: string[] = [];
  const split0050 = fixture.provenance.corporateActions['0050'].split;
  const distributions0050 = fixture.provenance.corporateActions['0050'].distributionsAppliedInThisDataset;

  const prices: Record<'0050' | '00631L' | '00865B', Map<string, number>> = {
    '0050': splitAdjustedPriceMap(fixture.rawPrices['0050'], split0050),
    '00631L': priceMap(fixture.rawPrices['00631L']),
    '00865B': priceMap(fixture.rawPrices['00865B'])
  };

  const commonDates: string[] = [];
  for (const date of allCalendarDaysBetween(fixture.startDate, fixture.endDate)) {
    if (taiwanTradingCalendarStatus(date) !== 'trading') continue;
    const missing = (['0050', '00631L', '00865B'] as const).filter(symbol => !prices[symbol].has(date));
    if (missing.length === 0) {
      commonDates.push(date);
      continue;
    }
    const allMissingAreSuspended = missing.every(symbol => symbol === '0050' && withinSplitSuspension(split0050, date));
    if (allMissingAreSuspended) continue;
    issues.push(`${date}: 官方應有交易資料但缺失（${missing.join('、')}），依 missing-data fail-closed 政策中止，不得插值或視為休市。`);
  }
  if (issues.length) return { status: 'invalid_input', issues };
  if (commonDates.length < 2) return { status: 'invalid_input', issues: ['共同有效交易日不足以形成任何 period。'] };

  const distributionByDate = new Map(distributions0050.map(d => [d.exDividendDate, d.amountPerUnit]));
  const periods: ClecHistoricalBacktestInput['periods'] = [];
  for (let i = 1; i < commonDates.length; i += 1) {
    const previous = commonDates[i - 1];
    const date = commonDates[i];
    const prototypePrev = prices['0050'].get(previous)!;
    const prototypeNow = prices['0050'].get(date)!;
    const distribution = distributionByDate.get(date) ?? 0;
    const prototypeReturn = ((prototypeNow + distribution) / prototypePrev - 1) * 100;
    const leveragedReturn = (prices['00631L'].get(date)! / prices['00631L'].get(previous)! - 1) * 100;
    const cashLikeReturn = (prices['00865B'].get(date)! / prices['00865B'].get(previous)! - 1) * 100;
    if (![prototypeReturn, leveragedReturn, cashLikeReturn].every(finite)) {
      return { status: 'invalid_input', issues: [`${date}: 計算出的報酬不是有限數值。`] };
    }
    periods.push({ date, returnPctByRole: { prototype: prototypeReturn, leveraged: leveragedReturn, 'cash-like': cashLikeReturn } });
  }
  return { status: 'ok', periods, commonDateCount: commonDates.length };
}

export type ClecTwReferenceRunInput = { preset: ClecHistoricalPreset; initialCapital: number; threshold: { drift: number; significantMultiplier?: number } };

/** Reuses the existing, Production-verified runClecHistoricalBacktest() Foundation; adds no second 442/433/703/5050 rule table. */
export function runClecTwReferenceValidation(fixture: ClecTwReferenceFixture, run: ClecTwReferenceRunInput): ClecHistoricalBacktestResult | { status: 'invalid_input'; issues: string[] } {
  const derived = deriveClecTwReferencePeriods(fixture);
  if (derived.status === 'invalid_input') return derived;
  return runClecHistoricalBacktest({ preset: run.preset, initialCapital: run.initialCapital, periods: derived.periods, threshold: run.threshold });
}
