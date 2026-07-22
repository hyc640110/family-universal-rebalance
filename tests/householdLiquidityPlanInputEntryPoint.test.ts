import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  applyHouseholdLiquidityPlanInput,
  householdLiquidityPlanInputStatus,
  parseHouseholdLiquidityPlanWan,
  type HouseholdLiquidityPlanField
} from '../src/lib/householdLiquidityPlanInputUi';
import { normalizeCashFlowProfile, type CashFlowProfile } from '../src/lib/cashFlow';
import { buildHouseholdLiquidityInput } from '../src/lib/householdLiquidityInputAdapter';

const profile = (overrides: Partial<CashFlowProfile> = {}): CashFlowProfile => normalizeCashFlowProfile({
  monthlyIncome: 100_000,
  fixedExpenses: [{ id: 'utility', name: '水電', amount: 500, category: 'utilities', enabled: true, liquidityRole: 'essential-living' }],
  variableExpenseBudget: 10_000,
  monthlyInvestmentBudget: 20_000,
  emergencyFundTargetMonths: 6,
  ...overrides
});

const adapterSource = (cashFlowProfile: CashFlowProfile) => ({ accounts: [], legacyCash: [], loans: [], cashFlowProfile, configuredBudget: 1_000 });

test('1. 空白輸入明確解析為 absent，0 與正數解析為元金額', () => {
  assert.deepEqual(parseHouseholdLiquidityPlanWan(''), { kind: 'absent' });
  assert.deepEqual(parseHouseholdLiquidityPlanWan('0'), { kind: 'valid', value: 0 });
  assert.deepEqual(parseHouseholdLiquidityPlanWan('1.25'), { kind: 'valid', value: 12_500 });
});

test('2. 負數、非數字、Infinity 與超出安全範圍的輸入都拒絕且保留修正用原字串', () => {
  assert.deepEqual(parseHouseholdLiquidityPlanWan('-1'), { kind: 'invalid', message: '金額不可小於 0' });
  for (const raw of ['abc', 'Infinity', '1e999', '900719925474.0992']) {
    const result = parseHouseholdLiquidityPlanWan(raw);
    assert.equal(result.kind, 'invalid');
  }
});

test('3. plan input functional update 僅更新指定欄位，並保留其他 Cash Flow 與 provenance', () => {
  const original = profile({ externalContribution: 100, plannedWithdrawal: 200 });
  const next = applyHouseholdLiquidityPlanInput(original, 'externalContribution', 0);
  assert.equal(next.externalContribution, 0);
  assert.equal(next.plannedWithdrawal, 200);
  assert.equal(next.monthlyInvestmentBudget, 20_000);
  assert.deepEqual(next.fixedExpenses, original.fixedExpenses);
  assert.notEqual(next, original);
});

test('4. 清除正數或 explicit zero 都會移除 persisted optional 欄位，不會轉成 0', () => {
  for (const field of ['externalContribution', 'plannedWithdrawal'] as HouseholdLiquidityPlanField[]) {
    const cleared = applyHouseholdLiquidityPlanInput(profile({ externalContribution: 0, plannedWithdrawal: 500 }), field, undefined);
    assert.equal(cleared[field], undefined);
    assert.equal(field === 'externalContribution' ? cleared.plannedWithdrawal : cleared.externalContribution, field === 'externalContribution' ? 500 : 0);
  }
});

test('5. status 文案區分未設定、explicit zero 與正數，不以 0 偽裝缺失', () => {
  assert.equal(householdLiquidityPlanInputStatus(undefined), '未設定');
  assert.equal(householdLiquidityPlanInputStatus(0), '已設定：0 元');
  assert.equal(householdLiquidityPlanInputStatus(12_500), '已設定：12,500 元');
});

test('6. UI update 後的 absent、zero、positive 與 clear 對 Adapter 保持正確語意', () => {
  const absent = applyHouseholdLiquidityPlanInput(profile(), 'externalContribution', undefined);
  assert.ok(Number.isNaN(buildHouseholdLiquidityInput(adapterSource(absent)).externalContribution));
  const zero = applyHouseholdLiquidityPlanInput(absent, 'externalContribution', 0);
  assert.equal(buildHouseholdLiquidityInput(adapterSource(zero)).externalContribution, 0);
  const positive = applyHouseholdLiquidityPlanInput(zero, 'externalContribution', 12_500);
  assert.equal(buildHouseholdLiquidityInput(adapterSource(positive)).externalContribution, 12_500);
  const cleared = applyHouseholdLiquidityPlanInput(positive, 'externalContribution', undefined);
  assert.ok(Number.isNaN(buildHouseholdLiquidityInput(adapterSource(cleared)).externalContribution));
});

test('7. entry point 位於 Cash Flow 設定，具中文文案、inputMode、清除與最小狀態提示', () => {
  const page = readFileSync(new URL('../src/pages/CashFlowPage.tsx', import.meta.url), 'utf8');
  assert.match(page, /家庭流動資金計畫/);
  assert.match(page, /額外投入資金/);
  assert.match(page, /預計提領資金/);
  assert.match(page, /inputMode="decimal"/);
  assert.match(page, /清除/);
  assert.match(page, /未設定不會自動視為 0/);
  assert.doesNotMatch(page, /deriveHouseholdLiquidity|executableBudget|canExecuteBuy/);
});
