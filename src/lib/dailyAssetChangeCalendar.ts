import { normalizeInvestmentPerformanceHistory, type AssetSeries } from './investmentPerformanceHistory';

export type DailyAssetChangeMode = AssetSeries;
export type CalendarDateState = 'past' | 'today' | 'future';

export type DailyAssetChange = {
  date: string;
  value: number;
  previousDate: string | null;
  previousValue: number | null;
  change: number | null;
  changeRate: number | null;
  hasComparison: boolean;
};

export type CalendarDay = {
  date: string;
  day: number;
  dateState: CalendarDateState;
  change: DailyAssetChange | null;
};

export type CalendarMonth = {
  month: string;
  year: number;
  monthIndex: number;
  leadingBlankCount: number;
  days: CalendarDay[];
};

export type CalendarMonthSummary = {
  snapshotCount: number;
  comparableDayCount: number;
  positiveDayCount: number;
  negativeDayCount: number;
  firstSnapshot: DailyAssetChange | null;
  lastSnapshot: DailyAssetChange | null;
  monthChange: number | null;
};

const monthPattern = /^(\d{4})-(\d{2})$/;

export function monthKeyFromDate(date: string): string {
  return date.slice(0, 7);
}

export function currentMonthKey(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 7);
}

export function localCalendarDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calendarDateState(date: string, today = localCalendarDateKey()): CalendarDateState {
  return date < today ? 'past' : date > today ? 'future' : 'today';
}

export function latestSnapshotMonth(raw: unknown, fallback = currentMonthKey()): string {
  return normalizeInvestmentPerformanceHistory(raw).at(-1)?.date.slice(0, 7) || fallback;
}

export function shiftMonth(month: string, amount: number): string {
  const match = month.match(monthPattern);
  if (!match) return month;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function buildDailyAssetChanges(raw: unknown, mode: DailyAssetChangeMode): DailyAssetChange[] {
  const rows = normalizeInvestmentPerformanceHistory(raw);
  return rows.map((row, index) => {
    const previous = rows[index - 1] || null;
    const value = row[mode];
    const previousValue = previous?.[mode] ?? null;
    return {
      date: row.date,
      value,
      previousDate: previous?.date ?? null,
      previousValue,
      change: previous ? value - previous[mode] : null,
      changeRate: previous && previous[mode] > 0 ? value / previous[mode] - 1 : null,
      hasComparison: Boolean(previous)
    };
  });
}

export function buildCalendarMonth(raw: unknown, mode: DailyAssetChangeMode, month: string, today = localCalendarDateKey()): CalendarMonth {
  const match = month.match(monthPattern);
  const fallback = currentMonthKey().match(monthPattern)!;
  const year = Number(match?.[1] ?? fallback[1]);
  const monthIndex = Number(match?.[2] ?? fallback[2]) - 1;
  const normalizedMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const changes = new Map(buildDailyAssetChanges(raw, mode).map(change => [change.date, change]));
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const days = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const date = `${normalizedMonth}-${String(day).padStart(2, '0')}`;
    return { date, day, dateState: calendarDateState(date, today), change: changes.get(date) || null };
  });
  return {
    month: normalizedMonth,
    year,
    monthIndex,
    leadingBlankCount: new Date(Date.UTC(year, monthIndex, 1)).getUTCDay(),
    days
  };
}

export function summarizeCalendarMonth(month: CalendarMonth): CalendarMonthSummary {
  const snapshots = month.days.flatMap(day => day.change ? [day.change] : []);
  const comparable = snapshots.filter(item => item.hasComparison && item.change !== null);
  return {
    snapshotCount: snapshots.length,
    comparableDayCount: comparable.length,
    positiveDayCount: comparable.filter(item => item.change! > 0).length,
    negativeDayCount: comparable.filter(item => item.change! < 0).length,
    firstSnapshot: snapshots[0] || null,
    lastSnapshot: snapshots.at(-1) || null,
    monthChange: snapshots.length >= 2 ? snapshots.at(-1)!.value - snapshots[0].value : null
  };
}
