import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveLoanRepaymentGroupPresentations } from '../src/lib/loanConfirmationPresentation';
import { buildLoanPaymentConfirmationGroup } from '../src/lib/loanAttributionConfirmation';
import { buildVoidEvent } from '../src/lib/financialEventVoid';
import type { FinancialEvent } from '../src/lib/financialEvents';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = { createdAt: '2026-08-14T00:00:00.000Z', updatedAt: '2026-08-14T00:00:00.000Z' };
const loanIds = new Set(['loan-a']);
const accountIds = new Set(['cash-a']);

const transaction: FinancialTransaction = {
  id: 'payment-1', accountId: 'cash-a', type: 'expense', status: 'posted', source: 'manual',
  amount: 20_300, currency: 'TWD', categoryId: 'expense-other', description: '', merchant: '', note: '',
  occurredAt: '2026-08-14T00:00:00.000Z', fingerprint: '', excluded: false, ...audit,
  loanAttribution: {
    kind: 'repayment', paymentId: 'payment-1', loanId: 'loan-a', cashAccountId: 'cash-a', currency: 'TWD',
    settlementAmount: 20_300,
    components: [
      { componentId: 'c-principal', type: 'principal', amount: 15_000 },
      { componentId: 'c-interest', type: 'interest', amount: 5_000 },
      { componentId: 'c-fee', type: 'fee', amount: 100 },
      { componentId: 'c-penalty', type: 'penalty', amount: 200 }
    ]
  }
};

test('candidate group: one row per paymentId, status=candidate, everConfirmed=false, no voidTargetEventId', () => {
  const rows = deriveLoanRepaymentGroupPresentations({ transactions: [transaction], loanIds, ledgerEvents: [], accountIds });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.status, 'candidate');
  assert.equal(rows[0]?.everConfirmed, false);
  assert.equal(rows[0]?.voidTargetEventId, undefined);
  assert.equal(rows[0]?.components.length, 4);
  assert.equal(rows[0]?.settlementAmount, 20_300);
});

test('confirmed group: status=matched, voidTargetEventId points at the principal component event', () => {
  const built = buildLoanPaymentConfirmationGroup({ transaction, transactions: [transaction], loanIds, now: audit.createdAt });
  assert.equal(built.rejected, false);
  if (built.rejected) return;
  const rows = deriveLoanRepaymentGroupPresentations({ transactions: [transaction], loanIds, ledgerEvents: built.events, accountIds });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.status, 'matched');
  const principalEvent = built.events.find(event => event.componentLink?.componentId === 'c-principal');
  assert.equal(rows[0]?.voidTargetEventId, principalEvent?.id, 'must deterministically pick the principal component, not array order or React render order');
});

test('voidTargetEventId falls back to first component when no principal component exists', () => {
  const noPrincipal: FinancialTransaction = {
    ...transaction,
    loanAttribution: {
      ...transaction.loanAttribution!,
      settlementAmount: 5_200,
      components: [
        { componentId: 'c-interest', type: 'interest', amount: 5_000 },
        { componentId: 'c-fee', type: 'fee', amount: 200 }
      ]
    },
    amount: 5_200
  };
  const built = buildLoanPaymentConfirmationGroup({ transaction: noPrincipal, transactions: [noPrincipal], loanIds, now: audit.createdAt });
  assert.equal(built.rejected, false);
  if (built.rejected) return;
  const rows = deriveLoanRepaymentGroupPresentations({ transactions: [noPrincipal], loanIds, ledgerEvents: built.events, accountIds });
  const interestEvent = built.events.find(event => event.componentLink?.componentId === 'c-interest');
  assert.equal(rows[0]?.voidTargetEventId, interestEvent?.id, 'without a principal component, the first component in loanAttribution.components order is the deterministic target');
});

test('voiding any single component reverts the whole group to candidate, and marks everConfirmed=true', () => {
  const built = buildLoanPaymentConfirmationGroup({ transaction, transactions: [transaction], loanIds, now: audit.createdAt });
  assert.equal(built.rejected, false);
  if (built.rejected) return;
  const interestEvent = built.events.find(event => event.componentLink?.componentId === 'c-interest')!;
  const voidResult = buildVoidEvent(built.events, { eventId: interestEvent.id, now: audit.createdAt });
  assert.equal(voidResult.rejected, false);
  if (voidResult.rejected) return;
  const events: FinancialEvent[] = [...built.events, voidResult.event];
  const rows = deriveLoanRepaymentGroupPresentations({ transactions: [transaction], loanIds, ledgerEvents: events, accountIds });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.status, 'candidate', 'voiding just one component must revert the whole group, not leave it partially matched');
  assert.equal(rows[0]?.everConfirmed, true, 'a previously-confirmed-then-voided group is distinguishable from a never-confirmed one');
  assert.equal(rows[0]?.voidTargetEventId, undefined);
});

test('reconfirming after a void produces a fresh confirmationGroupId, never reusing or mixing the old components', () => {
  const first = buildLoanPaymentConfirmationGroup({ transaction, transactions: [transaction], loanIds, now: audit.createdAt });
  assert.equal(first.rejected, false);
  if (first.rejected) return;
  const principalEvent = first.events.find(event => event.componentLink?.componentId === 'c-principal')!;
  const voided = buildVoidEvent(first.events, { eventId: principalEvent.id, now: audit.createdAt });
  assert.equal(voided.rejected, false);
  if (voided.rejected) return;
  const afterVoid: FinancialEvent[] = [...first.events, voided.event];

  const second = buildLoanPaymentConfirmationGroup({ transaction, transactions: [transaction], loanIds, now: audit.createdAt });
  assert.equal(second.rejected, false);
  if (second.rejected) return;
  assert.notEqual(second.confirmationGroupId, first.confirmationGroupId);
  assert.equal(new Set(second.events.map(event => event.id)).size, second.events.length);
  assert.equal(second.events.some(event => first.events.some(oldEvent => oldEvent.id === event.id)), false, 'reconfirm must never reuse an old component event id');

  const events: FinancialEvent[] = [...afterVoid, ...second.events];
  const rows = deriveLoanRepaymentGroupPresentations({ transactions: [transaction], loanIds, ledgerEvents: events, accountIds });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.status, 'matched');
});
