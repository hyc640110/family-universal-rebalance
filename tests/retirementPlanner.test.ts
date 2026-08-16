import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateRetirementPlan, createRetirementPlanDraft } from '../src/lib/retirementPlanner';
import type { CashFlowProfile } from '../src/lib/cashFlow';

const cashFlowProfile: CashFlowProfile = {
  schemaVersion: 3,
  monthlyIncome: 80_000,
  monthlyInvestmentBudget: 10_000,
  emergencyFundTargetMonths: 6,
  fixedExpenses: [
    { id: 'rent', name: '房租', amount: 20_000, category: 'housing', enabled: true },
    { id: 'optional', name: '停用項目', amount: 9_000, category: 'other', enabled: false }
  ]
};

test('退休試算以 4% 提領率、已啟用每月支出與年度大額支出計算 FIRE 目標', () => {
  const plan = createRetirementPlanDraft(cashFlowProfile, {
    annualBigExpenses: { travelBudget: 60_000, insuranceFee: 60_000 },
    withdrawalRatePercent: 4,
    retirementYears: 10,
    expectedAnnualReturnPercent: 0
  });

  const result = calculateRetirementPlan(plan, 1_500_000);

  assert.equal(result.monthlyFixedExpenses, 20_000);
  assert.equal(result.annualExpenses, 360_000);
  assert.equal(result.fireTarget, 9_000_000);
  assert.equal(result.progressPercent, 16.666666666666664);
  assert.equal(result.averageMonthlyContribution, 62_500);
  assert.equal(result.annualContribution, 750_000);
});

test('退休試算在零報酬率時以既有月複利年金反推得到固定月投入', () => {
  const plan = createRetirementPlanDraft(undefined, {
    fixedExpenses: [{ id: 'living', name: '生活費', amount: 10_000, category: 'other', enabled: true }],
    annualBigExpenses: { travelBudget: 0, insuranceFee: 0 },
    withdrawalRatePercent: 10,
    retirementYears: 1,
    expectedAnnualReturnPercent: 0
  });

  const result = calculateRetirementPlan(plan, 0);

  assert.equal(result.fireTarget, 1_200_000);
  assert.equal(result.averageMonthlyContribution, 100_000);
  assert.equal(result.annualContribution, 1_200_000);
});

test('退休年限為零時不製造假投入金額', () => {
  const plan = createRetirementPlanDraft(undefined, {
    fixedExpenses: [{ id: 'living', name: '生活費', amount: 10_000, category: 'other', enabled: true }],
    retirementYears: 0,
    expectedAnnualReturnPercent: 5
  });

  const result = calculateRetirementPlan(plan, 0);

  assert.equal(result.averageMonthlyContribution, null);
  assert.equal(result.annualContribution, null);
});

test('退休草稿從現金流預填時會複製項目，不會回寫原始 cashFlowProfile', () => {
  const plan = createRetirementPlanDraft(cashFlowProfile);
  plan.fixedExpenses[0]!.amount = 99_999;

  assert.equal(cashFlowProfile.fixedExpenses[0]!.amount, 20_000);
  assert.deepEqual(plan.fixedExpenses.map(item => item.id), ['rent', 'optional']);
});
