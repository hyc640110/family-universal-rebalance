import assert from 'node:assert/strict';
import test from 'node:test';
import { findLinkedFxConversionId, FX_CONVERSION_PAYLOAD_KIND, FX_CONVERSION_PAYLOAD_VERSION } from '../src/lib/fxConversionIdentity';
import type { FinancialTransaction, OpaqueFinancialTransactionEnvelope } from '../src/lib/transactions';

/**
 * UR-TODO-046 FX-F2C-1: pure delete-linkage guard characterization. No FX producer exists yet —
 * these envelopes/transactions are hand-authored fixtures (per FX-F2B's own test convention) to
 * prove the guard behaves correctly once a producer eventually writes real records.
 */

const knownTx = (id: string, overrides: Partial<FinancialTransaction> = {}): FinancialTransaction => ({
  id, accountId: 'acc-twd', type: 'expense', status: 'posted', source: 'manual', amount: 1000,
  currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-01-01T00:00:00.000Z',
  description: '', merchant: '', note: '', excluded: false, fingerprint: '',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides
});

const validEnvelope = (id: string, sourceTransactionId: string, destinationTransactionId: string): OpaqueFinancialTransactionEnvelope => ({
  transactionOpaqueEnvelopeVersion: 1, id,
  payload: {
    kind: FX_CONVERSION_PAYLOAD_KIND, payloadVersion: FX_CONVERSION_PAYLOAD_VERSION,
    sourceTransactionId, destinationTransactionId,
    sourceCurrency: 'TWD', destinationCurrency: 'USD', sourceAmount: 32000, destinationAmount: 1000,
    effectiveDate: '2026-01-01', feeTreatment: { type: 'none' }
  }
});

test('linked source leg cannot be individually deleted: guard finds the active conversion', () => {
  const transactions = [knownTx('src-1', { amount: 32000 }), knownTx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 })];
  const opaque = [validEnvelope('conv-1', 'src-1', 'dst-1')];
  assert.equal(findLinkedFxConversionId('src-1', transactions, opaque), 'conv-1');
});

test('linked destination leg cannot be individually deleted: guard finds the active conversion', () => {
  const transactions = [knownTx('src-1', { amount: 32000 }), knownTx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 })];
  const opaque = [validEnvelope('conv-1', 'src-1', 'dst-1')];
  assert.equal(findLinkedFxConversionId('dst-1', transactions, opaque), 'conv-1');
});

test('unrelated ordinary transaction can still be deleted: guard finds nothing', () => {
  const transactions = [knownTx('src-1', { amount: 32000 }), knownTx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 }), knownTx('unrelated')];
  const opaque = [validEnvelope('conv-1', 'src-1', 'dst-1')];
  assert.equal(findLinkedFxConversionId('unrelated', transactions, opaque), undefined);
});

test('malformed opaque payload does not falsely block unrelated transactions', () => {
  const transactions = [knownTx('unrelated')];
  const malformed: OpaqueFinancialTransactionEnvelope = {
    transactionOpaqueEnvelopeVersion: 1, id: 'conv-bad',
    payload: { kind: FX_CONVERSION_PAYLOAD_KIND, payloadVersion: FX_CONVERSION_PAYLOAD_VERSION }
  };
  assert.equal(findLinkedFxConversionId('unrelated', transactions, [malformed]), undefined);
  // Even a malformed payload that happens to reference a real id by coincidence must not block —
  // it can never resolve to `valid` because required fields are absent.
  assert.equal(findLinkedFxConversionId('src-1', [knownTx('src-1')], [malformed]), undefined);
});

test('an envelope whose linked transaction is missing causes no block and no silent repair', () => {
  const transactions = [knownTx('unrelated')];
  const opaque = [validEnvelope('conv-1', 'missing-src', 'missing-dst')];
  const before = JSON.stringify({ transactions, opaque });
  assert.equal(findLinkedFxConversionId('unrelated', transactions, opaque), undefined);
  assert.equal(findLinkedFxConversionId('missing-src', transactions, opaque), undefined, 'the referenced-but-absent id is not itself in the transaction list to protect');
  assert.equal(JSON.stringify({ transactions, opaque }), before, 'pure function: no mutation of inputs, no repair attempted');
});

test('a conversion invalidated by amount/currency mismatch against its linked transactions does not block deletion', () => {
  const transactions = [knownTx('src-1', { amount: 999 /* mismatches pinned payload sourceAmount 32000 */ }), knownTx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 })];
  const opaque = [validEnvelope('conv-1', 'src-1', 'dst-1')];
  assert.equal(findLinkedFxConversionId('src-1', transactions, opaque), undefined, 'invalid-resolved conversions do not count as active');
});
