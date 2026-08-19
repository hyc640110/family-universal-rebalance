import assert from 'node:assert/strict';
import test from 'node:test';
import { moveHoldingDisplayOrder, normalizeHoldingDisplayOrder, orderHoldingRows } from '../src/lib/holdingDisplayOrder';

const holding = (symbol: string, overrides: Partial<{ isArchived: boolean }> = {}) => ({
  symbol, name: symbol, shares: 0, avgCost: 0, targetWeight: 10, assetClass: 'growth' as const, ...overrides
});

test('UR-TODO-070 normalizeHoldingDisplayOrder: undefined raw falls back to holdings original active order', () => {
  const holdings = [holding('00662'), holding('00670L'), holding('00631L')];
  assert.deepEqual(normalizeHoldingDisplayOrder(undefined, holdings), ['00662', '00670L', '00631L']);
});

test('UR-TODO-070 normalizeHoldingDisplayOrder: empty array raw falls back to holdings original active order', () => {
  const holdings = [holding('00662'), holding('00670L')];
  assert.deepEqual(normalizeHoldingDisplayOrder([], holdings), ['00662', '00670L']);
});

test('UR-TODO-070 normalizeHoldingDisplayOrder: duplicate symbols in raw are deduped, first occurrence wins', () => {
  const holdings = [holding('00662'), holding('00670L')];
  assert.deepEqual(normalizeHoldingDisplayOrder(['00670L', '00662', '00670L'], holdings), ['00670L', '00662']);
});

test('UR-TODO-070 normalizeHoldingDisplayOrder: invalid/unknown symbols in raw are dropped', () => {
  const holdings = [holding('00662'), holding('00670L')];
  assert.deepEqual(normalizeHoldingDisplayOrder(['NOPE', '00670L', 'ALSO-NOPE', '00662'], holdings), ['00670L', '00662']);
});

test('UR-TODO-070 normalizeHoldingDisplayOrder: archived holdings are excluded even if present in raw', () => {
  const holdings = [holding('00662'), holding('00670L', { isArchived: true }), holding('00631L')];
  assert.deepEqual(normalizeHoldingDisplayOrder(['00670L', '00631L', '00662'], holdings), ['00631L', '00662']);
});

test('UR-TODO-070 normalizeHoldingDisplayOrder: active symbols missing from raw are appended in holdings original order', () => {
  const holdings = [holding('00662'), holding('00670L'), holding('00631L'), holding('00865B')];
  assert.deepEqual(normalizeHoldingDisplayOrder(['00631L'], holdings), ['00631L', '00662', '00670L', '00865B']);
});

test('UR-TODO-070 normalizeHoldingDisplayOrder: a valid full preference is respected as-is', () => {
  const holdings = [holding('00662'), holding('00670L'), holding('00631L')];
  assert.deepEqual(normalizeHoldingDisplayOrder(['00631L', '00662', '00670L'], holdings), ['00631L', '00662', '00670L']);
});

test('UR-TODO-070 normalizeHoldingDisplayOrder: deterministic for the same inputs, and never mutates holdings', () => {
  const holdings = [holding('00662'), holding('00670L'), holding('00631L')];
  const frozenHoldings = JSON.parse(JSON.stringify(holdings));
  const first = normalizeHoldingDisplayOrder(['00631L', '00662'], holdings);
  const second = normalizeHoldingDisplayOrder(['00631L', '00662'], holdings);
  assert.deepEqual(first, second);
  assert.deepEqual(holdings, frozenHoldings);
});

test('UR-TODO-070 moveHoldingDisplayOrder: moves a symbol up one position', () => {
  assert.deepEqual(moveHoldingDisplayOrder(['A', 'B', 'C'], 'B', 'up'), ['B', 'A', 'C']);
});

test('UR-TODO-070 moveHoldingDisplayOrder: moves a symbol down one position', () => {
  assert.deepEqual(moveHoldingDisplayOrder(['A', 'B', 'C'], 'B', 'down'), ['A', 'C', 'B']);
});

test('UR-TODO-070 moveHoldingDisplayOrder: moving the first item up is a no-op', () => {
  const order = ['A', 'B', 'C'];
  assert.deepEqual(moveHoldingDisplayOrder(order, 'A', 'up'), order);
});

test('UR-TODO-070 moveHoldingDisplayOrder: moving the last item down is a no-op', () => {
  const order = ['A', 'B', 'C'];
  assert.deepEqual(moveHoldingDisplayOrder(order, 'C', 'down'), order);
});

test('UR-TODO-070 moveHoldingDisplayOrder: a single-item order is a no-op in both directions', () => {
  const order = ['A'];
  assert.deepEqual(moveHoldingDisplayOrder(order, 'A', 'up'), order);
  assert.deepEqual(moveHoldingDisplayOrder(order, 'A', 'down'), order);
});

test('UR-TODO-070 moveHoldingDisplayOrder: never mutates the input array', () => {
  const order = ['A', 'B', 'C'];
  const frozen = [...order];
  moveHoldingDisplayOrder(order, 'B', 'up');
  assert.deepEqual(order, frozen);
});

test('UR-TODO-070 orderHoldingRows: reorders rows to match a display order', () => {
  const rows = [{ symbol: '00662', value: 1 }, { symbol: '00670L', value: 2 }, { symbol: '00631L', value: 3 }];
  const ordered = orderHoldingRows(rows, ['00631L', '00670L', '00662']);
  assert.deepEqual(ordered.map(r => r.symbol), ['00631L', '00670L', '00662']);
});

test('UR-TODO-070 orderHoldingRows: appends rows missing from the order in their original relative order, without mutating rows', () => {
  const rows = [{ symbol: '00662' }, { symbol: '00670L' }, { symbol: '00631L' }];
  const frozenRows = JSON.parse(JSON.stringify(rows));
  const ordered = orderHoldingRows(rows, ['00631L']);
  assert.deepEqual(ordered.map(r => r.symbol), ['00631L', '00662', '00670L']);
  assert.deepEqual(rows, frozenRows);
});

test('UR-TODO-070 isolation: reordering never changes any row field other than array position', () => {
  const rows = [
    { symbol: '00662', shares: 100, avgCost: 20, targetWeight: 40, assetClass: 'growth' as const },
    { symbol: '00631L', shares: 50, avgCost: 38.4, targetWeight: 60, assetClass: 'growth' as const }
  ];
  const ordered = orderHoldingRows(rows, ['00631L', '00662']);
  assert.deepEqual(ordered.find(r => r.symbol === '00662'), rows[0]);
  assert.deepEqual(ordered.find(r => r.symbol === '00631L'), rows[1]);
});
