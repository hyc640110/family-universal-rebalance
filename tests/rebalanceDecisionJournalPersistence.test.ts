import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { createRebalanceDecisionSnapshot } from '../src/lib/rebalanceDecisionJournal';

type Persistence = {
  normalizeState(raw: unknown): Record<string, unknown>;
  backupPayload(state: unknown, quotes: Record<string, unknown>): Record<string, unknown>;
  stateFromBackup(raw: unknown, current: unknown): { state: Record<string, unknown> };
};

async function loadPersistence(): Promise<Persistence> {
  const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
  try { return await server.ssrLoadModule('/src/App.tsx') as Persistence; } finally { await server.close(); }
}

const journal = [createRebalanceDecisionSnapshot({
  id: 'decision-persistence-1', createdAt: '2026-08-16T02:00:00.000Z', asOfDate: '2026-08-16', decidedAt: '2026-08-16T02:01:00.000Z',
  decision: 'defer', note: null,
  recommendation: { canRecommend: true, mode: 'buy-only', investableCash: null, rows: [] },
  quoteEvidence: [],
})];

test('Decision Journal 在 localStorage-shaped state 和 JSON Backup round-trip 中保留', async () => {
  const { normalizeState, backupPayload, stateFromBackup } = await loadPersistence();
  const state = normalizeState({ rebalanceDecisionJournal: journal });
  assert.deepEqual(state.rebalanceDecisionJournal, journal);
  const backup = backupPayload(state, {});
  assert.deepEqual(backup.rebalanceDecisionJournal, journal);
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;
  assert.deepEqual(restored.rebalanceDecisionJournal, journal);
});

test('舊 JSON Backup 缺少 Decision Journal 時保留目前裝置既有紀錄', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  const current = normalizeState({ rebalanceDecisionJournal: journal });
  const restored = stateFromBackup({ holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], creditCards: [] }, current).state;
  assert.deepEqual(restored.rebalanceDecisionJournal, journal);
});

test('含有 malformed Decision Journal record 的輸入只略過損壞紀錄', async () => {
  const { normalizeState } = await loadPersistence();
  const state = normalizeState({ rebalanceDecisionJournal: [{ ...journal[0], id: '' }, journal[0]] });
  assert.deepEqual(state.rebalanceDecisionJournal, journal);
});
