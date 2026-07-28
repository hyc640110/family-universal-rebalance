import assert from 'node:assert/strict';
import test from 'node:test';
import { presentHouseholdLiquidityDiagnostics } from '../src/lib/householdLiquidityDiagnosticPresentation';
import type { CashFlowProfile } from '../src/lib/cashFlow';

const profile: CashFlowProfile = {
  monthlyIncome: null,
  fixedExpenses: [
    { id: 'loan', name: '信貸', amount: 3_000, category: 'loan', enabled: true, liquidityRole: 'debt-payment' },
    { id: 'unnamed', name: '  ', amount: 1_000, category: 'other', enabled: true },
  ],
  variableExpenseBudget: null,
  monthlyInvestmentBudget: null,
  emergencyFundTargetMonths: 6,
};

test('家庭流動性診斷以穩定優先順序產生可讀且可行動的內容', () => {
  const presentation = presentHouseholdLiquidityDiagnostics({
    diagnostics: [
      { code: 'PLANNED_WITHDRAWAL_UNSET' },
      { code: 'CASH_FLOW_ROLE_UNASSIGNED', sourceId: 'cash-flow:unnamed' },
      { code: 'DEBT_PAYMENT_LINK_REQUIRED', sourceId: 'cash-flow:loan' },
      { code: 'EXTERNAL_CONTRIBUTION_UNSET' },
      { code: 'CASH_FLOW_PROFILE_MISSING' },
    ],
    cashFlowProfile: profile,
  });

  assert.deepEqual(presentation.items.map(item => item.message), [
    '現金流設定尚未建立。請先設定每月收支與固定支出。',
    '固定支出「信貸」已標記為借款還款，但尚未連結借款。',
    '固定支出「未命名固定支出」尚未指定家庭流動性用途。',
    '尚未明確設定本期額外投入資金。',
    '尚未明確設定本期預計提領資金。',
  ]);
  assert.equal(presentation.items.every(item => item.action.to === '/tools/cash-flow'), true);
  assert.equal(presentation.items.every(item => !/CASH_FLOW_|DEBT_PAYMENT_|undefined|null|loan-/i.test(item.message)), true);
});

test('家庭流動性診斷在沒有原因時不建立呈現項目，並保留明確零元不被誤判', () => {
  assert.deepEqual(presentHouseholdLiquidityDiagnostics({ diagnostics: [], cashFlowProfile: profile }).items, []);
  const configuredZero: CashFlowProfile = { ...profile, externalContribution: 0, plannedWithdrawal: 0 };
  assert.deepEqual(presentHouseholdLiquidityDiagnostics({ diagnostics: [], cashFlowProfile: configuredZero }).items, []);
});
