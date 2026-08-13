import { isCanonicalCalendarDay } from './calendarDay';
import type { FinancialTransaction, OpaqueFinancialTransactionEnvelope } from './transactions';

/**
 * UR-TODO-046 FX-F2B: pure FX conversion pairing identity foundation.
 *
 * This module answers exactly one question — "do these two existing `FinancialTransaction`
 * records, plus this opaque payload, together describe one deterministic, fail-safe FX
 * conversion?" — and nothing else. It is domain-neutral with respect to F1A opaque
 * preservation: a malformed or unsupported FX payload is still a valid
 * `OpaqueFinancialTransactionEnvelope` from F1A's point of view (lossless preservation is
 * unconditional), it simply resolves here to `invalid`/`unsupported` rather than `valid`.
 *
 * No producer, no UI, no `FinancialEvent` integration, no reconciliation change. This module
 * has zero write path — it only classifies data that a future, separately-authorized producer
 * would create (UR-TODO-046 FX-F1C/F1D: Production must stay OFF until that authorization).
 *
 * Identity model (see FX-F2B Review):
 * - `envelope.id` IS the conversion identity — the payload never stores a second, redundant
 *   `conversionId`.
 * - `sourceTransactionId`/`destinationTransactionId` reference existing `FinancialTransaction.id`
 *   values directly — there is no separate `legId`.
 * - `sourceCurrency`/`destinationCurrency`/`sourceAmount`/`destinationAmount` are pinned,
 *   immutable historical facts in the payload (not resolved-only), validated against their
 *   linked transaction at resolution time, so the conversion remains a complete economic-event
 *   snapshot even if a linked transaction is later deleted.
 * - `accountId` is deliberately NOT stored — it is always resolved from the linked
 *   `FinancialTransaction`, because a fixed, single `FinancialAccount.currency` already implies
 *   the two legs cannot share an account for a genuine TWD<->USD conversion; storing it would
 *   be a redundant, never-independently-useful copy.
 * - `executedRate` is never persisted — it is 100% deterministically derivable from the pinned
 *   amounts, so persisting it would create a third authoritative fact competing with the two leg
 *   amounts. A market/reference-close rate (see fxValuation.ts) is a completely different fact
 *   and must never substitute for it.
 */

export const FX_CONVERSION_PAYLOAD_KIND = 'fx-conversion' as const;
export const FX_CONVERSION_PAYLOAD_VERSION = 1 as const;

export type FxConversionCurrency = 'TWD' | 'USD';
const SUPPORTED_FX_CONVERSION_CURRENCIES: ReadonlySet<string> = new Set(['TWD', 'USD']);

/**
 * Four-state fee contract (FX-F2B Review §12): `none` and `included` are explicit user
 * declarations, never inferred from a missing field. `unknown` is the fail-safe default for
 * "not declared" — it must never be silently treated as `none` (fee=0) by any downstream
 * consumer.
 */
export type FxConversionFeeTreatment =
  | { type: 'none' }
  | { type: 'explicit'; feeTransactionId: string }
  | { type: 'included' }
  | { type: 'unknown' };

export type FxConversionOpaquePayloadV1 = {
  kind: typeof FX_CONVERSION_PAYLOAD_KIND;
  payloadVersion: typeof FX_CONVERSION_PAYLOAD_VERSION;
  sourceTransactionId: string;
  destinationTransactionId: string;
  sourceCurrency: FxConversionCurrency;
  destinationCurrency: FxConversionCurrency;
  sourceAmount: number;
  destinationAmount: number;
  effectiveDate: string;
  feeTreatment: FxConversionFeeTreatment;
};

/** True only when the payload explicitly opts into being an FX conversion candidate — mirrors
 * F1A's `isOpaqueTransactionEnvelopeCandidate()`: structural shape detection, not a version gate. */
export function isFxConversionPayloadCandidate(payload: unknown): payload is Record<string, unknown> {
  return Boolean(payload) && typeof payload === 'object' && !Array.isArray(payload)
    && (payload as Record<string, unknown>).kind === FX_CONVERSION_PAYLOAD_KIND;
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const isFiniteAmount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function parseFxConversionFeeTreatment(value: unknown): FxConversionFeeTreatment | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  if (row.type === 'none') return { type: 'none' };
  if (row.type === 'included') return { type: 'included' };
  if (row.type === 'unknown') return { type: 'unknown' };
  if (row.type === 'explicit' && isNonEmptyString(row.feeTransactionId)) return { type: 'explicit', feeTransactionId: row.feeTransactionId.trim() };
  return undefined;
}

export type FxConversionPayloadParseFailureReason =
  | 'unsupported-payload-version'
  | 'malformed-payload'
  | 'unsupported-currency-pair'
  | 'same-currency';

export type FxConversionPayloadParseResult =
  | { ok: true; payload: FxConversionOpaquePayloadV1 }
  | { ok: false; reason: FxConversionPayloadParseFailureReason };

/**
 * Parses a candidate payload's *shape* only — no linked-transaction, duplicate, or amount-vs-
 * transaction cross-validation happens here (that is resolveFxConversionEnvelope's job). Kept
 * separate from F1A's envelope parser: F1A only decides whether the envelope itself is a valid
 * opaque record; this decides whether ITS payload is a valid FX conversion v1 request. A payload
 * that fails here is still a perfectly valid, preserved opaque envelope from F1A's perspective.
 */
export function parseFxConversionPayloadV1(payload: Record<string, unknown>): FxConversionPayloadParseResult {
  if (payload.payloadVersion !== FX_CONVERSION_PAYLOAD_VERSION) return { ok: false, reason: 'unsupported-payload-version' };
  const sourceTransactionId = payload.sourceTransactionId;
  const destinationTransactionId = payload.destinationTransactionId;
  const sourceCurrency = payload.sourceCurrency;
  const destinationCurrency = payload.destinationCurrency;
  const sourceAmount = payload.sourceAmount;
  const destinationAmount = payload.destinationAmount;
  const effectiveDate = payload.effectiveDate;
  const feeTreatment = parseFxConversionFeeTreatment(payload.feeTreatment);
  if (!isNonEmptyString(sourceTransactionId) || !isNonEmptyString(destinationTransactionId)
    || typeof sourceCurrency !== 'string' || typeof destinationCurrency !== 'string'
    || !isFiniteAmount(sourceAmount) || !isFiniteAmount(destinationAmount)
    || !isCanonicalCalendarDay(effectiveDate) || !feeTreatment) return { ok: false, reason: 'malformed-payload' };
  if (!SUPPORTED_FX_CONVERSION_CURRENCIES.has(sourceCurrency) || !SUPPORTED_FX_CONVERSION_CURRENCIES.has(destinationCurrency)) {
    return { ok: false, reason: 'unsupported-currency-pair' };
  }
  if (sourceCurrency === destinationCurrency) return { ok: false, reason: 'same-currency' };
  return {
    ok: true,
    payload: {
      kind: FX_CONVERSION_PAYLOAD_KIND, payloadVersion: FX_CONVERSION_PAYLOAD_VERSION,
      sourceTransactionId: sourceTransactionId.trim(), destinationTransactionId: destinationTransactionId.trim(),
      sourceCurrency: sourceCurrency as FxConversionCurrency, destinationCurrency: destinationCurrency as FxConversionCurrency,
      sourceAmount, destinationAmount, effectiveDate, feeTreatment
    }
  };
}

/**
 * Canonical quote convention: TWD per USD, always — regardless of conversion direction. Purely
 * derived from the two pinned leg amounts; never reads fxValuation.ts/cbcFxProvider.ts, never
 * fetches, never persisted. A market/reference-close rate is a different fact and must never
 * substitute for this.
 */
export function deriveFxConversionExecutedRate(payload: Pick<FxConversionOpaquePayloadV1, 'sourceCurrency' | 'destinationCurrency' | 'sourceAmount' | 'destinationAmount'>): number | undefined {
  const twdAmount = payload.sourceCurrency === 'TWD' ? payload.sourceAmount : payload.destinationCurrency === 'TWD' ? payload.destinationAmount : undefined;
  const usdAmount = payload.sourceCurrency === 'USD' ? payload.sourceAmount : payload.destinationCurrency === 'USD' ? payload.destinationAmount : undefined;
  if (twdAmount === undefined || usdAmount === undefined || !(twdAmount > 0) || !(usdAmount > 0)) return undefined;
  const rate = twdAmount / usdAmount;
  return Number.isFinite(rate) && rate > 0 ? rate : undefined;
}

export type FxConversionFeeResolution =
  | { status: 'none' }
  | { status: 'included' }
  | { status: 'unknown' }
  | { status: 'explicit-resolved'; feeTransactionId: string }
  | { status: 'explicit-unresolved'; feeTransactionId: string };

/**
 * Never fails the principal conversion — a malformed/unresolved explicit fee link only degrades
 * the fee's own resolution status, per FX-F2B Review §12/§22 ("malformed explicit fee does not
 * invalidate principal"). `unknown` and `included` never derive or imply a fee amount.
 */
export function resolveFxConversionFeeTreatment(feeTreatment: FxConversionFeeTreatment, transactionsById: ReadonlyMap<string, FinancialTransaction>): FxConversionFeeResolution {
  if (feeTreatment.type === 'none') return { status: 'none' };
  if (feeTreatment.type === 'included') return { status: 'included' };
  if (feeTreatment.type === 'unknown') return { status: 'unknown' };
  return transactionsById.has(feeTreatment.feeTransactionId)
    ? { status: 'explicit-resolved', feeTransactionId: feeTreatment.feeTransactionId }
    : { status: 'explicit-unresolved', feeTransactionId: feeTreatment.feeTransactionId };
}

export type FxConversionResolutionFailureReason =
  | FxConversionPayloadParseFailureReason
  | 'same-source-destination'
  | 'missing-source-transaction'
  | 'missing-destination-transaction'
  | 'source-currency-mismatch'
  | 'destination-currency-mismatch'
  | 'non-positive-amount'
  | 'source-amount-mismatch'
  | 'destination-amount-mismatch'
  | 'duplicate-transaction-claim';

export type FxConversionResolution =
  | {
    status: 'valid'; conversionId: string; sourceTransactionId: string; destinationTransactionId: string;
    sourceCurrency: FxConversionCurrency; destinationCurrency: FxConversionCurrency; sourceAmount: number; destinationAmount: number;
    effectiveDate: string; executedRate: number; feeResolution: FxConversionFeeResolution;
  }
  | { status: 'invalid'; conversionId: string; reason: FxConversionResolutionFailureReason }
  | { status: 'unsupported'; conversionId: string; reason: FxConversionResolutionFailureReason }
  | { status: 'duplicate'; conversionId: string; reason: FxConversionResolutionFailureReason };

const INVALID_PARSE_REASONS: ReadonlySet<FxConversionPayloadParseFailureReason> = new Set(['malformed-payload', 'same-currency']);

/**
 * Resolves exactly one opaque envelope in isolation — no cross-envelope duplicate detection
 * (see resolveFxConversions for that). Never throws; a missing linked transaction always
 * resolves to `unsupported`, never auto-repaired, never silently guessed at.
 */
export function resolveFxConversionEnvelope(envelope: OpaqueFinancialTransactionEnvelope, transactionsById: ReadonlyMap<string, FinancialTransaction>): FxConversionResolution | null {
  if (!isFxConversionPayloadCandidate(envelope.payload)) return null;
  const conversionId = envelope.id;
  const parsed = parseFxConversionPayloadV1(envelope.payload);
  if (!parsed.ok) return { status: INVALID_PARSE_REASONS.has(parsed.reason) ? 'invalid' : 'unsupported', conversionId, reason: parsed.reason };
  const payload = parsed.payload;
  if (payload.sourceTransactionId === payload.destinationTransactionId) return { status: 'invalid', conversionId, reason: 'same-source-destination' };
  const sourceTransaction = transactionsById.get(payload.sourceTransactionId);
  if (!sourceTransaction) return { status: 'unsupported', conversionId, reason: 'missing-source-transaction' };
  const destinationTransaction = transactionsById.get(payload.destinationTransactionId);
  if (!destinationTransaction) return { status: 'unsupported', conversionId, reason: 'missing-destination-transaction' };
  if (!(payload.sourceAmount > 0) || !(payload.destinationAmount > 0)) return { status: 'invalid', conversionId, reason: 'non-positive-amount' };
  if (sourceTransaction.currency !== payload.sourceCurrency) return { status: 'invalid', conversionId, reason: 'source-currency-mismatch' };
  if (destinationTransaction.currency !== payload.destinationCurrency) return { status: 'invalid', conversionId, reason: 'destination-currency-mismatch' };
  if (sourceTransaction.amount !== payload.sourceAmount) return { status: 'invalid', conversionId, reason: 'source-amount-mismatch' };
  if (destinationTransaction.amount !== payload.destinationAmount) return { status: 'invalid', conversionId, reason: 'destination-amount-mismatch' };
  const executedRate = deriveFxConversionExecutedRate(payload);
  if (executedRate === undefined) return { status: 'invalid', conversionId, reason: 'non-positive-amount' };
  return {
    status: 'valid', conversionId, sourceTransactionId: payload.sourceTransactionId, destinationTransactionId: payload.destinationTransactionId,
    sourceCurrency: payload.sourceCurrency, destinationCurrency: payload.destinationCurrency, sourceAmount: payload.sourceAmount, destinationAmount: payload.destinationAmount,
    effectiveDate: payload.effectiveDate, executedRate, feeResolution: resolveFxConversionFeeTreatment(payload.feeTreatment, transactionsById)
  };
}

/**
 * Resolves every FX conversion candidate among the given opaque envelopes, then applies pure,
 * identity-only duplicate detection: any `FinancialTransaction` claimed (as either leg) by more
 * than one otherwise-identity-resolved candidate marks every claimant `duplicate`. Never uses
 * date, amount closeness, memo, account name, institution, or list adjacency to pair or
 * deduplicate — only explicit `sourceTransactionId`/`destinationTransactionId` claims.
 */
export function resolveFxConversions(envelopes: readonly OpaqueFinancialTransactionEnvelope[], transactions: readonly FinancialTransaction[]): FxConversionResolution[] {
  const transactionsById = new Map(transactions.map(transaction => [transaction.id, transaction]));
  const results: FxConversionResolution[] = [];
  const claimants = new Map<string, string[]>();
  for (const envelope of envelopes) {
    const resolution = resolveFxConversionEnvelope(envelope, transactionsById);
    if (!resolution) continue;
    results.push(resolution);
    if (resolution.status === 'valid') {
      for (const transactionId of [resolution.sourceTransactionId, resolution.destinationTransactionId]) {
        const existing = claimants.get(transactionId) || [];
        existing.push(resolution.conversionId);
        claimants.set(transactionId, existing);
      }
    }
  }
  const duplicateConversionIds = new Set<string>();
  for (const claimantIds of claimants.values()) if (claimantIds.length > 1) claimantIds.forEach(id => duplicateConversionIds.add(id));
  return results.map(resolution => duplicateConversionIds.has(resolution.conversionId)
    ? { status: 'duplicate', conversionId: resolution.conversionId, reason: 'duplicate-transaction-claim' }
    : resolution);
}

/**
 * UR-TODO-046 FX-F2C-1: pure delete-linkage guard. Returns the `conversionId` of the FX
 * conversion that legitimately references `transactionId` as a leg, or `undefined` if no such
 * active conversion exists. Only a `valid`-resolved envelope counts as "active" — a malformed
 * opaque payload, a payload whose linked transaction is missing, or one that fails cross-
 * validation must never block deletion of an unrelated transaction (F1A's Preserve≠Interpret
 * boundary: an opaque record that cannot be interpreted has no economic claim on anything).
 * There is no producer yet, so in normal operation this will simply find nothing; the helper
 * exists so the ordinary delete path stays safe once a producer starts writing real envelopes.
 */
export function findLinkedFxConversionId(transactionId: string, transactions: readonly FinancialTransaction[], opaqueTransactions: readonly OpaqueFinancialTransactionEnvelope[]): string | undefined {
  const transactionsById = new Map(transactions.map(transaction => [transaction.id, transaction]));
  for (const envelope of opaqueTransactions) {
    const resolution = resolveFxConversionEnvelope(envelope, transactionsById);
    if (resolution?.status === 'valid' && (resolution.sourceTransactionId === transactionId || resolution.destinationTransactionId === transactionId)) {
      return resolution.conversionId;
    }
  }
  return undefined;
}
