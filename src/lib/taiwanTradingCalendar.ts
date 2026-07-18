export type TaiwanTradingCalendarStatus = 'trading' | 'closed' | 'unavailable' | 'invalid';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Source: TWSE annual market holiday schedules. Keep the supported years explicit:
// an uncovered year must never be treated as a normal trading day by default.
const CLOSED_DATES_BY_YEAR: Record<number, readonly string[]> = {
  2025: [
    '2025-01-01', '2025-01-23', '2025-01-24', '2025-01-27', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
    '2025-02-28', '2025-04-03', '2025-04-04', '2025-05-01', '2025-05-30', '2025-10-06', '2025-10-10', '2025-12-25',
  ],
  2026: [
    '2026-01-01', '2026-02-12', '2026-02-13', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20',
    '2026-02-27', '2026-04-03', '2026-04-06', '2026-05-01', '2026-06-19', '2026-09-25', '2026-09-28', '2026-10-09',
    '2026-10-26', '2026-12-25',
  ],
};

const validDate = (date: string) => {
  if (!DATE_PATTERN.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
};

const yearOf = (date: string) => Number(date.slice(0, 4));
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

export const taiwanTradingCalendarYears = () => Object.keys(CLOSED_DATES_BY_YEAR).map(Number).sort((a, b) => a - b);

export const taiwanTradingCalendarStatus = (date: string): TaiwanTradingCalendarStatus => {
  if (!validDate(date)) return 'invalid';
  const closedDates = CLOSED_DATES_BY_YEAR[yearOf(date)];
  if (!closedDates) return 'unavailable';
  return weekday(date) === 0 || weekday(date) === 6 || closedDates.includes(date) ? 'closed' : 'trading';
};

export const addTaiwanCalendarDays = (date: string, amount: number) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
};

/** Returns the latest confirmed market trading date at or before the supplied Taipei calendar date. */
export const latestTaiwanTradingDate = (date: string) => {
  if (!validDate(date)) return null;
  let candidate = date;
  for (let remaining = 0; remaining < 16; remaining += 1) {
    const status = taiwanTradingCalendarStatus(candidate);
    if (status === 'trading') return candidate;
    if (status === 'unavailable' || status === 'invalid') return null;
    candidate = addTaiwanCalendarDays(candidate, -1);
  }
  return null;
};
