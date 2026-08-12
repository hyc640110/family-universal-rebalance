import assert from 'node:assert/strict';
import test from 'node:test';
import { createFinancialAccount } from '../src/lib/financialAccounts';
import { deriveCanonicalNetWorthTotals } from '../src/lib/canonicalNetWorthTotals';
import type { FxRateRecord } from '../src/lib/fxValuation';

const rate = (patch: Partial<FxRateRecord> = {}): FxRateRecord => ({
  id: 'cbc-usd-twd-2026-08-12',
  baseCurrency: 'USD',
  quoteCurrency: 'TWD',
  quotePerBase: 31,
  rateType: 'reference-close',
  provider: 'Central Bank of the Republic of China (Taiwan)',
  rateDate: '2026-08-12',
  capturedAt: '2026-08-12T09:00:00.000Z',
  policyVersion: 'fx-a1-v1',
  ...patch
});

const twdAccount = (overrides: Parameters<typeof createFinancialAccount>[0] = {}) =>
  createFinancialAccount({ id: 'twd-cash', type: 'bank', manualBalance: 100_000, currency: 'TWD', ...overrides });

const usdAccount = (overrides: Parameters<typeof createFinancialAccount>[0] = {}) =>
  createFinancialAccount({ id: 'usd-cash', type: 'bank', manualBalance: 1_000, currency: 'USD', ...overrides });

test('1. TWD-only regression: totals unchanged and fully available', () => {
  const accounts = [twdAccount(), createFinancialAccount({ id: 'twd-loan', type: 'loan', manualBalance: 20_000, currency: 'TWD' })];
  const totals = deriveCanonicalNetWorthTotals(accounts, [], '2026-08-12');
  assert.equal(totals.cash, 100_000);
  assert.equal(totals.accountNetWorth, 80_000);
  assert.equal(totals.cashAvailable, true);
  assert.equal(totals.accountNetWorthAvailable, true);
  assert.deepEqual(totals.fxValuations, []);
});

test('2. USD account with a valid rate is valued at quotePerBase and pinned', () => {
  const totals = deriveCanonicalNetWorthTotals([usdAccount()], [rate()], '2026-08-12');
  assert.equal(totals.cash, 31_000);
  assert.equal(totals.cashAvailable, true);
  assert.equal(totals.fxValuations.length, 1);
  assert.equal(totals.fxValuations[0].roundedValue, 31_000);
});

test('3. TWD + USD canonical total is not a naked currency sum', () => {
  const totals = deriveCanonicalNetWorthTotals([twdAccount(), usdAccount()], [rate()], '2026-08-12');
  // 100,000 TWD + 1,000 USD must NOT equal 101,000; it must equal 100,000 + (1,000 * 31) = 131,000.
  assert.notEqual(totals.cash, 101_000);
  assert.equal(totals.cash, 131_000);
  assert.equal(totals.cashAvailable, true);
});

test('4. USD missing rate excludes the balance and marks cash unavailable', () => {
  const totals = deriveCanonicalNetWorthTotals([twdAccount(), usdAccount()], [], '2026-08-12');
  assert.equal(totals.cash, 100_000);
  assert.equal(totals.cashAvailable, false);
  assert.equal(totals.accountNetWorthAvailable, false);
  assert.deepEqual(totals.fxValuations, []);
});

test('5. USD stale rate (beyond 3 calendar days) excludes the balance and marks unavailable', () => {
  const totals = deriveCanonicalNetWorthTotals([usdAccount()], [rate({ rateDate: '2026-08-08' })], '2026-08-12');
  assert.equal(totals.cash, 0);
  assert.equal(totals.cashAvailable, false);
  assert.deepEqual(totals.fxValuations, []);
});

test('6. unsupported currency excludes the balance and marks unavailable', () => {
  const jpyAccount = createFinancialAccount({ id: 'jpy-cash', type: 'bank', manualBalance: 1_000, currency: 'JPY' });
  const totals = deriveCanonicalNetWorthTotals([jpyAccount], [rate()], '2026-08-12');
  assert.equal(totals.cash, 0);
  assert.equal(totals.cashAvailable, false);
  assert.deepEqual(totals.fxValuations, []);
});

test('7. invalid/non-finite (derived, unresolved) balance excludes the account and marks unavailable', () => {
  const derivedUsd = createFinancialAccount({ id: 'usd-derived', type: 'bank', balanceMode: 'derived', currency: 'USD' });
  const totals = deriveCanonicalNetWorthTotals([derivedUsd], [rate()], '2026-08-12', { derivedBalances: {} });
  assert.equal(totals.cash, 0);
  assert.equal(totals.cashAvailable, false);
});

test('8. deleted account leaves no orphan valuation', () => {
  const withUsd = deriveCanonicalNetWorthTotals([usdAccount()], [rate()], '2026-08-12');
  assert.equal(withUsd.fxValuations.length, 1);
  const afterDeletion = deriveCanonicalNetWorthTotals([], [rate()], '2026-08-12');
  assert.deepEqual(afterDeletion.fxValuations, []);
  assert.equal(afterDeletion.cash, 0);
  assert.equal(afterDeletion.cashAvailable, true);
});

test('9. a TWD account never produces an FX valuation record', () => {
  const totals = deriveCanonicalNetWorthTotals([twdAccount()], [rate()], '2026-08-12');
  assert.deepEqual(totals.fxValuations, []);
});

test('10. an inactive foreign-currency account with no rate does not poison availability (pre-existing isActive contract, unrelated to FX)', () => {
  const inactiveUsd = createFinancialAccount({ id: 'usd-inactive', type: 'bank', manualBalance: 5_000, currency: 'USD', isActive: false });
  const totals = deriveCanonicalNetWorthTotals([twdAccount(), inactiveUsd], [], '2026-08-12');
  assert.equal(totals.cash, 100_000);
  assert.equal(totals.cashAvailable, true);
  assert.equal(totals.accountNetWorthAvailable, true);
});

test('23. a liquid-type foreign account with unresolved FX makes cash unavailable', () => {
  const totals = deriveCanonicalNetWorthTotals([usdAccount()], [], '2026-08-12');
  assert.equal(totals.cashAvailable, false);
});

test('24-25. cash unavailable cascades to accountNetWorth (which drives totalAssets/netWorth) unavailable', () => {
  const totals = deriveCanonicalNetWorthTotals([usdAccount()], [], '2026-08-12');
  assert.equal(totals.cashAvailable, false);
  assert.equal(totals.accountNetWorthAvailable, false);
});

test('a non-liquid foreign account can make accountNetWorth unavailable without affecting cash', () => {
  const usdSecurities = createFinancialAccount({ id: 'usd-securities', type: 'securities', manualBalance: 2_000, currency: 'USD' });
  const totals = deriveCanonicalNetWorthTotals([twdAccount(), usdSecurities], [], '2026-08-12');
  assert.equal(totals.cash, 100_000);
  assert.equal(totals.cashAvailable, true);
  assert.equal(totals.accountNetWorthAvailable, false);
});

test('a liability-type foreign account contributes negatively once valued and can mark unavailable', () => {
  const usdLoan = createFinancialAccount({ id: 'usd-loan', type: 'loan', manualBalance: 500, currency: 'USD' });
  const available = deriveCanonicalNetWorthTotals([usdLoan], [rate()], '2026-08-12');
  assert.equal(available.accountNetWorth, -15_500);
  assert.equal(available.accountNetWorthAvailable, true);
  const unavailable = deriveCanonicalNetWorthTotals([usdLoan], [], '2026-08-12');
  assert.equal(unavailable.accountNetWorth, 0);
  assert.equal(unavailable.accountNetWorthAvailable, false);
});
