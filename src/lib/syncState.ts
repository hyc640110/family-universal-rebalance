export type SyncSource = '本機資料' | '已從雲端下載' | '已從備份匯入';

export type SyncMeta = {
  dirty: boolean;
  source: SyncSource;
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

type StateWithSyncMetadata = Record<string, unknown> & {
  syncMeta?: unknown;
  remoteMeta?: unknown;
};

/** Sync metadata describes this device, so it must not participate in payload equality or Firebase storage. */
export function withoutSyncMetadata<T extends StateWithSyncMetadata>(state: T): Omit<T, 'syncMeta' | 'remoteMeta'> {
  const { syncMeta: _syncMeta, remoteMeta: _remoteMeta, ...syncableState } = state;
  return syncableState;
}

export function hasSyncableStateChanged(previous: StateWithSyncMetadata, next: StateWithSyncMetadata) {
  return JSON.stringify(withoutSyncMetadata(previous)) !== JSON.stringify(withoutSyncMetadata(next));
}
