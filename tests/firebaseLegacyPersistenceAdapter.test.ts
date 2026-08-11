import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createServer } from 'vite';
import { createFinancialAccount } from '../src/lib/financialAccounts';
import { isLegacyFirebaseOnlyPersistenceDelta } from '../src/lib/legacyFirebasePersistence';

type Persistence = {
  normalizeState(raw: unknown): Record<string, unknown>;
  stateFromBackup(raw: unknown, current: unknown): { state: Record<string, unknown> };
  backupPayload(state: unknown, quotes: Record<string, unknown>): unknown;
  stateWithPersistedFinancialEventLedger(state: unknown): Record<string, unknown>;
};

async function loadPersistence(): Promise<Persistence> {
  const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
  try {
    return await server.ssrLoadModule('/src/App.tsx') as Persistence;
  } finally {
    await server.close();
  }
}

test('P3-B1: legacy-only Firebase localStorage delta 不得取得 initial hydration write 資格', () => {
  const raw = JSON.stringify({ holdings: [], firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' } });
  const clean = JSON.stringify({ holdings: [] });
  assert.equal(isLegacyFirebaseOnlyPersistenceDelta(raw, clean), true);
});

test('P3-B1: 真實持久化 mutation 不得被 legacy write gate 阻擋', () => {
  const raw = JSON.stringify({ holdings: [], firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' } });
  const changed = JSON.stringify({ holdings: [{ symbol: '00662' }] });
  assert.equal(isLegacyFirebaseOnlyPersistenceDelta(raw, changed), false);
});

test('P3-B1: canonical localStorage writer 在 genuine mutation 時不再輸出 Firebase legacy config', async () => {
  const { normalizeState, stateWithPersistedFinancialEventLedger } = await loadPersistence();
  const legacy = normalizeState({ firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' }, holdings: [] });
  const changed = normalizeState({ ...legacy, holdings: [{ symbol: '00662', shares: 1, avgCost: 1, assetClass: 'growth' }] });
  assert.equal('firebase' in stateWithPersistedFinancialEventLedger(changed), false);
});

test('P3-B1: 實際 App hydration 與 mount persistence 均使用明確 legacy write gate', () => {
  const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(source, /const initialPersistenceWriteAllowed = shouldWriteInitialHydration\(raw, json\)/);
  assert.match(source, /!didMount\.current && !initialPersistenceWriteAllowedRef\.current/);
});

test('P3-B1: clean Backup 不得 fallback 到 current Firebase config', async () => {
  const { normalizeState, stateFromBackup, stateWithPersistedFinancialEventLedger } = await loadPersistence();
  const current = normalizeState({ firebase: { databaseURL: 'https://current.example.invalid', secretPath: 'current' } });
  const restored = stateFromBackup({ holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], financialEventSchemaVersion: 3, financialEvents: [] }, current).state;
  assert.notDeepEqual(restored.firebase, current.firebase);
  assert.equal('firebase' in stateWithPersistedFinancialEventLedger(restored), false, 'Full Restore 的後續 canonical localStorage 輸出不得重建 legacy config');
});

test('P3-B1: old top-level Firebase Backup 仍可讀取', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  const current = normalizeState({});
  const restored = stateFromBackup({ holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], financialEventSchemaVersion: 3, financialEvents: [], firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' } }, current).state;
  assert.deepEqual(restored.firebase, { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' });
});

test('P3-B1: current syncSettings.firebase Backup 仍可讀取，但不具有 runtime sync 意義', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  const firebase = { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' };
  const restored = stateFromBackup({
    holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], financialEventSchemaVersion: 3, financialEvents: [],
    syncSettings: { refreshSec: 60, autoSync: false, autoSyncSec: 60, firebase, firebaseConfigured: true }
  }, normalizeState({})).state;
  assert.deepEqual(restored.firebase, firebase);
});

test('P3-B1: v3 split atomic group 與 void marker 在 legacy Firebase 輸入下仍完整 round-trip', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadPersistence();
  const timestamp = '2026-08-11T00:00:00.000Z';
  const state = normalizeState({
    firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' },
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'split-expense', accountId: 'bank-a', type: 'expense', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'expense-food', description: '', merchant: '', note: '', occurredAt: timestamp, excluded: false }],
    financialEventSchemaVersion: 3,
    financialEvents: [
      { id: 'split-a', type: 'external-expense', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-11', amount: 70, currency: 'TWD', accountId: 'bank-a', transactionId: 'split-expense', splitAllocationLink: { domain: 'test-only', allocationGroupId: 'split-group', componentId: 'a' }, note: '', createdAt: timestamp, updatedAt: timestamp },
      { id: 'split-b', type: 'external-expense', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-11', amount: 30, currency: 'TWD', accountId: 'bank-a', transactionId: 'split-expense', splitAllocationLink: { domain: 'test-only', allocationGroupId: 'split-group', componentId: 'b' }, note: '', createdAt: timestamp, updatedAt: timestamp },
      { id: 'void-a', type: 'adjustment', status: 'posted', source: 'void', effectiveDate: '2026-08-11', amount: 70, currency: 'TWD', accountId: 'bank-a', transactionId: 'split-expense', voidedEventId: 'split-a', note: '', createdAt: timestamp, updatedAt: timestamp }
    ]
  });
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backupPayload(state, {}))), normalizeState({})).state;
  assert.equal(restored.financialEventSchemaVersion, 3);
  assert.deepEqual((restored.financialEvents as Array<{ id: string }>).map(({ id }) => id), ['split-a', 'split-b', 'void-a']);
  assert.equal((restored.financialEvents as Array<{ voidedEventId?: string }>)[2]?.voidedEventId, 'split-a');
  assert.deepEqual((restored.financialEvents as Array<{ splitAllocationLink?: unknown }>)[0]?.splitAllocationLink, { domain: 'test-only', allocationGroupId: 'split-group', componentId: 'a' });
});
