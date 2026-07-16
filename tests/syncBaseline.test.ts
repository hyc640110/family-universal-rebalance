import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  canonicalSyncJson,
  createSyncPayloadSnapshot,
  deriveSuccessfulUploadResult,
  deriveSyncBaselineDiagnostics,
  hasSyncableStateChanged,
  shortSyncFingerprint,
  stableCanonicalJson,
  SYNC_CANONICAL_SCHEMA,
  syncPayloadTopLevelDiff,
  syncPayloadFingerprint,
  withoutSyncBaseline
} from '../src/lib/syncState';

const meta = (overrides: Record<string, unknown> = {}) => ({
  dirty: false,
  source: '本機資料',
  status: '已同步',
  baselineFingerprint: 'sync-v1-0000000000000000',
  ...overrides
});

const state = (overrides: Record<string, unknown> = {}) => ({
  holdings: [{ symbol: '00631L', name: '元大台灣50正2', shares: 1000, targetWeight: 40 }],
  accounts: [{ id: 'account-1', manualBalance: 1000 }],
  cash: [],
  loans: [],
  transactions: [],
  netWorthHistory: [{ date: '2026-07-14', totalAssets: 1000 }],
  gmailOAuth: { status: 'disconnected', grantedScopes: [], lastCheckedAt: '2026-07-14T00:00:00.000Z' },
  firebase: { databaseURL: 'https://example.firebaseio.com', secretPath: 'device-a' },
  syncMeta: meta(),
  remoteMeta: { holdingsCount: 1, cashCount: 0, loansCount: 0, updatedAt: '2026-07-14T00:00:00.000Z' },
  ...overrides
});

test('equal canonical sync payloads have the same fingerprint and are clean against their baseline', () => {
  const current = state();
  const snapshot = createSyncPayloadSnapshot(current);
  const baseline = snapshot.fingerprint;
  assert.equal(syncPayloadFingerprint({ ...current, syncMeta: meta({ dirty: true }) }), baseline);
  const diagnostics = deriveSyncBaselineDiagnostics(current, baseline, snapshot.fieldFingerprints);
  assert.equal(diagnostics.baselineAvailable, true);
  assert.equal(diagnostics.currentFingerprint, baseline);
  assert.equal(diagnostics.baselineFingerprint, baseline);
  assert.equal(diagnostics.dirty, false);
  assert.equal(diagnostics.reason, 'clean');
  assert.equal(diagnostics.canonicalSchema, SYNC_CANONICAL_SCHEMA);
  assert.deepEqual(diagnostics.currentFieldFingerprints, snapshot.fieldFingerprints);
  assert.deepEqual(diagnostics.baselineFieldFingerprints, snapshot.fieldFingerprints);
  assert.deepEqual(diagnostics.changedFields, []);
});

test('real sync payload changes produce a different fingerprint and dirty payload-diff reason', () => {
  const original = state();
  const changed = state({ accounts: [{ id: 'account-1', manualBalance: 1001 }] });
  const baseline = syncPayloadFingerprint(original);
  assert.notEqual(syncPayloadFingerprint(changed), baseline);
  assert.equal(deriveSyncBaselineDiagnostics(changed, baseline).dirty, true);
  assert.equal(deriveSyncBaselineDiagnostics(changed, baseline).reason, 'payload differs');
});

test('syncMeta, remoteMeta, timestamps, runtime diagnostics, and dirty metadata do not affect canonical payload', () => {
  const original = state();
  const metadataOnly = state({
    syncMeta: meta({ dirty: true, lastUploadAt: '2026-07-15T00:00:00.000Z', runtimeProvenance: { build: 'next' } }),
    remoteMeta: { holdingsCount: 99, cashCount: 99, loansCount: 99, updatedAt: '2026-07-15T00:00:00.000Z' }
  });
  assert.equal(syncPayloadFingerprint(metadataOnly), syncPayloadFingerprint(original));
  assert.equal(hasSyncableStateChanged(original, metadataOnly), false);
});

test('Gmail OAuth lastCheckedAt is device diagnostic metadata and cannot dirty or enter Firebase payload', () => {
  const original = state();
  const checkedLater = state({ gmailOAuth: { status: 'disconnected', grantedScopes: [], lastCheckedAt: '2026-07-15T00:00:00.000Z' } });
  assert.equal(syncPayloadFingerprint(checkedLater), syncPayloadFingerprint(original));
  assert.deepEqual(syncPayloadTopLevelDiff(original, checkedLater), []);
  assert.doesNotMatch(createSyncPayloadSnapshot(checkedLater).canonicalJson, /lastCheckedAt/);
});

test('safe top-level diff reports a real Gmail OAuth state change without exposing values', () => {
  const original = state();
  const connected = state({ gmailOAuth: { status: 'connected', grantedScopes: ['https://www.googleapis.com/auth/gmail.readonly'], lastCheckedAt: '2026-07-15T00:00:00.000Z' } });
  assert.deepEqual(syncPayloadTopLevelDiff(original, connected), ['gmailOAuth']);
});

test('successful upload baseline records the sent A payload and remains clean while current is A', () => {
  const sentA = createSyncPayloadSnapshot(state());
  const outcome = deriveSyncBaselineDiagnostics(state(), sentA.fingerprint);
  assert.equal(outcome.dirty, false);
  assert.equal(outcome.baselineFingerprint, sentA.fingerprint);
});

test('mobile-equivalent upload success survives persistence and reload with baseline A clean', () => {
  const currentA = state({ syncMeta: meta({ dirty: true, baselineFingerprint: 'sync-v1-1111111111111111' }) });
  const sentA = createSyncPayloadSnapshot(currentA);
  const outcome = deriveSuccessfulUploadResult(currentA, sentA);
  const callbackState = {
    ...currentA,
    syncMeta: meta({ baselineFingerprint: sentA.fingerprint, dirty: outcome.dirty, lastUploadAt: '2026-07-15T00:00:00.000Z' })
  };
  const reloaded = JSON.parse(JSON.stringify(callbackState));
  assert.equal(outcome.dirty, false);
  assert.equal(reloaded.syncMeta.baselineFingerprint, sentA.fingerprint);
  assert.equal(deriveSyncBaselineDiagnostics(reloaded, reloaded.syncMeta.baselineFingerprint).dirty, false);
});

test('metadata callback after upload keeps the localStorage baseline and clean result', () => {
  const currentA = state();
  const sentA = createSyncPayloadSnapshot(currentA);
  const callbackState = { ...currentA, syncMeta: meta({ baselineFingerprint: sentA.fingerprint, dirty: false }) };
  const metadataEffect = {
    ...callbackState,
    syncMeta: { ...callbackState.syncMeta, lastUploadAt: '2026-07-15T00:00:01.000Z', status: 'persisted' },
    remoteMeta: { holdingsCount: 1, cashCount: 0, loansCount: 0, updatedAt: '2026-07-15T00:00:01.000Z' }
  };
  assert.equal(deriveSyncBaselineDiagnostics(metadataEffect, sentA.fingerprint).dirty, false);
});

test('upload race A to B keeps baseline A and marks current B dirty after A succeeds', () => {
  const payloadA = state();
  const payloadB = state({ holdings: [{ symbol: '00631L', name: '元大台灣50正2', shares: 1001, targetWeight: 40 }] });
  const sentA = createSyncPayloadSnapshot(payloadA);
  const outcome = deriveSyncBaselineDiagnostics(payloadB, sentA.fingerprint);
  assert.equal(outcome.baselineFingerprint, sentA.fingerprint);
  assert.equal(outcome.currentFingerprint, syncPayloadFingerprint(payloadB));
  assert.equal(outcome.dirty, true);
});

test('successful upload outcome reports netWorthHistory when it truly changes after request A', () => {
  const payloadA = state();
  const payloadB = state({ netWorthHistory: [...(payloadA.netWorthHistory as unknown[]), { date: '2026-07-15', totalAssets: 1001 }] });
  const outcome = deriveSuccessfulUploadResult(payloadB, createSyncPayloadSnapshot(payloadA));
  assert.equal(outcome.dirty, true);
  assert.deepEqual(outcome.changedFields, ['netWorthHistory']);
});

test('upload failure does not invent or replace a baseline and changed data stays dirty', () => {
  const previousBaseline = syncPayloadFingerprint(state());
  const changed = state({ transactions: [{ id: 'tx-1', amount: 1 }] });
  const beforeFailure = deriveSyncBaselineDiagnostics(changed, previousBaseline);
  const afterFailure = deriveSyncBaselineDiagnostics(changed, previousBaseline);
  assert.deepEqual(afterFailure, beforeFailure);
  assert.equal(afterFailure.dirty, true);
});

test('successful download uses the downloaded canonical payload as a clean baseline', () => {
  const downloaded = state({ holdings: [{ symbol: '00662', name: '富邦NASDAQ', shares: 3, targetWeight: 40 }] });
  const baseline = syncPayloadFingerprint(downloaded);
  assert.equal(deriveSyncBaselineDiagnostics(downloaded, baseline).dirty, false);
});

test('download failure leaves the existing local baseline and payload unchanged', () => {
  const local = state();
  const baseline = syncPayloadFingerprint(local);
  assert.equal(deriveSyncBaselineDiagnostics(local, baseline).reason, 'clean');
  assert.equal(syncPayloadFingerprint(local), baseline);
});

test('legacy local data without a baseline is conservative, explicit, and intact', () => {
  const legacy = state({ syncMeta: { dirty: false, source: '本機資料', status: '舊資料' } });
  const outcome = deriveSyncBaselineDiagnostics(legacy);
  assert.equal(outcome.baselineAvailable, false);
  assert.equal(outcome.dirty, true);
  assert.equal(outcome.reason, 'baseline missing');
  assert.equal((legacy.holdings as unknown[]).length, 1);
});

test('legacy Backup metadata without baseline remains valid and local baseline is portable only when explicitly removed', () => {
  const oldMeta = { dirty: true, source: '已從備份匯入' as const, status: '舊備份' };
  assert.deepEqual(withoutSyncBaseline(oldMeta), oldMeta);
  assert.equal('baselineFingerprint' in withoutSyncBaseline(meta() as never), false);
});

test('quote cache and fetchedAt stay outside AppState and cannot change its fingerprint', () => {
  const current = state();
  const before = syncPayloadFingerprint(current);
  const quoteCache = { '00631L': { price: 100, fetchedAt: '2026-07-14T00:00:00.000Z' } };
  quoteCache['00631L'] = { price: 101, fetchedAt: '2026-07-15T00:00:00.000Z' };
  assert.equal(syncPayloadFingerprint(current), before);
});

test('persisted holding name changes are syncable and mark the payload dirty', () => {
  const original = state();
  const renamed = state({ holdings: [{ symbol: '00631L', name: '正式名稱更新', shares: 1000, targetWeight: 40 }] });
  assert.equal(hasSyncableStateChanged(original, renamed), true);
});

test('netWorthHistory snapshots are syncable and mark the payload dirty', () => {
  const original = state();
  const next = state({ netWorthHistory: [...(original.netWorthHistory as unknown[]), { date: '2026-07-15', totalAssets: 1001 }] });
  assert.equal(hasSyncableStateChanged(original, next), true);
});

test('metadata updates after upload keep a matching baseline clean', () => {
  const uploaded = state();
  const baseline = syncPayloadFingerprint(uploaded);
  const metadataOnly = { ...uploaded, syncMeta: meta({ baselineFingerprint: baseline, lastUploadAt: '2026-07-15T00:00:00.000Z' }) };
  assert.equal(deriveSyncBaselineDiagnostics(metadataOnly, baseline).dirty, false);
});

test('baseline metadata never appears in the Firebase canonical payload', () => {
  const snapshot = createSyncPayloadSnapshot(state());
  assert.equal('syncMeta' in snapshot.payload, false);
  assert.equal('remoteMeta' in snapshot.payload, false);
  assert.doesNotMatch(snapshot.canonicalJson, /baselineFingerprint|syncMeta|remoteMeta/);
});

test('canonical serializer ignores object insertion order but retains semantic values', () => {
  const left = { beta: 2, alpha: { delta: 4, gamma: 3 } };
  const right = { alpha: { gamma: 3, delta: 4 }, beta: 2 };
  assert.equal(stableCanonicalJson(left), stableCanonicalJson(right));
});

test('array order remains business-significant and is never sorted away', () => {
  const left = state({ holdings: [{ symbol: 'AAA' }, { symbol: 'BBB' }] });
  const right = state({ holdings: [{ symbol: 'BBB' }, { symbol: 'AAA' }] });
  assert.notEqual(canonicalSyncJson(left), canonicalSyncJson(right));
  assert.equal(hasSyncableStateChanged(left, right), true);
});

test('fingerprint short codes do not reveal the canonical payload', () => {
  const fingerprint = syncPayloadFingerprint(state());
  assert.match(fingerprint, /^sync-v2-[0-9a-f]{16}$/);
  assert.match(shortSyncFingerprint(fingerprint), /^[0-9a-f]{12}$/);
  assert.doesNotMatch(shortSyncFingerprint(fingerprint), /00631L|device-a/);
});

test('App upload, download, Backup, and reset flows enforce baseline lifecycle and canonical request body', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /body: snapshot\.canonicalJson/);
  assert.match(app, /const requestSnapshot = createSyncPayloadSnapshot\(normalized\)/);
  assert.match(app, /uploadFirebase\(normalized\.firebase, requestSnapshot\)/);
  assert.match(app, /baselineFingerprint: uploadedSnapshot\.fingerprint/);
  assert.match(app, /baselineFieldFingerprints: uploadedSnapshot\.fieldFingerprints/);
  assert.match(app, /baselineCanonicalSchema: uploadedSnapshot\.canonicalSchema/);
  assert.match(app, /setState\(current => \{[\s\S]*?deriveSuccessfulUploadResult\(current, uploadedSnapshot\)/);
  assert.doesNotMatch(app, /deriveSyncBaselineDiagnostics\(stateRef\.current, uploadedSnapshot\.fingerprint\)/);
  assert.match(app, /const downloadedSnapshot = createSyncPayloadSnapshot\(remote\)/);
  assert.match(app, /baselineFingerprint: downloadedSnapshot\.fingerprint/);
  assert.match(app, /syncMeta: withoutSyncBaseline\(normalized\.syncMeta\)/);
  assert.match(app, /baselineFingerprint: undefined,[\s\S]*?source: '已從備份匯入'/);
  assert.match(app, /已重設為預設資產；尚未建立同步基準/);
});

test('persistence effect cannot overwrite a newer stateRef baseline with an older render', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /useEffect\(\(\) => \{\s*if \(stateRef\.current !== state\) return;\s*writeState\(state\)/);
  assert.doesNotMatch(app, /stateRef\.current = state; writeState\(state\)/);
});

test('sync status text is derived from current diagnostics rather than stale syncMeta dirty', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /syncBaselineDiagnostics\.dirty \? localDirtyStatus\(state\)/);
  assert.doesNotMatch(app, /syncMeta\.dirty \? localDirtyStatus\(state\)/);
});

test('Gmail OAuth status effect is stable across parent renders and does not poll on inline onChange identity', () => {
  const component = readFileSync(new URL('../src/components/GmailOAuthSettings.tsx', import.meta.url), 'utf8');
  assert.match(component, /const onChangeRef = useRef\(onChange\)/);
  assert.match(component, /getGoogleOAuthStatus\(\)[\s\S]*?onChangeRef\.current/);
  assert.doesNotMatch(component, /\[enabled, onChange\]/);
});

test('sync diagnostics expose only short fingerprints and never render the Firebase path or full payload', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /<span>Sync baseline<\/span>/);
  assert.match(app, /<span>Current fingerprint<\/span>/);
  assert.match(app, /<span>Baseline fingerprint<\/span>/);
  assert.match(app, /<span>Dirty reason<\/span>/);
  assert.doesNotMatch(app, /`FirebasePath:|<span>Firebase path<\/span>|<span>實際 Firebase path<\/span>/);
  assert.match(app, /不包含 Firebase 完整路徑、完整同步 payload/);
});

test('Preview and Production storage keys and Firebase path behavior remain isolated', () => {
  const previewEnv = readFileSync(new URL('../.env.preview-deploy', import.meta.url), 'utf8');
  const appInfo = readFileSync(new URL('../src/constants/appInfo.ts', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(previewEnv, /VITE_STORAGE_KEY=family-universal-rebalance-preview-v100-state/);
  assert.match(appInfo, /family-universal-rebalance-v100-state/);
  assert.match(previewEnv, /VITE_FIREBASE_BASE_PATH=family-universal-rebalance-preview/);
  assert.match(appInfo, /createEnvironmentBoundary\(import\.meta\.env\.VITE_DEPLOYMENT_ENVIRONMENT, import\.meta\.env\.VITE_FIREBASE_BASE_PATH\)/);
  assert.match(app, /function syncPath\(config: FirebaseConfig\).*buildFirebaseSyncRoot\(config\.secretPath\)/s);
});
