import assert from 'node:assert/strict';
import test from 'node:test';
import { createFinancialAccount } from '../src/lib/financialAccounts';
import {
  deriveForeignCashValuation,
  normalizeFxRateHistory,
  selectUsdTwdReferenceCloseRate,
  type FxRateRecord
} from '../src/lib/fxValuation';

const rate = (patch: Partial<FxRateRecord> = {}): FxRateRecord => ({
  id: 'cbt-usd-twd-2026-08-12',
  baseCurrency: 'USD',
  quoteCurrency: 'TWD',
  quotePerBase: 31,
  rateType: 'reference-close',
  provider: 'Central Bank of the Republic of China (Taiwan)',
  providerRecordId: 'USD-TWD-2026-08-12',
  rateDate: '2026-08-12',
  sourcePublishedAt: '2026-08-12T08:00:00.000Z',
  capturedAt: '2026-08-12T09:00:00.000Z',
  policyVersion: 'fx-a1-v1',
  ...patch
});

const usdAccount = () => createFinancialAccount({ id: 'usd-cash', type: 'bank', manualBalance: 1_000, currency: 'USD' }, '2026-08-12T00:00:00.000Z');

test('USD/TWD uses quote-per-base direction: USD 1,000 × 31 = TWD 31,000', () => {
  const result = deriveForeignCashValuation({ account: usdAccount(), valuationDate: '2026-08-12', rate: rate() });
  assert.deepEqual(result, {
    status: 'available', accountId: 'usd-cash', originalAmount: 1_000, originalCurrency: 'USD', valuationCurrency: 'TWD', valuationDate: '2026-08-12',
    rateId: 'cbt-usd-twd-2026-08-12', quotePerBase: 31, rateDate: '2026-08-12', staleDays: 0, carriedForward: false,
    unroundedValue: 31_000, roundedValue: 31_000, policyVersion: 'fx-a1-v1'
  });
});

test('invalid rate values are rejected and deterministic duplicate IDs choose one canonical record', () => {
  for (const quotePerBase of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) assert.deepEqual(normalizeFxRateHistory([rate({ quotePerBase })]).records, []);
  const first = rate({ quotePerBase: 31, capturedAt: '2026-08-12T09:00:00.000Z' });
  const second = rate({ quotePerBase: 32, capturedAt: '2026-08-12T10:00:00.000Z' });
  assert.deepEqual(normalizeFxRateHistory([second, first]).records, [first]);
  assert.deepEqual(normalizeFxRateHistory([first, second]).records, [first]);
});

test('rate lookup supports a maximum three-day carry-forward and then fail-safe stale result', () => {
  const selected = selectUsdTwdReferenceCloseRate([rate({ rateDate: '2026-08-08' })], '2026-08-11');
  assert.equal(selected?.rateDate, '2026-08-08');
  assert.equal(deriveForeignCashValuation({ account: usdAccount(), valuationDate: '2026-08-11', rate: selected }).status, 'available');
  assert.deepEqual(deriveForeignCashValuation({ account: usdAccount(), valuationDate: '2026-08-12', rate: selected }), {
    status: 'stale-rate', accountId: 'usd-cash', originalAmount: 1_000, originalCurrency: 'USD', valuationCurrency: 'TWD', valuationDate: '2026-08-12', rateId: 'cbt-usd-twd-2026-08-12', rateDate: '2026-08-08', staleDays: 4, carriedForward: true, policyVersion: 'fx-a1-v1'
  });
});

test('missing rate, unsupported currency, and TWD preserve fail-safe / no-conversion boundaries', () => {
  assert.deepEqual(deriveForeignCashValuation({ account: usdAccount(), valuationDate: '2026-08-12', rate: undefined }), {
    status: 'missing-rate', accountId: 'usd-cash', originalAmount: 1_000, originalCurrency: 'USD', valuationCurrency: 'TWD', valuationDate: '2026-08-12'
  });
  assert.equal(deriveForeignCashValuation({ account: createFinancialAccount({ id: 'jpy', type: 'bank', manualBalance: 1_000, currency: 'JPY' }), valuationDate: '2026-08-12', rate: rate() }).status, 'unsupported-currency');
  assert.equal(deriveForeignCashValuation({ account: createFinancialAccount({ id: 'twd', type: 'bank', manualBalance: 1_000, currency: 'TWD' }), valuationDate: '2026-08-12', rate: rate() }), null);
});
