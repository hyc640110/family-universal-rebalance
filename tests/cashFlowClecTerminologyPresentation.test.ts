import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CashFlowPage from '../src/pages/CashFlowPage';
import ClecStrategyCenterPage from '../src/pages/ClecStrategyCenterPage';
import type { ClecStrategyCenterResult } from '../src/lib/clecStrategy';
import type { ClecRuleOutput } from '../src/lib/clecStrategyRules';
import type { CashFlowProfile } from '../src/lib/cashFlow';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const view: ClecStrategyCenterResult = {
  allocationSource: { preset: 'custom', label: '自訂配置', rolesValid: true, blockingReasons: [], targetWeightTotal: null, targetWeights: [] },
  currentStrategy: { id: 'current-target-gap', rebalanceMode: 'buy-only', executable: true },
  dataQuality: { passed: true, blockingReasons: [], warnings: [] },
  trigger: { thresholdReached: false, allocationDeviation: 0, rebalanceThreshold: 5 },
  availableCalculation: { canCalculateCurrentGap: true, recommendationRoute: '/tools/rebalance-recommendation' },
  strategies: []
};

const rule: ClecRuleOutput = {
  decisionStatus: 'no_action', recommendedAction: 'hold', severity: 'info', confidence: 'high', confidenceBasis: 'data_and_rule_completeness',
  reasonCodes: [], summary: '目前無需動作。', explanationItems: [], affectedAssets: [], blockingIssues: [], warnings: [], dataQualityNotes: [],
  financialSummary: { availableCash: 10_000, plannedContribution: 20_000, plannedWithdrawal: 5_000, debtBalance: null, cashReserve: 30_000, leverageExposure: null },
  calculatedAt: '2026-07-28'
};

const render = (element: ReturnType<typeof createElement>) => renderToStaticMarkup(createElement(MemoryRouter, null, element));

test('避免重新出現計畫投入或計畫提款：Cash Flow 與 CLEC 應以相同正式名稱與資金語意呈現', () => {
  const cashFlow = render(createElement(CashFlowPage, { currentCash: null, onSave: () => undefined }));
  const clec = render(createElement(ClecStrategyCenterPage, { view, rule }));

  assert.match(cashFlow, /額外投入資金（萬元）/);
  assert.match(cashFlow, /由目前家庭流動資產之外額外投入的金額。/);
  assert.match(cashFlow, /預計提領資金（萬元）/);
  assert.match(cashFlow, /預計由家庭流動資產移出的金額。/);
  assert.match(clec, /<dt>額外投入資金<\/dt>/);
  assert.match(clec, /<dt>預計提領資金<\/dt>/);
  assert.match(clec, /額外投入資金為本次計畫增加的資金；預計提領資金會先從可用資金扣除。/);
  assert.doesNotMatch(clec, /計畫投入|計畫提款/);
});

test('固定支出角色欄位提供既有契約選項，並保留失效借款連結供使用者重新選擇', () => {
  const profile: CashFlowProfile = {
    schemaVersion: 3,
    monthlyIncome: null,
    fixedExpenses: [
      { id: 'unassigned', name: '水電', amount: 500, category: 'utilities', enabled: true },
      { id: 'missing-link', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment' },
      { id: 'orphan-link', name: '已失效房貸', amount: 2_000, category: 'loan', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'removed-loan' },
      { id: 'ambiguous', name: '待確認支出', amount: 1_000, category: 'other', enabled: true, liquidityRole: 'ambiguous' }
    ],
    variableExpenseBudget: null,
    monthlyInvestmentBudget: null,
    emergencyFundTargetMonths: 6
  };

  const cashFlow = render(createElement(CashFlowPage, {
    profile,
    currentCash: null,
    loans: [{ id: 'loan-1', name: '房屋貸款' }, { id: '  ', name: '不可選' }],
    onSave: () => undefined
  }));

  assert.match(cashFlow, /家庭流動性角色/);
  assert.match(cashFlow, /尚未指定／待確認/);
  assert.match(cashFlow, /生活必要支出/);
  assert.match(cashFlow, /借款還款/);
  assert.match(cashFlow, /不納入家庭流動性/);
  assert.doesNotMatch(cashFlow, />ambiguous</);
  assert.match(cashFlow, /選擇借款/);
  assert.match(cashFlow, /房屋貸款/);
  assert.doesNotMatch(cashFlow, /不可選/);
  assert.match(cashFlow, /尚未選擇借款，請先選擇對應的借款資料。/);
  assert.match(cashFlow, /原連結借款已不存在／待重新選擇/);
  assert.match(cashFlow, /removed-loan/);
});

test('現金流設定動作只出現一次，並位於固定支出清單之後', () => {
  const cashFlow = render(createElement(CashFlowPage, { currentCash: null, onSave: () => undefined }));
  const fixedExpensesIndex = cashFlow.indexOf('固定支出清單');
  const saveButtonIndex = cashFlow.indexOf('>儲存現金流設定</button>');
  const clearButtonIndex = cashFlow.indexOf('>清空設定</button>');

  assert.equal((cashFlow.match(/>儲存現金流設定<\/button>/g) ?? []).length, 1);
  assert.equal((cashFlow.match(/>清空設定<\/button>/g) ?? []).length, 1);
  assert.ok(fixedExpensesIndex >= 0, '應能定位固定支出清單');
  assert.ok(saveButtonIndex > fixedExpensesIndex, '儲存按鈕應位於固定支出清單之後');
  assert.ok(clearButtonIndex > fixedExpensesIndex, '清空按鈕應位於固定支出清單之後');
});
