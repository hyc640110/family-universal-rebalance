import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/performanceMetrics.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const metrics = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const asset = (overrides = {}) => ({ symbol: 'AAA', name: '測試資產', shares: 100, avgCost: 100, cost: 10000, marketValue: 12000, pnl: 2000, dayPnl: 100, previousClose: 119, ...overrides });
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} should equal ${expected}`);

const empty = metrics.calculatePortfolioPerformance([]);
assert.equal(empty.assets.length, 0, 'no holdings remains empty');

const single = metrics.calculatePortfolioPerformance([asset()]);
assert.equal(single.totalCost, 10000, 'single holding cost');
assert.equal(single.totalMarketValue, 12000, 'single holding market value');
assert.equal(single.unrealizedPnl, 2000, 'single holding unrealized pnl');
closeTo(single.returnRate, 0.2);
closeTo(single.todayReturnRate, 12000 / 11900 - 1);

const mixed = metrics.calculatePortfolioPerformance([asset({ symbol: 'GOOD', marketValue: 15000, cost: 10000, previousClose: 140 }), asset({ symbol: 'LOSS', marketValue: 5000, cost: 10000, previousClose: 55 }), asset({ symbol: 'ZERO', shares: 0 })]);
assert.equal(mixed.assets.length, 2, 'zero-share holding is excluded');
assert.equal(mixed.unrealizedPnl, 0, 'mixed gains and losses aggregate correctly');
assert.deepEqual(metrics.calculatePnlContribution(mixed.assets).map(item => item.symbol), ['GOOD', 'LOSS'], 'contribution sort is descending');

const zeroCost = metrics.calculatePortfolioPerformance([asset({ cost: 0, avgCost: 0, marketValue: 3000 })]);
assert.equal(zeroCost.returnRate, null, 'zero cost has no return rate');
assert.equal(zeroCost.assets[0].returnRate, null, 'zero-cost asset has no return rate');

const noPrevious = metrics.calculatePortfolioPerformance([asset({ previousClose: 0 })]);
assert.equal(noPrevious.todayReturnRate, null, 'missing previous close has no daily return rate');

const invalid = metrics.calculatePortfolioPerformance([asset({ shares: Number.NaN, cost: Infinity, marketValue: Number.NaN }), asset({ symbol: 'VALID', shares: 1, cost: 100, marketValue: 160, previousClose: 150 })]);
assert.equal(invalid.assets.length, 1, 'invalid shares are excluded');
assert.equal(invalid.totalMarketValue, 160, 'invalid numeric values cannot poison totals');

const concentrated = metrics.calculatePortfolioPerformance([asset({ symbol: 'BIG', shares: 1, cost: 100, marketValue: 800, previousClose: 700 }), asset({ symbol: 'SMALL', shares: 1, cost: 100, marketValue: 200, previousClose: 190 })]);
const concentration = metrics.calculatePortfolioConcentration(concentrated);
closeTo(concentration.largestMarketValueRatio, 0.8);
closeTo(concentration.topThreeMarketValueRatio, 1);
closeTo(concentration.largestProfitRatio, 0.875);

const allLoss = metrics.calculatePortfolioPerformance([asset({ marketValue: 9000, cost: 10000 }), asset({ symbol: 'LOSS2', marketValue: 8000, cost: 10000 })]);
assert.equal(metrics.calculatePortfolioConcentration(allLoss).largestProfitRatio, null, 'all-loss portfolio has no positive-profit concentration');

console.log('PASS Performance metric calculations: empty, single, multi, zero cost, missing quote, zero shares, gains, losses, sorting, concentration, invalid values');
