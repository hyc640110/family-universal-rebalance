import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ClecStrategyCenterPage from '../src/pages/ClecStrategyCenterPage';
import type { ClecStrategyCenterResult } from '../src/lib/clecStrategy';
import type { ClecRuleOutput } from '../src/lib/clecStrategyRules';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const view: ClecStrategyCenterResult = {
  allocationSource: {
    preset: 'custom',
    label: '自訂配置',
    rolesValid: true,
    blockingReasons: [],
    targetWeightTotal: 100,
    targetWeights: [
      { symbol: '00662', name: '富邦NASDAQ', role: 'prototype', targetWeight: 40 },
      { symbol: '00670L', name: '富邦NASDAQ正2', role: 'leveraged', targetWeight: 40 },
      { symbol: '00865B', name: '國泰US短期公債', role: 'cash-like', targetWeight: 20 }
    ]
  },
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

const render = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ClecStrategyCenterPage, { view, rule })));

test('UR-TODO-003/048: 目前配置來源卡片明確標示角色分類為 CLEC 模擬專用，與資產頁正式分類無關', () => {
  const html = render();
  assert.match(html, /class="note clec-role-scope-note"/);
  assert.match(html, /以下「原型資產／槓桿資產／類現金持股」為 CLEC 模擬專用分類/);
  assert.match(html, /與資產頁「成長／防守」正式配置分類是兩套互不相通的系統/);
  assert.match(html, /兩者無對應關係/);
  // Role labels themselves are unchanged - still render next to the new clarifying note.
  assert.match(html, /原型資產/);
  assert.match(html, /槓桿資產/);
  assert.match(html, /類現金持股/);
});

test('UR-TODO-003/048: 新增說明文字未改動既有角色標籤資料或目標比例計算', () => {
  const html = render();
  assert.match(html, /00662[\s\S]*原型資產/);
  assert.match(html, /00670L[\s\S]*槓桿資產/);
  assert.match(html, /00865B[\s\S]*類現金持股/);
  assert.match(html, /目標比例總和/);
  assert.match(html, /前往資產頁查看正式目標配置/);
});
