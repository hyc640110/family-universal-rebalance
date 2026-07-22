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

test('presents recent-trading-day quote movement from existing quote fields without treating closed markets as unavailable', () => {
  assert.deepEqual(formatCompactQuoteMovement(0.25, 0.78, 32), { text: '+0.25（+0.78%）', tone: 'up', ariaLabel: '最近交易日上漲 0.25 元，漲幅 0.78%' });
  assert.deepEqual(formatCompactQuoteMovement(-0.15, -0.3, 50), { text: '-0.15（-0.30%）', tone: 'down', ariaLabel: '最近交易日下跌 0.15 元，跌幅 0.30%' });
  assert.deepEqual(formatCompactQuoteMovement(0, 0, 100.15), { text: '0.00（0.00%）', tone: 'hold', ariaLabel: '最近交易日平盤' });
  assert.deepEqual(formatCompactQuoteMovement(0.25, 0.78, 0), { text: '—', tone: 'hold', ariaLabel: '最近交易日漲跌資料不足' });
});

test('never presents an untrusted previous close as a daily movement', () => {
  assert.deepEqual(formatCompactQuoteMovement(-2.18, -5.86, 37.19, false), { text: '—', tone: 'hold', ariaLabel: '今日漲跌比較基準未驗證' });
});
