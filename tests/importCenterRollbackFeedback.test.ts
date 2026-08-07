import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateRollbackImport } from '../src/lib/importCenter';
import type { FinancialTransaction } from '../src/lib/transactions';

const baseTransaction = (overrides: Partial<FinancialTransaction> = {}): FinancialTransaction => ({
  id: 'tx-1', accountId: 'acc-1', type: 'income', status: 'posted', source: 'import', amount: 1000,
  currency: 'TWD', categoryId: 'income-other', description: 'coffee', merchant: '', note: '[import:session-1]',
  occurredAt: '2026-08-01T00:00:00.000Z', fingerprint: 'fp-1', excluded: false,
  createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides
});

test('evaluateRollbackImport: all imported rows untouched → ok with the correct count', () => {
  const transactions = [
    baseTransaction({ id: 'tx-1' }),
    baseTransaction({ id: 'tx-2' }),
    baseTransaction({ id: 'tx-3', note: '[import:other-session]' })
  ];
  const outcome = evaluateRollbackImport(transactions, 'session-1');
  assert.deepEqual(outcome, { ok: true, count: 2 });
});

test('evaluateRollbackImport: any edited row blocks the whole session, reporting how many were edited', () => {
  const transactions = [
    baseTransaction({ id: 'tx-1' }),
    baseTransaction({ id: 'tx-2', updatedAt: '2026-08-02T00:00:00.000Z' }),
    baseTransaction({ id: 'tx-3' })
  ];
  const outcome = evaluateRollbackImport(transactions, 'session-1');
  assert.deepEqual(outcome, { ok: false, reason: 'edited', editedCount: 1, totalCount: 3 });
});

test('evaluateRollbackImport: every row of the session already individually deleted → distinct no-transactions reason', () => {
  const transactions = [baseTransaction({ id: 'tx-1', note: '[import:other-session]' })];
  const outcome = evaluateRollbackImport(transactions, 'session-1');
  assert.deepEqual(outcome, { ok: false, reason: 'no-transactions' });
});

test('evaluateRollbackImport: does not classify a manually-created transaction as belonging to the session', () => {
  const transactions = [baseTransaction({ id: 'tx-1', source: 'manual', note: '[import:session-1]' })];
  const outcome = evaluateRollbackImport(transactions, 'session-1');
  assert.deepEqual(outcome, { ok: false, reason: 'no-transactions' });
});
