const CANONICAL_TIME_ZONE = 'Asia/Taipei';

export type CalendarDayInput = Date | number | string;

/** Validates a persisted Asia/Taipei canonical calendar-day without consulting runtime TZ. */
export function isCanonicalCalendarDay(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Returns the canonical YYYY-MM-DD in Asia/Taipei, independent of runtime TZ. */
export function canonicalCalendarDay(input: CalendarDayInput = new Date()): string {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid calendar-day input');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CANONICAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** Shifts an already canonical YYYY-MM-DD day without using the runtime timezone. */
export function shiftCanonicalCalendarDay(day: string, amount: number): string {
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match || !isCanonicalCalendarDay(day) || !Number.isInteger(amount)) throw new RangeError('Invalid canonical calendar-day shift');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const dayOfMonth = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth + amount));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Selects the final occurrence for each date and sorts the resulting date keys.
 * This is a deterministic last-occurrence contract, not timestamp-latest semantics.
 */
export function selectLastOccurrenceByDate<T extends { date: string }>(rows: readonly T[]): T[] {
  const byDate = new Map<string, T>();
  rows.forEach(row => byDate.set(row.date, row));
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}
