import type { DeploymentEnvironment } from './environmentBoundary';

/**
 * UR-TODO-046 FX-F1D: narrow, source-controlled capability gate for a future FX opaque
 * transaction producer. This module intentionally has no relationship to opaque
 * *preservation* (see transactions.ts / OpaqueFinancialTransactionEnvelope, UR-TODO-046
 * FX-F1A) — preservation of an already-existing opaque record is unconditional and must
 * never be gated by producer capability. This module only answers whether a producer is
 * allowed to create a *new* one.
 *
 * Two independent layers, both must hold:
 *  1. Source gate — a hardcoded constant below. Flipping it to `true` is an explicit,
 *     reviewable code diff in its own PR; it is never derived from Vite env, localStorage,
 *     AppState, a runtime toggle, or a query string.
 *  2. Environment guard — reuses the existing, already-validated `DeploymentEnvironment`
 *     (see environmentBoundary.ts's `environmentIdentity()`, which itself fails closed on
 *     any value other than 'preview'/'production'). Production can never satisfy this gate
 *     regardless of the source gate's value.
 *
 * FX-F1C found that no persistence-layer signal can retroactively protect a pre-F1A/stale
 * client from silently destroying an opaque record it does not recognize (architecture
 * constraint, not a defect this gate attempts to fix). This gate is therefore a controlled
 * -rollout risk-reduction tool — it prevents Production from producing new opaque data
 * before a human has explicitly authorized it — not an absolute compatibility guarantee.
 */

/** Current phase value. Flipped to `true` in UR-TODO-046 FX-F2C-3 (its own, explicitly
 * authorized PR) — this is the controlled-rollout gate ON decision. Combined with the
 * environment guard below, this unlocks the producer in Preview only; Production remains OFF
 * regardless of this value. Unlocking Production is a distinct future decision requiring its
 * own PR. */
const FX_OPAQUE_PRODUCER_SOURCE_GATE = true;

/**
 * Pure two-argument contract: producer capability requires both the source gate and a
 * Preview environment. This function's logic is long-lived — it should not need to change
 * when the source gate is eventually flipped to `true`, and should not need to be deleted
 * when Production is eventually authorized to unlock the first producer (only the source
 * gate value, and this environment condition if the rollout plan changes, would move).
 */
export function deriveFxOpaqueProducerCapability(sourceGateEnabled: boolean, deploymentEnvironment: DeploymentEnvironment): boolean {
  return sourceGateEnabled && deploymentEnvironment === 'preview';
}

/** The single entry point any future producer must call before creating an opaque record. */
export function isFxOpaqueProducerEnabled(deploymentEnvironment: DeploymentEnvironment): boolean {
  return deriveFxOpaqueProducerCapability(FX_OPAQUE_PRODUCER_SOURCE_GATE, deploymentEnvironment);
}
