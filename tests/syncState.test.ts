import test from 'node:test';
import assert from 'node:assert/strict';
import { hasSyncableStateChanged, withoutSyncMetadata } from '../src/lib/syncState';

const syncedMeta = { dirty: false, source: '本機資料' as const, status: '已同步', lastUploadAt: '2026-07-14T12:00:00.000Z' };
const dirtyMeta = { dirty: true, source: '本機資料' as const, status: '本機資料有變更，尚未上傳' };
const baseState = {
  holdings: [{ symbol: '00631L', name: '元大台灣50正2', shares: 1000 }],
  cash: [{ id: 'cash-1', amount: 1000 }],
  accounts: [{ id: 'account-1', balance: 1000 }],
  loans: [{ id: 'loan-1', principal: 500 }],
  transactions: [{ id: 'tx-1', amount: 100 }],
  netWorthHistory: [{ date: '2026-07-14', totalAssets: 1000 }],
  refreshSec: 60,
  syncMeta: syncedMeta,
  remoteMeta: { holdingsCount: 1, cashCount: 1, loansCount: 1, updatedAt: '2026-07-14T12:00:00.000Z' }
};

test('sync metadata-only updates do not create dirty-worthy data changes', () => {
  assert.equal(hasSyncableStateChanged(baseState, {
    ...baseState,
    syncMeta: dirtyMeta,
    remoteMeta: { holdingsCount: 1, cashCount: 1, loansCount: 1, updatedAt: '2026-07-14T12:01:00.000Z' }
  }), false);
});

test('persistent holdings, accounts, cash, loans, transactions, settings, and snapshots do create data changes', () => {
  const changes = [
    { ...baseState, holdings: [{ ...baseState.holdings[0], shares: 1001 }] },
    { ...baseState, cash: [{ ...baseState.cash[0], amount: 1001 }] },
    { ...baseState, accounts: [{ ...baseState.accounts[0], balance: 1001 }] },
    { ...baseState, loans: [{ ...baseState.loans[0], principal: 501 }] },
    { ...baseState, transactions: [{ ...baseState.transactions[0], amount: 101 }] },
    { ...baseState, refreshSec: 61 },
    { ...baseState, netWorthHistory: [{ date: '2026-07-14', totalAssets: 1001 }] }
  ];
  for (const changed of changes) assert.equal(hasSyncableStateChanged(baseState, changed), true);
});

test('Firebase payload removes device-local sync metadata without changing user data', () => {
  const payload = withoutSyncMetadata(baseState);
  assert.deepEqual(payload, {
    holdings: baseState.holdings,
    cash: baseState.cash,
    accounts: baseState.accounts,
    loans: baseState.loans,
    transactions: baseState.transactions,
    netWorthHistory: baseState.netWorthHistory,
    refreshSec: 60
  });
  assert.equal('syncMeta' in payload, false);
  assert.equal('remoteMeta' in payload, false);
  assert.deepEqual(withoutSyncMetadata(baseState), payload);
});

test('legacy Firebase payloads with stale or missing sync metadata remain compatible', () => {
  const legacyWithDirtyMeta = { ...baseState, syncMeta: dirtyMeta, remoteMeta: { holdingsCount: 999, cashCount: 999, loansCount: 999 } };
  const legacyWithoutMeta = withoutSyncMetadata(baseState);
  assert.deepEqual(withoutSyncMetadata(legacyWithDirtyMeta), legacyWithoutMeta);
  assert.deepEqual(withoutSyncMetadata(legacyWithoutMeta), legacyWithoutMeta);
});
