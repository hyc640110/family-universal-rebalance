import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { canonicalCalendarDay, selectLastOccurrenceByDate, shiftCanonicalCalendarDay } from '../src/lib/calendarDay';
import { historyForRange, localSnapshotDate, type NetWorthSnapshot } from '../src/lib/netWorthHistory';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const snapshot = (date: string, netWorth: number): NetWorthSnapshot => ({
  date,
  totalAssets: netWorth,
  netWorth,
  investmentValue: netWorth,
  cash: 0,
  debt: 0
});

function calendarDayInTimeZone(timestamp: string, timeZone: string) {
  const code = "import { canonicalCalendarDay } from './src/lib/calendarDay.ts'; console.log(canonicalCalendarDay(new Date(process.argv[1])));";
  return execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', code, timestamp], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, TZ: timeZone }
  }).trim();
}

test('canonical calendar day uses Asia/Taipei across UTC midnight boundaries', () => {
  assert.equal(canonicalCalendarDay('2026-01-01T07:59:00.000Z'), '2026-01-01');
  assert.equal(canonicalCalendarDay('2026-01-01T15:59:00.000Z'), '2026-01-01');
  assert.equal(canonicalCalendarDay('2026-01-01T16:00:00.000Z'), '2026-01-02');
  assert.equal(canonicalCalendarDay(0), '1970-01-01');
});

test('canonical calendar day is stable under UTC, Taipei, and New York runtimes', () => {
  const timestamp = '2025-12-31T16:30:00.000Z';
  const results = ['UTC', 'Asia/Taipei', 'America/New_York'].map(timeZone => calendarDayInTimeZone(timestamp, timeZone));
  assert.deepEqual(results, ['2026-01-01', '2026-01-01', '2026-01-01']);
});

test('snapshot producer compatibility entry delegates to the canonical calendar day', () => {
  const timestamp = new Date('2026-01-01T16:00:00.000Z');
  assert.equal(localSnapshotDate(timestamp), canonicalCalendarDay(timestamp));
  assert.equal(localSnapshotDate(timestamp), '2026-01-02');
});

test('same-day selector keeps the final occurrence and explicitly does not use timestamp semantics', () => {
  const first = snapshot('2026-07-01', 100);
  const second = snapshot('2026-07-01', 200);
  const third = snapshot('2026-07-01', 300);
  assert.deepEqual(selectLastOccurrenceByDate([first, second, third]), [third]);
  assert.deepEqual(selectLastOccurrenceByDate([third, second, first]), [first]);
});

test('same-day selector preserves distinct dates and existing date strings', () => {
  const rows = [snapshot('2026-07-02', 200), snapshot('2026-07-01', 100), snapshot('2026-07-02', 220)];
  assert.deepEqual(selectLastOccurrenceByDate(rows).map(row => [row.date, row.netWorth]), [['2026-07-01', 100], ['2026-07-02', 220]]);
});

test('canonical day shifts stay independent of runtime timezone', () => {
  assert.equal(shiftCanonicalCalendarDay('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftCanonicalCalendarDay('2026-02-28', 1), '2026-03-01');
  assert.equal(shiftCanonicalCalendarDay('2026-12-31', 1), '2027-01-01');
});

test('App snapshot producer uses the compatibility entry backed by the canonical helper', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /netWorthSnapshotFromTotals\(\{/);
  assert.match(app, /upsertNetWorthSnapshot\(current\.netWorthHistory, currentNetWorthSnapshot\)/);
  assert.match(readFileSync(new URL('../src/lib/netWorthHistory.ts', import.meta.url), 'utf8'), /localSnapshotDate\(date = new Date\(\)\): string \{ return canonicalCalendarDay\(date\); \}/);
});

test('net-worth history ranges use the canonical Taipei day at the UTC boundary', () => {
  const rows = [snapshot('2026-01-01', 100), snapshot('2026-01-02', 110), snapshot('2026-01-08', 120)];
  assert.deepEqual(historyForRange(rows, '7d', new Date('2026-01-08T15:59:00.000Z')).map(row => row.date), ['2026-01-02', '2026-01-08']);
  assert.deepEqual(historyForRange(rows, '7d', new Date('2026-01-08T16:00:00.000Z')).map(row => row.date), ['2026-01-08']);
});
