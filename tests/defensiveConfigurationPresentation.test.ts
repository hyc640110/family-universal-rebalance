import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveDefensiveConfigurationPresentation } from '../src/lib/defensiveConfigurationPresentation';

test('preserves known values and keeps defensive theory separate from execution', () => {
  const result = deriveDefensiveConfigurationPresentation({
    defensiveTotalRatio: 42.5,
    protectedSafetyCash: 120_000,
    defensiveHoldingsRatio: 18.25,
    investableCash: 80_000,
    theoreticalDefensiveConfigurationShortfall: 25_000,
    safetyCashShortfall: 0,
    executionMethod: 'buy-only',
    canExecute: true,
    blockingReasons: [],
  });

  assert.deepEqual(result.defensiveTotalRatio, { status: 'known', value: 42.5, isExplicitZero: false });
  assert.deepEqual(result.protectedSafetyCash, { status: 'known', value: 120_000, isExplicitZero: false });
  assert.deepEqual(result.defensiveHoldingsRatio, { status: 'known', value: 18.25, isExplicitZero: false });
  assert.deepEqual(result.investableCash, { status: 'known', value: 80_000, isExplicitZero: false });
  assert.deepEqual(result.theory.defensiveConfigurationShortfall, {
    status: 'known',
    value: 25_000,
    isExplicitZero: false,
  });
  assert.deepEqual(result.theory.safetyCashShortfall, { status: 'known', value: 0, isExplicitZero: true });
  assert.deepEqual(result.execution, {
    status: 'available',
    method: 'buy-only',
    blockingReasons: [],
  });
});

test('keeps explicit zero known and never converts unavailable values to zero', () => {
  const result = deriveDefensiveConfigurationPresentation({
    defensiveTotalRatio: 0,
    protectedSafetyCash: 0,
    defensiveHoldingsRatio: null,
    investableCash: Number.NaN,
    theoreticalDefensiveConfigurationShortfall: Number.POSITIVE_INFINITY,
    safetyCashShortfall: null,
    executionMethod: null,
    canExecute: false,
    blockingReasons: [],
  });

  assert.deepEqual(result.defensiveTotalRatio, { status: 'known', value: 0, isExplicitZero: true });
  assert.deepEqual(result.protectedSafetyCash, { status: 'known', value: 0, isExplicitZero: true });
  assert.deepEqual(result.defensiveHoldingsRatio, { status: 'unavailable', value: null, isExplicitZero: false });
  assert.deepEqual(result.investableCash, { status: 'unavailable', value: null, isExplicitZero: false });
  assert.deepEqual(result.theory.defensiveConfigurationShortfall, {
    status: 'unavailable',
    value: null,
    isExplicitZero: false,
  });
  assert.deepEqual(result.theory.safetyCashShortfall, { status: 'unavailable', value: null, isExplicitZero: false });
  assert.deepEqual(result.execution, {
    status: 'unavailable',
    method: null,
    blockingReasons: [],
  });
});

test('preserves upstream blocking reasons without inventing executable amounts', () => {
  const blockingReasons = [
    { code: 'INSUFFICIENT_LIQUIDITY_DATA', message: '流動性資料不足' },
    { code: 'NO_EXECUTABLE_BUDGET', message: '目前沒有可執行買入額度' },
  ];

  const result = deriveDefensiveConfigurationPresentation({
    defensiveTotalRatio: 35,
    protectedSafetyCash: 100_000,
    defensiveHoldingsRatio: 10,
    investableCash: null,
    theoreticalDefensiveConfigurationShortfall: null,
    safetyCashShortfall: 15_000,
    executionMethod: 'standard',
    canExecute: false,
    blockingReasons,
  });

  assert.equal(result.execution.status, 'blocked');
  assert.equal(result.execution.method, 'standard');
  assert.deepEqual(result.execution.blockingReasons, blockingReasons);
  assert.notStrictEqual(result.execution.blockingReasons, blockingReasons);
  assert.deepEqual(result.theory.defensiveConfigurationShortfall, {
    status: 'unavailable',
    value: null,
    isExplicitZero: false,
  });
  assert.deepEqual(result.investableCash, { status: 'unavailable', value: null, isExplicitZero: false });
});
