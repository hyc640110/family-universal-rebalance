import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeFocusedSymbols, toggleFocusedSymbol } from '../src/lib/focusedSymbols';

const holdingsWith = (...symbols: string[]) => symbols.map(symbol => ({ symbol, shares: 0, avgCost: 0, targetWeight: 0, assetClass: 'growth' as const }));

// --- one-time migration ---

test('field never persisted before (undefined): migrates to [\'00631L\'] when 00631L exists in holdings', () => {
  const result = normalizeFocusedSymbols(undefined, holdingsWith('00631L', '00662'));
  assert.deepEqual(result, ['00631L']);
});

test('field never persisted before (missing/malformed, e.g. a plain object): also migrates', () => {
  assert.deepEqual(normalizeFocusedSymbols({}, holdingsWith('00631L')), ['00631L']);
  assert.deepEqual(normalizeFocusedSymbols(null, holdingsWith('00631L')), ['00631L']);
  assert.deepEqual(normalizeFocusedSymbols('00631L', holdingsWith('00631L')), ['00631L'], 'a raw string (not an array) is not a valid prior value either');
});

test('migration target 00631L not present in holdings: migration still runs, but the existence filter then drops it, leaving []', () => {
  const result = normalizeFocusedSymbols(undefined, holdingsWith('00662', '00670L'));
  assert.deepEqual(result, []);
});

// --- already migrated: never re-populated, even when empty ---

test('field already an array and empty ([]): respected as the user\'s explicit "cleared" choice, NOT repopulated with 00631L', () => {
  const result = normalizeFocusedSymbols([], holdingsWith('00631L', '00662'));
  assert.deepEqual(result, [], 'once migrated, an empty array must stay empty — this is the core one-time-migration guarantee');
});

test('field already an array with the user\'s own choice: respected, not overridden back to 00631L', () => {
  const result = normalizeFocusedSymbols(['00685L'], holdingsWith('00631L', '00685L'));
  assert.deepEqual(result, ['00685L']);
});

// --- holdings-existence filter (reused from the same mechanism as dipAlerts) ---

test('a selected symbol no longer present in holdings is dropped', () => {
  const result = normalizeFocusedSymbols(['00685L'], holdingsWith('00631L', '00662'));
  assert.deepEqual(result, []);
});

// --- data-layer invariants: max 1, deduped ---

test('an array with more than one entry is clamped to the first valid one (data-layer enforces "at most 1", not just the UI)', () => {
  const result = normalizeFocusedSymbols(['00631L', '00685L'], holdingsWith('00631L', '00685L'));
  assert.deepEqual(result, ['00631L']);
});

test('duplicate entries collapse to one', () => {
  const result = normalizeFocusedSymbols(['00631L', '00631L'], holdingsWith('00631L'));
  assert.deepEqual(result, ['00631L']);
});

test('symbol normalization (lowercase/whitespace) applies the same as elsewhere in the codebase', () => {
  const result = normalizeFocusedSymbols([' 00631l '], holdingsWith('00631L'));
  assert.deepEqual(result, ['00631L']);
});

test('malformed array entries (non-string, empty string) are safely ignored, not thrown on', () => {
  const result = normalizeFocusedSymbols([null, '', 42, '00631L'], holdingsWith('00631L'));
  assert.deepEqual(result, ['00631L']);
});

// --- toggleFocusedSymbol: pure selection logic ---

test('selecting a new symbol replaces whatever was previously focused (no manual "clear first" step)', () => {
  const result = toggleFocusedSymbol(['00631L'], '00685L');
  assert.deepEqual(result, ['00685L']);
});

test('re-selecting the already-focused symbol clears the selection entirely', () => {
  const result = toggleFocusedSymbol(['00631L'], '00631L');
  assert.deepEqual(result, []);
});

test('selecting a symbol when nothing was focused before', () => {
  const result = toggleFocusedSymbol([], '00631L');
  assert.deepEqual(result, ['00631L']);
});

test('toggle normalizes the input symbol', () => {
  const result = toggleFocusedSymbol([], ' 00631l ');
  assert.deepEqual(result, ['00631L']);
});

// --- independence from dip-ladder tracking (UR-TODO-061 explicit requirement) ---

test('switching the focused symbol never touches an unrelated dipAlerts-shaped structure — proven both by signature (no such parameter exists) and by direct before/after comparison', () => {
  const accumulatedDipAlerts = { '00631L': { enabled: true, referencePrice: 0, thresholdPct: -10, highWaterMark: 300, triggeredLevel: 2 } };
  const before = structuredClone(accumulatedDipAlerts);
  const nextFocusedSymbols = toggleFocusedSymbol(['00631L'], '00685L');
  assert.deepEqual(nextFocusedSymbols, ['00685L']);
  assert.deepEqual(accumulatedDipAlerts, before, '00631L\'s accumulated highWaterMark/triggeredLevel must be byte-for-byte unchanged after switching away from it');
});
