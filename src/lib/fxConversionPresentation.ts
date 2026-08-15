import type { FinancialEvent } from './financialEvents';
import { resolveActiveFxConversionGroups, resolveFxConversions, type FxConversionCurrency } from './fxConversionIdentity';
import type { FinancialTransaction, OpaqueFinancialTransactionEnvelope } from './transactions';

/**
 * UR-TODO-054-B: pure, read-only selector that collapses the two independently-reconciled FX
 * conversion legs (see transactionReconciliation.ts's `fxConversionLeg` branch — each leg
 * transaction gets its own `candidate`/`matched` result row) into one presentation row per
 * `conversionId`, the atomic economic unit a user actually confirms, views, or voids. Mirrors
 * loanConfirmationPresentation.ts's shape (one row per group, `status`/`everConfirmed`/
 * `voidTargetEventId`), but the grouping key and void-target logic are simpler: an FX conversion
 * is always exactly one `FinancialEvent` (never N components), so there is no "which component is
 * the deterministic void target" decision to make — at most one active event can ever exist for a
 * given `conversionId` (resolveActiveFxConversionGroups()'s own all-or-nothing contract).
 *
 * A conversion whose envelope does not resolve to `valid` (missing/mismatched leg transaction,
 * malformed payload, non-positive amount, etc.) is skipped entirely — never shown as a partial or
 * broken row — exactly mirroring how deriveLoanRepaymentGroupPresentations() skips any
 * transaction whose `validateLoanAttribution()` result isn't `valid`. Uses `resolveFxConversions()`
 * (not the single-envelope `resolveFxConversionEnvelope()`) specifically so that two envelopes
 * claiming the same leg transaction — a data-integrity edge case, not a normal user flow — both
 * resolve `duplicate` and neither renders, rather than each independently resolving `valid` and
 * showing up as two separately-confirmable candidates for the same underlying transactions.
 */

export type FxConversionPresentationStatus = 'candidate' | 'matched';

export type FxConversionPresentation = {
  conversionId: string;
  sourceTransactionId: string;
  destinationTransactionId: string;
  sourceCurrency: FxConversionCurrency;
  destinationCurrency: FxConversionCurrency;
  sourceAmount: number;
  destinationAmount: number;
  effectiveDate: string;
  status: FxConversionPresentationStatus;
  /** True when this conversionId has at least one historical attribution-confirmation event on record — i.e. it was confirmed and later voided, distinct from "never confirmed". Presentation-only; never used for correctness. */
  everConfirmed: boolean;
  /** The currently-active FinancialEvent.id for this conversionId when status === 'matched'. Always present in that case (resolveActiveFxConversionGroups() guarantees at most one), absent otherwise. */
  voidTargetEventId?: string;
};

export type FxConversionPresentationInput = {
  opaqueTransactions: readonly OpaqueFinancialTransactionEnvelope[];
  transactions: readonly FinancialTransaction[];
  ledgerEvents: readonly FinancialEvent[];
};

/**
 * Builds one presentation row per distinct, `valid`-resolved conversion found across
 * `opaqueTransactions`. Only conversions whose linked legs currently satisfy the full
 * `resolveFxConversions()` contract (including its cross-envelope duplicate-claim check) are
 * included — malformed, incomplete, or duplicate-claiming conversions never reach this UI,
 * exactly mirroring how they never reach `derivedEvidenceItems` today.
 */
export function deriveFxConversionPresentations(input: FxConversionPresentationInput): FxConversionPresentation[] {
  const transactionsById = new Map(input.transactions.map(transaction => [transaction.id, transaction]));
  const opaqueTransactionsById = new Map(input.opaqueTransactions.map(envelope => [envelope.id, envelope]));
  const groupResolution = resolveActiveFxConversionGroups(input.ledgerEvents, transactionsById, opaqueTransactionsById);
  const resolutions = resolveFxConversions(input.opaqueTransactions, input.transactions);

  const results: FxConversionPresentation[] = [];
  for (const resolution of resolutions) {
    if (resolution.status !== 'valid') continue;

    const isMatched = groupResolution.confirmedConversionIds.has(resolution.conversionId);
    const everConfirmed = input.ledgerEvents.some(event => event.fxConversionLink?.conversionId === resolution.conversionId && event.source === 'attribution-confirmation');
    const voidTargetEventId = isMatched
      ? input.ledgerEvents.find(event => groupResolution.validEventIds.has(event.id) && event.fxConversionLink?.conversionId === resolution.conversionId)?.id
      : undefined;

    results.push({
      conversionId: resolution.conversionId,
      sourceTransactionId: resolution.sourceTransactionId,
      destinationTransactionId: resolution.destinationTransactionId,
      sourceCurrency: resolution.sourceCurrency,
      destinationCurrency: resolution.destinationCurrency,
      sourceAmount: resolution.sourceAmount,
      destinationAmount: resolution.destinationAmount,
      effectiveDate: resolution.effectiveDate,
      status: isMatched ? 'matched' : 'candidate',
      everConfirmed,
      ...(voidTargetEventId ? { voidTargetEventId } : {})
    });
  }
  return results;
}
