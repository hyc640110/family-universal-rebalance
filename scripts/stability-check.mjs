import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const simulator = readFileSync(new URL('../src/pages/AllocationSimulatorPage.tsx', import.meta.url), 'utf8');
const riskMetrics = readFileSync(new URL('../src/lib/riskMetrics.ts', import.meta.url), 'utf8');
const riskCenter = readFileSync(new URL('../src/pages/RiskCenterPage.tsx', import.meta.url), 'utf8');
const wealth = readFileSync(new URL('../src/lib/wealthGoal.ts', import.meta.url), 'utf8');
const wealthPage = readFileSync(new URL('../src/pages/WealthGoalPage.tsx', import.meta.url), 'utf8');
const homeDecision = readFileSync(new URL('../src/lib/homeDecision.ts', import.meta.url), 'utf8');
const performanceMetrics = readFileSync(new URL('../src/lib/performanceMetrics.ts', import.meta.url), 'utf8');
const performancePage = readFileSync(new URL('../src/pages/PerformanceAnalyticsPage.tsx', import.meta.url), 'utf8');
const cashFlow = readFileSync(new URL('../src/lib/cashFlow.ts', import.meta.url), 'utf8');
const cashFlowPage = readFileSync(new URL('../src/pages/CashFlowPage.tsx', import.meta.url), 'utf8');
const netWorthHistory = readFileSync(new URL('../src/lib/netWorthHistory.ts', import.meta.url), 'utf8');
const netWorthHistoryPage = readFileSync(new URL('../src/pages/NetWorthHistoryPage.tsx', import.meta.url), 'utf8');

const checks = [
  ['Holding persists name', /type Holding = \{[^}]*name\?: string/.test(app)],
  ['Quote parser reads dynamic names', /quoteNameFields/.test(app) && /parseWorkerQuote\(symbol: SymbolCode, data: unknown, holding\?: Holding\)/.test(app)],
  ['Quote refresh writes names to holdings only on changes', /hasNameChange/.test(app) && /return name && name !== h\.name \? \{ \.\.\.h, name \} : h/.test(app)],
  ['Backup import can recover names from quotes', /const quoteNames = r\.quotes/.test(app) && /resolveSymbolName\(symbol, holding\?\.name, quote\?\.name\)/.test(app)],
  ['Deviation has a single rendered text source', /const rebalanceDeviationText = rb\.deviationText/.test(app) && /summary=\{`\$\{rb\.thresholdStatus\}｜偏離 \$\{rebalanceDeviationText\}`\}/.test(app)],
  ['Deviation formula is currentGrowthWeight minus growthTargetPercent', /const currentGrowthWeight = stockWeight/.test(app) && /const growthTargetPercent = m\.growthTargetPct/.test(app) && /const deviation = stockWeight - m\.growthTargetPct/.test(app)],
  ['Compact and full modes reset their section presets', /const FULL_UI_SECTIONS/.test(app) && /applyDisplayMode\('compact'\)/.test(app) && /applyDisplayMode\('full'\)/.test(app)],
  ['Full mode sections remain manually collapsible', /const defaultSectionsForMode = uiState\.displayMode === 'full' \? FULL_UI_SECTIONS : DEFAULT_UI_STATE\.sections/.test(app)],
  ['Allocation simulator uses an independent route', /isAllocationSimulator = routeLocation\.pathname === '\/tools\/allocation-simulator'/.test(app)],
  ['Allocation simulator is read-only session state', /useState\('0'\)/.test(simulator) && !/localStorage\.setItem|writeState\(|uploadFirebase\(|downloadFirebase\(/.test(simulator)],
  ['Allocation simulator blocks trade preview until targets total 100 percent', /const isExact = Math\.abs\(targetTotal - 100\)/.test(simulator) && /!result\.isExact/.test(simulator)],
  ['Allocation simulator handles missing current prices', /缺少有效股價/.test(simulator) && /hasValidPrice/.test(simulator)],
  ['Risk center uses a centralized pure calculation helper', /export function deriveRiskMetrics/.test(riskMetrics) && /isLeveragedAsset/.test(riskMetrics)],
  ['Risk center uses an independent route and read-only analysis', /isRiskCenter = routeLocation\.pathname === '\/tools\/risk-center'/.test(app) && !/localStorage\.setItem|writeState\(|uploadFirebase\(|downloadFirebase\(/.test(riskCenter)],
  ['Risk metrics avoid unsafe no-loan values', /monthlyPayment > 0 \? cash \/ monthlyPayment : null/.test(riskMetrics) && /目前無借款月付壓力/.test(riskCenter)]
  ,['Wealth goal has normalized defaults and monthly compound projection', /normalizeWealthGoalSettings/.test(wealth) && /Math\.pow\(1 \+ s\.annualReturnRate \/ 100, 1 \/ 12\) - 1/.test(wealth) && /month <= 1200/.test(wealth)]
  ,['Wealth goal target input uses ten-thousand-yuan display while state stays in yuan', /目標資產（萬元）/.test(wealthPage) && /draft\.targetAmount \/ 10000/.test(wealthPage) && /Number\(value\)\*10000/.test(wealthPage)]
  ,['Dashboard decision uses a centralized priority helper', /deriveHomeDecision/.test(homeDecision)]
  ,['Event values are captured before React state updater callbacks', /const rawValue=e\.currentTarget\.value;const value=rawValue/.test(wealthPage) && !/setDraft\(d=>\(\{\.\.\.d,\[key\]:e\.currentTarget/.test(wealthPage) && !/setState\(s => \(\{ \.\.\.s, rebalanceMode: normalizeRebalanceMode\(e\.target/.test(app)]
  ,['Build metadata derives from the displayed app version', /APP_BUILD_TIME = `\$\{APP_VERSION\}/.test(readFileSync(new URL('../src/constants/appInfo.ts', import.meta.url), 'utf8'))]
  ,['Performance analytics uses centralized typed calculations', /export function calculateAssetCost/.test(performanceMetrics) && /export function calculatePortfolioPerformance/.test(performanceMetrics) && /export function calculatePortfolioConcentration/.test(performanceMetrics)]
  ,['Performance calculations exclude zero-share assets and guard invalid values', /filter\(asset => finite\(asset\.shares\) > 0\)/.test(performanceMetrics) && /Number\.isFinite/.test(performanceMetrics) && /safeRatio/.test(performanceMetrics)]
  ,['Performance return rates safely handle zero cost', /returnRate: safeRatio\(unrealizedPnl, cost\)/.test(performanceMetrics) && /denominator > 0/.test(performanceMetrics)]
  ,['Performance page includes overview, rankings, contributions and concentration', /績效總覽/.test(performancePage) && /資產報酬排名/.test(performancePage) && /報酬貢獻/.test(performancePage) && /報酬集中度/.test(performancePage)]
  ,['Performance rankings support required sort modes', /contribution/.test(performancePage) && /return-rate/.test(performancePage) && /loss/.test(performancePage) && /market-value/.test(performancePage)]
  ,['Performance page clearly handles unavailable prior-day data', /今日報酬率暫以「—」呈現/.test(performancePage)]
  ,['Performance UI state remains session-only', !/localStorage\.setItem|writeState\(|uploadFirebase\(|downloadFirebase\(/.test(performancePage)]
  ,['Analytics defaults to performance and retains a risk tab', /useState<'performance' \| 'risk'>\('performance'\)/.test(app) && /analyticsView === 'risk'/.test(app)]
  ,['Cash flow profile is optional and normalized safely', /cashFlowProfile\?: CashFlowProfile/.test(app) && /r\.cashFlowProfile === undefined \? undefined : normalizeCashFlowProfile/.test(app)]
  ,['Backup and manual Firebase payload keep cash flow compatible', /cashFlowProfile: normalized\.cashFlowProfile/.test(app) && /r\.cashFlowProfile === undefined \? \{\} : \{ cashFlowProfile: r\.cashFlowProfile \}/.test(app)]
  ,['Cash flow uses centralized safe formulas', /export function calculateFixedExpenses/.test(cashFlow) && /export function calculateEmergencyFundTarget/.test(cashFlow) && /export function classifyCashFlowStatus/.test(cashFlow) && /safeRatio/.test(cashFlow) === false]
  ,['Cash flow input events capture primitive values synchronously', /const rawValue=event\.currentTarget\.value/.test(cashFlowPage) && /const checked=event\.currentTarget\.checked/.test(cashFlowPage)]
  ,['Cash flow page includes overview, expenses, reserve and pressure indicators', /每月現金流總覽/.test(cashFlowPage) && /固定支出清單/.test(cashFlowPage) && /緊急預備金/.test(cashFlowPage) && /支出壓力指標/.test(cashFlowPage)]
  ,['Net worth history remains an optional backward-compatible field', /netWorthHistory\?: NetWorthSnapshot/.test(app) && /r\.netWorthHistory === undefined \? undefined : normalizeNetWorthHistory/.test(app)]
  ,['Net worth history snapshot upsert and compatibility helpers are centralized', /export function upsertNetWorthSnapshot/.test(netWorthHistory) && /export function deriveHistoryStats/.test(netWorthHistory) && /normalizeNetWorthHistory/.test(netWorthHistory)]
  ,['Net worth history page includes ranges, chart and statistics', /7 天/.test(netWorthHistoryPage) && /最大回撤/.test(netWorthHistoryPage) && /history-chart/.test(netWorthHistoryPage)]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}

if (failed.length) {
  process.exitCode = 1;
}
