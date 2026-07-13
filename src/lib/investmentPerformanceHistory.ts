import type { NetWorthSnapshot } from './netWorthHistory';

export type InvestmentPerformanceRange = '30d' | '90d' | '1y' | 'all';
export type AssetSeries = 'investmentValue' | 'netWorth';
export type PeriodChange = { key: string; startDate: string; endDate: string; startValue: number; endValue: number; change: number };

export type SeriesStats = {
  latest: NetWorthSnapshot | null;
  highest: number | null;
  distanceFromHigh: number | null;
  distanceFromHighRate: number | null;
  maxDrawdown: number | null;
  monthChange: number | null;
  yearChange: number | null;
  monthlyChanges: PeriodChange[];
  yearlyChanges: PeriodChange[];
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Keeps only complete, finite daily snapshots. The final occurrence for a day
 * wins, matching the application's existing same-day snapshot overwrite rule.
 */
export function normalizeInvestmentPerformanceHistory(raw: unknown): NetWorthSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const byDate = new Map<string, NetWorthSnapshot>();
  raw.forEach(value => {
    const row = value && typeof value === 'object' ? value as Partial<NetWorthSnapshot> : null;
    if (!row || !validDate(row.date)) return;
    const totalAssets = finite(row.totalAssets);
    const netWorth = finite(row.netWorth);
    const investmentValue = finite(row.investmentValue);
    const cash = finite(row.cash);
    const debt = finite(row.debt);
    if (totalAssets === null || netWorth === null || investmentValue === null || cash === null || debt === null) return;
    byDate.set(row.date, { date: row.date, totalAssets, netWorth, investmentValue, cash, debt });
  });
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function filterInvestmentPerformanceRange(history: NetWorthSnapshot[], range: InvestmentPerformanceRange, now = new Date()): NetWorthSnapshot[] {
  const rows = normalizeInvestmentPerformanceHistory(history);
  if (range === 'all') return rows;
  const days = range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days + 1);
  const offset = cutoff.getTimezoneOffset() * 60000;
  const cutoffDate = new Date(cutoff.getTime() - offset).toISOString().slice(0, 10);
  return rows.filter(row => row.date >= cutoffDate);
}

function changesFor(rows: NetWorthSnapshot[], field: AssetSeries, keyOf: (date: string) => string): PeriodChange[] {
  const groups = new Map<string, NetWorthSnapshot[]>();
  rows.forEach(row => groups.set(keyOf(row.date), [...(groups.get(keyOf(row.date)) || []), row]));
  return [...groups.entries()].flatMap(([key, values]) => {
    if (values.length < 2) return [];
    const start = values[0];
    const end = values.at(-1)!;
    return [{ key, startDate: start.date, endDate: end.date, startValue: start[field], endValue: end[field], change: end[field] - start[field] }];
  }).reverse();
}

export function deriveInvestmentPerformanceStats(raw: unknown, field: AssetSeries): SeriesStats {
  const rows = normalizeInvestmentPerformanceHistory(raw);
  const latest = rows.at(-1) || null;
  const values = rows.map(row => row[field]);
  const highest = values.length ? Math.max(...values) : null;
  const distanceFromHigh = latest && highest !== null ? latest[field] - highest : null;
  const distanceFromHighRate = latest && highest !== null && highest > 0 ? latest[field] / highest - 1 : null;

  let peak: number | null = null;
  let maxDrawdown: number | null = null;
  rows.forEach(row => {
    const value = row[field];
    if (peak !== null && peak > 0) {
      const drawdown = Math.min(0, (value - peak) / peak);
      maxDrawdown = maxDrawdown === null ? drawdown : Math.min(maxDrawdown, drawdown);
    }
    if (peak === null || value > peak) peak = value;
  });

  const latestMonth = latest ? rows.filter(row => row.date.startsWith(latest.date.slice(0, 7))) : [];
  const latestYear = latest ? rows.filter(row => row.date.startsWith(latest.date.slice(0, 4))) : [];
  return {
    latest,
    highest,
    distanceFromHigh,
    distanceFromHighRate,
    maxDrawdown,
    monthChange: latestMonth.length > 1 ? latestMonth.at(-1)![field] - latestMonth[0][field] : null,
    yearChange: latestYear.length > 1 ? latestYear.at(-1)![field] - latestYear[0][field] : null,
    monthlyChanges: changesFor(rows, field, date => date.slice(0, 7)),
    yearlyChanges: changesFor(rows, field, date => date.slice(0, 4))
  };
}

export function deriveInvestmentPerformanceQuality(raw: unknown) {
  const history = normalizeInvestmentPerformanceHistory(raw);
  const positivePeakExists = history.some(row => row.investmentValue > 0 || row.netWorth > 0);
  return {
    snapshotCount: history.length,
    earliestDate: history[0]?.date || null,
    latestDate: history.at(-1)?.date || null,
    canCalculateChange: history.length >= 2,
    canCalculateMaxDrawdown: history.length >= 2 && positivePeakExists,
    canCalculateCagr: false,
    canCalculateXirr: false,
    cagrReason: '缺少可辨識的投資投入、提領與出售現金流，無法可靠計算 CAGR。',
    xirrReason: '缺少各筆投資現金流與期末價值的完整對應，無法可靠計算 XIRR。'
  };
}
