import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCalendarMonth, buildDailyAssetChanges, latestSnapshotMonth, shiftMonth, summarizeCalendarMonth } from '../src/lib/dailyAssetChangeCalendar';
import type { NetWorthSnapshot } from '../src/lib/netWorthHistory';
import { readFileSync } from 'node:fs';

const snapshot = (date: string, netWorth: number, investmentValue = netWorth): NetWorthSnapshot => ({ date, totalAssets: netWorth, netWorth, investmentValue, cash: 0, debt: 0 });

test('sorts dates, rejects impossible dates and keeps the final same-day snapshot', () => {
  const rows = buildDailyAssetChanges([
    snapshot('2026-07-03', 300),
    snapshot('2026-02-30', 999),
    snapshot('bad-date', 999),
    snapshot('2026-07-01', 100),
    snapshot('2026-07-03', 350)
  ], 'netWorth');
  assert.deepEqual(rows.map(row => [row.date, row.value]), [['2026-07-01', 100], ['2026-07-03', 350]]);
});

test('excludes non-finite snapshots and switches between net worth and investment assets', () => {
  const raw = [snapshot('2026-07-01', 100, 60), snapshot('2026-07-02', 120, 90), { ...snapshot('2026-07-03', 130), cash: Number.NaN }];
  assert.equal(buildDailyAssetChanges(raw, 'netWorth')[1].change, 20);
  assert.equal(buildDailyAssetChanges(raw, 'investmentValue')[1].change, 30);
  assert.equal(buildDailyAssetChanges(raw, 'netWorth').length, 2);
});

test('first snapshot has no comparison and adjacent snapshots support positive, negative and zero changes', () => {
  const rows = buildDailyAssetChanges([snapshot('2026-07-01', 100), snapshot('2026-07-02', 120), snapshot('2026-07-03', 90), snapshot('2026-07-04', 90)], 'netWorth');
  assert.deepEqual(rows.map(row => [row.change, row.hasComparison]), [[null, false], [20, true], [-30, true], [0, true]]);
  assert.ok(Math.abs(rows[1].changeRate! - 0.2) < Number.EPSILON);
  assert.equal(rows[2].changeRate, -0.25);
  assert.equal(rows[3].changeRate, 0);
});

test('keeps amount change but omits percentage when previous value is zero or negative', () => {
  const zero = buildDailyAssetChanges([snapshot('2026-07-01', 0), snapshot('2026-07-02', 10)], 'netWorth')[1];
  const negative = buildDailyAssetChanges([snapshot('2026-07-01', -5), snapshot('2026-07-02', 10)], 'netWorth')[1];
  assert.deepEqual([zero.change, zero.changeRate], [10, null]);
  assert.deepEqual([negative.change, negative.changeRate], [15, null]);
});

test('does not interpolate missing dates and compares across month boundaries', () => {
  const raw = [snapshot('2026-01-31', 100), snapshot('2026-02-02', 110)];
  const month = buildCalendarMonth(raw, 'netWorth', '2026-02');
  assert.equal(month.days[0].change, null);
  assert.equal(month.days[1].change?.previousDate, '2026-01-31');
  assert.equal(month.days[1].change?.change, 10);
});

test('builds empty months, correct month lengths and weekday starting positions', () => {
  assert.equal(buildCalendarMonth([], 'netWorth', '2024-02').days.length, 29);
  assert.equal(buildCalendarMonth([], 'netWorth', '2026-04').days.length, 30);
  assert.equal(buildCalendarMonth([], 'netWorth', '2026-07').days.length, 31);
  assert.equal(buildCalendarMonth([], 'netWorth', '2026-07').leadingBlankCount, 3);
  assert.equal(buildCalendarMonth([], 'netWorth', '2026-07').days.every(day => day.change === null), true);
});

test('switches months and selects latest snapshot month with current-month fallback', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(latestSnapshotMonth([snapshot('2026-04-01', 1), snapshot('2026-07-01', 2)], '2025-01'), '2026-07');
  assert.equal(latestSnapshotMonth([], '2025-01'), '2025-01');
});

test('summarizes first-to-last monthly change and omits it with fewer than two snapshots', () => {
  const summary = summarizeCalendarMonth(buildCalendarMonth([snapshot('2026-07-01', 100), snapshot('2026-07-03', 120), snapshot('2026-07-05', 90)], 'netWorth', '2026-07'));
  assert.equal(summary.monthChange, -10);
  assert.equal(summary.comparableDayCount, 2);
  assert.equal(summary.positiveDayCount, 1);
  assert.equal(summary.negativeDayCount, 1);
  assert.equal(summarizeCalendarMonth(buildCalendarMonth([snapshot('2026-07-01', 100)], 'netWorth', '2026-07')).monthChange, null);
});

test('calendar UI exposes month, mode and selectable date detail controls', () => {
  const source = readFileSync(new URL('../src/components/DailyAssetChangeCalendar.tsx', import.meta.url), 'utf8');
  assert.match(source, /aria-label="上一個月"/);
  assert.match(source, /aria-label="下一個月"/);
  assert.match(source, /淨資產變動/);
  assert.match(source, /投資資產變動/);
  assert.match(source, /setSelectedDate\(day\.date\)/);
  assert.match(source, /前一筆快照日期/);
  assert.match(source, /不等同純投資損益/);
});

test('calendar CSS keeps seven columns inside a 390px viewport and mobile cells prioritize percentage', () => {
  const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(styles, /daily-calendar-weekdays[^}]*grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
  assert.match(styles, /daily-calendar-grid[^}]*grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media \(max-width:640px\)[\s\S]*daily-calendar-day small\{display:none\}/);
});
