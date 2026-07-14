import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveClecStrategyCenter } from '../src/lib/clecStrategy';

const holdings = [{ symbol: 'AAA', name: '原型', targetWeight: 40 }, { symbol: 'BBB', name: '槓桿', targetWeight: 40 }, { symbol: 'CCC', name: '類現金', targetWeight: 20 }];
const base = (preset: 'custom' | 'clec-442' | 'clec-433' = 'clec-442') => ({ allocation: { preset, holdings, roleBySymbol: { AAA: 'prototype' as const, BBB: 'leveraged' as const, CCC: 'cash-like' as const } }, rebalanceMode: 'standard' as const, dataQuality: { passed: true, blockingReasons: [] as string[] }, trigger: { thresholdReached: false, allocationDeviation: 1, rebalanceThreshold: 5 } });
const byId = (id: string, result = deriveClecStrategyCenter(base())) => result.strategies.find(item => item.id === id)!;

test('433, 442 and custom remain target-weight sources rather than rebalance modes', () => {
  const fourFourTwo = deriveClecStrategyCenter(base('clec-442')), fourThreeThree = deriveClecStrategyCenter(base('clec-433')), custom = deriveClecStrategyCenter(base('custom'));
  assert.equal(fourFourTwo.allocationSource.label, 'CLEC 442'); assert.equal(fourThreeThree.allocationSource.label, 'CLEC 433'); assert.equal(custom.allocationSource.label, '自訂配置'); assert.equal(fourFourTwo.currentStrategy.rebalanceMode, 'standard'); assert.equal(fourFourTwo.strategies.some(item => item.id === 'clec-442' as any), false);
});
test('implemented and pending specification states remain explicit', () => {
  assert.deepEqual({ status: byId('standard').specificationStatus, executable: byId('standard').executable }, { status: 'implemented', executable: true }); assert.deepEqual({ status: byId('buy-only').specificationStatus, executable: byId('buy-only').executable }, { status: 'implemented', executable: true }); assert.deepEqual({ status: byId('annual-ratio-reset').specificationStatus, executable: byId('annual-ratio-reset').executable }, { status: 'verified-partial', executable: false }); assert.deepEqual({ status: byId('clec-smart-rebalance').specificationStatus, executable: byId('clec-smart-rebalance').executable }, { status: 'verified-partial', executable: false }); assert.deepEqual({ status: byId('clec-dynamic-contribution').specificationStatus, executable: byId('clec-dynamic-contribution').executable }, { status: 'unverified', executable: false }); assert.equal(byId('one-time-target-reset').sourceType, 'unverified-name'); assert.match(byId('one-time-target-reset').summary, /待確認概念/);
});
test('invalid roles and data-quality failures are preserved without invented zero values', () => {
  const invalid = deriveClecStrategyCenter({ ...base(), allocation: { ...base().allocation, roleBySymbol: { AAA: 'prototype', BBB: 'prototype', CCC: 'cash-like' } } }); const blocked = deriveClecStrategyCenter({ ...base(), dataQuality: { passed: false, blockingReasons: ['AAA 為過期報價。', 'BBB 報價日期不明。', 'CCC 使用備援價格。', '偵測到重複 symbol：AAA。'] }, trigger: { thresholdReached: null, allocationDeviation: null, rebalanceThreshold: null } });
  assert.equal(invalid.allocationSource.rolesValid, false); assert.ok(invalid.allocationSource.blockingReasons.length > 0); assert.equal(blocked.availableCalculation.canCalculateCurrentGap, false); assert.equal(blocked.trigger.allocationDeviation, null); assert.equal(blocked.dataQuality.blockingReasons.length, 4);
});
test('selector is pure and separates cash-like holdings, target source and execution', () => {
  const input = base(), before = JSON.stringify(input), result = deriveClecStrategyCenter(input); assert.equal(JSON.stringify(input), before); assert.equal(result.allocationSource.targetWeights.find(item => item.symbol === 'CCC')?.role, 'cash-like'); assert.equal(byId('clec-smart-rebalance', result).effects.some(item => /金額、股數或交易清單/.test(item)), true); assert.equal(byId('one-time-target-reset', result).effects.some(item => /不修改 targetWeight/.test(item)), true); assert.equal(result.availableCalculation.recommendationRoute, '/tools/rebalance-recommendation');
});
