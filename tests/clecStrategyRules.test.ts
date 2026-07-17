import assert from 'node:assert/strict';
import test from 'node:test';
import { buildClecStrategyRuleInput } from '../src/lib/clecStrategyRuleAdapter';
import { deriveClecStrategyRule } from '../src/lib/clecStrategyRules';

const base = (overrides: Record<string, unknown> = {}) => ({
  strategyId: 'clec-rule-foundation', allocationPresetId: 'clec-442' as const, rebalanceMode: 'standard' as const, asOfDate: '2026-07-17', portfolioValue: 100000,
  investableAssets: [{ symbol: 'AAA', currentWeight: 35, targetWeight: 40, quoteFreshness: 'fresh' as const }, { symbol: 'BBB', currentWeight: 45, targetWeight: 40, quoteFreshness: 'fresh' as const }, { symbol: 'CCC', currentWeight: 20, targetWeight: 20, quoteFreshness: 'fresh' as const }],
  availableCash: null, plannedContribution: null, plannedWithdrawal: null, debtBalance: null, cashReserve: null, leverageExposure: null,
  threshold: { drift: 5, significantMultiplier: 2, minCashReserve: null, maxDebt: null, maxLeverageExposure: 1.5 }, dataQualityFlags: [] as string[], ...overrides
});

test('preset is an allocation source and never changes rebalanceMode', () => {
  const result = deriveClecStrategyRule(base({ allocationPresetId: 'clec-433', rebalanceMode: 'buy-only' }));
  assert.equal(result.decisionStatus, 'rebalance_consider'); assert.equal(result.recommendedAction, 'hold');
});
test('invalid targets and missing data block without a normal action', () => {
  const invalid = deriveClecStrategyRule(base({ investableAssets: [{ symbol: 'AAA', currentWeight: 1, targetWeight: 90, quoteFreshness: 'missing' }] }));
  assert.equal(invalid.decisionStatus, 'blocked'); assert.equal(invalid.recommendedAction, 'resolve_data_issue'); assert.ok(invalid.reasonCodes.includes('DATA_MISSING')); assert.ok(invalid.reasonCodes.includes('TARGET_WEIGHT_INVALID'));
});
test('drift boundaries, cash priority, and stable asset ordering are deterministic', () => {
  const below = deriveClecStrategyRule(base({ investableAssets: [{ symbol: 'BBB', currentWeight: 42, targetWeight: 40, quoteFreshness: 'fresh' }, { symbol: 'AAA', currentWeight: 38, targetWeight: 40, quoteFreshness: 'fresh' }, { symbol: 'CCC', currentWeight: 20, targetWeight: 20, quoteFreshness: 'fresh' }] }));
  const cash = deriveClecStrategyRule(base({ availableCash: 1000 }));
  assert.equal(below.decisionStatus, 'no_action'); assert.equal(cash.recommendedAction, 'rebalance_with_cash'); assert.deepEqual(cash.affectedAssets, ['AAA', 'BBB']);
});
test('buy-only cannot create sell or full rebalance actions, including withdrawal', () => {
  const result = deriveClecStrategyRule(base({ rebalanceMode: 'buy-only', plannedWithdrawal: 1000, investableAssets: [{ symbol: 'AAA', currentWeight: 20, targetWeight: 40, quoteFreshness: 'fresh' }, { symbol: 'BBB', currentWeight: 60, targetWeight: 40, quoteFreshness: 'fresh' }, { symbol: 'CCC', currentWeight: 20, targetWeight: 20, quoteFreshness: 'fresh' }] }));
  assert.equal(result.recommendedAction, 'hold'); assert.equal(result.decisionStatus, 'rebalance_required'); assert.ok(result.reasonCodes.includes('WITHDRAWAL_REQUIRED'));
});
test('stale, leverage, reserve and debt are warnings and retain the portfolio action', () => {
  const result = deriveClecStrategyRule(base({ availableCash: 500, leverageExposure: 2, cashReserve: 10, debtBalance: 200, threshold: { drift: 5, minCashReserve: 100, maxDebt: 100, maxLeverageExposure: 1.5 }, investableAssets: [{ symbol: 'AAA', currentWeight: 35, targetWeight: 40, quoteFreshness: 'stale' }, { symbol: 'BBB', currentWeight: 45, targetWeight: 40, quoteFreshness: 'fresh' }, { symbol: 'CCC', currentWeight: 20, targetWeight: 20, quoteFreshness: 'fresh' }] }));
  assert.equal(result.recommendedAction, 'rebalance_with_cash'); assert.equal(result.severity, 'warning'); assert.ok(result.reasonCodes.includes('QUOTE_STALE')); assert.ok(result.reasonCodes.includes('LEVERAGE_ELEVATED')); assert.equal(result.confidenceBasis, 'data_and_rule_completeness');
});
test('adapter keeps unknown values missing instead of coercing them to zero', () => {
  const input = buildClecStrategyRuleInput({ allocationPresetId: 'custom', rebalanceMode: 'standard', asOfDate: '2026-07-17', portfolioValue: null, holdings: [{ symbol: ' aaa ', currentWeight: null, targetWeight: null, quoteFreshness: 'missing' }], availableCash: null, debtBalance: null, leverageExposure: null, threshold: { drift: 5 }, dataQualityFlags: [] });
  const result = deriveClecStrategyRule(input);
  assert.equal(input.investableAssets[0].symbol, 'AAA'); assert.equal(input.portfolioValue, null); assert.equal(result.decisionStatus, 'blocked'); assert.equal(result.financialSummary.availableCash, null);
});
