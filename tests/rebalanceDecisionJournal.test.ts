import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createRebalanceDecisionSnapshot,
  normalizeRebalanceDecisionJournal,
  normalizeRebalanceDecisionSnapshot,
  type RebalanceDecisionSnapshotInput,
} from '../src/lib/rebalanceDecisionJournal';

const recommendation = {
  canRecommend: true,
  blockingReasons: [],
  mode: 'standard',
  totalAssets: 100000,
  liquidCash: 20000,
  cashTargetPct: 10,
  cashTargetValue: 10000,
  targetTotal: 90,
  thresholdReached: true,
  allocationDeviation: 5,
  thresholdGap: 2,
  allocation: {
    growth: { currentValue: 60000, targetWeight: 70 },
    defensive: { currentValue: 30000, targetWeight: 20 },
    cash: { currentValue: 10000 },
  },
  rows: [{
    symbol: '00631L', name: 'ETF', assetClass: 'growth', currentValue: 60000,
    currentWeight: 60, targetWeight: 70, targetValue: 70000, difference: 10000,
    action: 'buy', recommendedAmount: 10000, unresolvedAmount: 0,
    reason: '目前市值低於目標市值。', priority: 1,
  }],
  buyTotal: 10000, sellTotal: 0, netCashImpact: 10000, availableBuyBudget: 20000,
  usedBuyBudget: 10000, remainingBudget: 10000, unresolvedGap: 0, cashShortfall: 0,
  notices: ['目前建議'], limitations: [],
};

const quoteEvidence = [{
  symbol: '00631L', price: 100, quoteDate: '2026-08-16', quoteTime: '09:30:00+08:00',
  quoteStatus: 'today' as const, quoteSource: 'TWSE', quoteError: null,
}];

const validInput = (): RebalanceDecisionSnapshotInput => ({
  id: 'decision-20260816-001', createdAt: '2026-08-16T01:30:00.000Z',
  asOfDate: '2026-08-16', decidedAt: '2026-08-16T01:30:00.000Z',
  decision: 'follow-recommendation', note: '依建議處理', recommendation, quoteEvidence,
});

test('creates a valid snapshot and deep-copies recommendation rows and quote evidence', () => {
  const input = validInput();
  const snapshot = createRebalanceDecisionSnapshot(input);
  assert.equal(snapshot.id, input.id);
  assert.equal(snapshot.asOfDate, '2026-08-16');
  assert.equal(snapshot.decidedAt, '2026-08-16T01:30:00.000Z');
  assert.equal(snapshot.decision, 'follow-recommendation');
  assert.notEqual(snapshot.recommendation, input.recommendation);
  assert.notEqual(snapshot.recommendation.rows, input.recommendation.rows);
  assert.notEqual(snapshot.quoteEvidence, input.quoteEvidence);
  input.recommendation.rows[0].recommendedAmount = 1;
  input.quoteEvidence[0].price = 1;
  assert.equal(snapshot.recommendation.rows[0].recommendedAmount, 10000);
  assert.equal(snapshot.quoteEvidence[0].price, 100);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.recommendation.rows), true);
  assert.equal(Object.isFrozen(snapshot.quoteEvidence[0]), true);
});

test('rejects a recommendation that cannot be recommended', () => {
  assert.throws(() => createRebalanceDecisionSnapshot({
    ...validInput(), recommendation: { ...recommendation, canRecommend: false },
  }), /canRecommend/);
});

test('preserves null values and rejects non-finite numeric evidence', () => {
  const snapshot = createRebalanceDecisionSnapshot({
    ...validInput(), recommendation: { ...recommendation, investableCash: null },
    quoteEvidence: [{ ...quoteEvidence[0], price: null }],
  });
  assert.equal((snapshot.recommendation as { investableCash?: number | null }).investableCash, null);
  assert.equal(snapshot.quoteEvidence[0].price, null);
  assert.throws(() => createRebalanceDecisionSnapshot({
    ...validInput(), quoteEvidence: [{ ...quoteEvidence[0], price: Number.NaN }],
  }), /finite|invalid/);
});

test('normalizer rejects malformed id, timestamp and enum values', () => {
  const input = validInput();
  assert.equal(normalizeRebalanceDecisionSnapshot({ ...input, id: '' }), null);
  assert.equal(normalizeRebalanceDecisionSnapshot({ ...input, createdAt: 'not-a-timestamp' }), null);
  assert.equal(normalizeRebalanceDecisionSnapshot({ ...input, asOfDate: 'not-a-date' }), null);
  assert.equal(normalizeRebalanceDecisionSnapshot({ ...input, decidedAt: 'not-a-timestamp' }), null);
  assert.equal(normalizeRebalanceDecisionSnapshot({ ...input, decision: 'execute' }), null);
});

test('journal normalizer skips malformed records but keeps valid records', () => {
  const valid = createRebalanceDecisionSnapshot(validInput());
  const result = normalizeRebalanceDecisionJournal([
    { ...valid, id: '' }, valid,
  ]);
  assert.deepEqual(result, [valid]);
});
