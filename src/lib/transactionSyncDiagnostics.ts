type TransactionRecord = Record<string, unknown>;

export type TransactionSyncDiagnostics = {
  baselineAvailable: boolean;
  transactionCount: number;
  normalizedTransactionCount: number;
  orderFingerprint: string;
  identityHashes: string[];
  structuralFingerprints: string[];
  changedIndexes: number[];
  changedFieldNames: string[];
  addedCount: number;
  removedCount: number;
  reorderedCount: number;
};

export const EMPTY_TRANSACTION_SYNC_DIAGNOSTICS: TransactionSyncDiagnostics = {
  baselineAvailable: false,
  transactionCount: 0,
  normalizedTransactionCount: 0,
  orderFingerprint: 'unavailable',
  identityHashes: [],
  structuralFingerprints: [],
  changedIndexes: [],
  changedFieldNames: [],
  addedCount: 0,
  removedCount: 0,
  reorderedCount: 0
};

const records = (value: unknown): TransactionRecord[] => Array.isArray(value)
  ? value.filter((item): item is TransactionRecord => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
  : [];

const canonicalValue = (value: unknown): unknown => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(item => canonicalValue(item));
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.keys(value as TransactionRecord).sort().flatMap(key => {
      const normalized = canonicalValue((value as TransactionRecord)[key]);
      return normalized === undefined ? [] : [[key, normalized]];
    })
  );
  return undefined;
};

const canonicalJson = (value: unknown) => JSON.stringify(canonicalValue(value));
const valueType = (value: unknown) => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;

async function privateShortHash(value: string) {
  if (!globalThis.crypto?.subtle) return 'unavailable';
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

async function transactionIdentity(transaction: TransactionRecord) {
  const id = typeof transaction.id === 'string' && transaction.id ? transaction.id : canonicalJson(transaction);
  return privateShortHash(`transaction-identity-v1|${id}`);
}

async function structuralFingerprint(transaction: TransactionRecord) {
  const structure = Object.keys(transaction).sort().map(key => `${key}:${valueType(transaction[key])}`).join('|');
  return privateShortHash(`transaction-structure-v1|${structure}`);
}

export async function deriveTransactionSyncDiagnostics(
  baselineInput: unknown,
  currentInput: unknown,
  normalizedCurrentInput: unknown = currentInput
): Promise<TransactionSyncDiagnostics> {
  const baselineAvailable = Array.isArray(baselineInput);
  const baseline = records(baselineInput);
  const current = records(currentInput);
  const normalizedCurrent = records(normalizedCurrentInput);
  const baselineIdentities = await Promise.all(baseline.map(transactionIdentity));
  const currentIdentities = await Promise.all(current.map(transactionIdentity));
  const structuralFingerprints = await Promise.all(current.map(structuralFingerprint));
  const baselineIndex = new Map(baselineIdentities.map((identity, index) => [identity, index]));
  const currentIndex = new Map(currentIdentities.map((identity, index) => [identity, index]));
  const changedIndexes: number[] = [];
  const changedFields = new Set<string>();
  let reorderedCount = 0;

  if (baselineAvailable) current.forEach((transaction, index) => {
    const identity = currentIdentities[index];
    const previousIndex = baselineIndex.get(identity);
    if (previousIndex === undefined) return;
    if (previousIndex !== index) reorderedCount += 1;
    const previous = baseline[previousIndex];
    const fields = Array.from(new Set([...Object.keys(previous), ...Object.keys(transaction)])).sort()
      .filter(field => canonicalJson(previous[field]) !== canonicalJson(transaction[field]));
    if (fields.length) {
      changedIndexes.push(index);
      fields.forEach(field => changedFields.add(field));
    }
  });

  return {
    baselineAvailable,
    transactionCount: current.length,
    normalizedTransactionCount: normalizedCurrent.length,
    orderFingerprint: await privateShortHash(`transaction-order-v1|${currentIdentities.join('|')}`),
    identityHashes: currentIdentities,
    structuralFingerprints,
    changedIndexes,
    changedFieldNames: [...changedFields].sort(),
    addedCount: baselineAvailable ? currentIdentities.filter(identity => !baselineIndex.has(identity)).length : 0,
    removedCount: baselineAvailable ? baselineIdentities.filter(identity => !currentIndex.has(identity)).length : 0,
    reorderedCount
  };
}
