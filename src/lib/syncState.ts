export type SyncSource = '本機資料' | '已從雲端下載' | '已從備份匯入';

export type SyncMeta = {
  dirty: boolean;
  source: SyncSource;
  baselineFingerprint?: string;
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
};

export type SyncBaselineDiagnostics = {
  baselineAvailable: boolean;
  currentFingerprint: string;
  baselineFingerprint?: string;
  dirty: boolean;
  reason: 'clean' | 'payload differs' | 'baseline missing';
};

/** Sync metadata describes this device, so it must not participate in payload equality or Firebase storage. */
export function withoutSyncMetadata<T extends StateWithSyncMetadata>(state: T): Omit<T, 'syncMeta' | 'remoteMeta'> {
  const { syncMeta: _syncMeta, remoteMeta: _remoteMeta, ...syncableState } = state;
  return syncableState;
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

export function syncPayloadFingerprint(state: StateWithSyncMetadata) {
  return `sync-v1-${fnv1a64(canonicalSyncJson(state))}`;
}

export function createSyncPayloadSnapshot(state: StateWithSyncMetadata): SyncPayloadSnapshot {
  const canonicalJson = canonicalSyncJson(state);
  return {
    payload: JSON.parse(canonicalJson) as Record<string, unknown>,
    canonicalJson,
    fingerprint: `sync-v1-${fnv1a64(canonicalJson)}`
  };
}

export function deriveSyncBaselineDiagnostics(state: StateWithSyncMetadata, baselineFingerprint?: string): SyncBaselineDiagnostics {
  const currentFingerprint = syncPayloadFingerprint(state);
  if (!baselineFingerprint) return { baselineAvailable: false, currentFingerprint, dirty: true, reason: 'baseline missing' };
  const dirty = currentFingerprint !== baselineFingerprint;
  return { baselineAvailable: true, currentFingerprint, baselineFingerprint, dirty, reason: dirty ? 'payload differs' : 'clean' };
}

export function shortSyncFingerprint(value?: string) {
  return value ? value.replace(/^sync-v\d+-/, '').slice(0, 12) : 'unavailable';
}

export function withoutSyncBaseline(meta: SyncMeta): SyncMeta {
  const { baselineFingerprint: _baselineFingerprint, ...portableMeta } = meta;
  return portableMeta;
}

export function hasSyncableStateChanged(previous: StateWithSyncMetadata, next: StateWithSyncMetadata) {
  return canonicalSyncJson(previous) !== canonicalSyncJson(next);
}
