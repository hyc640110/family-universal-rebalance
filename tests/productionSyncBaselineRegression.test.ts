import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeGmailOAuth } from '../src/lib/gmailOAuth';
import { netWorthSnapshotFromTotals, normalizeNetWorthHistory, upsertNetWorthSnapshot } from '../src/lib/netWorthHistory';
import { normalizeWealthGoalSettings } from '../src/lib/wealthGoal';
import {
  SYNC_CANONICAL_SCHEMA,
  SYNCABLE_TOP_LEVEL_FIELDS,
  canonicalSyncPayload,
  createSyncPayloadSnapshot,
  deriveSuccessfulUploadResult,
  deriveSyncBaselineDiagnostics,
  shortSyncFingerprint,
  stableCanonicalJson,
  syncPayloadFingerprint,
  syncPayloadTopLevelDiff,
  withoutSyncBaseline
} from '../src/lib/syncState';

const localMeta = (overrides: Record<string, unknown> = {}) => ({
  dirty: false,
  source: '本機資料',
  status: '已同步',
  ...overrides
});

const productionEquivalentState = (overrides: Record<string, unknown> = {}) => ({
  holdings: [{ symbol: 'TEST1', name: '匿名資產', shares: 2, avgCost: 10, assetClass: 'growth', targetWeight: 40 }],
  cash: [{ id: 'cash-test', name: '匿名現金', amount: 20, note: '' }],
  accounts: [{ id: 'account-test', name: '匿名帳戶', type: 'cash', manualBalance: 20, currency: 'TWD', balanceMode: 'manual', active: true, includeInNetWorth: true, includeInLiquidCash: true, sortOrder: 0, note: '' }],
  accountSchemaVersion: 1,
  cashAccountMigrationVersion: 1,
  transactions: [],
  transactionSchemaVersion: 1,
  importSessions: [],
  importPresets: [],
  importSchemaVersion: 1,
  gmailOAuth: { status: 'disconnected', grantedScopes: [] },
  loans: [],
  refreshSec: 60,
  autoSync: false,
  autoSyncSec: 60,
  allocationPreset: 'custom',
  allocationRoleBySymbol: {},
  rebalanceMode: 'buy-only',
  rebalanceThreshold: 5,
  buyOnlyBudget: 100000,
  dipAlerts: {},
  wealthGoal: normalizeWealthGoalSettings(undefined),
  netWorthHistory: [netWorthSnapshotFromTotals({ totalAssets: 40, netWorth: 40, investmentValue: 20, cash: 20, debt: 0 }, '2026-07-15')],
  firebase: { databaseURL: 'https://production.invalid', secretPath: 'private-production-path' },
  workerUrl: 'https://production-worker.invalid',
  deploymentMetadata: { environment: 'production', commit: 'production-commit' },
  syncMeta: localMeta(),
  remoteMeta: null,
  ...overrides
});

const previewEquivalentState = () => productionEquivalentState({
  firebase: { databaseURL: 'https://preview.invalid', secretPath: 'private-preview-path' },
  workerUrl: 'https://preview-worker.invalid',
  deploymentMetadata: { environment: 'preview', commit: 'preview-commit' }
});

const normalizeReloadEquivalent = (raw: Record<string, unknown>) => ({
  ...raw,
  gmailOAuth: normalizeGmailOAuth(raw.gmailOAuth),
  wealthGoal: normalizeWealthGoalSettings(raw.wealthGoal),
  ...(raw.netWorthHistory === undefined ? {} : { netWorthHistory: normalizeNetWorthHistory(raw.netWorthHistory) })
});

test('Production-equivalent snapshot survives request JSON and reload normalization', () => {
  const before = normalizeReloadEquivalent(productionEquivalentState());
  const snapshot = createSyncPayloadSnapshot(before);
  const requestBody = JSON.parse(snapshot.canonicalJson) as Record<string, unknown>;
  const reloaded = normalizeReloadEquivalent(requestBody);
  assert.equal(createSyncPayloadSnapshot(reloaded).canonicalJson, snapshot.canonicalJson);
  assert.equal(syncPayloadFingerprint(reloaded), snapshot.fingerprint);
});

test('Preview-equivalent snapshot has the same round-trip contract', () => {
  const before = normalizeReloadEquivalent(previewEquivalentState());
  const snapshot = createSyncPayloadSnapshot(before);
  const reloaded = normalizeReloadEquivalent(JSON.parse(snapshot.canonicalJson));
  assert.equal(syncPayloadFingerprint(reloaded), snapshot.fingerprint);
});

test('Production and Preview deployment metadata cannot pollute sync payload', () => {
  const production = createSyncPayloadSnapshot(productionEquivalentState());
  const preview = createSyncPayloadSnapshot(previewEquivalentState());
  assert.equal(production.fingerprint, preview.fingerprint);
  assert.equal('firebase' in production.payload, false);
  assert.equal('workerUrl' in production.payload, false);
  assert.equal('deploymentMetadata' in production.payload, false);
});

test('undefined object properties follow JSON request semantics', () => {
  const withUndefined = productionEquivalentState({ wealthGoal: { targetAmount: 1, targetYear: undefined } });
  const snapshot = createSyncPayloadSnapshot(withUndefined);
  assert.equal(snapshot.canonicalJson, stableCanonicalJson(JSON.parse(JSON.stringify(canonicalSyncPayload(withUndefined)))));
  assert.equal((snapshot.payload.wealthGoal as Record<string, unknown>).targetYear, undefined);
});

test('undefined array entries become null exactly like JSON.stringify', () => {
  const value = productionEquivalentState({ importSessions: [undefined, null] });
  const snapshot = createSyncPayloadSnapshot(value);
  assert.deepEqual(snapshot.payload.importSessions, [null, null]);
  assert.equal(snapshot.canonicalJson, stableCanonicalJson(JSON.parse(JSON.stringify(canonicalSyncPayload(value)))));
});

test('missing values normalized to defaults do not drift on reload', () => {
  const raw = productionEquivalentState();
  delete (raw as Record<string, unknown>).wealthGoal;
  const normalizedBeforeUpload = normalizeReloadEquivalent(raw);
  const snapshot = createSyncPayloadSnapshot(normalizedBeforeUpload);
  const reloaded = normalizeReloadEquivalent(JSON.parse(snapshot.canonicalJson));
  assert.equal(syncPayloadFingerprint(reloaded), snapshot.fingerprint);
});

test('Firebase configuration is device-local and excluded from canonical payload', () => {
  const left = productionEquivalentState();
  const right = productionEquivalentState({ firebase: { databaseURL: 'https://other.invalid', secretPath: 'other-private-path' } });
  assert.equal(syncPayloadFingerprint(left), syncPayloadFingerprint(right));
  assert.deepEqual(syncPayloadTopLevelDiff(left, right), []);
});

test('Production-disabled Gmail OAuth normalizes without fingerprint drift', () => {
  const disconnected = productionEquivalentState({ gmailOAuth: normalizeGmailOAuth(undefined) });
  const reloaded = productionEquivalentState({ gmailOAuth: normalizeGmailOAuth((disconnected as Record<string, unknown>).gmailOAuth) });
  assert.equal(syncPayloadFingerprint(reloaded), syncPayloadFingerprint(disconnected));
});

test('Gmail OAuth lastCheckedAt remains device-only', () => {
  const before = productionEquivalentState({ gmailOAuth: { status: 'disconnected', grantedScopes: [], lastCheckedAt: '2026-07-15T00:00:00.000Z' } });
  const after = productionEquivalentState({ gmailOAuth: { status: 'disconnected', grantedScopes: [], lastCheckedAt: '2026-07-15T00:01:00.000Z' } });
  assert.equal(syncPayloadFingerprint(after), syncPayloadFingerprint(before));
});

test('unchanged netWorthHistory is stable after normalization', () => {
  const current = productionEquivalentState();
  const normalized = productionEquivalentState({ netWorthHistory: normalizeNetWorthHistory(current.netWorthHistory) });
  assert.equal(syncPayloadFingerprint(normalized), syncPayloadFingerprint(current));
});

test('a genuine netWorthHistory snapshot remains syncable', () => {
  const current = productionEquivalentState();
  const changed = productionEquivalentState({ netWorthHistory: upsertNetWorthSnapshot(current.netWorthHistory, netWorthSnapshotFromTotals({ totalAssets: 41, netWorth: 41, investmentValue: 21, cash: 20, debt: 0 }, '2026-07-15')) });
  assert.notEqual(syncPayloadFingerprint(changed), syncPayloadFingerprint(current));
  assert.deepEqual(syncPayloadTopLevelDiff(current, changed), ['netWorthHistory']);
});

test('upload baseline is the fingerprint of the exact immutable request body', () => {
  const snapshot = createSyncPayloadSnapshot(productionEquivalentState());
  const requestSnapshot = createSyncPayloadSnapshot(JSON.parse(snapshot.canonicalJson));
  assert.equal(requestSnapshot.fingerprint, snapshot.fingerprint);
  assert.equal(requestSnapshot.canonicalJson, snapshot.canonicalJson);
});

test('reload keeps baseline available and current equal to baseline', () => {
  const snapshot = createSyncPayloadSnapshot(productionEquivalentState());
  const reloaded = normalizeReloadEquivalent(JSON.parse(snapshot.canonicalJson));
  const diagnostics = deriveSyncBaselineDiagnostics(reloaded, snapshot.fingerprint, snapshot.fieldFingerprints);
  assert.equal(diagnostics.baselineAvailable, true);
  assert.equal(diagnostics.dirty, false);
  assert.equal(diagnostics.reason, 'clean');
});

test('local persistence round-trip retains baseline field diagnostics', () => {
  const current = productionEquivalentState();
  const snapshot = createSyncPayloadSnapshot(current);
  const persisted = JSON.parse(JSON.stringify({ ...current, syncMeta: localMeta({ baselineFingerprint: snapshot.fingerprint, baselineFieldFingerprints: snapshot.fieldFingerprints, baselineCanonicalSchema: snapshot.canonicalSchema }) }));
  assert.equal(persisted.syncMeta.baselineFingerprint, snapshot.fingerprint);
  assert.deepEqual(persisted.syncMeta.baselineFieldFingerprints, snapshot.fieldFingerprints);
  assert.equal(persisted.syncMeta.baselineCanonicalSchema, SYNC_CANONICAL_SCHEMA);
});

test('top-level diagnostics expose only allowlisted names and short fingerprints', () => {
  const snapshot = createSyncPayloadSnapshot(productionEquivalentState());
  for (const [key, fingerprint] of Object.entries(snapshot.fieldFingerprints)) {
    assert.ok((SYNCABLE_TOP_LEVEL_FIELDS as readonly string[]).includes(key));
    assert.match(shortSyncFingerprint(fingerprint), /^[0-9a-f]{12}$/);
  }
  const safeText = Object.entries(snapshot.fieldFingerprints).map(([key, value]) => `${key}:${shortSyncFingerprint(value)}`).join('/');
  assert.doesNotMatch(safeText, /production\.invalid|private-production-path|匿名|TEST1/);
});

test('baseline diagnostics never enter Firebase request payload', () => {
  const snapshot = createSyncPayloadSnapshot(productionEquivalentState());
  const withBaseline = productionEquivalentState({ syncMeta: localMeta({ baselineFingerprint: snapshot.fingerprint, baselineFieldFingerprints: snapshot.fieldFingerprints, baselineCanonicalSchema: snapshot.canonicalSchema }) });
  const request = createSyncPayloadSnapshot(withBaseline);
  assert.equal('syncMeta' in request.payload, false);
  assert.doesNotMatch(request.canonicalJson, /baselineFieldFingerprints|baselineCanonicalSchema/);
});

test('baseline diagnostics never enter Backup JSON', () => {
  const snapshot = createSyncPayloadSnapshot(productionEquivalentState());
  const portable = withoutSyncBaseline(localMeta({ baselineFingerprint: snapshot.fingerprint, baselineFieldFingerprints: snapshot.fieldFingerprints, baselineCanonicalSchema: snapshot.canonicalSchema }) as never);
  assert.equal('baselineFingerprint' in portable, false);
  assert.equal('baselineFieldFingerprints' in portable, false);
  assert.equal('baselineCanonicalSchema' in portable, false);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /syncMeta: withoutSyncBaseline\(normalized\.syncMeta\)/);
});

test('A to B upload race still reports the real changed top-level field', () => {
  const stateA = productionEquivalentState();
  const stateB = productionEquivalentState({ transactions: [{ id: 'tx-test', amount: 1 }] });
  const outcome = deriveSuccessfulUploadResult(stateB, createSyncPayloadSnapshot(stateA));
  assert.equal(outcome.dirty, true);
  assert.deepEqual(outcome.changedFields, ['transactions']);
});

test('legacy total-only baseline remains readable and explicit', () => {
  const current = productionEquivalentState();
  const legacy = deriveSyncBaselineDiagnostics(current, 'sync-v1-0000000000000000');
  assert.equal(legacy.baselineAvailable, true);
  assert.equal(legacy.dirty, true);
  assert.equal(legacy.baselineFieldFingerprints, undefined);
  assert.deepEqual(legacy.changedFields, []);
});

test('Preview and Production storage keys and Firebase paths remain isolated', () => {
  const previewEnv = readFileSync(new URL('../.env.preview-deploy', import.meta.url), 'utf8');
  const appInfo = readFileSync(new URL('../src/constants/appInfo.ts', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(previewEnv, /VITE_STORAGE_KEY=family-universal-rebalance-preview-v100-state/);
  assert.match(appInfo, /family-universal-rebalance-v100-state/);
  assert.match(app, /FIREBASE_BASE_PATH.*encodeURIComponent\(config\.secretPath/s);
});

test('Production regression path waits for Quote settlement and snapshots net worth before upload', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /if \(!hasUpdatedQuotes \|\| isRefreshingQuotes\) throw new Error/);
  assert.match(app, /netWorthHistory: upsertNetWorthSnapshot\(stateRef\.current\.netWorthHistory, currentNetWorthSnapshot\)/);
  assert.match(app, /if \(!hasUpdatedQuotes\) return;[\s\S]*upsertNetWorthSnapshot\(current\.netWorthHistory, currentNetWorthSnapshot\)/);
});
