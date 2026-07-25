import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveRebalanceExecutionEligibility } from '../src/lib/rebalanceExecutionEligibility';
import { deriveRebalanceRecommendation, type RebalanceRecommendationInput } from '../src/lib/rebalanceRecommendation';
import type { ClecRuleOutput } from '../src/lib/clecStrategyRules';

const rule = (overrides: Partial<ClecRuleOutput> = {}): ClecRuleOutput => ({ decisionStatus: 'rebalance_required', recommendedAction: 'full_rebalance', severity: 'high', confidence: 'high', confidenceBasis: 'data_and_rule_completeness', reasonCodes: ['DRIFT_ABOVE_THRESHOLD'], summary: '規則正常。', explanationItems: [], affectedAssets: ['AAA'], blockingIssues: [], warnings: [], dataQualityNotes: [], financialSummary: { availableCash: 200, plannedContribution: null, plannedWithdrawal: null, debtBalance: null, cashReserve: 200, leverageExposure: null }, calculatedAt: '2026-07-18', ...overrides });
const recommendation = (overrides: Record<string, unknown> = {}) => ({ canRecommend: true, mode: 'standard' as const, thresholdReached: true, liquidCash: 200, buyTotal: 100, cashShortfall: 0, rows: [{ symbol: 'AAA', name: '甲', action: 'buy' as const, difference: 100, recommendedAmount: 100, unresolvedAmount: 0 }, { symbol: 'BBB', name: '乙', action: 'sell' as const, difference: -50, recommendedAmount: 50, unresolvedAmount: 0 }], ...overrides });
const derive = (ruleOverrides: Partial<ClecRuleOutput> = {}, recommendationOverrides: Record<string, unknown> = {}) => deriveRebalanceExecutionEligibility({ clecRuleOutput: rule(ruleOverrides), recommendation: recommendation(recommendationOverrides) });

test('is deterministic and does not mutate either existing output', () => { const r = rule(), p = recommendation(), before = structuredClone({ r, p }); assert.deepEqual(deriveRebalanceExecutionEligibility({ clecRuleOutput: r, recommendation: p }), deriveRebalanceExecutionEligibility({ clecRuleOutput: r, recommendation: p })); assert.deepEqual({ r, p }, before); });
test('blocked keeps theoretical reference and never fabricates eligible zero amounts', () => { const result = derive({ decisionStatus: 'blocked', recommendedAction: 'resolve_data_issue', blockingIssues: ['報價缺失。'], reasonCodes: ['DATA_MISSING'] }); assert.equal(result.status, 'blocked'); assert.equal(result.eligiblePlanState, 'blocked'); assert.equal(result.eligibleItems[0].eligibleAmount, null); assert.equal(result.eligibleItems[0].theoreticalAmount, 100); assert.equal(result.eligibleItems[0].eligibleDirection, 'unavailable'); });
test('buy-only excludes theoretical sells but preserves them as theory', () => { const result = derive({ rebalanceMode: undefined as never }, { mode: 'buy-only' }); const sell = result.eligibleItems[1]; assert.equal(result.status, 'partially_eligible'); assert.equal(sell.theoreticalDirection, 'sell'); assert.equal(sell.theoreticalAmount, 50); assert.equal(sell.status, 'excluded'); assert.equal(sell.eligibleAmount, null); assert.ok(sell.reasonCodes.includes('BUY_ONLY_SELL_EXCLUDED')); });
test('standard allowed direction and amounts exactly reuse recommendation output and ordering', () => { const result = derive(); assert.equal(result.status, 'eligible'); assert.deepEqual(result.eligibleItems.map(item => [item.symbol, item.eligibleDirection, item.eligibleAmount]), [['AAA', 'buy', 100], ['BBB', 'sell', 50]]); });
test('below threshold is reference only without an execution direction', () => { const result = derive({ decisionStatus: 'no_action', recommendedAction: 'hold', reasonCodes: ['DRIFT_BELOW_THRESHOLD'] }, { thresholdReached: false }); assert.equal(result.status, 'reference_only'); assert.equal(result.eligibleItems[0].eligibleAmount, null); assert.ok(result.reasonCodes.includes('THRESHOLD_NOT_REACHED')); });
test('cash priority without a confirmed amount and insufficient standard cash remain reference only', () => { const missing = derive({ recommendedAction: 'rebalance_with_cash', financialSummary: { ...rule().financialSummary, availableCash: null } }); const short = derive({}, { cashShortfall: 20 }); assert.equal(missing.status, 'reference_only'); assert.ok(missing.reasonCodes.includes('CASH_AMOUNT_UNCONFIRMED')); assert.equal(short.status, 'reference_only'); assert.ok(short.reasonCodes.includes('CASH_INSUFFICIENT')); });
test('stale or missing quote data blocks eligible money and keeps theory visible', () => { const stale = derive({ decisionStatus: 'blocked', recommendedAction: 'resolve_data_issue', reasonCodes: ['QUOTE_STALE'], blockingIssues: ['報價過期。'] }); const missing = derive({ decisionStatus: 'blocked', recommendedAction: 'resolve_data_issue', reasonCodes: ['DATA_MISSING'], blockingIssues: ['報價缺失。'] }); assert.equal(stale.eligibleItems[0].theoreticalAmount, 100); assert.equal(stale.eligibleItems[0].eligibleAmount, null); assert.equal(missing.status, 'blocked'); });
test('invalid, missing and zero semantics stay unavailable or hold instead of eligible money', () => { const invalid = derive({}, { rows: [{ symbol: '', name: '未知', action: 'buy', difference: Number.NaN, recommendedAmount: Number.POSITIVE_INFINITY, unresolvedAmount: null }] }); const zero = derive({}, { rows: [{ symbol: 'ZERO', name: '零', action: 'hold', difference: 0, recommendedAmount: 0, unresolvedAmount: 0 }] }); assert.equal(invalid.status, 'unavailable'); assert.equal(invalid.eligibleItems[0].status, 'unavailable'); assert.equal(zero.eligibleItems[0].eligibleDirection, 'hold'); assert.equal(zero.eligibleItems[0].eligibleAmount, 0); });
test('empty recommendation is unavailable rather than an eligible empty plan', () => { const result = derive({}, { rows: [] }); assert.equal(result.status, 'unavailable'); assert.equal(result.eligibleItems.length, 0); });

// V7.0B sub-PR 2: rebalanceExecutionEligibility.ts itself is NOT modified (recommendation.cashShortfall is read
// generically — it doesn't know or care what basis produced that number). These two tests verify, end-to-end
// through the real deriveRebalanceRecommendation (not the local `recommendation()` mock above), that the
// CASH_INSUFFICIENT gate still fires correctly now that standard mode's cashShortfall is investableCash-based.
const standardEligibilityInput = (investableCash: number | null): RebalanceRecommendationInput => ({
  totalAssets: 1_000, liquidCash: 5_000, buyOnlyBudget: 150, investableCash, rebalanceMode: 'standard',
  rebalanceThreshold: 5, allocationDeviation: 8, targetTotal: 80, cashTargetPct: 20,
  duplicateSymbols: [], otherAssetValue: 0,
  allocation: { growth: { currentValue: 500, targetWeight: 60 }, defensive: { currentValue: 300, targetWeight: 20 }, cash: { currentValue: 200 } },
  holdings: [
    { symbol: 'AAA', name: '成長甲', marketValue: 400, currentWeight: 40, targetWeight: 60, assetClass: 'growth', price: 40, quoteStatus: 'today', quoteSource: 'Price Worker' },
    { symbol: 'BBB', name: '防守乙', marketValue: 400, currentWeight: 40, targetWeight: 20, assetClass: 'defensive', price: 40, quoteStatus: 'today', quoteSource: 'Price Worker' },
  ],
});

test('V7.0B sub-PR 2 integration: real standard-mode investableCash shortfall correctly trips CASH_INSUFFICIENT end-to-end', () => {
  const recommendationOutput = deriveRebalanceRecommendation(standardEligibilityInput(50));
  assert.equal(recommendationOutput.mode, 'standard');
  assert.ok((recommendationOutput.cashShortfall ?? 0) > 0, 'sanity check: this fixture must actually produce a positive investableCash-based shortfall');
  const result = deriveRebalanceExecutionEligibility({ clecRuleOutput: rule(), recommendation: recommendationOutput });
  assert.equal(result.status, 'reference_only');
  assert.ok(result.reasonCodes.includes('CASH_INSUFFICIENT'));
});

test('V7.0B sub-PR 2 integration: real standard-mode investableCash sufficient to cover the buy does not trip CASH_INSUFFICIENT', () => {
  const recommendationOutput = deriveRebalanceRecommendation(standardEligibilityInput(500));
  assert.equal(recommendationOutput.mode, 'standard');
  assert.equal(recommendationOutput.cashShortfall, 0, 'sanity check: this fixture must produce zero shortfall so the gate below is a true negative, not a skipped check');
  const result = deriveRebalanceExecutionEligibility({ clecRuleOutput: rule(), recommendation: recommendationOutput });
  assert.equal(result.status, 'eligible');
  assert.ok(!result.reasonCodes.includes('CASH_INSUFFICIENT'));
});
