import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CashFlowPage from '../src/pages/CashFlowPage';
import ClecStrategyCenterPage from '../src/pages/ClecStrategyCenterPage';
import type { ClecStrategyCenterResult } from '../src/lib/clecStrategy';
import type { ClecRuleOutput } from '../src/lib/clecStrategyRules';

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
