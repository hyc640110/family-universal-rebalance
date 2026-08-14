import { isCanonicalCalendarDay } from './calendarDay';
import {
  createTransactionId, updateTransaction as buildTransactionRecord,
  type AccountReference, type FinancialTransaction, type LoanPaymentComponent
} from './transactions';

/**
 * UR-TODO-054-A: pure Minimal Loan Repayment Producer. This module answers "given user input,
 * build one `FinancialTransaction` carrying a complete `LoanRepaymentAttribution` candidate, or
 * refuse" — it never calls `setState`, never touches localStorage/the DOM. It deliberately never
 * calls `confirmLoanPaymentGroupAndAppend()`: the transaction it returns is a reconciliation
 * candidate only (`loan-payment-contract-candidate`), never a `FinancialEvent`. Confirmation is a
 * separate, explicit, later user action (see loanConfirmationPresentation.ts / App.tsx).
 *
 * Mirrors fxConversionProducer.ts's `buildFxConversionCreation()` shape: build the full record
 * in memory via the existing `updateTransaction()` normalization pipeline (passing a complete
 * literal as `current` with an empty patch, exactly like that module does for its two legs), then
 * let the caller (App.tsx) perform the single `setState()` commit.
 */

export type LoanRepaymentComponentAmounts = {
  principal?: number | string;
  interest?: number | string;
  fee?: number | string;
  penalty?: number | string;
};

export type LoanRepaymentCreationInput = {
  loanId: string;
  cashAccountId: string;
  effectiveDate: string;
  components: LoanRepaymentComponentAmounts;
  note?: string;
};

export type LoanRepaymentCreationContext = {
  accounts: readonly AccountReference[];
  loanIds: ReadonlySet<string>;
  /** Caller-supplied ISO UTC timestamp so this stays a pure, testable function. */
  timestamp?: string;
};

export type LoanRepaymentCreationFailureReason =
  | 'invalid-loan'
  | 'invalid-account'
  | 'invalid-effective-date'
  | 'no-components'
  | 'invalid-component-amount'
  | 'transaction-construction-failed';

export type LoanRepaymentCreationResult =
  | { status: 'success'; transaction: FinancialTransaction; paymentId: string }
  | { status: 'invalid'; reason: LoanRepaymentCreationFailureReason };

/** Order matches componentLink's canonical presentation order (financialEvents.ts's LOAN_EVENT_TYPES order). */
const COMPONENT_KEYS: (keyof LoanRepaymentComponentAmounts)[] = ['principal', 'interest', 'fee', 'penalty'];

/**
 * UR-TODO-054-A §4: a component amount must be strictly > 0 to exist at all — zero, empty,
 * undefined, and null are all "this component does not exist", never `{ amount: 0 }` (which
 * would make normalizeLoanAttribution() drop the *entire* attribution, per transactions.ts's
 * `components.length !== record.components.length` check). Negative and non-finite values are
 * explicit input errors, not "absent".
 */
function parseComponentAmount(value: number | string | undefined): { ok: true; amount: number | null } | { ok: false } {
  if (value === undefined || value === null || value === '') return { ok: true, amount: null };
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return { ok: false };
  if (parsed < 0) return { ok: false };
  if (parsed === 0) return { ok: true, amount: null };
  return { ok: true, amount: parsed };
}

/**
 * Builds the one-record Loan repayment candidate entirely in memory, validating every step
 * before returning anything. Never throws; every failure path returns a typed result instead.
 * Returns a `status: 'success'` transaction that already carries a complete, valid
 * `LoanRepaymentAttribution` — reconciliation will classify it as `loan-payment-contract-candidate`
 * on the very next read, with no further write from this module.
 */
export function buildLoanRepaymentCreation(input: LoanRepaymentCreationInput, context: LoanRepaymentCreationContext): LoanRepaymentCreationResult {
  if (!input.loanId || !context.loanIds.has(input.loanId)) return { status: 'invalid', reason: 'invalid-loan' };
  const account = context.accounts.find(candidate => candidate.id === input.cashAccountId);
  if (!account || !account.isActive || account.currency !== 'TWD') return { status: 'invalid', reason: 'invalid-account' };
  if (!isCanonicalCalendarDay(input.effectiveDate)) return { status: 'invalid', reason: 'invalid-effective-date' };

  const paymentId = createTransactionId();
  const components: LoanPaymentComponent[] = [];
  for (const key of COMPONENT_KEYS) {
    const parsed = parseComponentAmount(input.components[key]);
    if (!parsed.ok) return { status: 'invalid', reason: 'invalid-component-amount' };
    if (parsed.amount !== null) components.push({ componentId: createTransactionId(), type: key, amount: parsed.amount });
  }
  if (!components.length) return { status: 'invalid', reason: 'no-components' };
  if (new Set(components.map(component => component.componentId)).size !== components.length) return { status: 'invalid', reason: 'transaction-construction-failed' };

  const settlementAmount = components.reduce((total, component) => total + component.amount, 0);
  const timestamp = context.timestamp ?? new Date().toISOString();
  const transactionId = createTransactionId();

  let transaction: FinancialTransaction;
  try {
    transaction = buildTransactionRecord({
      id: transactionId, accountId: account.id, type: 'expense', status: 'posted', source: 'manual',
      amount: settlementAmount, currency: 'TWD', categoryId: 'expense-other',
      description: '', merchant: '', note: input.note ?? '', occurredAt: input.effectiveDate, fingerprint: '',
      excluded: false, createdAt: timestamp, updatedAt: timestamp,
      loanAttribution: {
        kind: 'repayment', paymentId, loanId: input.loanId, cashAccountId: account.id,
        currency: 'TWD', settlementAmount, components
      }
    }, {}, context.accounts as AccountReference[], timestamp);
  } catch {
    return { status: 'invalid', reason: 'transaction-construction-failed' };
  }

  // Self-check: normalization must have kept the attribution intact, not silently dropped it
  // (e.g. a future change to normalizeLoanAttribution()'s rules would surface here as a refusal,
  // never as a transaction that silently lost its loanAttribution).
  if (!transaction.loanAttribution || transaction.loanAttribution.kind !== 'repayment') {
    return { status: 'invalid', reason: 'transaction-construction-failed' };
  }

  return { status: 'success', transaction, paymentId };
}
