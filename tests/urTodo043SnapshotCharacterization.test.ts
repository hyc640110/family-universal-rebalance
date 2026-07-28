import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildDailyAssetChanges } from '../src/lib/dailyAssetChangeCalendar';
import { deriveAiDecisions, type AiDecisionInput } from '../src/lib/aiDecision';
import { deriveInvestmentPerformanceStats, normalizeInvestmentPerformanceHistory } from '../src/lib/investmentPerformanceHistory';
import { normalizeNetWorthHistory, type NetWorthSnapshot } from '../src/lib/netWorthHistory';
import { calculatePortfolioPerformance } from '../src/lib/performanceMetrics';
import { canonicalSyncPayload } from '../src/lib/syncState';

// Characterization only: these assertions preserve observed behavior for UR-TODO-043-A.
// They do not declare the current local-timezone or numeric-coercion behavior as the desired contract.
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const fields = ['totalAssets', 'netWorth', 'investmentValue', 'cash', 'debt'] as const;
const snapshot = (date: string, values: Partial<Omit<NetWorthSnapshot, 'date'>> = {}): NetWorthSnapshot => ({
  date,
  totalAssets: 100,
  netWorth: 100,
  investmentValue: 100,
  cash: 0,
  debt: 0,
  ...values
});

function localDateInTimeZone(timestamp: string, timeZone: string) {
  const code = "import { localSnapshotDate } from './src/lib/netWorthHistory.ts'; console.log(localSnapshotDate(new Date(process.argv[1])));";
  return execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', code, timestamp], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, TZ: timeZone }
  }).trim();
}

function decisionInput(history: NetWorthSnapshot[]): AiDecisionInput {
  const stats = deriveInvestmentPerformanceStats(history, 'investmentValue');
  return {
    today: '2026-01-03',
    dashboard: { investmentValue: 100, dayPnl: 0, dayPnlRate: 0, cashRatio: 0, quoteStatus: '報價正常', holdingsCount: 1 },
    risk: { overallLevel: 0, cash: 0, cashRatio: 0, cashSafetyMonths: null, largestHoldingRatio: 0, topTwoRatio: 0, topThreeRatio: 0, leveragedAssets: [], leveragedValue: 0, leveragedRatio: 0, leveragedGrowthRatio: 0 },
    performance: { stats, canCalculateMaxDrawdown: history.length >= 2, snapshotCount: history.length },
    dividend: { summary: { yearAmount: 0, monthAmount: 0, totalAmount: 0, yearCount: 0, latest: null }, sources: [] },
    market: { fetchedAt: '', status: 'unavailable', items: [] },
    quoteStatuses: ['today'],
    quoteErrors: 0,
    backupQuoteCount: 0,
    targetOverLimit: false,
    holdingMarketValue: 100,
    liquidity: { dataCompleteness: 'complete', safetyCashShortfall: 0, investableCash: 0, protectedSafetyCash: 0 },
    todayConclusion: '保留現金'
  };
}

test('current behavior: local snapshot date follows the executing browser timezone for the same UTC instant', () => {
  const timestamp = '2025-12-31T16:30:00.000Z';
  assert.equal(localDateInTimeZone(timestamp, 'Asia/Taipei'), '2026-01-01');
  assert.equal(localDateInTimeZone(timestamp, 'UTC'), '2025-12-31');
  assert.equal(localDateInTimeZone(timestamp, 'America/Los_Angeles'), '2025-12-31');
});

test('known risk: Taiwan midnight and calendar boundaries are derived from local timezone rather than an explicit Taiwan contract', () => {
  assert.equal(localDateInTimeZone('2025-12-31T15:59:00.000Z', 'Asia/Taipei'), '2025-12-31');
  assert.equal(localDateInTimeZone('2025-12-31T16:00:00.000Z', 'Asia/Taipei'), '2026-01-01');
  assert.equal(localDateInTimeZone('2025-12-31T16:01:00.000Z', 'Asia/Taipei'), '2026-01-01');
  assert.equal(localDateInTimeZone('2026-06-30T15:59:00.000Z', 'Asia/Taipei'), '2026-06-30');
  assert.equal(localDateInTimeZone('2026-06-30T16:00:00.000Z', 'Asia/Taipei'), '2026-07-01');
});

test('current behavior: same-day snapshots use the final array occurrence, not a timestamp', () => {
  const first = snapshot('2026-07-01', { netWorth: 100 });
  const second = snapshot('2026-07-01', { netWorth: 200 });
  const third = snapshot('2026-07-01', { netWorth: 300 });
  assert.equal(normalizeNetWorthHistory([first, second, third])[0].netWorth, 300);
  assert.equal(normalizeInvestmentPerformanceHistory([first, second, third])[0].netWorth, 300);
  assert.equal(normalizeNetWorthHistory([third, second, first])[0].netWorth, 100);
  assert.equal(normalizeInvestmentPerformanceHistory([third, second, first])[0].netWorth, 100);
});

test('current behavior: local JSON, Firebase canonical payload, and Backup-style JSON retain duplicate snapshot array order before normalization', () => {
  const duplicateDates = [snapshot('2026-07-01', { netWorth: 100 }), snapshot('2026-07-01', { netWorth: 200 })];
  const localStorageRoundTrip = JSON.parse(JSON.stringify(duplicateDates));
  const firebaseRoundTrip = canonicalSyncPayload({ netWorthHistory: duplicateDates }).netWorthHistory;
  const backupRoundTrip = JSON.parse(JSON.stringify({ netWorthHistory: duplicateDates })).netWorthHistory;
  for (const raw of [localStorageRoundTrip, firebaseRoundTrip, backupRoundTrip]) {
    assert.equal(normalizeNetWorthHistory(raw)[0].netWorth, 200);
    assert.equal(normalizeInvestmentPerformanceHistory(raw)[0].netWorth, 200);
  }
});

test('current behavior: daily calendar compares the immediately previous valid snapshot across missing days, weekends, months, and years', () => {
  const changes = buildDailyAssetChanges([
    snapshot('2025-12-31', { netWorth: 100 }),
    snapshot('2026-01-05', { netWorth: 120 }),
    snapshot('2026-01-11', { netWorth: 150 }),
    snapshot('2026-02-02', { netWorth: 130 })
  ], 'netWorth');
  assert.deepEqual(changes.map(row => [row.date, row.previousDate, row.change]), [
    ['2025-12-31', null, null],
    ['2026-01-05', '2025-12-31', 20],
    ['2026-01-11', '2026-01-05', 30],
    ['2026-02-02', '2026-01-11', -20]
  ]);
  assert.equal(changes.length, 4);
});

test('current behavior: a weekend or closed-market snapshot is compared when it exists and no dates are interpolated', () => {
  const changes = buildDailyAssetChanges([
    snapshot('2026-07-03', { netWorth: 100 }),
    snapshot('2026-07-05', { netWorth: 125 }),
    snapshot('2026-07-06', { netWorth: 130 })
  ], 'netWorth');
  assert.deepEqual(changes.map(row => [row.date, row.previousDate, row.change]), [
    ['2026-07-03', null, null],
    ['2026-07-05', '2026-07-03', 25],
    ['2026-07-06', '2026-07-05', 5]
  ]);
});

test('known risk: every non-finite or non-numeric snapshot field becomes zero in net-worth normalization but invalidates the analytics snapshot', () => {
  const invalidValues: unknown[] = [undefined, null, '', 'not-a-number', Number.NaN, Infinity, -Infinity];
  for (const field of fields) {
    for (const invalid of invalidValues) {
      const raw = { ...snapshot('2026-07-01'), [field]: invalid };
      assert.equal(normalizeNetWorthHistory([raw])[0][field], 0, `${field}=${String(invalid)}`);
      assert.deepEqual(normalizeInvestmentPerformanceHistory([raw]), [], `${field}=${String(invalid)}`);
    }
  }
});

test('known risk: the same invalid input produces a zero-valued Dashboard history summary while Analytics excludes it', () => {
  const raw = [snapshot('2026-07-01', { netWorth: 100 }), { ...snapshot('2026-07-02', { netWorth: 200 }), cash: Infinity }];
  const dashboardHistory = normalizeNetWorthHistory(raw);
  const analyticsHistory = normalizeInvestmentPerformanceHistory(raw);
  assert.deepEqual(dashboardHistory.map(row => [row.date, row.netWorth, row.cash]), [['2026-07-01', 100, 0], ['2026-07-02', 200, 0]]);
  assert.deepEqual(analyticsHistory, [snapshot('2026-07-01', { netWorth: 100 })]);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /const historySummary = useMemo\(\(\) => deriveHistoryStats\(netWorthHistory\)/);
  assert.match(app, /monthChange: historySummary\.monthChange, yearChange: historySummary\.yearChange/);
});

test('current behavior: aggregate cash, debt, external funding, planned withdrawal, and import correction provenance is not stored in a snapshot', () => {
  const base = snapshot('2026-07-01', { totalAssets: 100, netWorth: 50, investmentValue: 100, cash: 0, debt: 50 });
  const cashIncrease = snapshot('2026-07-02', { totalAssets: 150, netWorth: 100, investmentValue: 100, cash: 50, debt: 50 });
  const debtDecrease = snapshot('2026-07-03', { totalAssets: 150, netWorth: 130, investmentValue: 100, cash: 50, debt: 20 });
  const netWorthChanges = buildDailyAssetChanges([base, cashIncrease, debtDecrease], 'netWorth');
  const investmentChanges = buildDailyAssetChanges([base, cashIncrease, debtDecrease], 'investmentValue');
  assert.deepEqual(netWorthChanges.map(row => row.change), [null, 50, 30]);
  assert.deepEqual(investmentChanges.map(row => row.change), [null, 0, 0]);
  assert.deepEqual(Object.keys(cashIncrease).sort(), ['cash', 'date', 'debt', 'investmentValue', 'netWorth', 'totalAssets']);
  assert.deepEqual(buildDailyAssetChanges([base, cashIncrease], 'netWorth'), buildDailyAssetChanges([base, { ...cashIncrease }], 'netWorth'));
});

test('current behavior: historical investment snapshot changes can alter AI drawdown, while current holding performance is calculated independently', () => {
  const history = [snapshot('2026-07-01', { investmentValue: 100 }), snapshot('2026-07-02', { investmentValue: 200 }), snapshot('2026-07-03', { investmentValue: 100 })];
  const drawdown = deriveAiDecisions(decisionInput(history)).find(item => item.id === 'drawdown')!;
  assert.match(drawdown.conclusion, /-50\.0%/);
  const performance = calculatePortfolioPerformance([{ symbol: 'TEST', name: '測試', shares: 1, avgCost: 100, marketValue: 100, cost: 100, pnl: 0, dayPnl: 0, previousClose: 100 }]);
  assert.equal(performance.unrealizedPnl, 0);
  assert.equal(performance.returnRate, 0);
});

test('current behavior: App passes history into Dashboard and AI drawdown consumers, while rebalance does not accept netWorthHistory', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /const investmentStats = useMemo\(\(\) => deriveInvestmentPerformanceStats\(netWorthHistory, 'investmentValue'\)/);
  assert.match(app, /performance: \{ stats: investmentStats, canCalculateMaxDrawdown: performanceQuality\.canCalculateMaxDrawdown, snapshotCount: performanceQuality\.snapshotCount \}/);
  const rebalanceStart = app.indexOf('function rebalance');
  const rebalanceSource = app.slice(rebalanceStart, app.indexOf('\nfunction ', rebalanceStart + 1));
  assert.match(rebalanceSource, /function rebalance\(state: AppState, quotes: Record<SymbolCode, Quote>\)/);
  assert.doesNotMatch(rebalanceSource, /netWorthHistory/);
});
