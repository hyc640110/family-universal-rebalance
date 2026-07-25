import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrderSuggestions, type OrderHelperMetrics, type OrderHelperRow, type OrderHelperState } from '../src/lib/rebalanceOrderHelper';

// V7.0B sub-PR 4a (UR-TODO-008): characterization tests for getOrderSuggestions BEFORE any investableCash wiring
// (sub-PR 4b). These lock in the current cash basis (m.cash, i.e. the raw account total, not investableCash) and
// the current buy/sell/defensive/budget behavior, so sub-PR 4b's diff is limited to intentional, reviewable
// changes instead of silent regressions. getOrderSuggestions itself was moved out of src/App.tsx into
// src/lib/rebalanceOrderHelper.ts (pure relocation, no logic change) specifically so this file can import and
// exercise the real production function — App.tsx cannot be imported by tests/*.test.ts at all, since it (and its
// ./constants/appInfo import) reference import.meta.env at module scope, a Vite-only global that throws under the
// plain Node ESM runtime tsx --test uses. See 008_TODO_BACKLOG.md UR-TODO-008 and AI_CONTEXT/003_CURRENT_STATUS.md
// §12.3 for the read-only inventory this file is based on.

const NOW = '2026-07-25T00:00:00.000Z';

const stock = (symbol: string, price: number, shares: number, assetClass: 'growth' | 'defensive', targetWeight: number): OrderHelperRow => ({
  symbol, shares, avgCost: price, assetClass, targetWeight,
  quote: { symbol, name: symbol, price, previousClose: null, previousCloseTrusted: false, change: null, changePct: null, volume: 0, source: '測試報價', updatedAt: NOW },
  marketValue: price * shares
});

function run(rows: OrderHelperRow[], overrides: { cashBalance?: number; rebalanceMode?: OrderHelperState['rebalanceMode']; buyOnlyBudget?: number } = {}) {
  const cash = overrides.cashBalance ?? 0;
  const state: OrderHelperState = { rebalanceMode: overrides.rebalanceMode ?? 'standard', buyOnlyBudget: overrides.buyOnlyBudget ?? 0, holdings: rows };
  const stocksTotal = rows.reduce((total, row) => total + row.marketValue, 0);
  const defensiveHoldingsValue = rows.filter(row => row.assetClass === 'defensive').reduce((total, row) => total + row.marketValue, 0);
  const m: OrderHelperMetrics = { rows, totalAssets: stocksTotal + cash, cash, defensiveHoldingsValue };
  const quotes = Object.fromEntries(rows.map(row => [row.symbol, row.quote]));
  return getOrderSuggestions(state, quotes, m);
}

test('is deterministic and does not mutate state, quotes or m', () => {
  const rows = [stock('AAA', 100, 5, 'growth', 80)];
  const state: OrderHelperState = { rebalanceMode: 'standard', buyOnlyBudget: 0, holdings: rows };
  const m: OrderHelperMetrics = { rows, totalAssets: 2500, cash: 2000, defensiveHoldingsValue: 0 };
  const quotes = { AAA: rows[0].quote };
  const before = structuredClone({ state, quotes, m });
  const first = getOrderSuggestions(state, quotes, m);
  const second = getOrderSuggestions(state, quotes, m);
  assert.deepEqual(first, second);
  assert.deepEqual({ state, quotes, m }, before);
});

test('standard mode, sufficient cash: buy gap funded in full from raw account cash (m.cash), not a safety-reserve-aware basis', () => {
  const result = run([stock('AAA', 100, 5, 'growth', 80)], { cashBalance: 2000, rebalanceMode: 'standard' });
  // totalAssets = 500 (AAA) + 2000 (cash) = 2500; target 80% => 2000; diff = 2000 - 500 = 1500
  assert.equal(result.cash, 2000);
  assert.equal(result.totalBuyAmount, 1500);
  assert.equal(result.growthBuy.length, 1);
  assert.equal(result.growthBuy[0].amount, 1500);
  assert.equal(result.cashEnough, true);
  assert.equal(result.shortage, 0);
});

test('standard mode, insufficient cash: shortage is totalBuyAmount minus raw m.cash, sell-side proceeds are never netted in', () => {
  const result = run([
    stock('AAA', 100, 1, 'growth', 70),
    stock('BBB', 100, 1, 'growth', 25)
  ], { cashBalance: 10, rebalanceMode: 'standard' });
  // totalAssets = 100 + 100 + 10 = 210
  // AAA target 147, diff +47 (buy); BBB target 52.5, diff -47.5 (sell) — sell proceeds do not offset the buy shortage
  assert.equal(result.growthBuy.length, 1);
  assert.equal(result.growthBuy[0].symbol, 'AAA');
  assert.equal(result.growthBuy[0].amount, 47);
  assert.equal(result.growthSell.length, 1);
  assert.equal(result.growthSell[0].symbol, 'BBB');
  assert.equal(result.growthSell[0].amount, 47.5);
  assert.equal(result.cashEnough, false);
  assert.equal(result.shortage, 37);
});

test('buy-only mode, sufficient cash and budget: single gap funded in full, cashLimited stays false', () => {
  const result = run([stock('AAA', 100, 5, 'growth', 80)], { cashBalance: 2000, rebalanceMode: 'buy-only', buyOnlyBudget: 2000 });
  // totalAssets = 2500 as above; fullBuyGap 1500; buyOnlyLimit = min(2000, 2000) = 2000
  assert.equal(result.buyOnlyLimit, 2000);
  assert.equal(result.fullBuyGap, 1500);
  assert.equal(result.growthBuy[0].amount, 1500);
  assert.equal(result.cashLimited, false);
  assert.equal(result.shortage, 0);
});

test('buy-only mode, budget-capped: multiple buy gaps are filled largest-diff-first and clipped at buyOnlyLimit, remainder reported as shortage', () => {
  const result = run([
    stock('AAA', 100, 0, 'growth', 40),
    stock('BBB', 100, 0, 'growth', 30)
  ], { cashBalance: 1000, rebalanceMode: 'buy-only', buyOnlyBudget: 500 });
  // totalAssets = 0 + 0 + 1000 = 1000; AAA diff 400, BBB diff 300; fullBuyGap 700; buyOnlyLimit = min(500,1000) = 500
  // waterfall: AAA gets 400 (remaining 100), BBB gets capped to the remaining 100
  assert.equal(result.buyOnlyLimit, 500);
  assert.equal(result.fullBuyGap, 700);
  assert.deepEqual(result.growthBuy.map(item => [item.symbol, item.amount]), [['AAA', 400], ['BBB', 100]]);
  assert.equal(result.totalBuyAmount, 500);
  assert.equal(result.cashLimited, true);
  assert.equal(result.shortage, 200);
  assert.equal(result.skippedSell.length, 0);
});

test('buy-only mode with an invalid (zero or negative) budget sets hasInvalidBuyOnlyBudget and clamps buyOnlyLimit to 0', () => {
  const zero = run([], { cashBalance: 100, rebalanceMode: 'buy-only', buyOnlyBudget: 0 });
  assert.equal(zero.hasInvalidBuyOnlyBudget, true);
  assert.equal(zero.buyOnlyLimit, 0);
  const negative = run([], { cashBalance: 100, rebalanceMode: 'buy-only', buyOnlyBudget: -500 });
  assert.equal(negative.buyOnlyBudget, 0);
  assert.equal(negative.hasInvalidBuyOnlyBudget, true);
});

test('standard mode with no growth holdings at all reports fullBuyGap 0 and no buy/sell suggestions', () => {
  const result = run([], { cashBalance: 500, rebalanceMode: 'standard' });
  assert.equal(result.fullBuyGap, 0);
  assert.equal(result.growthBuy.length, 0);
  assert.equal(result.totalBuyAmount, 0);
  assert.equal(result.shortage, 0);
  assert.equal(result.cashEnough, true);
});

test('a growth holding exactly at its target weight produces zero diff and is excluded from both buy and sell lists', () => {
  const result = run([stock('AAA', 100, 10, 'growth', 100)], { cashBalance: 0, rebalanceMode: 'standard' });
  // totalAssets = 1000 + 0 = 1000; target 100% => 1000; diff = 0
  assert.equal(result.fullBuyGap, 0);
  assert.equal(result.growthBuy.length, 0);
  assert.equal(result.growthSell.length, 0);
});

test('multiple simultaneous buy and sell gaps: growthBuy is sorted largest-diff-first, growthSell carries the over-target holding', () => {
  const result = run([
    stock('AAA', 100, 1, 'growth', 60),
    stock('BBB', 100, 1, 'growth', 20),
    stock('CCC', 100, 8, 'growth', 10)
  ], { cashBalance: 1000, rebalanceMode: 'standard' });
  // totalAssets = 100+100+800+1000 = 2000; AAA diff +1100, BBB diff +300, CCC diff -600
  assert.deepEqual(result.growthBuy.map(item => item.symbol), ['AAA', 'BBB']);
  assert.equal(result.growthBuy[0].amount, 1100);
  assert.equal(result.growthBuy[1].amount, 300);
  assert.equal(result.growthSell.length, 1);
  assert.equal(result.growthSell[0].symbol, 'CCC');
  assert.equal(result.growthSell[0].amount, 600);
  assert.equal(result.totalBuyAmount, 1400);
  assert.equal(result.shortage, 400);
});

test('defensive reminder: no defensive holdings at all reports status "missing"', () => {
  const result = run([stock('AAA', 100, 5, 'growth', 80)], { cashBalance: 500, rebalanceMode: 'standard' });
  assert.equal(result.defensiveReminder.status, 'missing');
  assert.equal(result.defensiveReminder.items.length, 0);
});

test('defensive reminder: a defensive holding more than 999 below its target amount reports status "under"', () => {
  const result = run([
    stock('AAA', 100, 5, 'growth', 30),
    stock('DDD', 100, 0, 'defensive', 50)
  ], { cashBalance: 2000, rebalanceMode: 'standard' });
  // totalAssets = 500 + 0 + 2000 = 2500; DDD target 1250, diff = 1250 (> 999)
  assert.equal(result.defensiveReminder.status, 'under');
  assert.equal(result.defensiveReminder.item?.symbol, 'DDD');
  assert.equal(result.defensiveReminder.item?.amount, 1250);
});

test('defensive reminder: a defensive holding more than 999 above its target amount reports status "over"', () => {
  const result = run([
    stock('AAA', 100, 1, 'growth', 10),
    stock('DDD', 100, 50, 'defensive', 10)
  ], { cashBalance: 100, rebalanceMode: 'standard' });
  // totalAssets = 100 + 5000 + 100 = 5200; DDD target 520, diff = 520 - 5000 = -4480 (< -999)
  assert.equal(result.defensiveReminder.status, 'over');
  assert.equal(result.defensiveReminder.item?.symbol, 'DDD');
  assert.equal(result.defensiveReminder.item?.amount, 4480);
});

test('defensive reminder: a defensive holding within 999 of its target amount reports status "ok" (neutral)', () => {
  const result = run([
    stock('AAA', 100, 1, 'growth', 10),
    stock('DDD', 100, 10, 'defensive', 90)
  ], { cashBalance: 0, rebalanceMode: 'standard' });
  // totalAssets = 100 + 1000 + 0 = 1100; DDD target 990, diff = 990 - 1000 = -10 (within +/-999)
  assert.equal(result.defensiveReminder.status, 'ok');
  assert.equal(result.defensiveReminder.item?.symbol, 'DDD');
  assert.equal(result.defensiveReminder.item?.amount, 10);
});
