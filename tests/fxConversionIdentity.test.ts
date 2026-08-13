import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  FX_CONVERSION_PAYLOAD_KIND,
  FX_CONVERSION_PAYLOAD_VERSION,
  deriveFxConversionExecutedRate,
  parseFxConversionPayloadV1,
  resolveFxConversionEnvelope,
  resolveFxConversionFeeTreatment,
  resolveFxConversions
} from '../src/lib/fxConversionIdentity';
import type { FinancialTransaction } from '../src/lib/transactions';

const tx = (id: string, overrides: Partial<FinancialTransaction> = {}): FinancialTransaction => ({
  id, accountId: 'acc-twd', type: 'expense', status: 'posted', source: 'manual', amount: 32000, currency: 'TWD',
  categoryId: 'expense-other', description: '', merchant: '', note: '', occurredAt: '2026-01-01T00:00:00.000Z',
  fingerprint: '', excluded: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides
});

const validPayload = (overrides: Record<string, unknown> = {}) => ({
  kind: FX_CONVERSION_PAYLOAD_KIND, payloadVersion: FX_CONVERSION_PAYLOAD_VERSION,
  sourceTransactionId: 'src-1', destinationTransactionId: 'dst-1',
  sourceCurrency: 'TWD', destinationCurrency: 'USD', sourceAmount: 32000, destinationAmount: 1000,
  effectiveDate: '2026-01-01', feeTreatment: { type: 'none' },
  ...overrides
});

const envelope = (id: string, payload: Record<string, unknown>) => ({ transactionOpaqueEnvelopeVersion: 1 as const, id, payload });

const twdUsdTransactions = () => [
  tx('src-1', { accountId: 'acc-twd', type: 'expense', currency: 'TWD', amount: 32000 }),
  tx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 })
];

// --- Valid ---

test('valid TWD->USD conversion resolves', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload())], twdUsdTransactions());
  assert.equal(result.status, 'valid');
});

test('valid USD->TWD conversion resolves', () => {
  const transactions = [
    tx('src-1', { accountId: 'acc-usd', type: 'expense', currency: 'USD', amount: 1000 }),
    tx('dst-1', { accountId: 'acc-twd', type: 'income', currency: 'TWD', amount: 32000 })
  ];
  const payload = validPayload({ sourceCurrency: 'USD', destinationCurrency: 'TWD', sourceAmount: 1000, destinationAmount: 32000 });
  const [result] = resolveFxConversions([envelope('conv-1', payload)], transactions);
  assert.equal(result.status, 'valid');
});

test('envelope.id is used as the conversion identity, no separate conversionId is read from the payload', () => {
  const [result] = resolveFxConversions([envelope('conv-xyz', validPayload())], twdUsdTransactions());
  assert.equal(result.status, 'valid');
  assert.equal((result as { conversionId: string }).conversionId, 'conv-xyz');
});

test('source/destination transactions resolve by id, not by adjacency/date/amount/memo', () => {
  const transactions = twdUsdTransactions();
  const result = resolveFxConversionEnvelope(envelope('conv-1', validPayload()), new Map(transactions.map(t => [t.id, t])));
  assert.equal(result?.status, 'valid');
  assert.equal((result as { sourceTransactionId: string }).sourceTransactionId, 'src-1');
  assert.equal((result as { destinationTransactionId: string }).destinationTransactionId, 'dst-1');
});

test('effectiveDate must be a canonical calendar day', () => {
  const parsed = parseFxConversionPayloadV1(validPayload({ effectiveDate: 'not-a-date' }));
  assert.equal(parsed.ok, false);
});

test('executed rate TWD->USD: TWD per USD derived from pinned amounts', () => {
  const rate = deriveFxConversionExecutedRate({ sourceCurrency: 'TWD', destinationCurrency: 'USD', sourceAmount: 32000, destinationAmount: 1000 });
  assert.equal(rate, 32);
});

test('executed rate USD->TWD: same canonical TWD-per-USD unit regardless of direction', () => {
  const rate = deriveFxConversionExecutedRate({ sourceCurrency: 'USD', destinationCurrency: 'TWD', sourceAmount: 1000, destinationAmount: 32000 });
  assert.equal(rate, 32);
});

test('executed rate is deterministic across repeated calls', () => {
  const input = { sourceCurrency: 'TWD' as const, destinationCurrency: 'USD' as const, sourceAmount: 32100, destinationAmount: 1000 };
  const first = deriveFxConversionExecutedRate(input);
  for (let i = 0; i < 5; i += 1) assert.equal(deriveFxConversionExecutedRate(input), first);
});

// --- Identity ---

test('same source and destination transaction id is invalid', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload({ sourceTransactionId: 'x', destinationTransactionId: 'x' }))], [tx('x')]);
  assert.equal(result.status, 'invalid');
  assert.equal((result as { reason: string }).reason, 'same-source-destination');
});

test('duplicate conversion: same transaction claimed by two conversionIds becomes duplicate for both', () => {
  const transactions = [...twdUsdTransactions(), tx('dst-2', { accountId: 'acc-usd-2', type: 'income', currency: 'USD', amount: 500 })];
  const envelopes = [
    envelope('conv-1', validPayload()),
    envelope('conv-2', validPayload({ destinationTransactionId: 'src-1', sourceTransactionId: 'dst-2', sourceCurrency: 'USD', destinationCurrency: 'TWD', sourceAmount: 500, destinationAmount: 32000 }))
  ];
  const results = resolveFxConversions(envelopes, transactions);
  assert.ok(results.every(result => result.status === 'duplicate'), 'both conversions claim src-1, both must be duplicate');
});

test('duplicate pair claimed under two different envelope ids is duplicate', () => {
  const envelopes = [envelope('conv-1', validPayload()), envelope('conv-2', validPayload())];
  const results = resolveFxConversions(envelopes, twdUsdTransactions());
  assert.ok(results.every(result => result.status === 'duplicate'));
});

test('missing source transaction resolves to unsupported, opaque envelope still exists', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload())], [tx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 })]);
  assert.equal(result.status, 'unsupported');
  assert.equal((result as { reason: string }).reason, 'missing-source-transaction');
});

test('missing destination transaction resolves to unsupported', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload())], [tx('src-1')]);
  assert.equal(result.status, 'unsupported');
  assert.equal((result as { reason: string }).reason, 'missing-destination-transaction');
});

// --- Currency ---

test('same currency on both legs is invalid, not silently accepted', () => {
  const parsed = parseFxConversionPayloadV1(validPayload({ destinationCurrency: 'TWD' }));
  assert.deepEqual(parsed, { ok: false, reason: 'same-currency' });
});

test('unsupported currency (JPY) is classified unsupported, not malformed', () => {
  const parsed = parseFxConversionPayloadV1(validPayload({ destinationCurrency: 'JPY' }));
  assert.deepEqual(parsed, { ok: false, reason: 'unsupported-currency-pair' });
});

test('payload pinned currency vs linked transaction currency mismatch is invalid', () => {
  const transactions = [tx('src-1', { currency: 'USD' }), tx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 })];
  const [result] = resolveFxConversions([envelope('conv-1', validPayload())], transactions);
  assert.equal(result.status, 'invalid');
  assert.equal((result as { reason: string }).reason, 'source-currency-mismatch');
});

// --- Amount ---

test('zero source amount is invalid', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload({ sourceAmount: 0 }))], [tx('src-1', { amount: 0 }), tx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 })]);
  assert.equal(result.status, 'invalid');
  assert.equal((result as { reason: string }).reason, 'non-positive-amount');
});

test('zero destination amount is invalid', () => {
  const transactions = [tx('src-1'), tx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 0 })];
  const [result] = resolveFxConversions([envelope('conv-1', validPayload({ destinationAmount: 0 }))], transactions);
  assert.equal(result.status, 'invalid');
  assert.equal((result as { reason: string }).reason, 'non-positive-amount');
});

test('negative source amount is invalid', () => {
  const parsed = parseFxConversionPayloadV1(validPayload({ sourceAmount: -32000 }));
  assert.equal(parsed.ok, true);
  const transactions = [tx('src-1', { amount: -32000 }), tx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 })];
  const [result] = resolveFxConversions([envelope('conv-1', validPayload({ sourceAmount: -32000 }))], transactions);
  assert.equal(result.status, 'invalid');
  assert.equal((result as { reason: string }).reason, 'non-positive-amount');
});

test('negative destination amount is invalid', () => {
  const transactions = [tx('src-1'), tx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: -1000 })];
  const [result] = resolveFxConversions([envelope('conv-1', validPayload({ destinationAmount: -1000 }))], transactions);
  assert.equal(result.status, 'invalid');
  assert.equal((result as { reason: string }).reason, 'non-positive-amount');
});

test('payload amount vs linked transaction amount mismatch is invalid — no tolerance/closeness pairing', () => {
  const transactions = [tx('src-1', { amount: 32050 }), tx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 })];
  const [result] = resolveFxConversions([envelope('conv-1', validPayload())], transactions);
  assert.equal(result.status, 'invalid');
  assert.equal((result as { reason: string }).reason, 'source-amount-mismatch');
});

// --- Fee ---

test('fee none is a valid principal conversion', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload({ feeTreatment: { type: 'none' } }))], twdUsdTransactions());
  assert.equal(result.status, 'valid');
  assert.deepEqual((result as { feeResolution: unknown }).feeResolution, { status: 'none' });
});

test('fee explicit with a resolvable fee transaction resolves', () => {
  const transactions = [...twdUsdTransactions(), tx('fee-1', { amount: 100 })];
  const feeResolution = resolveFxConversionFeeTreatment({ type: 'explicit', feeTransactionId: 'fee-1' }, new Map(transactions.map(t => [t.id, t])));
  assert.deepEqual(feeResolution, { status: 'explicit-resolved', feeTransactionId: 'fee-1' });
});

test('fee explicit with a missing fee transaction: principal conversion still valid, fee unresolved', () => {
  const payload = validPayload({ feeTreatment: { type: 'explicit', feeTransactionId: 'does-not-exist' } });
  const [result] = resolveFxConversions([envelope('conv-1', payload)], twdUsdTransactions());
  assert.equal(result.status, 'valid', 'a malformed/unresolved fee link must not invalidate the principal pair');
  assert.deepEqual((result as { feeResolution: unknown }).feeResolution, { status: 'explicit-unresolved', feeTransactionId: 'does-not-exist' });
});

test('fee included is a valid principal conversion, no fee amount is derived', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload({ feeTreatment: { type: 'included' } }))], twdUsdTransactions());
  assert.equal(result.status, 'valid');
  assert.deepEqual((result as { feeResolution: unknown }).feeResolution, { status: 'included' });
  assert.ok(!('feeAmount' in (result as object)), 'no fee amount field must exist anywhere on the result');
});

test('fee unknown is a valid principal conversion', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload({ feeTreatment: { type: 'unknown' } }))], twdUsdTransactions());
  assert.equal(result.status, 'valid');
  assert.deepEqual((result as { feeResolution: unknown }).feeResolution, { status: 'unknown' });
});

test('fee unknown never becomes fee=0 — the resolution status is a distinct discriminant, not a numeric zero', () => {
  const feeResolution = resolveFxConversionFeeTreatment({ type: 'unknown' }, new Map());
  assert.equal(feeResolution.status, 'unknown');
  assert.ok(!('feeAmount' in feeResolution) && !('amount' in feeResolution));
});

test('fee included never derives a fee amount from the amount difference', () => {
  const feeResolution = resolveFxConversionFeeTreatment({ type: 'included' }, new Map());
  assert.equal(feeResolution.status, 'included');
  assert.ok(!('feeAmount' in feeResolution) && !('amount' in feeResolution));
});

test('missing fee evidence (malformed feeTreatment) is rejected at parse time, never silently defaults to none', () => {
  const parsed = parseFxConversionPayloadV1(validPayload({ feeTreatment: undefined }));
  assert.equal(parsed.ok, false);
  assert.equal(parsed.ok === false ? parsed.reason : undefined, 'malformed-payload');
});

// --- Isolation ---

test('reference/market rate is never used as the executed rate — module never imports fxValuation.ts or cbcFxProvider.ts', () => {
  const source = readFileSync(new URL('../src/lib/fxConversionIdentity.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from ['"]\.\/fxValuation['"]/);
  assert.doesNotMatch(source, /from ['"]\.\/cbcFxProvider['"]/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
});

test('module never imports or calls reconciliation, FinancialEvent, or the F1D producer gate', () => {
  const source = readFileSync(new URL('../src/lib/fxConversionIdentity.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from ['"]\.\/transactionReconciliation['"]/);
  assert.doesNotMatch(source, /from ['"]\.\/financialEvents['"]/);
  assert.doesNotMatch(source, /from ['"]\.\/fxOpaqueProducerGate['"]/);
  assert.doesNotMatch(source, /localStorage/);
});

test('executed rate is never persisted as a field on the valid resolution result', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload())], twdUsdTransactions());
  assert.equal(result.status, 'valid');
  assert.ok('executedRate' in result, 'executedRate is present on the runtime resolution result (derived), just never written to persisted payload');
  const source = readFileSync(new URL('../src/lib/fxConversionIdentity.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /payload\.executedRate|executedRate:\s*payload/);
});

test('malformed FX payload is still a structurally valid opaque envelope — resolver returns invalid/unsupported, never null, for an fx-conversion-kinded payload', () => {
  const [result] = resolveFxConversions([envelope('conv-1', { kind: FX_CONVERSION_PAYLOAD_KIND, payloadVersion: 1 })], []);
  assert.notEqual(result, undefined);
  assert.ok(result.status === 'invalid' || result.status === 'unsupported');
});

test('a payload that is not fx-conversion-kinded produces no resolution at all (out of this module\'s scope)', () => {
  const results = resolveFxConversions([envelope('conv-1', { kind: 'some-other-future-capability' })], []);
  assert.deepEqual(results, []);
});

test('an unsupported future payloadVersion is preserved as opaque and classified unsupported, not invalid', () => {
  const [result] = resolveFxConversions([envelope('conv-1', validPayload({ payloadVersion: 2 }))], []);
  assert.equal(result.status, 'unsupported');
  assert.equal((result as { reason: string }).reason, 'unsupported-payload-version');
});
