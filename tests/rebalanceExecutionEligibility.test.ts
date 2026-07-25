import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveRebalanceExecutionEligibility } from '../src/lib/rebalanceExecutionEligibility';
import { deriveRebalanceRecommendation, type RebalanceRecommendationInput } from '../src/lib/rebalanceRecommendation';
import type { ClecRuleOutput } from '../src/lib/clecStrategyRules';

const rule = (overrides: Partial<ClecRuleOutput> = {}): ClecRuleOutput => ({ decisionStatus: 'rebalance_required', recommendedAction: 'full_rebalance', severity: 'high', confidence: 'high', confidenceBasis: 'data_and_rule_completeness', reasonCodes: ['DRIFT_ABOVE_THRESHOLD'], summary: '規則正常。', explanationItems: [], affectedAssets: ['AAA'], blockingIssues: [], warnings: [], dataQualityNotes: [], financialSummary: { availableCash: 200, plannedContribution: null, plannedWithdrawal: null, debtBalance: null, cashReserve: 200, leverageExposure: null }, calculatedAt: '2026-07-18', ...overrides });
// availableBuyBudget/remainingBudget/unresolvedGap default to a standard-mode fixture with 200 investable cash,
// 100 theoretical buy total, 0 shortfall — matching liquidCash/buyTotal/cashShortfall above (013 §12.3 fields).
const recommendation = (overrides: Record<string, unknown> = {}) => ({ canRecommend: true, mode: 'standard' as const, thresholdReached: true, liquidCash: 200, buyTotal: 100, cashShortfall: 0, availableBuyBudget: 200, remainingBudget: 100, unresolvedGap: 0, rows: [{ symbol: 'AAA', name: '甲', action: 'buy' as const, difference: 100, recommendedAmount: 100, unresolvedAmount: 0 }, { symbol: 'BBB', name: '乙', action: 'sell' as const, difference: -50, recommendedAmount: 50, unresolvedAmount: 0 }], ...overrides });
const derive = (ruleOverrides: Partial<ClecRuleOutput> = {}, recommendationOverrides: Record<string, unknown> = {}) => deriveRebalanceExecutionEligibility({ clecRuleOutput: rule(ruleOverrides), recommendation: recommendation(recommendationOverrides) });

test('is deterministic and does not mutate either existing output', () => { const r = rule(), p = recommendation(), before = structuredClone({ r, p }); assert.deepEqual(deriveRebalanceExecutionEligibility({ clecRuleOutput: r, recommendation: p }), deriveRebalanceExecutionEligibility({ clecRuleOutput: r, recommendation: p })); assert.deepEqual({ r, p }, before); });
test('blocked keeps theoretical reference and never fabricates eligible zero amounts', () => { const result = derive({ decisionStatus: 'blocked', recommendedAction: 'resolve_data_issue', blockingIssues: ['報價缺失。'], reasonCodes: ['DATA_MISSING'] }); assert.equal(result.status, 'blocked'); assert.equal(result.eligiblePlanState, 'blocked'); assert.equal(result.eligibleItems[0].eligibleAmount, null); assert.equal(result.eligibleItems[0].theoreticalAmount, 100); assert.equal(result.eligibleItems[0].eligibleDirection, 'unavailable'); });
test('buy-only excludes theoretical sells but preserves them as theory', () => { const result = derive({ rebalanceMode: undefined as never }, { mode: 'buy-only' }); const sell = result.eligibleItems[1]; assert.equal(result.status, 'partially_eligible'); assert.equal(sell.theoreticalDirection, 'sell'); assert.equal(sell.theoreticalAmount, 50); assert.equal(sell.status, 'excluded'); assert.equal(sell.eligibleAmount, null); assert.ok(sell.reasonCodes.includes('BUY_ONLY_SELL_EXCLUDED')); });
test('standard allowed direction and amounts exactly reuse recommendation output and ordering', () => { const result = derive(); assert.equal(result.status, 'eligible'); assert.deepEqual(result.eligibleItems.map(item => [item.symbol, item.eligibleDirection, item.eligibleAmount]), [['AAA', 'buy', 100], ['BBB', 'sell', 50]]); });
test('below threshold is reference only without an execution direction', () => { const result = derive({ decisionStatus: 'no_action', recommendedAction: 'hold', reasonCodes: ['DRIFT_BELOW_THRESHOLD'] }, { thresholdReached: false }); assert.equal(result.status, 'reference_only'); assert.equal(result.eligibleItems[0].eligibleAmount, null); assert.ok(result.reasonCodes.includes('THRESHOLD_NOT_REACHED')); });
// V7.0B sub-PR 3 (013 §12.3): CASH_AMOUNT_UNCONFIRMED is removed rather than rewired to investableCash, because
// recommendation.canRecommend already gates household-liquidity investableCash === null upstream (the `blocked`
// branch above) — by the time this file's cash check runs, availableBuyBudget is always a confirmed number, so a
// second "is the cash amount confirmed" gate here would never fire. This test's expected value has changed from
// the prior sub-PR (previously asserted CASH_AMOUNT_UNCONFIRMED / reference_only): CLEC's own recommendedAction
// or a null CLEC financialSummary.availableCash no longer affects eligibility at all once investableCash itself
// is confirmed, so this fixture now correctly reaches the final 'eligible' branch.
test('CLEC recommendedAction and its own (now-unused) financialSummary.availableCash no longer gate eligibility; only investableCash-based cashShortfall does', () => {
  const noLongerGated = derive({ recommendedAction: 'rebalance_with_cash', financialSummary: { ...rule().financialSummary, availableCash: null } });
  assert.equal(noLongerGated.status, 'eligible');
  const short = derive({}, { cashShortfall: 20 });
  assert.equal(short.status, 'reference_only');
  assert.ok(short.reasonCodes.includes('CASH_INSUFFICIENT'));
});
test('stale or missing quote data blocks eligible money and keeps theory visible', () => { const stale = derive({ decisionStatus: 'blocked', recommendedAction: 'resolve_data_issue', reasonCodes: ['QUOTE_STALE'], blockingIssues: ['報價過期。'] }); const missing = derive({ decisionStatus: 'blocked', recommendedAction: 'resolve_data_issue', reasonCodes: ['DATA_MISSING'], blockingIssues: ['報價缺失。'] }); assert.equal(stale.eligibleItems[0].theoreticalAmount, 100); assert.equal(stale.eligibleItems[0].eligibleAmount, null); assert.equal(missing.status, 'blocked'); });
test('invalid, missing and zero semantics stay unavailable or hold instead of eligible money', () => { const invalid = derive({}, { rows: [{ symbol: '', name: '未知', action: 'buy', difference: Number.NaN, recommendedAmount: Number.POSITIVE_INFINITY, unresolvedAmount: null }] }); const zero = derive({}, { rows: [{ symbol: 'ZERO', name: '零', action: 'hold', difference: 0, recommendedAmount: 0, unresolvedAmount: 0 }] }); assert.equal(invalid.status, 'unavailable'); assert.equal(invalid.eligibleItems[0].status, 'unavailable'); assert.equal(zero.eligibleItems[0].eligibleDirection, 'hold'); assert.equal(zero.eligibleItems[0].eligibleAmount, 0); });
test('empty recommendation is unavailable rather than an eligible empty plan', () => { const result = derive({}, { rows: [] }); assert.equal(result.status, 'unavailable'); assert.equal(result.eligibleItems.length, 0); });

// V7.0B sub-PR 3 (013 §12.3): the three money-contract fields are read verbatim from recommendation's own
// availableBuyBudget/buyTotal/cashShortfall/unresolvedGap — no new arithmetic is introduced by this file.
test('013 §12.3 money contract: sufficient standard-mode cash yields matching investableCash/executableAmount and zero externalFundingRequired', () => {
  const result = derive({}, { availableBuyBudget: 300, buyTotal: 100, cashShortfall: 0 });
  assert.equal(result.investableCash, 300);
  assert.equal(result.executableAmount, 100);
  assert.equal(result.externalFundingRequired, 0);
});
test('013 §12.3 money contract: insufficient standard-mode cash clamps executableAmount to the investable basis and surfaces the shortfall as externalFundingRequired', () => {
  const result = derive({}, { availableBuyBudget: 50, buyTotal: 100, cashShortfall: 50 });
  assert.equal(result.investableCash, 50);
  assert.equal(result.executableAmount, 50);
  assert.equal(result.externalFundingRequired, 50);
});
test('013 §12.3 money contract: buy-only zero investableCash reports all three figures as the §12.3 display example expects (0 / 0 / full theoretical gap)', () => {
  const result = derive({}, { mode: 'buy-only', availableBuyBudget: 0, buyTotal: 0, cashShortfall: 0, unresolvedGap: 100, rows: [{ symbol: 'AAA', name: '甲', action: 'buy' as const, difference: 100, recommendedAmount: 0, unresolvedAmount: 100 }] });
  assert.equal(result.investableCash, 0);
  assert.equal(result.executableAmount, 0);
  assert.equal(result.externalFundingRequired, 100);
});
test('013 §12.3 money contract: missing availableBuyBudget/buyTotal never fabricates a zero, all three figures stay null', () => {
  const result = derive({}, { availableBuyBudget: null, buyTotal: null, cashShortfall: null, unresolvedGap: null });
  assert.equal(result.investableCash, null);
  assert.equal(result.executableAmount, null);
  assert.equal(result.externalFundingRequired, null);
});

// These four tests verify, end-to-end through the real deriveRebalanceRecommendation (not the local
// `recommendation()` mock above), that the CASH_INSUFFICIENT gate and the 013 §12.3 money contract both still
// work correctly now that standard mode's cashShortfall/availableBuyBudget are investableCash-based.
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

test('V7.0B sub-PR 3 integration: real standard-mode investableCash shortfall trips CASH_INSUFFICIENT and reports matching 013 §12.3 figures end-to-end', () => {
  const recommendationOutput = deriveRebalanceRecommendation(standardEligibilityInput(50));
  assert.equal(recommendationOutput.mode, 'standard');
  assert.ok((recommendationOutput.cashShortfall ?? 0) > 0, 'sanity check: this fixture must actually produce a positive investableCash-based shortfall');
  const result = deriveRebalanceExecutionEligibility({ clecRuleOutput: rule(), recommendation: recommendationOutput });
  assert.equal(result.status, 'reference_only');
  assert.ok(result.reasonCodes.includes('CASH_INSUFFICIENT'));
  assert.equal(result.investableCash, recommendationOutput.availableBuyBudget);
  assert.equal(result.externalFundingRequired, recommendationOutput.cashShortfall);
});

test('V7.0B sub-PR 3 integration: real standard-mode investableCash sufficient to cover the buy does not trip CASH_INSUFFICIENT and reports zero externalFundingRequired', () => {
  const recommendationOutput = deriveRebalanceRecommendation(standardEligibilityInput(500));
  assert.equal(recommendationOutput.mode, 'standard');
  assert.equal(recommendationOutput.cashShortfall, 0, 'sanity check: this fixture must produce zero shortfall so the gate below is a true negative, not a skipped check');
  const result = deriveRebalanceExecutionEligibility({ clecRuleOutput: rule(), recommendation: recommendationOutput });
  assert.equal(result.status, 'eligible');
  assert.ok(!result.reasonCodes.includes('CASH_INSUFFICIENT'));
  assert.equal(result.externalFundingRequired, 0);
  assert.equal(result.investableCash, recommendationOutput.availableBuyBudget);
});
