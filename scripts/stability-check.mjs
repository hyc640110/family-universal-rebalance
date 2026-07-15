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
const investmentPerformanceHistory = readFileSync(new URL('../src/lib/investmentPerformanceHistory.ts', import.meta.url), 'utf8');
const cashFlow = readFileSync(new URL('../src/lib/cashFlow.ts', import.meta.url), 'utf8');
const cashFlowPage = readFileSync(new URL('../src/pages/CashFlowPage.tsx', import.meta.url), 'utf8');
const netWorthHistory = readFileSync(new URL('../src/lib/netWorthHistory.ts', import.meta.url), 'utf8');
const netWorthHistoryPage = readFileSync(new URL('../src/pages/NetWorthHistoryPage.tsx', import.meta.url), 'utf8');
const toolQuickNavigation = readFileSync(new URL('../src/components/ToolQuickNavigation.tsx', import.meta.url), 'utf8');
const toolNavigation = readFileSync(new URL('../src/lib/toolNavigation.ts', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../src/pages/DashboardDecisionPage.tsx', import.meta.url), 'utf8');

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
  ,['Build metadata is injected or explicitly unavailable instead of using a stale release date', /APP_BUILD_TIME = import\.meta\.env\.VITE_BUILD_TIME \|\| 'unavailable'/.test(readFileSync(new URL('../src/constants/appInfo.ts', import.meta.url), 'utf8'))]
  ,['Performance analytics uses centralized typed calculations', /export function calculateAssetCost/.test(performanceMetrics) && /export function calculatePortfolioPerformance/.test(performanceMetrics) && /export function calculatePortfolioConcentration/.test(performanceMetrics)]
  ,['Performance calculations exclude zero-share assets and guard invalid values', /filter\(asset => finite\(asset\.shares\) > 0\)/.test(performanceMetrics) && /Number\.isFinite/.test(performanceMetrics) && /safeRatio/.test(performanceMetrics)]
  ,['Performance return rates safely handle zero cost', /returnRate: safeRatio\(unrealizedPnl, cost\)/.test(performanceMetrics) && /denominator > 0/.test(performanceMetrics)]
  ,['Performance page includes current holdings, history, rankings, contributions and concentration', /目前持股績效/.test(performancePage) && /資產變化與回撤/.test(performancePage) && /資產報酬排名/.test(performancePage) && /報酬貢獻/.test(performancePage) && /報酬集中度/.test(performancePage)]
  ,['Performance rankings support required sort modes', /contribution/.test(performancePage) && /return-rate/.test(performancePage) && /loss/.test(performancePage) && /market-value/.test(performancePage)]
  ,['Performance page clearly handles unavailable prior-day data', /今日報酬率以「—」呈現/.test(performancePage)]
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
  ,['Tool pages share one quick navigation component', /ToolQuickNavigation/.test(simulator) && /ToolQuickNavigation/.test(riskCenter) && /ToolQuickNavigation/.test(wealthPage) && /ToolQuickNavigation/.test(cashFlowPage) && /ToolQuickNavigation/.test(netWorthHistoryPage)]
  ,['Tool quick navigation excludes the current page and uses SPA links', /getToolQuickLinks\(current\)/.test(toolQuickNavigation) && /<Link to="\/tools"/.test(toolQuickNavigation) && !/location\.href/.test(toolQuickNavigation)]
  ,['Tool quick navigation follows the shared Tool Center order', /TOOL_DEFINITIONS[\s\S]*dividend-center[\s\S]*ai-decision[\s\S]*portfolio-risk[\s\S]*rebalance-recommendation[\s\S]*clec-strategy[\s\S]*wealth-goal[\s\S]*cash-flow[\s\S]*net-worth-history[\s\S]*allocation-simulator[\s\S]*risk-center/.test(toolNavigation)]
  ,['Allocation contribution uses wan display with yuan calculation', /模擬投入金額（萬元）/.test(simulator) && /Math\.max\(0, safeNumber\(contribution\)\) \* 10000/.test(simulator) && /min="0"/.test(simulator)]
  ,['Display mode uses one persisted UI state and resets compact sections', /writeUiState\(uiState\)/.test(app) && /displayMode === 'full' \? FULL_UI_SECTIONS : DEFAULT_UI_STATE\.sections/.test(app) && /document\.documentElement\.dataset\.displayMode/.test(app)]
  ,['Compact and full modes have distinct user-facing descriptions', /只顯示核心資訊，適合日常快速查看。/.test(app) && /顯示完整分析、進階欄位與說明。/.test(app)]
  ,['Display mode only controls collapsible defaults without hiding functionality', /JSON\.stringify\(\{ displayMode: state\.displayMode \}\)/.test(app) && !/data-display-mode="compact"/.test(styles) && /quoteSources: false[\s\S]*syncStatus: false[\s\S]*syncDiagnostics: false[\s\S]*targetCheck: false/.test(app) && /quoteSources: true[\s\S]*syncStatus: true[\s\S]*syncDiagnostics: true[\s\S]*targetCheck: true/.test(app)]
  ,['Settings details reuse SectionCard and surface target errors', /id="quote-sources-section"[\s\S]*SectionCard/.test(app) && /id="sync-status-section"[\s\S]*SectionCard/.test(app) && /id="sync-diagnostics-section"[\s\S]*SectionCard/.test(app) && /id="target-check-section"[\s\S]*targetCheckHasError/.test(app) && /setUiState\(current => current\.sections\.targetCheck/.test(app)]
  ,['Dashboard uses existing quote, risk and history sources without inventing finance data', /deriveHistoryStats/.test(app) && /deriveInvestmentDashboard/.test(app) && /今日投資摘要/.test(dashboard) && /投資健康度/.test(dashboard) && /重要提醒/.test(dashboard) && /net-worth-history/.test(dashboard) && /tools\/risk-center/.test(dashboard)]
  ,['Dashboard decisions use the required priority labels and SPA links', /需要優先處理風險[\s\S]*建議再平衡[\s\S]*建議加碼/.test(homeDecision) && /<Link/.test(dashboard) && !/location\.href|window\.location/.test(dashboard)]
  ,['Performance center separates current holdings from historical asset changes', /目前持股未實現損益/.test(performancePage) && /不是已排除現金流的投資報酬/.test(performancePage) && /deriveInvestmentPerformanceStats/.test(performancePage) && /deriveInvestmentPerformanceQuality/.test(investmentPerformanceHistory)]
  ,['Account and transaction sections use independent persisted toggle keys', /id="accounts-section"[\s\S]*sectionOpen\('cash'\)[\s\S]*toggleSection\('cash'\)/.test(app) && /id="transactions-section"[\s\S]*sectionOpen\('transactions'\)[\s\S]*toggleSection\('transactions'\)/.test(app) && /transactions: false/.test(app) && /transactions: true/.test(app)]
  ,['Transaction exclusion checkbox uses a clickable label and normal checkbox styling', /className="exclude-statistics"[\s\S]*type="checkbox"[\s\S]*排除統計[\s\S]*不列入收支統計與衍生餘額/.test(app) && /\.financial-account-fields \.exclude-statistics input\[type="checkbox"\]/.test(styles)]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}

if (failed.length) {
  process.exitCode = 1;
}
