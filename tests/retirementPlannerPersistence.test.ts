import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

type Persistence = {
  normalizeState(raw: unknown): Record<string, unknown>;
  backupPayload(state: unknown, quotes: Record<string, unknown>): Record<string, unknown>;
  stateFromBackup(raw: unknown, current: unknown): { state: Record<string, unknown> };
};

async function loadPersistence(): Promise<Persistence> {
  const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
  try {
    return await server.ssrLoadModule('/src/App.tsx') as Persistence;
  } finally {
    await server.close();
  }
}

const retirementPlan = {
  fixedExpenses: [{ id: 'rent', name: '房租', amount: 20_000, category: 'housing', enabled: true }],
  customFixedExpenseIds: [],
  annualBigExpenses: { travelBudget: 60_000, insuranceFee: 24_000 },
  withdrawalRatePercent: 4,
  retirementYears: 20,
  expectedAnnualReturnPercent: 5
};

test('退休規劃在 localStorage-shaped state 與 JSON Backup 匯入後完整保留', async () => {
  const { normalizeState, backupPayload, stateFromBackup } = await loadPersistence();
  const state = normalizeState({ retirementPlan });

  assert.deepEqual(state.retirementPlan, retirementPlan);
  const backup = backupPayload(state, {});
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;
  assert.deepEqual(restored.retirementPlan, retirementPlan);
});

test('舊 Backup 缺少退休規劃時不會虛構或覆寫目前已保存的退休規劃', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  const current = normalizeState({ retirementPlan });
  const restored = stateFromBackup({ holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], creditCards: [] }, current).state;

  assert.deepEqual(restored.retirementPlan, retirementPlan);
});
