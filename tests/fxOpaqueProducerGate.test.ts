import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveFxOpaqueProducerCapability, isFxOpaqueProducerEnabled } from '../src/lib/fxOpaqueProducerGate';

// --- Gate ---

test('UR-TODO-046 FX-F1D: current phase — Production is always OFF regardless of the source gate', () => {
  assert.equal(deriveFxOpaqueProducerCapability(true, 'production'), false);
  assert.equal(deriveFxOpaqueProducerCapability(false, 'production'), false);
});

test('UR-TODO-046 FX-F1D: current phase — Preview only has capability when the source gate is also enabled', () => {
  assert.equal(deriveFxOpaqueProducerCapability(false, 'preview'), false);
  assert.equal(deriveFxOpaqueProducerCapability(true, 'preview'), true);
});

test('UR-TODO-046 FX-F1D: current phase — this Sprint\'s wired source gate is OFF, so Preview is currently OFF too', () => {
  assert.equal(isFxOpaqueProducerEnabled('preview'), false);
  assert.equal(isFxOpaqueProducerEnabled('production'), false);
});

test('UR-TODO-046 FX-F1D: long-lived contract — Production can never satisfy the gate under any source gate value (exhaustive)', () => {
  for (const sourceGateEnabled of [true, false]) {
    assert.equal(deriveFxOpaqueProducerCapability(sourceGateEnabled, 'production'), false);
  }
});

test('UR-TODO-046 FX-F1D: long-lived contract — the gate is a deterministic pure function (same input, same output, repeatedly)', () => {
  for (let i = 0; i < 5; i += 1) {
    assert.equal(deriveFxOpaqueProducerCapability(true, 'preview'), true);
    assert.equal(deriveFxOpaqueProducerCapability(true, 'production'), false);
    assert.equal(deriveFxOpaqueProducerCapability(false, 'preview'), false);
    assert.equal(deriveFxOpaqueProducerCapability(false, 'production'), false);
  }
});

test('UR-TODO-046 FX-F1D: long-lived contract — invalid/unknown environment values are rejected by the existing environment contract, not re-implemented here', () => {
  const gate = readFileSync(new URL('../src/lib/fxOpaqueProducerGate.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(gate, /['"]staging['"]|['"]development['"]|===\s*['"]preview['"]\s*\|\|/, 'gate must not invent its own environment identity logic');
  assert.match(gate, /DeploymentEnvironment/, 'gate must reuse the existing DeploymentEnvironment type');
});

test('UR-TODO-046 FX-F1D: long-lived contract — the gate never reads localStorage, AppState, query string, or any runtime toggle', () => {
  const gate = readFileSync(new URL('../src/lib/fxOpaqueProducerGate.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(gate, /localStorage\s*\./, 'must not read/write localStorage');
  assert.doesNotMatch(gate, /window\.location/, 'must not read query string / URL state');
  assert.doesNotMatch(gate, /import\.meta\.env/, 'must not derive the source gate from Vite env');
  assert.doesNotMatch(gate, /:\s*AppState/, 'must not accept AppState as an input');
});

test('UR-TODO-046 FX-F1D: long-lived contract — producer capability is opt-in (false by default), not opt-out', () => {
  const gate = readFileSync(new URL('../src/lib/fxOpaqueProducerGate.ts', import.meta.url), 'utf8');
  assert.match(gate, /FX_OPAQUE_PRODUCER_SOURCE_GATE\s*=\s*false/);
});

// --- F1A preservation regression (gate must never touch preservation) ---

test('UR-TODO-046 FX-F1D: this module has zero coupling to opaque preservation (transactions.ts / normalizeTransactions)', () => {
  const gate = readFileSync(new URL('../src/lib/fxOpaqueProducerGate.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(gate, /from\s+['"]\.\/transactions['"]/, 'must not import from transactions.ts');
  assert.doesNotMatch(gate, /normalizeTransactions\s*\(|serializeTransactionCollection\s*\(/, 'must not call preservation logic');
});
