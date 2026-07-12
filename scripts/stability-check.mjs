import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const simulator = readFileSync(new URL('../src/pages/AllocationSimulatorPage.tsx', import.meta.url), 'utf8');
const riskMetrics = readFileSync(new URL('../src/lib/riskMetrics.ts', import.meta.url), 'utf8');
const riskCenter = readFileSync(new URL('../src/pages/RiskCenterPage.tsx', import.meta.url), 'utf8');
const wealth = readFileSync(new URL('../src/lib/wealthGoal.ts', import.meta.url), 'utf8');

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
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}

if (failed.length) {
  process.exitCode = 1;
}
