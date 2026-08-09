import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveLoanRuntimeEvidence, validateLoanAttribution } from '../src/lib/loanAttribution';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = { createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z' };

function transaction(id: string, patch: Partial<FinancialTransaction> = {}): FinancialTransaction {
  return {
    id, accountId: 'cash-a', type: 'expense', status: 'posted', source: 'manual', amount: 20_000,
    currency: 'TWD', categoryId: 'expense-housing', description: '', merchant: '', note: '',
    occurredAt: '2026-08-09T00:00:00.000Z', fingerprint: '', excluded: false, ...audit, ...patch
  };
}

const repayment = transaction('repayment-1', {
  loanAttribution: {
    kind: 'repayment', paymentId: 'payment-1', loanId: 'loan-a', cashAccountId: 'cash-a', currency: 'TWD', settlementAmount: 20_000,
    components: [
      { componentId: 'principal-1', type: 'principal', amount: 15_000 },
      { componentId: 'interest-1', type: 'interest', amount: 5_000 }
    ]
  }
});

test('完整 TWD repayment 僅將利息列為負貢獻，本金仍為零', () => {
  const validated = validateLoanAttribution({ transaction: repayment, transactions: [repayment], loanIds: new Set(['loan-a']) });
  assert.equal(validated.status, 'valid');
  const evidence = deriveLoanRuntimeEvidence({ transactions: [repayment], loanIds: new Set(['loan-a']), ledgerEvents: [] });
  assert.deepEqual(evidence.map(item => [item.componentId, item.type, item.contribution]), [
    ['principal-1', 'loan-principal-payment', 0],
    ['interest-1', 'loan-interest-payment', -5_000]
  ]);
});

test('principal-only 與 interest-only 都只依正式 component 歸因；Loan monthlyPayment 快照不會被反推為歷史事實', () => {
  const principalOnly = transaction('principal-only', { loanAttribution: { ...repayment.loanAttribution!, paymentId: 'principal-only', components: [{ componentId: 'principal-only', type: 'principal', amount: 20_000 }] } });
  const interestOnly = transaction('interest-only', { loanAttribution: { ...repayment.loanAttribution!, paymentId: 'interest-only', components: [{ componentId: 'interest-only', type: 'interest', amount: 20_000 }] } });
  assert.equal(deriveLoanRuntimeEvidence({ transactions: [principalOnly], loanIds: new Set(['loan-a']), ledgerEvents: [] }).reduce((sum, item) => sum + item.contribution, 0), 0);
  assert.equal(deriveLoanRuntimeEvidence({ transactions: [interestOnly], loanIds: new Set(['loan-a']), ledgerEvents: [] }).reduce((sum, item) => sum + item.contribution, 0), -20_000);
  // The derivation accepts only ids, never Loan.monthlyPayment/rate/balance snapshots.
  assert.equal(deriveLoanRuntimeEvidence({ transactions: [repayment], loanIds: new Set(['loan-a']), ledgerEvents: [] }).reduce((sum, item) => sum + item.contribution, 0), -5_000);
});

test('缺 component、合計不符、未知 loan 與非 TWD 一律 fail-safe', () => {
  const missing = transaction('missing', { loanAttribution: { ...repayment.loanAttribution!, components: [] } });
  const mismatch = transaction('mismatch', { loanAttribution: { ...repayment.loanAttribution!, paymentId: 'payment-2', components: [{ componentId: 'principal-2', type: 'principal', amount: 19_999 }] } });
  const unknownLoan = transaction('unknown-loan', { loanAttribution: { ...repayment.loanAttribution!, paymentId: 'payment-3', loanId: 'loan-missing' } });
  const nonTwd = transaction('usd', { currency: 'USD', loanAttribution: { ...repayment.loanAttribution!, paymentId: 'payment-4', currency: 'USD' } });
  for (const candidate of [missing, mismatch, unknownLoan, nonTwd]) {
    assert.equal(validateLoanAttribution({ transaction: candidate, transactions: [candidate], loanIds: new Set(['loan-a']) }).status, 'unsupported');
  }
});

test('明確 cash movement 必須唯一、同帳戶、同幣別、同金額與正確方向，否則整筆 repayment fail-safe', () => {
  const linked = transaction('repayment-linked', { loanAttribution: { ...repayment.loanAttribution!, paymentId: 'payment-linked', cashMovementId: 'cash-movement-1' } });
  const movement = transaction('cash-movement', {
    categoryId: 'expense-other',
    loanAttribution: { kind: 'cash-movement', cashMovementId: 'cash-movement-1', direction: 'decrease', cashAccountId: 'cash-a', currency: 'TWD', settlementAmount: 20_000 }
  });
  assert.equal(validateLoanAttribution({ transaction: linked, transactions: [linked, movement], loanIds: new Set(['loan-a']) }).status, 'valid');
  assert.equal(deriveLoanRuntimeEvidence({ transactions: [linked, movement], loanIds: new Set(['loan-a']), ledgerEvents: [] }).reduce((sum, item) => sum + item.contribution, 0), -5_000, 'trade 與明確配對 cash movement 只取 loan component 一次');
  assert.equal(validateLoanAttribution({ transaction: linked, transactions: [linked], loanIds: new Set(['loan-a']) }).status, 'unsupported');
  assert.equal(validateLoanAttribution({ transaction: linked, transactions: [linked, movement, { ...movement, id: 'cash-movement-duplicate' }], loanIds: new Set(['loan-a']) }).status, 'unsupported');
});

test('duplicate paymentId 不得產生任何 runtime attribution；generic 房貸文字不會被猜成 loan repayment', () => {
  const duplicate = transaction('repayment-duplicate', { source: 'import', loanAttribution: { ...repayment.loanAttribution!, paymentId: 'payment-1' } });
  assert.deepEqual(deriveLoanRuntimeEvidence({ transactions: [repayment, duplicate], loanIds: new Set(['loan-a']), ledgerEvents: [] }), []);
  const generic = transaction('generic', { description: '房貸', loanAttribution: undefined });
  assert.equal(validateLoanAttribution({ transaction: generic, transactions: [generic], loanIds: new Set(['loan-a']) }).status, 'not-applicable');
});

test('同一 loan 的 componentId 跨不同 paymentId 重複時，兩筆 repayment 都不得產生 runtime attribution', () => {
  const secondPayment = transaction('repayment-component-duplicate', {
    source: 'import',
    loanAttribution: {
      ...repayment.loanAttribution!,
      paymentId: 'payment-2',
      components: [
        { componentId: 'principal-1', type: 'principal', amount: 15_000 },
        { componentId: 'interest-2', type: 'interest', amount: 5_000 }
      ]
    }
  });

  const input = { transaction: repayment, transactions: [repayment, secondPayment], loanIds: new Set(['loan-a']) };
  assert.equal(validateLoanAttribution(input).status, 'unsupported');
  assert.equal(validateLoanAttribution({ ...input, transaction: secondPayment }).status, 'unsupported');
  assert.deepEqual(deriveLoanRuntimeEvidence({ transactions: [repayment, secondPayment], loanIds: new Set(['loan-a']), ledgerEvents: [] }), []);
});

test('無 linked cash movement 的另一筆手動貸款餘額調整不會被 Loan runtime evidence 當成第二次 repayment', () => {
  const manualBalanceAdjustment = transaction('manual-loan-balance-adjustment', { type: 'adjustment', categoryId: 'adjustment-other', amount: 15_000, loanAttribution: undefined });
  const evidence = deriveLoanRuntimeEvidence({ transactions: [repayment, manualBalanceAdjustment], loanIds: new Set(['loan-a']), ledgerEvents: [] });
  assert.equal(evidence.reduce((sum, item) => sum + item.contribution, 0), -5_000);
  assert.equal(evidence.every(item => item.transactionId === repayment.id), true);
});

test('fee、penalty 與 full payoff／partial prepayment 只有明示 component 才各自扣除一次', () => {
  const payoff = transaction('payoff', {
    amount: 21_000,
    loanAttribution: { kind: 'repayment', paymentId: 'payoff-1', loanId: 'loan-a', cashAccountId: 'cash-a', currency: 'TWD', settlementAmount: 21_000, components: [
      { componentId: 'principal', type: 'principal', amount: 15_000 }, { componentId: 'interest', type: 'interest', amount: 5_000 }, { componentId: 'fee', type: 'fee', amount: 500 }, { componentId: 'penalty', type: 'penalty', amount: 500 }
    ] }
  });
  const evidence = deriveLoanRuntimeEvidence({ transactions: [payoff], loanIds: new Set(['loan-a']), ledgerEvents: [] });
  assert.equal(evidence.reduce((sum, item) => sum + item.contribution, 0), -6_000);
  const prepayment = transaction('prepayment', { amount: 10_500, loanAttribution: { kind: 'repayment', paymentId: 'prepay-1', loanId: 'loan-a', cashAccountId: 'cash-a', currency: 'TWD', settlementAmount: 10_500, components: [{ componentId: 'principal', type: 'principal', amount: 10_000 }, { componentId: 'penalty', type: 'penalty', amount: 500 }] } });
  assert.equal(deriveLoanRuntimeEvidence({ transactions: [prepayment], loanIds: new Set(['loan-a']), ledgerEvents: [] }).reduce((sum, item) => sum + item.contribution, 0), -500);
});

test('loan disbursement 是零貢獻，缺正式 contract 的 refinance 不會被猜測', () => {
  const disbursement = transaction('disbursement', { type: 'income', amount: 200_000, loanAttribution: { kind: 'disbursement', paymentId: 'draw-1', loanId: 'loan-a', cashAccountId: 'cash-a', currency: 'TWD', settlementAmount: 200_000 } });
  assert.equal(validateLoanAttribution({ transaction: disbursement, transactions: [disbursement], loanIds: new Set(['loan-a']) }).status, 'valid');
  assert.deepEqual(deriveLoanRuntimeEvidence({ transactions: [disbursement], loanIds: new Set(['loan-a']), ledgerEvents: [] }).map(item => [item.type, item.contribution]), [['loan-disbursement', 0]]);
  const refinance = transaction('refinance', { description: '轉貸', loanAttribution: undefined });
  assert.equal(validateLoanAttribution({ transaction: refinance, transactions: [refinance], loanIds: new Set(['loan-a']) }).status, 'not-applicable');
});
