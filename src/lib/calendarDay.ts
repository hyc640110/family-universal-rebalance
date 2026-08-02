const CANONICAL_TIME_ZONE = 'Asia/Taipei';

export type CalendarDayInput = Date | number | string;

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

/**
 * Selects the final occurrence for each date and sorts the resulting date keys.
 * This is a deterministic last-occurrence contract, not timestamp-latest semantics.
 */
export function selectLastOccurrenceByDate<T extends { date: string }>(rows: readonly T[]): T[] {
  const byDate = new Map<string, T>();
  rows.forEach(row => byDate.set(row.date, row));
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}
