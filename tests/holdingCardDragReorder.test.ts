import assert from 'node:assert/strict';
import test from 'node:test';
import { moveHoldingDisplayOrderToIndex } from '../src/lib/holdingDisplayOrder';
import { resolveDragTargetIndex } from '../src/lib/holdingCardDragGeometry';

// ---- moveHoldingDisplayOrderToIndex (pure index-to-index reorder) ----

test('UR-TODO-071 moveHoldingDisplayOrderToIndex: first -> last', () => {
  assert.deepEqual(moveHoldingDisplayOrderToIndex(['A', 'B', 'C', 'D'], 'A', 3), ['B', 'C', 'D', 'A']);
});

test('UR-TODO-071 moveHoldingDisplayOrderToIndex: last -> first', () => {
  assert.deepEqual(moveHoldingDisplayOrderToIndex(['A', 'B', 'C', 'D'], 'D', 0), ['D', 'A', 'B', 'C']);
});

test('UR-TODO-071 moveHoldingDisplayOrderToIndex: middle -> middle', () => {
  assert.deepEqual(moveHoldingDisplayOrderToIndex(['A', 'B', 'C', 'D', 'E'], 'B', 3), ['A', 'C', 'D', 'B', 'E']);
  assert.deepEqual(moveHoldingDisplayOrderToIndex(['A', 'B', 'C', 'D', 'E'], 'D', 1), ['A', 'D', 'B', 'C', 'E']);
});

test('UR-TODO-071 moveHoldingDisplayOrderToIndex: same index is a no-op', () => {
  const order = ['A', 'B', 'C'];
  assert.deepEqual(moveHoldingDisplayOrderToIndex(order, 'B', 1), order);
});

test('UR-TODO-071 moveHoldingDisplayOrderToIndex: symbol not present in order is a no-op', () => {
  const order = ['A', 'B', 'C'];
  assert.deepEqual(moveHoldingDisplayOrderToIndex(order, 'ZZZ', 0), order);
});

test('UR-TODO-071 moveHoldingDisplayOrderToIndex: out-of-range targetIndex clamps to the nearest valid boundary', () => {
  assert.deepEqual(moveHoldingDisplayOrderToIndex(['A', 'B', 'C'], 'A', 99), ['B', 'C', 'A']);
  assert.deepEqual(moveHoldingDisplayOrderToIndex(['A', 'B', 'C'], 'C', -5), ['C', 'A', 'B']);
});

test('UR-TODO-071 moveHoldingDisplayOrderToIndex: single-item order is always a no-op', () => {
  assert.deepEqual(moveHoldingDisplayOrderToIndex(['A'], 'A', 0), ['A']);
});

test('UR-TODO-071 moveHoldingDisplayOrderToIndex: never mutates the input array', () => {
  const order = ['A', 'B', 'C', 'D'];
  const frozen = [...order];
  moveHoldingDisplayOrderToIndex(order, 'A', 2);
  assert.deepEqual(order, frozen);
});

test('UR-TODO-071 moveHoldingDisplayOrderToIndex: deterministic for the same inputs', () => {
  const first = moveHoldingDisplayOrderToIndex(['A', 'B', 'C', 'D'], 'B', 3);
  const second = moveHoldingDisplayOrderToIndex(['A', 'B', 'C', 'D'], 'B', 3);
  assert.deepEqual(first, second);
});

// ---- resolveDragTargetIndex (pure pointer-Y-to-index geometry) ----

test('UR-TODO-071 resolveDragTargetIndex: pointer above all siblings resolves to index 0', () => {
  assert.equal(resolveDragTargetIndex(10, [100, 200, 300]), 0);
});

test('UR-TODO-071 resolveDragTargetIndex: pointer below all siblings resolves to the last index', () => {
  assert.equal(resolveDragTargetIndex(500, [100, 200, 300]), 3);
});

test('UR-TODO-071 resolveDragTargetIndex: pointer between two sibling midpoints resolves to the boundary index', () => {
  assert.equal(resolveDragTargetIndex(150, [100, 200, 300]), 1);
  assert.equal(resolveDragTargetIndex(250, [100, 200, 300]), 2);
});

test('UR-TODO-071 resolveDragTargetIndex: pointer exactly at a midpoint is not yet past it (stable boundary)', () => {
  assert.equal(resolveDragTargetIndex(200, [100, 200, 300]), 1);
});

test('UR-TODO-071 resolveDragTargetIndex: empty sibling list always resolves to index 0', () => {
  assert.equal(resolveDragTargetIndex(999, []), 0);
});

test('UR-TODO-071 resolveDragTargetIndex: counts strictly-above-pointer siblings regardless of input order (no crash on malformed input)', () => {
  // Siblings are passed in current visual (top-to-bottom) order in practice, so midpoints are normally
  // sorted; this only asserts the function is a simple, safe count and never throws on malformed input.
  assert.equal(resolveDragTargetIndex(150, [300, 100, 200]), 1);
});
