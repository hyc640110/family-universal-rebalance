import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runClecHistoricalBacktest } from '../src/lib/clecHistoricalBacktest';

const returns = (prototype: number, leveraged = 0, cashLike = 0) => ({
  prototype,
  leveraged,
  'cash-like': cashLike
});

const input = (overrides: Record<string, unknown> = {}) => ({
  preset: 'clec-442' as const,
  initialCapital: 100,
  periods: [{ date: '2026-01-02', returnPctByRole: returns(0) }],
  threshold: { drift: 5, significantMultiplier: 2 },
  ...overrides
});

const ok = (value: ReturnType<typeof runClecHistoricalBacktest>) => {
  assert.equal(value.status, 'ok');
  return value;
};

test('uses allocation preset previews as the target-weight source for all four CLEC presets', () => {
  const expected = {
    'clec-442': { prototype: 40, leveraged: 40, 'cash-like': 20 },
    'clec-433': { prototype: 40, leveraged: 30, 'cash-like': 30 },
    'clec-703': { prototype: 0, leveraged: 70, 'cash-like': 30 },
    'clec-5050': { prototype: 0, leveraged: 50, 'cash-like': 50 }
  } as const;

  for (const preset of Object.keys(expected) as Array<keyof typeof expected>) {
    assert.deepEqual(ok(runClecHistoricalBacktest(input({ preset }))).targetWeights, expected[preset]);
  }
});

test('zero percent returns preserve capital without a rebalance or drawdown', () => {
  const result = ok(runClecHistoricalBacktest(input({
    periods: [
      { date: '2026-01-02', returnPctByRole: returns(0) },
      { date: '2026-01-03', returnPctByRole: returns(0) }
    ]
  })));

  assert.equal(result.finalValue, 100);
  assert.equal(result.totalReturnPct, 0);
  assert.equal(result.rebalanceCount, 0);
  assert.equal(result.maxDrawdownPct, 0);
  assert.ok(result.periods.every(period => period.rule.decisionStatus === 'no_action' && !period.rebalanced));
});

test('below-threshold drift keeps the formal rule at no_action and never rebalances', () => {
  const result = ok(runClecHistoricalBacktest(input({
    periods: [{ date: '2026-01-02', returnPctByRole: returns(5) }]
  })));

  assert.equal(result.periods[0].rule.decisionStatus, 'no_action');
  assert.equal(result.periods[0].rule.recommendedAction, 'hold');
  assert.equal(result.periods[0].rebalanced, false);
});

test('rebalance_consider remains a non-trading signal', () => {
  const result = ok(runClecHistoricalBacktest(input({
    threshold: { drift: 3, significantMultiplier: 2 },
    periods: [{ date: '2026-01-02', returnPctByRole: returns(20) }]
  })));

  assert.equal(result.periods[0].rule.decisionStatus, 'rebalance_consider');
  assert.equal(result.periods[0].rule.recommendedAction, 'hold');
  assert.equal(result.periods[0].rebalanced, false);
});

test('full_rebalance is the sole execution trigger and restores the preset weights frictionlessly', () => {
  const result = ok(runClecHistoricalBacktest(input({
    periods: [{ date: '2026-01-02', returnPctByRole: returns(50) }]
  })));
  const period = result.periods[0];

  assert.equal(period.rule.decisionStatus, 'rebalance_required');
  assert.equal(period.rule.recommendedAction, 'full_rebalance');
  assert.equal(period.rebalanced, true);
  assert.equal(result.rebalanceCount, 1);
  assert.deepEqual(Object.fromEntries(Object.entries(period.endingValues).map(([role, value]) => [role, value / period.endingPortfolioValue * 100])), result.targetWeights);
});

test('carries each ending value into the next opening value without creating or losing value at rebalance', () => {
  const result = ok(runClecHistoricalBacktest(input({
    periods: [
      { date: '2026-01-02', returnPctByRole: returns(50) },
      { date: '2026-01-03', returnPctByRole: returns(0, 10, 0) }
    ]
  })));

  assert.deepEqual(result.periods[1].openingValues, result.periods[0].endingValues);
  assert.equal(result.periods[0].endingPortfolioValue, Object.values(result.periods[0].closingValuesBeforeRebalance).reduce((sum, value) => sum + value, 0));
});

test('reports max drawdown as a positive magnitude from the running period-ending peak', () => {
  const result = ok(runClecHistoricalBacktest(input({
    threshold: { drift: 101, significantMultiplier: 2 },
    periods: [
      { date: '2026-01-02', returnPctByRole: returns(20, 20, 20) },
      { date: '2026-01-03', returnPctByRole: returns(-25, -25, -25) }
    ]
  })));

  assert.equal(result.finalValue, 90);
  assert.equal(result.maxDrawdownPct, 25);
});

test('fails closed for non-finite and less-than-negative-one-hundred return percentages', () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -100.0001]) {
    const result = runClecHistoricalBacktest(input({
      periods: [{ date: '2026-01-02', returnPctByRole: returns(value) }]
    }));
    assert.equal(result.status, 'invalid_input');
  }
});

test('fails closed for non-positive capital, invalid thresholds, and custom presets', () => {
  for (const overrides of [
    { initialCapital: 0 },
    { threshold: { drift: -1 } },
    { threshold: { drift: 5, significantMultiplier: 0 } },
    { preset: 'custom' }
  ]) {
    const result = runClecHistoricalBacktest(input(overrides) as Parameters<typeof runClecHistoricalBacktest>[0]);
    assert.equal(result.status, 'invalid_input');
  }
});

test('fails closed for invalid, repeated, or descending Asia/Taipei calendar dates', () => {
  for (const dates of [['2026-02-30'], ['2026-01-02', '2026-01-02'], ['2026-01-03', '2026-01-02']]) {
    const result = runClecHistoricalBacktest(input({
      periods: dates.map(date => ({ date, returnPctByRole: returns(0) }))
    }));
    assert.equal(result.status, 'invalid_input');
  }
});

test('backtest delegates the action decision to deriveClecStrategyRule instead of implementing a second drift rule', () => {
  const source = readFileSync(new URL('../src/lib/clecHistoricalBacktest.ts', import.meta.url), 'utf8');
  assert.match(source, /deriveClecStrategyRule\(/);
  assert.doesNotMatch(source, /decisionStatus\s*===\s*['"]rebalance_consider['"]\s*\).*full_rebalance/s);
});
