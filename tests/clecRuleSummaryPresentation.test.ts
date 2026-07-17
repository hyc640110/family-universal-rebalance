import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { ClecRuleOutput } from '../src/lib/clecStrategyRules';
import { CLEC_RULE_SUMMARY_MAX_REASONS, CLEC_RULE_SUMMARY_MAX_WARNINGS, CLEC_STRATEGY_CENTER_ROUTE, presentClecRuleSummary } from '../src/lib/clecRuleSummaryPresentation';

const rule = (overrides: Partial<ClecRuleOutput> = {}): ClecRuleOutput => ({
  decisionStatus: 'rebalance_consider', recommendedAction: 'rebalance_with_cash', severity: 'warning', confidence: 'high', confidenceBasis: 'data_and_rule_completeness', reasonCodes: ['DRIFT_ABOVE_THRESHOLD'], summary: '既有規則摘要。', explanationItems: [{ code: 'DRIFT_ABOVE_THRESHOLD', title: '偏離達門檻', detail: '既有引擎理由。', severity: 'warning', assets: ['AAA'] }], affectedAssets: ['AAA'], blockingIssues: [], warnings: ['既有警示。'], dataQualityNotes: [], financialSummary: { availableCash: null, plannedContribution: null, plannedWithdrawal: null, debtBalance: null, cashReserve: null, leverageExposure: null }, calculatedAt: '2026-07-17', ...overrides
});

test('consumes existing output without recalculation or mutation and remains deterministic', () => {
  const input = rule(); const before = structuredClone(input);
  assert.deepEqual(presentClecRuleSummary(input), presentClecRuleSummary(input)); assert.deepEqual(input, before);
});
test('blocked output keeps its existing reason and removes normal execution direction', () => {
  const result = presentClecRuleSummary(rule({ decisionStatus: 'blocked', recommendedAction: 'resolve_data_issue', blockingIssues: ['目標比例無效。'], explanationItems: [{ code: 'TARGET_WEIGHT_INVALID', title: '目標比例無效', detail: '目標比例總和錯誤。', severity: 'high', assets: [] }] }));
  assert.equal(result.statusLabel, '資料阻擋'); assert.equal(result.actionLabel, null); assert.equal(result.reasons[0].detail, '目標比例總和錯誤。');
});
test('buy-only and planned withdrawal faithfully preserve existing action and priority', () => {
  const result = presentClecRuleSummary(rule({ recommendedAction: 'buy_underweight', reasonCodes: ['WITHDRAWAL_REQUIRED'], explanationItems: [{ code: 'WITHDRAWAL_REQUIRED', title: '計畫提款', detail: '計畫提款優先於新增投入。', severity: 'warning', assets: ['BBB'] }] }));
  assert.equal(result.actionLabel, '可優先補低配'); assert.doesNotMatch(result.actionLabel ?? '', /賣出|完整/); assert.equal(result.reasons[0].code, 'WITHDRAWAL_REQUIRED');
});
test('no-action and unavailable states do not imply a pending task or normal action', () => {
  assert.equal(presentClecRuleSummary(rule({ decisionStatus: 'no_action', recommendedAction: 'hold', severity: 'info' })).statusLabel, '目前無需動作');
  const unavailable = presentClecRuleSummary(undefined); assert.equal(unavailable.statusLabel, '資料不足'); assert.equal(unavailable.actionLabel, null);
});
test('reasons, warnings and assets have stable bounded presentation order', () => {
  const result = presentClecRuleSummary(rule({ explanationItems: Array.from({ length: 5 }, (_, index) => ({ code: 'QUOTE_STALE' as const, title: `理由${index}`, detail: `${index}`, severity: 'warning' as const, assets: [] })), warnings: ['一', '二', '三', '四'], affectedAssets: ['BBB', 'AAA'] }));
  assert.equal(result.reasons.length, CLEC_RULE_SUMMARY_MAX_REASONS); assert.equal(result.warnings.length, CLEC_RULE_SUMMARY_MAX_WARNINGS); assert.deepEqual(result.affectedAssets, ['BBB', 'AAA']);
});
test('uses the existing CLEC route and the rebalance page only receives the app-derived output', () => {
  assert.equal(presentClecRuleSummary(rule()).route, CLEC_STRATEGY_CENTER_ROUTE);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8'); const page = readFileSync(new URL('../src/pages/RebalanceRecommendationPage.tsx', import.meta.url), 'utf8'); const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(app, /RebalanceRecommendationPage view=\{rebalanceRecommendationView\} recommendations=\{recommendationModels\} rule=\{clecStrategyRuleView\}/); assert.doesNotMatch(page, /deriveClecStrategyRule|buildClecStrategyRuleInput/); assert.match(page, /<ClecRuleSummaryCard rule=\{rule\} \/>/); assert.match(css, /\.clec-rule-summary-bridge/); assert.match(css, /@media \(max-width:700px\)\{\.clec-rule-summary-bridge/);
});
