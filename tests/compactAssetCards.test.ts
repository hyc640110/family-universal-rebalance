import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCompactHoldingWeight, formatCompactQuoteMovement } from '../src/lib/compactAssetCard';

test('formats the existing market-value / total-assets holding ratio without inventing a zero value', () => {
  assert.equal(formatCompactHoldingWeight(5_000, 1_000_000), '<1%');
  assert.equal(formatCompactHoldingWeight(10_000, 1_000_000), '1.0%');
  assert.equal(formatCompactHoldingWeight(0, 1_000_000), '0.0%');
  assert.equal(formatCompactHoldingWeight(10_000, 0), '—');
  assert.equal(formatCompactHoldingWeight(Number.NaN, 1_000_000), '—');
});

test('presents current quote movement with Taiwan-market colors, signs and a neutral stale state', () => {
  assert.deepEqual(formatCompactQuoteMovement(1.25, true), { text: '↑ +1.25%', tone: 'up' });
  assert.deepEqual(formatCompactQuoteMovement(-0.75, true), { text: '↓ -0.75%', tone: 'down' });
  assert.deepEqual(formatCompactQuoteMovement(0, true), { text: '— 0.00%', tone: 'hold' });
  assert.deepEqual(formatCompactQuoteMovement(1.25, false), { text: '— 非今日報價', tone: 'hold' });
});
