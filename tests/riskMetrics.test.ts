import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveRiskMetrics, type RiskInput, type RiskLiquidityContext } from '../src/lib/riskMetrics';

// UR-TODO-009 sub-PR 3 (013 §22): deriveRiskMetrics's cash-safety fields (cashSafetyMonths／minimumCashTarget／
// stableCashTarget) must now come from the Household Liquidity core model (`input.liquidity`, matching
// HouseholdLiquidityOutput's monthlyEssentialExpenses／minimumSafetyCash／stableSafetyCash／safetyCashShortfall／
// investableCash／dataCompleteness), replacing the old cash ÷ monthlyPayment formula that ignored living
// expenses entirely. This file did not exist before this sub-PR — deriveRiskMetrics previously had zero direct
// test coverage; the tests below lock in the new formula's behavior across dataCompleteness states,
// safetyCashShortfall presence, and investableCash being zero vs. sufficient, per the sub-PR 3 test plan.

const COMPLETE: RiskLiquidityContext = { monthlyEssentialExpenses: 20000, minimumSafetyCash: 120000, stableSafetyCash: 240000, safetyCashShortfall: 0, investableCash: 30000, dataCompleteness: 'complete' };
const INSUFFICIENT: RiskLiquidityContext = { monthlyEssentialExpenses: null, minimumSafetyCash: null, stableSafetyCash: null, safetyCashShortfall: null, investableCash: null, dataCompleteness: 'insufficient' };

const BASE: RiskInput = {
  assets: [{ symbol: '00631L', name: '台灣正2', assetClass: 'growth', marketValue: 400000 }],
  // 刻意設定與 liquidity.monthlyEssentialExpenses 不同量級的 monthlyPayment，用來證明新公式已與 monthlyPayment
  // 解耦——舊公式（cash ÷ monthlyPayment、monthlyPayment*6／*12）在這組輸入下會得出完全不同的數字。
  loans: [{ id: 'loan-1', name: '信貸', principal: 500000, annualRate: 3, monthlyPayment: 100000 }],
  cash: 100000,
  totalAssets: 500000,
  growthRatio: 80,
  defensiveRatio: 20,
  growthTargetPct: 80,
  allocationDeviation: 0,
  rebalanceThreshold: 5,
  thresholdReached: false,
  liquidity: COMPLETE
};

const run = (overrides: Partial<RiskInput> = {}) => deriveRiskMetrics({ ...BASE, ...overrides });
const withLiquidity = (overrides: Partial<RiskLiquidityContext>) => run({ liquidity: { ...COMPLETE, ...overrides } });

test('is deterministic and does not mutate its input', () => {
  const input: RiskInput = { ...BASE, liquidity: { ...COMPLETE } };
  const before = structuredClone(input);
  const first = deriveRiskMetrics(input);
  const second = deriveRiskMetrics(input);
  assert.deepEqual(first, second);
  assert.deepEqual(input, before);
});

test('新公式已與 monthlyPayment 解耦：cashSafetyMonths 改用 cash ÷ monthlyEssentialExpenses，不再是 cash ÷ monthlyPayment', () => {
  // BASE：cash=100000、monthlyPayment=100000（舊公式會得出 1.0 個月）；liquidity.monthlyEssentialExpenses=20000
  // （新公式應得出 100000/20000 = 5.0 個月），兩者數字明顯不同，證明改讀正確欄位。
  const risk = run();
  assert.equal(risk.cashSafetyMonths, 5);
});

test('minimumCashTarget／stableCashTarget 直接採用 liquidity.minimumSafetyCash／stableSafetyCash，不再是 monthlyPayment*6／*12', () => {
  // 若沿用舊公式，monthlyPayment=100000 會得出 600000／1200000；新公式應為 liquidity 提供的 120000／240000。
  const risk = run();
  assert.equal(risk.minimumCashTarget, 120000);
  assert.equal(risk.stableCashTarget, 240000);
});

test('dataCompleteness 為 insufficient 時，cashSafetyMonths 為 null，不得偽裝為 0 個月或已達標', () => {
  const risk = withLiquidity(INSUFFICIENT);
  assert.equal(risk.cashSafetyMonths, null);
  assert.equal(risk.items[0].level, 0);
  assert.equal(risk.items[0].status, '資料不足，暫無法評估');
  assert.match(risk.items[0].reason, /缺少必要生活費或負債資料/);
  assert.match(risk.items[0].suggestion, /收支與現金流中心/);
});

test('dataCompleteness 為 partial 時（即使 monthlyEssentialExpenses 仍為數字），一律視為資料不足，不計算月數', () => {
  const risk = withLiquidity({ dataCompleteness: 'partial' });
  assert.equal(risk.cashSafetyMonths, null);
  assert.equal(risk.items[0].status, '資料不足，暫無法評估');
});

test('minimumSafetyCash／stableSafetyCash 為 null 時，minimumCashTarget／stableCashTarget 以既有 number 型別安全回退為 0', () => {
  const risk = withLiquidity(INSUFFICIENT);
  assert.equal(risk.minimumCashTarget, 0);
  assert.equal(risk.stableCashTarget, 0);
});

test('dataCompleteness 為 complete 但 monthlyEssentialExpenses 為 0 時，視為僅反映流動性，不計算月數且風險等級為 0', () => {
  const risk = withLiquidity({ monthlyEssentialExpenses: 0 });
  assert.equal(risk.cashSafetyMonths, null);
  assert.equal(risk.items[0].level, 0);
  assert.equal(risk.items[0].status, '目前無必要支出壓力');
  assert.match(risk.items[0].reason, /本指標僅反映流動性/);
});

test('safetyCashShortfall > 0 時，reason 附上缺口金額，不顯示 investableCash', () => {
  const risk = withLiquidity({ safetyCashShortfall: 50000, investableCash: 0 });
  assert.match(risk.items[0].reason, /安全存量仍有缺口 50,000 元/);
  assert.doesNotMatch(risk.items[0].reason, /可投資現金/);
});

test('safetyCashShortfall 為 0 且 investableCash 為 0 時，reason 顯示可投資現金 0 元（缺口剛好打平，尚無餘裕）', () => {
  const risk = withLiquidity({ safetyCashShortfall: 0, investableCash: 0 });
  assert.match(risk.items[0].reason, /目前可投資現金 0 元/);
  assert.doesNotMatch(risk.items[0].reason, /安全存量仍有缺口/);
});

test('safetyCashShortfall 為 0 且 investableCash 充足時，reason 顯示實際可投資金額', () => {
  const risk = withLiquidity({ safetyCashShortfall: 0, investableCash: 80000 });
  assert.match(risk.items[0].reason, /目前可投資現金 80,000 元/);
});

test('cashRisk 沿用既有 12／6／3 個月門檻分級，僅分母改變', () => {
  assert.equal(withLiquidity({ monthlyEssentialExpenses: 100000 / 12 }).items[0].level, 0); // 剛好 12 個月
  assert.equal(withLiquidity({ monthlyEssentialExpenses: 100000 / 6 }).items[0].level, 1); // 剛好 6 個月
  assert.equal(withLiquidity({ monthlyEssentialExpenses: 100000 / 3 }).items[0].level, 2); // 剛好 3 個月
  assert.equal(withLiquidity({ monthlyEssentialExpenses: 100000 }).items[0].level, 3); // 1 個月，高風險
});

test('借款壓力（loan）項目行為不受本次修正影響：monthlyPayment 為 0 時無月付壓力，否則沿用 cashRisk', () => {
  const noLoan = run({ loans: [] });
  assert.equal(noLoan.items[1].level, 0);
  assert.equal(noLoan.items[1].status, '無月付壓力');
  const withLoan = run();
  assert.equal(withLoan.items[1].level, withLoan.items[0].level);
});

test('輸出物件透傳 monthlyEssentialExpenses／safetyCashShortfall／investableCash／dataCompleteness，供後續子 PR 消費', () => {
  const risk = run();
  assert.equal(risk.monthlyEssentialExpenses, 20000);
  assert.equal(risk.safetyCashShortfall, 0);
  assert.equal(risk.investableCash, 30000);
  assert.equal(risk.dataCompleteness, 'complete');
});

test('非現金相關指標（集中度、槓桿、配置偏離）不受本次修正影響', () => {
  const risk = run({ assets: [{ symbol: '00631L', name: '台灣正2', assetClass: 'growth', marketValue: 400000 }, { symbol: '00865B', name: '公債', assetClass: 'defensive', marketValue: 100000 }] });
  assert.equal(risk.largestHoldingRatio, 80);
  assert.equal(risk.leveragedRatio, 80);
  assert.equal(risk.items[3].key, 'concentration');
  assert.equal(risk.items[4].key, 'allocation');
});
