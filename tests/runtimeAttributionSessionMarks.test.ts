import assert from 'node:assert/strict';
import test from 'node:test';
import { toggleRuntimeAttributionMark } from '../src/lib/runtimeAttributionSessionMarks';

test('toggling an id twice returns to the original (unmarked) state', () => {
  const empty = new Set<string>();
  const marked = toggleRuntimeAttributionMark(empty, 'txn-1');
  assert.ok(marked.has('txn-1'));
  const unmarked = toggleRuntimeAttributionMark(marked, 'txn-1');
  assert.ok(!unmarked.has('txn-1'));
});

test('marking one id never affects another id', () => {
  const afterFirst = toggleRuntimeAttributionMark(new Set(), 'txn-a');
  const afterSecond = toggleRuntimeAttributionMark(afterFirst, 'txn-b');
  assert.ok(afterSecond.has('txn-a'));
  assert.ok(afterSecond.has('txn-b'));

  const afterUnmarkingA = toggleRuntimeAttributionMark(afterSecond, 'txn-a');
  assert.ok(!afterUnmarkingA.has('txn-a'));
  assert.ok(afterUnmarkingA.has('txn-b'), 'unmarking txn-a must not affect txn-b');
});

test('never mutates the set passed in, always returns a new Set instance', () => {
  const original = new Set(['txn-x']);
  const result = toggleRuntimeAttributionMark(original, 'txn-y');
  assert.equal(original.has('txn-y'), false, 'the input set must not be mutated');
  assert.notEqual(result, original);
});

test('repeated toggling on the same id is idempotent across many cycles', () => {
  let current: ReadonlySet<string> = new Set();
  for (let i = 0; i < 5; i += 1) current = toggleRuntimeAttributionMark(current, 'txn-1');
  // 5 toggles from empty: on, off, on, off, on -> ends marked
  assert.ok(current.has('txn-1'));
});
