import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const canonicalTotals = readFileSync(new URL('../src/lib/canonicalNetWorthTotals.ts', import.meta.url), 'utf8');

test('UR-TODO-046 FX-A3: App.tsx does not import the FX-A2 CBC provider adapter (no startup/render auto-fetch)', () => {
  assert.doesNotMatch(app, /cbcFxProvider/);
  assert.doesNotMatch(app, /fetchCbcUsdTwdFxRateHistory/);
});

test('UR-TODO-046 FX-A3: the canonical totals producer performs no network I/O (pure function of already-loaded state)', () => {
  assert.doesNotMatch(canonicalTotals, /\bfetch\s*\(/);
  assert.doesNotMatch(canonicalTotals, /cbcFxProvider/);
});
