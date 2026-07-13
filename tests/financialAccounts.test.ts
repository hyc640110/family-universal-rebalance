import assert from 'node:assert/strict';
import test from 'node:test';
import { CASH_ACCOUNT_MIGRATION_VERSION, createFinancialAccount, deactivateFinancialAccount, financialAccountAssetTotal, financialAccountLiquidTotal, financialAccountNetWorthContribution, getFinancialAccountBalance, migrateLegacyCashItems, normalizeAccountState, normalizeFinancialAccounts, removeFinancialAccount, restoreFinancialAccount, updateFinancialAccount } from '../src/lib/financialAccounts';

test('normalizes malformed accounts and keeps account ids unique', () => {
  const { accounts } = normalizeFinancialAccounts([{ id: 'a', name: '銀行', type: 'bank', balanceMode: 'manual', manualBalance: 100 }, { id: 'a', type: 'unexpected', balanceMode: 'bad' }], '2026-01-01T00:00:00.000Z');
  assert.equal(accounts.length, 2); assert.equal(accounts[0].id, 'a'); assert.notEqual(accounts[1].id, 'a'); assert.equal(accounts[1].type, 'other'); assert.equal(accounts[1].balanceMode, 'manual');
});

test('fills safe defaults for missing fields and skips unrecoverable rows', () => {
  const { accounts, skipped } = normalizeFinancialAccounts([null, { id: 'safe', name: '', type: 'invalid', balanceMode: 'invalid', manualBalance: 'bad', currency: '', isActive: 'yes', sortOrder: -5, createdAt: 'bad-date' }], '2026-01-01T00:00:00.000Z');
  assert.equal(skipped.length, 1); assert.equal(accounts.length, 1); assert.equal(accounts[0].name, '未命名帳戶'); assert.equal(accounts[0].type, 'other'); assert.equal(accounts[0].balanceMode, 'manual'); assert.equal(accounts[0].currency, 'TWD'); assert.equal(accounts[0].manualBalance, 0); assert.equal(accounts[0].sortOrder, 0); assert.equal(accounts[0].createdAt, '2026-01-01T00:00:00.000Z');
});

test('migrates legacy cash once and preserves its stable id', () => {
  const legacy = [{ id: 'cash-1', name: '錢包', amount: 500, note: '備用' }];
  const migrated = normalizeAccountState(undefined, legacy, '2026-01-01T00:00:00.000Z');
  const reloaded = normalizeAccountState(migrated.accounts, legacy, '2026-01-02T00:00:00.000Z');
  assert.equal(migrated.accounts[0].id, 'cash-1'); assert.equal(reloaded.accounts.length, 1); assert.equal(reloaded.accounts[0].id, 'cash-1'); assert.equal(migrated.cashAccountMigrationVersion, CASH_ACCOUNT_MIGRATION_VERSION);
});

test('accounts win over legacy cash when both are present', () => {
  const result = normalizeAccountState([{ id: 'bank-1', name: '銀行', type: 'bank', manualBalance: 9 }], [{ id: 'cash-1', amount: 99 }]);
  assert.equal(result.accounts.length, 1); assert.equal(result.accounts[0].id, 'bank-1');
});

test('manual balances count while derived unavailable and inactive accounts do not', () => {
  const manual = createFinancialAccount({ id: 'manual', type: 'cash', manualBalance: 100 });
  const derived = createFinancialAccount({ id: 'derived', balanceMode: 'derived', manualBalance: 999 });
  const inactive = createFinancialAccount({ id: 'inactive', manualBalance: 50, isActive: false });
  const liability = createFinancialAccount({ id: 'card', type: 'creditCard', manualBalance: 20 });
  assert.deepEqual(getFinancialAccountBalance(derived), { value: null, status: 'unavailable' }); assert.equal(financialAccountAssetTotal([manual, derived, inactive]), 100); assert.equal(financialAccountLiquidTotal([manual, derived, inactive, liability]), 100); assert.equal(financialAccountNetWorthContribution([manual, derived, inactive, liability]), 80);
});

test('editing keeps an id stable and legacy migration handles empty or broken data', () => {
  const account = createFinancialAccount({ name: '原名' }); const edited = updateFinancialAccount(account, { name: '新名稱' });
  const inactive = deactivateFinancialAccount(edited); const restored = restoreFinancialAccount(inactive);
  assert.equal(account.id, edited.id); assert.equal(inactive.isActive, false); assert.equal(restored.isActive, true); assert.deepEqual(removeFinancialAccount([restored], restored.id), []); assert.deepEqual(migrateLegacyCashItems([null, { name: '現金' }]).map(item => item.name), ['現金']);
});

test('localStorage, Firebase, and JSON backup payloads round-trip through the same normalizer', () => {
  const persisted = { accounts: [createFinancialAccount({ id: 'persisted', type: 'eWallet', manualBalance: 300 })], cash: [{ id: 'old-cash', amount: 999 }] };
  const localStorageRoundTrip = normalizeAccountState(JSON.parse(JSON.stringify(persisted)).accounts, persisted.cash);
  const firebaseRoundTrip = normalizeAccountState(JSON.parse(JSON.stringify(persisted)).accounts, persisted.cash);
  const backupRoundTrip = normalizeAccountState(JSON.parse(JSON.stringify(persisted)).accounts, persisted.cash);
  for (const result of [localStorageRoundTrip, firebaseRoundTrip, backupRoundTrip]) { assert.equal(result.accounts[0].id, 'persisted'); assert.equal(result.accounts[0].manualBalance, 300); }
});

test('partial legacy cash migration is stable and never duplicates into an existing account state', () => {
  const legacy = [{ id: 'cash-a', name: '現金 A', amount: 10 }, null, { id: 'cash-a', name: '現金 B', amount: 20 }];
  const first = normalizeAccountState(undefined, legacy, '2026-01-01T00:00:00.000Z');
  const reload = normalizeAccountState(first.accounts, legacy, '2026-01-02T00:00:00.000Z');
  assert.equal(first.accounts.length, 2); assert.equal(new Set(first.accounts.map(account => account.id)).size, 2); assert.deepEqual(reload.accounts.map(account => account.id), first.accounts.map(account => account.id));
});
