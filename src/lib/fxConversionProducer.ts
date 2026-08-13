import { isCanonicalCalendarDay } from './calendarDay';
import {
  FX_CONVERSION_PAYLOAD_KIND, FX_CONVERSION_PAYLOAD_VERSION, isFxConversionPayloadCandidate, resolveFxConversionEnvelope, resolveFxConversions,
  type FxConversionCurrency, type FxConversionFeeTreatment, type FxConversionOpaquePayloadV1, type FxConversionResolutionFailureReason
} from './fxConversionIdentity';
import {
  createTransactionId, TRANSACTION_OPAQUE_ENVELOPE_VERSION, updateTransaction as buildTransactionRecord,
  type AccountReference, type FinancialTransaction, type OpaqueFinancialTransactionEnvelope
} from './transactions';

/**
 * UR-TODO-046 FX-F2C-2: pure Manual FX Conversion Producer. This module answers "given user
 * input, build the exactly-three-record atomic FX conversion, or refuse" — it never calls
 * `setState`, never touches localStorage/the DOM, never fetches, and never reads a market/
 * reference-close rate (see FX-F2B's `deriveFxConversionExecutedRate` for the read-only,
 * never-persisted derived rate the caller may display). The caller (App.tsx) owns the single
 * `setState` commit and the F1D gate/environment resolution; this module is gate-agnostic
 * except for the explicit `gateEnabled` boolean passed in by the caller (per ADR-010, "hidden
 * UI does not equal a safely blocked producer" — this is the second, write-path layer).
 */

const SUPPORTED_CURRENCIES: ReadonlySet<string> = new Set(['TWD', 'USD']);

export type FxConversionCreationInput = {
  sourceAccountId: string;
  sourceAmount: number;
  destinationAccountId: string;
  destinationAmount: number;
  effectiveDate: string;
  feeTreatment: FxConversionFeeTreatment;
  note?: string;
};

export type FxConversionCreationContext = {
  accounts: readonly AccountReference[];
  transactions: readonly FinancialTransaction[];
  opaqueTransactions: readonly OpaqueFinancialTransactionEnvelope[];
  /** Resolved once by the caller via `isFxOpaqueProducerEnabled(deploymentEnvironment)` — this module never imports the gate itself, so it cannot accidentally diverge from the single source of truth. */
  gateEnabled: boolean;
  timestamp?: string;
};

export type FxConversionCreationFailureReason =
  | 'invalid-source-account'
  | 'invalid-destination-account'
  | 'same-account'
  | 'unsupported-currency-pair'
  | 'invalid-source-amount'
  | 'invalid-destination-amount'
  | 'invalid-effective-date'
  | 'invalid-fee-treatment'
  | 'explicit-fee-transaction-not-found'
  | 'leg-construction-failed'
  | FxConversionResolutionFailureReason;

export type FxConversionCreationResult =
  | { status: 'success'; conversionId: string; sourceLeg: FinancialTransaction; destinationLeg: FinancialTransaction; envelope: OpaqueFinancialTransactionEnvelope }
  | { status: 'invalid'; reason: FxConversionCreationFailureReason }
  | { status: 'unsupported'; reason: FxConversionCreationFailureReason }
  | { status: 'duplicate'; reason: FxConversionCreationFailureReason }
  | { status: 'gate-blocked' };

function isValidFeeTreatment(value: FxConversionFeeTreatment): boolean {
  if (!value || typeof value !== 'object') return false;
  if (value.type === 'none' || value.type === 'included' || value.type === 'unknown') return true;
  return value.type === 'explicit' && typeof value.feeTransactionId === 'string' && value.feeTransactionId.trim() !== '';
}

/**
 * Builds the exactly-three-record FX conversion (source leg, destination leg, opaque
 * envelope) entirely in memory, validating every step before returning anything — the
 * caller commits all three (or none) in a single `setState()` (see App.tsx's `createFxConversion`).
 * Never throws; every failure path returns a typed result instead.
 */
export function buildFxConversionCreation(input: FxConversionCreationInput, context: FxConversionCreationContext): FxConversionCreationResult {
  // 1. Gate check — first, before any other validation, so a blocked producer never leaks why an input would otherwise have been accepted.
  if (!context.gateEnabled) return { status: 'gate-blocked' };

  // 2. Account validation.
  const sourceAccount = context.accounts.find(account => account.id === input.sourceAccountId);
  if (!sourceAccount || !sourceAccount.isActive) return { status: 'invalid', reason: 'invalid-source-account' };
  const destinationAccount = context.accounts.find(account => account.id === input.destinationAccountId);
  if (!destinationAccount || !destinationAccount.isActive) return { status: 'invalid', reason: 'invalid-destination-account' };
  if (sourceAccount.id === destinationAccount.id) return { status: 'invalid', reason: 'same-account' };

  // 3. Currency validation — exactly one TWD leg and one USD leg, either direction.
  const currencyPair = new Set([sourceAccount.currency, destinationAccount.currency]);
  if (currencyPair.size !== 2 || !SUPPORTED_CURRENCIES.has(sourceAccount.currency) || !SUPPORTED_CURRENCIES.has(destinationAccount.currency)) {
    return { status: 'invalid', reason: 'unsupported-currency-pair' };
  }

  // 4. Amount validation.
  if (!Number.isFinite(input.sourceAmount) || !(input.sourceAmount > 0)) return { status: 'invalid', reason: 'invalid-source-amount' };
  if (!Number.isFinite(input.destinationAmount) || !(input.destinationAmount > 0)) return { status: 'invalid', reason: 'invalid-destination-amount' };

  // 5. effectiveDate validation.
  if (!isCanonicalCalendarDay(input.effectiveDate)) return { status: 'invalid', reason: 'invalid-effective-date' };

  // 6. feeTreatment validation — an explicit link to a fee transaction that does not exist is
  // refused up front rather than persisted as a known-broken link (FX-F2C Review §21/§11: prefer
  // failing early over creating data with an already-known-unresolved fee link).
  if (!isValidFeeTreatment(input.feeTreatment)) return { status: 'invalid', reason: 'invalid-fee-treatment' };
  if (input.feeTreatment.type === 'explicit') {
    const feeTransactionId = input.feeTreatment.feeTransactionId;
    if (!context.transactions.some(transaction => transaction.id === feeTransactionId)) {
      return { status: 'invalid', reason: 'explicit-fee-transaction-not-found' };
    }
  }

  // 7-9. Identity creation — all at submit time, in this exact order: source leg id, then
  // destination leg id, then the envelope id (= conversion identity, FX-F2B ADR-011 §1).
  const timestamp = context.timestamp ?? new Date().toISOString();
  const sourceTransactionId = createTransactionId();
  const destinationTransactionId = createTransactionId();
  const conversionId = createTransactionId();

  let sourceLeg: FinancialTransaction;
  let destinationLeg: FinancialTransaction;
  try {
    sourceLeg = buildTransactionRecord({
      id: sourceTransactionId, accountId: sourceAccount.id, type: 'expense', status: 'posted', source: 'manual',
      amount: input.sourceAmount, currency: sourceAccount.currency, categoryId: 'expense-other',
      description: '', merchant: '', note: input.note ?? '', occurredAt: input.effectiveDate, fingerprint: '',
      excluded: false, createdAt: timestamp, updatedAt: timestamp,
      fxConversionLeg: { conversionId, role: 'source' }
    }, {}, context.accounts as AccountReference[], timestamp);
    destinationLeg = buildTransactionRecord({
      id: destinationTransactionId, accountId: destinationAccount.id, type: 'income', status: 'posted', source: 'manual',
      amount: input.destinationAmount, currency: destinationAccount.currency, categoryId: 'income-other',
      description: '', merchant: '', note: input.note ?? '', occurredAt: input.effectiveDate, fingerprint: '',
      excluded: false, createdAt: timestamp, updatedAt: timestamp,
      fxConversionLeg: { conversionId, role: 'destination' }
    }, {}, context.accounts as AccountReference[], timestamp);
  } catch {
    return { status: 'invalid', reason: 'leg-construction-failed' };
  }

  // 10. Build the opaque FX conversion envelope.
  const payload: FxConversionOpaquePayloadV1 = {
    kind: FX_CONVERSION_PAYLOAD_KIND, payloadVersion: FX_CONVERSION_PAYLOAD_VERSION,
    sourceTransactionId, destinationTransactionId,
    sourceCurrency: sourceAccount.currency as FxConversionCurrency, destinationCurrency: destinationAccount.currency as FxConversionCurrency,
    sourceAmount: input.sourceAmount, destinationAmount: input.destinationAmount,
    effectiveDate: input.effectiveDate, feeTreatment: input.feeTreatment
  };
  const envelope: OpaqueFinancialTransactionEnvelope = { transactionOpaqueEnvelopeVersion: TRANSACTION_OPAQUE_ENVELOPE_VERSION, id: conversionId, payload };

  // 11. Validate the complete three-record set through the F2B resolver — the same pure
  // pipeline a reader would use, so a `valid` result here is exactly what will read back later.
  const transactionsById = new Map([...context.transactions, sourceLeg, destinationLeg].map(transaction => [transaction.id, transaction]));
  const resolution = resolveFxConversionEnvelope(envelope, transactionsById);
  if (!resolution) return { status: 'unsupported', reason: 'malformed-payload' };
  if (resolution.status !== 'valid') return { status: resolution.status === 'invalid' ? 'invalid' : 'unsupported', reason: resolution.reason };

  // 12. Duplicate check across every existing conversion plus this new candidate.
  const allEnvelopes = [...context.opaqueTransactions, envelope];
  const allTransactions = [...context.transactions, sourceLeg, destinationLeg];
  const duplicateCheck = resolveFxConversions(allEnvelopes, allTransactions).find(item => item.conversionId === conversionId);
  if (duplicateCheck?.status === 'duplicate') return { status: 'duplicate', reason: 'duplicate-transaction-claim' };

  return { status: 'success', conversionId, sourceLeg, destinationLeg, envelope };
}

export type FxConversionDeletionPlan =
  | { status: 'success'; conversionId: string; sourceTransactionId: string; destinationTransactionId: string }
  | { status: 'not-fx-conversion' }
  | { status: 'not-active'; reason: string };

/**
 * Pure plan for atomically deleting an FX conversion (envelope + both legs). Only an envelope
 * whose payload is a `valid`-resolved FX conversion (same "active" definition as F2C-1's
 * `findLinkedFxConversionId` ordinary-delete guard) is eligible — anything else (not an FX
 * payload at all, or a malformed/inconsistent one) must fall back to the existing generic
 * F1A opaque delete, because this plan cannot safely identify which two transactions, if any,
 * are genuinely its legs.
 */
export function buildFxConversionDeletion(envelope: OpaqueFinancialTransactionEnvelope, transactions: readonly FinancialTransaction[]): FxConversionDeletionPlan {
  if (!isFxConversionPayloadCandidate(envelope.payload)) return { status: 'not-fx-conversion' };
  const transactionsById = new Map(transactions.map(transaction => [transaction.id, transaction]));
  const resolution = resolveFxConversionEnvelope(envelope, transactionsById);
  if (!resolution || resolution.status !== 'valid') return { status: 'not-active', reason: resolution?.reason ?? 'unresolved' };
  return { status: 'success', conversionId: resolution.conversionId, sourceTransactionId: resolution.sourceTransactionId, destinationTransactionId: resolution.destinationTransactionId };
}
