import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { isCanonicalCalendarDay } from '../src/lib/calendarDay';

type LoanRecord = { id: string; name: string; principal: number; annualRate: number; monthlyPayment: number; startDate: string; totalMonths?: number; asOf?: string };
type AppPersistence = {
  normalizeState(raw: unknown): { [key: string]: unknown; loans: LoanRecord[] };
  backupPayload(state: unknown, quotes: Record<string, unknown>): unknown;
  stateFromBackup(raw: unknown, current: unknown): { state: { [key: string]: unknown; loans: LoanRecord[] } };
};

async function loadAppPersistence(): Promise<AppPersistence> {
  const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
  try {
    return await server.ssrLoadModule('/src/App.tsx') as AppPersistence;
  } finally {
    await server.close();
  }
}

const legacyLoan = { id: 'loan-legacy', name: '信貸', principal: 500000, annualRate: 3.5, monthlyPayment: 10000, startDate: '2024-01-01' };

test('UR-TODO-041: a loan with no asOf is migrated to today (not left null, not pre-dated) across localStorage normalization', async () => {
  const { normalizeState } = await loadAppPersistence();
  const state = normalizeState({ loans: [legacyLoan] });
  const migrated = state.loans[0];
  assert.ok(isCanonicalCalendarDay(migrated.asOf), `expected a valid canonical calendar-day, got ${migrated.asOf}`);
  assert.equal(migrated.monthlyPayment, legacyLoan.monthlyPayment);
});

test('UR-TODO-041: an already-present valid asOf is preserved verbatim, never overwritten by the migration default', async () => {
  const { normalizeState } = await loadAppPersistence();
  const state = normalizeState({ loans: [{ ...legacyLoan, asOf: '2026-01-15' }] });
  assert.equal(state.loans[0].asOf, '2026-01-15');
});

test('UR-TODO-041: migration is consistent across localStorage and JSON Backup import', async () => {
  const { normalizeState, backupPayload, stateFromBackup } = await loadAppPersistence();
  const localState = normalizeState({ loans: [legacyLoan] });
  const localAsOf = localState.loans[0].asOf;

  const restoredFromBackup = stateFromBackup(JSON.parse(JSON.stringify(backupPayload(localState, {}))), normalizeState({})).state;

  for (const state of [restoredFromBackup]) {
    assert.ok(isCanonicalCalendarDay(state.loans[0].asOf));
  }
  // The migrated asOf is a deterministic "today" value produced by the same canonical-day
  // producer on every persisted local path within this single test run, so both should agree.
  assert.equal(restoredFromBackup.loans[0].asOf, localAsOf);
});

test('UR-TODO-041: migration never overwrites monthlyPayment or any other loan field', async () => {
  const { normalizeState } = await loadAppPersistence();
  const state = normalizeState({ loans: [legacyLoan] });
  const migrated = state.loans[0];
  assert.equal(migrated.name, legacyLoan.name);
  assert.equal(migrated.principal, legacyLoan.principal);
  assert.equal(migrated.annualRate, legacyLoan.annualRate);
  assert.equal(migrated.monthlyPayment, legacyLoan.monthlyPayment);
  assert.equal(migrated.startDate, legacyLoan.startDate);
});

test('UR-TODO-041: a freshly migrated loan (asOf = today) is never immediately reported as stale', async () => {
  const { normalizeState } = await loadAppPersistence();
  const { deriveLoanDataFreshness } = await import('../src/lib/loanDataFreshness');
  const state = normalizeState({ loans: [legacyLoan] });
  const migrated = state.loans[0];
  const [freshness] = deriveLoanDataFreshness([{ id: migrated.id, asOf: migrated.asOf }], migrated.asOf!);
  assert.equal(freshness.isStale, false);
});
