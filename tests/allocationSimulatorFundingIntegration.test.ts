import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveAllocationSimulatorFunding } from '../src/lib/allocationSimulatorFunding';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('App 將 Simulator funding 限定接至 Household Liquidity 與 Cash Flow 的四項正式來源', () => {
  const app = source('src/App.tsx');

  assert.match(app, /<AllocationSimulatorPage\s+rows=\{m\.rows\}\s+totalAssets=\{m\.totalAssets\}\s+cash=\{m\.cash\}\s+fundingInput=\{\{\s+totalLiquidCash: householdLiquidityForRebalance\.totalLiquidCash,\s+protectedSafetyCash: householdLiquidityForRebalance\.protectedSafetyCash,\s+externalContribution: state\.cashFlowProfile\?\.externalContribution,\s+plannedWithdrawal: state\.cashFlowProfile\?\.plannedWithdrawal\s+\}\}/s);
  assert.doesNotMatch(app, /fundingInput=\{\{[^}]*m\.cash/);
  assert.doesNotMatch(app, /fundingInput=\{\{[^}]*investableCash/);
});

test('Simulator 安全現金假設是預設關閉的 component-local state，且只傳入既有 selector', () => {
  const page = source('src/pages/AllocationSimulatorPage.tsx');

  assert.match(page, /deriveAllocationSimulatorFunding/);
  assert.match(page, /const \[allowSafetyCashUsage, setAllowSafetyCashUsage\] = useState\(false\)/);
  assert.match(page, /deriveAllocationSimulatorFunding\(\{ \.\.\.fundingInput, allowSafetyCashUsage \}\)/);
  assert.match(page, /type="checkbox"[\s\S]*checked=\{allowSafetyCashUsage\}[\s\S]*onChange=\{event => setAllowSafetyCashUsage\(event\.currentTarget\.checked\)\}/);
  assert.match(page, /disabled=\{!canUseSafetyCashAssumption\}/);
  assert.doesNotMatch(page, /setContribution|simulatedContribution|模擬投入金額/);
  assert.match(page, /模擬資金來源/);
  assert.match(page, /受保護安全現金/);
  assert.match(page, /假設動用安全現金/);
});

test('Simulator 安全現金開關僅在 selector 可用時啟用，並顯示具無障礙語意的高風險警示', () => {
  const page = source('src/pages/AllocationSimulatorPage.tsx');
  const styles = source('src/styles.css');

  const unavailable = deriveAllocationSimulatorFunding({
    totalLiquidCash: 100_000,
    protectedSafetyCash: 20_000,
    externalContribution: undefined,
    plannedWithdrawal: 0,
    allowSafetyCashUsage: false
  });
  assert.equal(unavailable.isUnavailable, true);
  assert.equal(unavailable.usableProtectedSafetyCash, 20_000);

  const knownZero = deriveAllocationSimulatorFunding({
    totalLiquidCash: 0,
    protectedSafetyCash: 0,
    externalContribution: 0,
    plannedWithdrawal: 0,
    allowSafetyCashUsage: false
  });
  assert.equal(knownZero.isUnavailable, false);
  assert.equal(knownZero.usableProtectedSafetyCash, 0);

  assert.match(page, /const canUseSafetyCashAssumption = !funding\.isUnavailable && funding\.usableProtectedSafetyCash !== null && funding\.usableProtectedSafetyCash > 0;/);
  assert.match(page, /aria-describedby="safety-cash-assumption-description"/);
  assert.match(page, /id="safety-cash-assumption-description"/);
  assert.match(page, /role="alert" aria-atomic="true"/);
  assert.match(page, /此為模擬假設，不代表建議實際動用安全現金。/);
  assert.match(styles, /\.simulator-safety-cash-warning\{/);
});

test('Simulator funding 的已知零值、unavailable 與超額提款契約可安全驅動呈現 gate', () => {
  const zero = deriveAllocationSimulatorFunding({
    totalLiquidCash: 100_000,
    protectedSafetyCash: 100_000,
    externalContribution: 0,
    plannedWithdrawal: 0,
    allowSafetyCashUsage: false
  });
  assert.equal(zero.isUnavailable, false);
  assert.equal(zero.simulationAvailableFunding, 0);

  const unavailable = deriveAllocationSimulatorFunding({
    totalLiquidCash: 100_000,
    protectedSafetyCash: 20_000,
    externalContribution: undefined,
    plannedWithdrawal: 0,
    allowSafetyCashUsage: false
  });
  assert.equal(unavailable.isUnavailable, true);
  assert.equal(unavailable.simulationAvailableFunding, null);

  const overdrawn = deriveAllocationSimulatorFunding({
    totalLiquidCash: 100_000,
    protectedSafetyCash: 80_000,
    externalContribution: 20_000,
    plannedWithdrawal: 121_000,
    allowSafetyCashUsage: false
  });
  assert.equal(overdrawn.isUnavailable, false);
  assert.equal(overdrawn.simulationAvailableFunding, 0);
  assert.ok(overdrawn.blockingReasons.includes('PLANNED_WITHDRAWAL_EXCEEDS_ALL_KNOWN_SOURCES'));

  const page = source('src/pages/AllocationSimulatorPage.tsx');
  assert.match(page, /const canShowSimulationAmounts = !funding\.isUnavailable && funding\.blockingReasons\.length === 0;/);
  assert.match(page, /totalAssets \+ funding\.externalContribution - funding\.plannedWithdrawal/);
  assert.doesNotMatch(page, /totalAssets \+ funding\.externalContribution - funding\.plannedWithdrawal \+ funding\.usableProtectedSafetyCash/);
  assert.match(page, /canShowSimulationAmounts \? money\(row\.targetValue\) : '資料不足'/);
  assert.match(page, /canShowSimulationAmounts && result\.isExact/);
});

test('Simulator funding 接線不引入持久化或正式回寫 API', () => {
  const page = source('src/pages/AllocationSimulatorPage.tsx');

  assert.doesNotMatch(page, /localStorage\.(setItem|removeItem)|firebase\.(set|update)|saveState|setState\(/i);
});

test('Simulator funding 區塊沿用桌機三欄與 390px 雙欄的既有版面契約', () => {
  const page = source('src/pages/AllocationSimulatorPage.tsx');
  const styles = source('src/styles.css');

  assert.match(page, /aria-label="模擬資金來源"/);
  assert.match(styles, /\.sim-summary-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media \(max-width: 768px\)\{[\s\S]*\.sim-summary-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
