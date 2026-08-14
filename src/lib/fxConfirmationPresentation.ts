import {
  deriveFxConversionExecutedRate, resolveActiveFxConversionGroups, resolveFxConversions,
  type FxConversionCurrency, type FxConversionFeeResolution
} from './fxConversionIdentity';
import type { FinancialEvent } from './financialEvents';
import type { FinancialTransaction, OpaqueFinancialTransactionEnvelope } from './transactions';

/**
 * UR-TODO-054-B: pure, read-only selector that groups a valid FX conversion (opaque envelope +
 * its two resolved legs) into one presentation row per `conversionId` — the atomic economic unit
 * a user actually confirms, views, or voids. Mirrors loanConfirmationPresentation.ts's role for
 * Loan, but deliberately NOT a shared framework: FX's shape (two transactions folded into one
 * event) is structurally different from Loan's (one transaction split into N component events),
 * so this stays FX-specific rather than forcing a premature cross-domain abstraction.
 *
 * Consumes only existing, unmodified contract entry points (`resolveFxConversions()`,
 * `resolveActiveFxConversionGroups()`, `deriveFxConversionExecutedRate()`) — it never
 * re-implements pairing, duplicate detection, or fee resolution.
 */

export type FxConfirmationGroupStatus = 'candidate' | 'matched';

export type FxConfirmationGroupPresentation = {
  conversionId: string;
  sourceTransactionId: string;
  sourceAccountId: string;
  sourceAmount: number;
  sourceCurrency: FxConversionCurrency;
  destinationTransactionId: string;
  destinationAccountId: string;
  destinationAmount: number;
  destinationCurrency: FxConversionCurrency;
  effectiveDate: string;
  /** Undefined only if the two pinned leg amounts cannot yield a positive rate — never guessed. */
  executedRate?: number;
  feeResolution: FxConversionFeeResolution;
  /** Only present when feeResolution.status === 'explicit-resolved' — a safe read of the already-linked transaction's own amount/currency, never a new fee event or a guessed value. */
  feeTransactionAmount?: number;
  feeTransactionCurrency?: string;
  status: FxConfirmationGroupStatus;
  /** True when this conversionId has at least one historical attribution-confirmation event on record — i.e. it was confirmed and later voided, distinct from "never confirmed". Presentation-only; never used for correctness. */
  everConfirmed: boolean;
  /** The currently-active confirmation FinancialEvent.id for a 'matched' group — always present when status === 'matched', absent otherwise. There is only ever one active event per conversionId (FX has no Loan-style component group), so no deterministic-selection logic is needed here. */
  voidTargetEventId?: string;
};

export type FxConfirmationGroupPresentationInput = {
  transactions: readonly FinancialTransaction[];
  opaqueTransactions: readonly OpaqueFinancialTransactionEnvelope[];
  ledgerEvents: readonly FinancialEvent[];
};

/**
 * Builds one presentation row per `conversionId` whose envelope currently resolves `valid`
 * (via `resolveFxConversions()`, which applies the same cross-envelope duplicate-claim detection
 * the Producer itself uses at creation time — an envelope in a duplicate claim resolves
 * `duplicate`, not `valid`, and is therefore excluded here, never shown as an actionable item).
 * Malformed, unsupported, or single-leg-missing envelopes are likewise excluded — they never
 * reach this UI, exactly mirroring how they never reach `reconcileTransactions()`'s
 * candidate/matched states either.
 */
export function deriveFxConfirmationGroupPresentations(input: FxConfirmationGroupPresentationInput): FxConfirmationGroupPresentation[] {
  const transactionsById = new Map(input.transactions.map(transaction => [transaction.id, transaction]));
  const opaqueTransactionsById = new Map(input.opaqueTransactions.map(envelope => [envelope.id, envelope]));
  const groupResolution = resolveActiveFxConversionGroups(input.ledgerEvents, transactionsById, opaqueTransactionsById);
  const resolutions = resolveFxConversions(input.opaqueTransactions, input.transactions);

  const results: FxConfirmationGroupPresentation[] = [];
  for (const resolution of resolutions) {
    if (resolution.status !== 'valid') continue;

    const sourceTransaction = transactionsById.get(resolution.sourceTransactionId);
    const destinationTransaction = transactionsById.get(resolution.destinationTransactionId);
    if (!sourceTransaction || !destinationTransaction) continue;

    const isMatched = groupResolution.confirmedConversionIds.has(resolution.conversionId);
    const everConfirmed = input.ledgerEvents.some(event => event.fxConversionLink?.conversionId === resolution.conversionId && event.source === 'attribution-confirmation');
    const voidTargetEventId = isMatched
      ? input.ledgerEvents.find(event => groupResolution.validEventIds.has(event.id) && event.fxConversionLink?.conversionId === resolution.conversionId)?.id
      : undefined;
    const executedRate = deriveFxConversionExecutedRate({
      sourceCurrency: resolution.sourceCurrency, destinationCurrency: resolution.destinationCurrency,
      sourceAmount: resolution.sourceAmount, destinationAmount: resolution.destinationAmount
    });
    const feeTransaction = resolution.feeResolution.status === 'explicit-resolved'
      ? transactionsById.get(resolution.feeResolution.feeTransactionId)
      : undefined;

    results.push({
      conversionId: resolution.conversionId,
      sourceTransactionId: resolution.sourceTransactionId,
      sourceAccountId: sourceTransaction.accountId,
      sourceAmount: resolution.sourceAmount,
      sourceCurrency: resolution.sourceCurrency,
      destinationTransactionId: resolution.destinationTransactionId,
      destinationAccountId: destinationTransaction.accountId,
      destinationAmount: resolution.destinationAmount,
      destinationCurrency: resolution.destinationCurrency,
      effectiveDate: resolution.effectiveDate,
      ...(executedRate !== undefined ? { executedRate } : {}),
      feeResolution: resolution.feeResolution,
      ...(feeTransaction ? { feeTransactionAmount: feeTransaction.amount, feeTransactionCurrency: feeTransaction.currency } : {}),
      status: isMatched ? 'matched' : 'candidate',
      everConfirmed,
      ...(voidTargetEventId ? { voidTargetEventId } : {})
    });
  }
  return results;
}
