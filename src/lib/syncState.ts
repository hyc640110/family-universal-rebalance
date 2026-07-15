export type SyncSource = '本機資料' | '已從雲端下載' | '已從備份匯入';

export const SYNC_CANONICAL_SCHEMA = 'sync-json-v2';
export const SYNCABLE_TOP_LEVEL_FIELDS = [
  'holdings',
  'cash',
  'accounts',
  'accountSchemaVersion',
  'cashAccountMigrationVersion',
  'transactions',
  'transactionSchemaVersion',
  'importSessions',
  'importPresets',
  'importSchemaVersion',
  'gmailOAuth',
  'loans',
  'refreshSec',
  'autoSync',
  'autoSyncSec',
  'allocationPreset',
  'allocationRoleBySymbol',
  'rebalanceMode',
  'rebalanceThreshold',
  'buyOnlyBudget',
  'dipAlerts',
  'wealthGoal',
  'cashFlowProfile',
  'netWorthHistory'
] as const;

export type SyncFieldFingerprints = Record<string, string>;

export function sanitizeSyncFieldFingerprints(raw: unknown): SyncFieldFingerprints | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const source = raw as Record<string, unknown>;
  const allowed = new Set<string>(SYNCABLE_TOP_LEVEL_FIELDS);
  const entries = Object.keys(source)
    .filter(key => allowed.has(key) && typeof source[key] === 'string' && /^sync-field-v\d+-[0-9a-f]{16}$/.test(source[key] as string))
    .sort()
    .map(key => [key, source[key] as string]);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export type SyncMeta = {
  dirty: boolean;
  source: SyncSource;
  baselineFingerprint?: string;
  baselineFieldFingerprints?: SyncFieldFingerprints;
  baselineCanonicalSchema?: string;
  lastLocalSaveAt?: string;
  lastUploadAt?: string;
  lastDownloadAt?: string;
  lastBackupExportAt?: string;
  lastBackupImportAt?: string;
  status: string;
};

export type RemoteMeta = {
  holdingsCount: number;
  cashCount: number;
  loansCount: number;
  updatedAt?: string;
};

export type StateWithSyncMetadata = Record<string, unknown> & {
  syncMeta?: unknown;
  remoteMeta?: unknown;
};

export type SyncPayloadSnapshot = {
  payload: Record<string, unknown>;
  canonicalJson: string;
  fingerprint: string;
  fieldFingerprints: SyncFieldFingerprints;
  canonicalSchema: string;
};

export type SyncBaselineDiagnostics = {
  baselineAvailable: boolean;
  currentFingerprint: string;
  baselineFingerprint?: string;
  dirty: boolean;
  reason: 'clean' | 'payload differs' | 'baseline missing';
  canonicalSchema: string;
  currentFieldFingerprints: SyncFieldFingerprints;
  baselineFieldFingerprints?: SyncFieldFingerprints;
  changedFields: string[];
};

export type SuccessfulUploadResult = SyncBaselineDiagnostics;

/** Sync metadata describes this device, so it must not participate in payload equality or Firebase storage. */
export function withoutSyncMetadata<T extends StateWithSyncMetadata>(state: T): Omit<T, 'syncMeta' | 'remoteMeta'> {
  const syncableState = Object.fromEntries(
    SYNCABLE_TOP_LEVEL_FIELDS
      .filter(key => Object.prototype.hasOwnProperty.call(state, key))
      .map(key => [key, state[key]])
  ) as Omit<T, 'syncMeta' | 'remoteMeta'>;
  const gmailOAuth = syncableState.gmailOAuth;
  if (!gmailOAuth || typeof gmailOAuth !== 'object' || Array.isArray(gmailOAuth)) return syncableState;
  const { lastCheckedAt: _lastCheckedAt, ...syncableGmailOAuth } = gmailOAuth as Record<string, unknown>;
  return { ...syncableState, gmailOAuth: syncableGmailOAuth } as Omit<T, 'syncMeta' | 'remoteMeta'>;
}

function canonicalValue(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(item => {
    const normalized = canonicalValue(item);
    return normalized === undefined ? null : normalized;
  });
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    return Object.keys(source).sort().reduce<Record<string, unknown>>((result, key) => {
      const normalized = canonicalValue(source[key]);
      if (normalized !== undefined) result[key] = normalized;
      return result;
    }, {});
  }
  return undefined;
}

export function stableCanonicalJson(value: unknown) {
  return JSON.stringify(canonicalValue(value));
}

export function canonicalSyncJson(state: StateWithSyncMetadata) {
  return stableCanonicalJson(withoutSyncMetadata(state));
}

export function canonicalSyncPayload(state: StateWithSyncMetadata): Record<string, unknown> {
  return JSON.parse(canonicalSyncJson(state)) as Record<string, unknown>;
}

function fnv1a64(value: string) {
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, '0');
}

function fingerprintJson(value: string) {
  return `sync-v2-${fnv1a64(value)}`;
}

function fieldFingerprintJson(value: string) {
  return `sync-field-v2-${fnv1a64(value)}`;
}

export function syncPayloadFieldFingerprints(state: StateWithSyncMetadata): SyncFieldFingerprints {
  const payload = canonicalSyncPayload(state);
  return Object.fromEntries(
    Object.keys(payload).sort().map(key => [key, fieldFingerprintJson(stableCanonicalJson(payload[key]))])
  );
}

export function syncPayloadFingerprint(state: StateWithSyncMetadata) {
  return fingerprintJson(canonicalSyncJson(state));
}

export function createSyncPayloadSnapshot(state: StateWithSyncMetadata): SyncPayloadSnapshot {
  const canonicalJson = canonicalSyncJson(state);
  return {
    payload: JSON.parse(canonicalJson) as Record<string, unknown>,
    canonicalJson,
    fingerprint: fingerprintJson(canonicalJson),
    fieldFingerprints: syncPayloadFieldFingerprints(state),
    canonicalSchema: SYNC_CANONICAL_SCHEMA
  };
}

function changedFingerprintFields(current: SyncFieldFingerprints, baseline?: SyncFieldFingerprints) {
  if (!baseline) return [];
  return Array.from(new Set([...Object.keys(current), ...Object.keys(baseline)]))
    .sort()
    .filter(key => current[key] !== baseline[key]);
}

export function deriveSyncBaselineDiagnostics(state: StateWithSyncMetadata, baselineFingerprint?: string, baselineFieldFingerprints?: SyncFieldFingerprints): SyncBaselineDiagnostics {
  const currentFingerprint = syncPayloadFingerprint(state);
  const currentFieldFingerprints = syncPayloadFieldFingerprints(state);
  if (!baselineFingerprint) return {
    baselineAvailable: false,
    currentFingerprint,
    dirty: true,
    reason: 'baseline missing',
    canonicalSchema: SYNC_CANONICAL_SCHEMA,
    currentFieldFingerprints,
    changedFields: []
  };
  const dirty = currentFingerprint !== baselineFingerprint;
  return {
    baselineAvailable: true,
    currentFingerprint,
    baselineFingerprint,
    dirty,
    reason: dirty ? 'payload differs' : 'clean',
    canonicalSchema: SYNC_CANONICAL_SCHEMA,
    currentFieldFingerprints,
    ...(baselineFieldFingerprints ? { baselineFieldFingerprints } : {}),
    changedFields: changedFingerprintFields(currentFieldFingerprints, baselineFieldFingerprints)
  };
}

/** Returns only safe top-level field names; values never leave the canonical payload comparison. */
export function syncPayloadTopLevelDiff(previous: StateWithSyncMetadata, next: StateWithSyncMetadata) {
  const left = canonicalSyncPayload(previous);
  const right = canonicalSyncPayload(next);
  return Array.from(new Set([...Object.keys(left), ...Object.keys(right)]))
    .sort()
    .filter(key => stableCanonicalJson(left[key]) !== stableCanonicalJson(right[key]));
}

export function deriveSuccessfulUploadResult(current: StateWithSyncMetadata, uploadedSnapshot: SyncPayloadSnapshot): SuccessfulUploadResult {
  return deriveSyncBaselineDiagnostics(current, uploadedSnapshot.fingerprint, uploadedSnapshot.fieldFingerprints);
}

export function shortSyncFingerprint(value?: string) {
  return value ? value.replace(/^sync(?:-field)?-v\d+-/, '').slice(0, 12) : 'unavailable';
}

export function withoutSyncBaseline(meta: SyncMeta): SyncMeta {
  const {
    baselineFingerprint: _baselineFingerprint,
    baselineFieldFingerprints: _baselineFieldFingerprints,
    baselineCanonicalSchema: _baselineCanonicalSchema,
    ...portableMeta
  } = meta;
  return portableMeta;
}

export function hasSyncableStateChanged(previous: StateWithSyncMetadata, next: StateWithSyncMetadata) {
  return canonicalSyncJson(previous) !== canonicalSyncJson(next);
}
