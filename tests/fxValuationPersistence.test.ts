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

const rate = {
  id: 'cbt-usd-twd-2026-08-12', baseCurrency: 'USD', quoteCurrency: 'TWD', quotePerBase: 31,
  rateType: 'reference-close', provider: 'Central Bank of the Republic of China (Taiwan)', rateDate: '2026-08-12',
  capturedAt: '2026-08-12T09:00:00.000Z', policyVersion: 'fx-a1-v1'
};

const pinnedValuation = {
  status: 'available', accountId: 'usd-cash', originalAmount: 1_000, originalCurrency: 'USD', valuationCurrency: 'TWD', valuationDate: '2026-08-12',
  rateId: rate.id, quotePerBase: 31, rateDate: '2026-08-12', staleDays: 0, carriedForward: false,
  unroundedValue: 31_000, roundedValue: 31_000, policyVersion: 'fx-a1-v1'
};

test('FX-A1: fxRateHistory and new snapshot pinned provenance survive localStorage-shaped and JSON Backup round-trips', async () => {
  const { normalizeState, backupPayload, stateFromBackup } = await loadPersistence();
  const state = normalizeState({
    fxRateHistory: [rate],
    netWorthHistory: [{ date: '2026-08-12', totalAssets: 31_000, netWorth: 31_000, investmentValue: 0, cash: 31_000, debt: 0, fxValuations: [pinnedValuation] }]
  });
  assert.deepEqual(state.fxRateHistory, [rate]);
  assert.deepEqual((state.netWorthHistory as Array<Record<string, unknown>>)[0].fxValuations, [pinnedValuation]);

  const backup = backupPayload(state, {});
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;
  assert.deepEqual(restored.fxRateHistory, [rate]);
  assert.deepEqual((restored.netWorthHistory as Array<Record<string, unknown>>)[0].fxValuations, [pinnedValuation]);
});

test('FX-A1: legacy snapshots stay readable, while malformed pinned provenance is discarded instead of inferring FX attribution', async () => {
  const { normalizeState } = await loadPersistence();
  const legacy = normalizeState({ netWorthHistory: [{ date: '2026-08-01', totalAssets: 100, netWorth: 100, investmentValue: 0, cash: 100, debt: 0 }] });
  assert.equal('fxValuations' in (legacy.netWorthHistory as Array<Record<string, unknown>>)[0], false);

  const malformed = normalizeState({ netWorthHistory: [{ date: '2026-08-12', totalAssets: 100, netWorth: 100, investmentValue: 0, cash: 100, debt: 0, fxValuations: [{ ...pinnedValuation, quotePerBase: 0 }] }] });
  assert.equal('fxValuations' in (malformed.netWorthHistory as Array<Record<string, unknown>>)[0], false);
});

test('FX-A1: a pinned snapshot valuation does not change after a later rate revision is appended', async () => {
  const { normalizeState } = await loadPersistence();
  const state = normalizeState({
    fxRateHistory: [rate, { ...rate, id: 'cbt-usd-twd-2026-08-12-revision-2', quotePerBase: 32, capturedAt: '2026-08-13T09:00:00.000Z' }],
    netWorthHistory: [{ date: '2026-08-12', totalAssets: 31_000, netWorth: 31_000, investmentValue: 0, cash: 31_000, debt: 0, fxValuations: [pinnedValuation] }]
  });
  assert.equal((state.netWorthHistory as Array<{ fxValuations?: Array<{ quotePerBase: number }> }>)[0].fxValuations?.[0].quotePerBase, 31);
});
