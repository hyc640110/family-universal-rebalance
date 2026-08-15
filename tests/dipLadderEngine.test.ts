import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveDipLadderUpdate, initialDipLadderState, type DipLadderQuoteInput, type DipLadderState } from '../src/lib/dipLadderEngine';

const quote = (overrides: Partial<DipLadderQuoteInput> = {}): DipLadderQuoteInput => ({
  price: 100, quoteStatus: 'today', quoteSource: 'Price Worker', ...overrides,
});

// --- initialization ---

test('highWaterMark null (not yet tracking): the first acceptable quote initializes it to the current price, no trigger', () => {
  const result = deriveDipLadderUpdate(initialDipLadderState, quote({ price: 300 }));
  assert.equal(result.ignored, false);
  assert.deepEqual(result.state, { highWaterMark: 300, triggeredLevel: null });
  assert.equal(result.drawdownPct, 0);
  assert.equal(result.newlyTriggeredLevel, null);
  assert.equal(result.didUpdateHighWaterMark, true);
});

// --- normal, non-triggered cases ---

test('price exactly equal to the recorded high: not a new high (strict >), not triggered', () => {
  const state: DipLadderState = { highWaterMark: 300, triggeredLevel: null };
  const result = deriveDipLadderUpdate(state, quote({ price: 300 }));
  assert.equal(result.didUpdateHighWaterMark, false);
  assert.equal(result.drawdownPct, 0);
  assert.equal(result.newlyTriggeredLevel, null);
  assert.deepEqual(result.state, state);
});

test('price above the recorded high: a new high, high-water mark advances, no trigger', () => {
  const state: DipLadderState = { highWaterMark: 300, triggeredLevel: null };
  const result = deriveDipLadderUpdate(state, quote({ price: 305 }));
  assert.equal(result.didUpdateHighWaterMark, true);
  assert.deepEqual(result.state, { highWaterMark: 305, triggeredLevel: null });
  assert.equal(result.newlyTriggeredLevel, null);
});

// --- the user-specified worked example: 300 -> 269 (level 1) -> 265 (no repeat) -> 239 (level 2) ---

test('sequential drops trigger levels in order without repeating an already-triggered level', () => {
  let state: DipLadderState = { highWaterMark: 300, triggeredLevel: null };

  const step1 = deriveDipLadderUpdate(state, quote({ price: 269 }));
  assert.equal(step1.newlyTriggeredLevel, 1);
  state = step1.state;
  assert.deepEqual(state, { highWaterMark: 300, triggeredLevel: 1 });

  const step2 = deriveDipLadderUpdate(state, quote({ price: 265 }));
  assert.equal(step2.newlyTriggeredLevel, null, '265 is still within level 1 (drawdown ~11.7%), must not re-trigger');
  state = step2.state;
  assert.deepEqual(state, { highWaterMark: 300, triggeredLevel: 1 });

  const step3 = deriveDipLadderUpdate(state, quote({ price: 239 }));
  assert.equal(step3.newlyTriggeredLevel, 2);
  state = step3.state;
  assert.deepEqual(state, { highWaterMark: 300, triggeredLevel: 2 });
});

// --- ratchet: oscillating within/below an already-triggered level never re-triggers or regresses ---

test('oscillating within the same triggered level (repeated ups and downs, no new high) never re-triggers', () => {
  let state: DipLadderState = { highWaterMark: 300, triggeredLevel: null };
  state = deriveDipLadderUpdate(state, quote({ price: 225 })).state; // -25% -> level 2
  assert.equal(state.triggeredLevel, 2);

  const bounceUp = deriveDipLadderUpdate(state, quote({ price: 234 })); // -22% -> still level 2
  assert.equal(bounceUp.newlyTriggeredLevel, null);
  assert.equal(bounceUp.state.triggeredLevel, 2);

  const dipAgain = deriveDipLadderUpdate(bounceUp.state, quote({ price: 216 })); // -28% -> still level 2
  assert.equal(dipAgain.newlyTriggeredLevel, null);
  assert.equal(dipAgain.state.triggeredLevel, 2);
});

test('the ladder never regresses on a partial recovery — only a genuine new high resets it', () => {
  let state: DipLadderState = { highWaterMark: 300, triggeredLevel: 2 }; // simulates level 2 already triggered
  const recovered = deriveDipLadderUpdate(state, quote({ price: 285 })); // -5%, well below any level, still under the high
  assert.equal(recovered.didUpdateHighWaterMark, false, 'not a new high (285 < 300)');
  assert.equal(recovered.newlyTriggeredLevel, null);
  assert.equal(recovered.state.triggeredLevel, 2, 'triggeredLevel must not regress just because the current drawdown looks smaller');
});

// --- new-high reset ---

test('a new high (even a marginal one) resets triggeredLevel to null and updates the high-water mark', () => {
  const state: DipLadderState = { highWaterMark: 300, triggeredLevel: 2 };
  const result = deriveDipLadderUpdate(state, quote({ price: 300.01 }));
  assert.equal(result.didUpdateHighWaterMark, true);
  assert.deepEqual(result.state, { highWaterMark: 300.01, triggeredLevel: null });
  assert.equal(result.newlyTriggeredLevel, null, 'a new high itself is never a "trigger"');
});

test('after a new-high reset, the ladder re-triggers correctly from the new high', () => {
  const afterNewHigh: DipLadderState = { highWaterMark: 400, triggeredLevel: null };
  const result = deriveDipLadderUpdate(afterNewHigh, quote({ price: 358 })); // -10.5% off the NEW high
  assert.equal(result.newlyTriggeredLevel, 1);
  assert.deepEqual(result.state, { highWaterMark: 400, triggeredLevel: 1 });
});

// --- boundary values ---

test('boundary: exactly -10.0% triggers level 1 (inclusive threshold)', () => {
  const result = deriveDipLadderUpdate({ highWaterMark: 100, triggeredLevel: null }, quote({ price: 90 }));
  assert.equal(result.drawdownPct, -10);
  assert.equal(result.newlyTriggeredLevel, 1);
});

test('boundary: -19.99% stays at level 1, does not reach level 2', () => {
  const result = deriveDipLadderUpdate({ highWaterMark: 100, triggeredLevel: null }, quote({ price: 80.01 }));
  assert.ok(result.drawdownPct !== null && result.drawdownPct > -20 && result.drawdownPct < -19);
  assert.equal(result.newlyTriggeredLevel, 1);
});

test('boundary: exactly -20.00% reaches level 2, not level 1', () => {
  const result = deriveDipLadderUpdate({ highWaterMark: 100, triggeredLevel: null }, quote({ price: 80 }));
  assert.equal(result.drawdownPct, -20);
  assert.equal(result.newlyTriggeredLevel, 2);
});

test('boundary: a drawdown under 10% (e.g. -9.99%) triggers no level at all', () => {
  const result = deriveDipLadderUpdate({ highWaterMark: 100, triggeredLevel: null }, quote({ price: 90.01 }));
  assert.equal(result.newlyTriggeredLevel, null);
  assert.equal(result.state.triggeredLevel, null);
});

// --- quote-quality gate: ignored updates leave state completely untouched ---

const untouchedState: DipLadderState = { highWaterMark: 300, triggeredLevel: 1 };

for (const status of ['stale', 'unknown', 'unavailable'] as const) {
  test(`quoteStatus '${status}' is ignored: state is returned byte-for-byte unchanged even though the price would otherwise trigger a new level`, () => {
    const result = deriveDipLadderUpdate(untouchedState, quote({ price: 100, quoteStatus: status })); // would be a huge, deep drawdown if accepted
    assert.equal(result.ignored, true);
    assert.equal(result.drawdownPct, null);
    assert.equal(result.newlyTriggeredLevel, null);
    assert.equal(result.didUpdateHighWaterMark, false);
    assert.equal(result.state, untouchedState, 'must be the exact same object reference, proving no recomputation happened');
  });
}

test('a backup/average-cost quote source is ignored even when quoteStatus looks acceptable (today)', () => {
  for (const source of ['成交均價備援', '備援報價', '離線快取'] as const) {
    const result = deriveDipLadderUpdate(untouchedState, quote({ price: 1000, quoteStatus: 'today', quoteSource: source })); // would look like a huge new high
    assert.equal(result.ignored, true, `source "${source}" must be treated as unacceptable`);
    assert.equal(result.state, untouchedState);
  }
});

test('a non-finite or non-positive price is ignored regardless of quoteStatus (defensive boundary validation)', () => {
  for (const price of [NaN, Infinity, -Infinity, 0, -50]) {
    const result = deriveDipLadderUpdate(untouchedState, quote({ price }));
    assert.equal(result.ignored, true, `price ${price} must be rejected`);
    assert.equal(result.state, untouchedState);
  }
});

test('recovery: after one or more ignored (stale) quotes, the next acceptable quote compares against the original untouched state, with no residual corruption', () => {
  const original: DipLadderState = { highWaterMark: 300, triggeredLevel: 1 };
  const ignored1 = deriveDipLadderUpdate(original, quote({ price: 50, quoteStatus: 'stale' }));
  const ignored2 = deriveDipLadderUpdate(ignored1.state, quote({ price: 999, quoteSource: '備援報價' }));
  assert.equal(ignored2.state, original);

  // a genuinely valid quote afterwards must behave exactly as if the ignored quotes never happened
  const result = deriveDipLadderUpdate(ignored2.state, quote({ price: 239 })); // -20.33% off the original 300 high -> level 2
  assert.equal(result.newlyTriggeredLevel, 2);
  assert.deepEqual(result.state, { highWaterMark: 300, triggeredLevel: 2 });
});

test('recent-trading-day quoteStatus is accepted, exactly like today', () => {
  const result = deriveDipLadderUpdate({ highWaterMark: 300, triggeredLevel: null }, quote({ price: 269, quoteStatus: 'recent-trading-day' }));
  assert.equal(result.ignored, false);
  assert.equal(result.newlyTriggeredLevel, 1);
});
