export const FINANCIAL_ACCOUNT_SCHEMA_VERSION = 1;
export const CASH_ACCOUNT_MIGRATION_VERSION = 1;

export const FINANCIAL_ACCOUNT_TYPES = ['cash', 'bank', 'securities', 'creditCard', 'loan', 'mortgage', 'eWallet', 'other'] as const;
export type FinancialAccountType = typeof FINANCIAL_ACCOUNT_TYPES[number];
export type AccountBalanceMode = 'manual' | 'derived';

export type FinancialAccount = {
  id: string;
  name: string;
  type: FinancialAccountType;
  balanceMode: AccountBalanceMode;
  manualBalance: number;
  currency: string;
  institutionName: string;
  note: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type LegacyCashItem = { id?: unknown; name?: unknown; amount?: unknown; note?: unknown };
export type FinancialAccountBalance = { value: number | null; status: 'available' | 'unavailable' };

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const asText = (value: unknown, fallback = '') => typeof value === 'string' ? value.trim() || fallback : fallback;
const amount = (value: unknown) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
const time = (value: unknown, fallback: string) => {
  const parsed = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
};
const hash = (value: string) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(36);
};

export function createFinancialAccountId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const random = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
    ? Array.from(crypto.getRandomValues(new Uint32Array(2))).map(value => value.toString(36)).join('')
    : `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  return `account-${Date.now().toString(36)}-${random.slice(0, 18)}`;
}

export function normalizeFinancialAccountType(value: unknown): FinancialAccountType {
  return FINANCIAL_ACCOUNT_TYPES.includes(value as FinancialAccountType) ? value as FinancialAccountType : 'other';
}

export function normalizeAccountBalanceMode(value: unknown): AccountBalanceMode {
  return value === 'derived' ? 'derived' : 'manual';
}

function stableImportedId(rawId: unknown, fingerprint: string, usedIds: Set<string>) {
  const candidate = asText(rawId);
  if (candidate && !usedIds.has(candidate)) return candidate;
  let suffix = 0;
  let id = `legacy-account-${hash(fingerprint)}`;
  while (usedIds.has(id)) id = `legacy-account-${hash(`${fingerprint}:${++suffix}`)}`;
  return id;
}

export function normalizeFinancialAccounts(raw: unknown, fallbackTime = new Date().toISOString()) {
  const skipped: string[] = [];
  const usedIds = new Set<string>();
  const accounts = (Array.isArray(raw) ? raw : []).flatMap((value, index) => {
    if (!value || typeof value !== 'object') { skipped.push(`第 ${index + 1} 筆不是帳戶物件`); return []; }
    const source = asRecord(value);
    const fingerprint = JSON.stringify(source);
    const id = stableImportedId(source.id, fingerprint, usedIds);
    if (asText(source.id) && asText(source.id) !== id) skipped.push(`第 ${index + 1} 筆帳戶 id 重複，已保留為獨立帳戶`);
    usedIds.add(id);
    const createdAt = time(source.createdAt, fallbackTime);
    return [{
      id,
      name: asText(source.name, '未命名帳戶'),
      type: normalizeFinancialAccountType(source.type),
      balanceMode: normalizeAccountBalanceMode(source.balanceMode),
      manualBalance: amount(source.manualBalance),
      currency: asText(source.currency, 'TWD').toUpperCase().slice(0, 8),
      institutionName: asText(source.institutionName),
      note: asText(source.note),
      isActive: source.isActive !== false,
      sortOrder: Math.max(0, Math.floor(amount(source.sortOrder ?? index))),
      createdAt,
      updatedAt: time(source.updatedAt, createdAt)
    } satisfies FinancialAccount];
  });
  return { accounts, skipped };
}

export function migrateLegacyCashItems(raw: unknown, fallbackTime = new Date().toISOString()) {
  const usedIds = new Set<string>();
  return (Array.isArray(raw) ? raw : []).flatMap((value, index) => {
    if (!value || typeof value !== 'object') return [];
    const cash = value as LegacyCashItem;
    const fingerprint = JSON.stringify(cash);
    const id = stableImportedId(cash.id, fingerprint, usedIds);
    usedIds.add(id);
    return [{ id, name: asText(cash.name, '現金'), type: 'cash' as const, balanceMode: 'manual' as const, manualBalance: amount(cash.amount), currency: 'TWD', institutionName: '', note: asText(cash.note), isActive: true, sortOrder: index, createdAt: fallbackTime, updatedAt: fallbackTime }];
  });
}

export function normalizeAccountState(rawAccounts: unknown, legacyCash: unknown, fallbackTime = new Date().toISOString()) {
  const hasAccounts = Array.isArray(rawAccounts);
  const normalized = normalizeFinancialAccounts(rawAccounts, fallbackTime);
  const accounts = hasAccounts ? normalized.accounts : migrateLegacyCashItems(legacyCash, fallbackTime);
  return { accounts, accountSchemaVersion: FINANCIAL_ACCOUNT_SCHEMA_VERSION, cashAccountMigrationVersion: CASH_ACCOUNT_MIGRATION_VERSION, migratedLegacyCash: !hasAccounts, skipped: normalized.skipped };
}

export function createFinancialAccount(input: Partial<FinancialAccount> = {}, timestamp = new Date().toISOString()): FinancialAccount {
  const id = input.id || createFinancialAccountId();
  const createdAt = time(input.createdAt, timestamp);
  return {
    id,
    name: asText(input.name, '新帳戶'),
    type: normalizeFinancialAccountType(input.type),
    balanceMode: normalizeAccountBalanceMode(input.balanceMode),
    manualBalance: amount(input.manualBalance),
    currency: asText(input.currency, 'TWD').toUpperCase().slice(0, 8),
    institutionName: asText(input.institutionName),
    note: asText(input.note),
    isActive: input.isActive !== false,
    sortOrder: Math.max(0, Math.floor(amount(input.sortOrder))),
    createdAt,
    updatedAt: time(input.updatedAt, createdAt)
  };
}

export function updateFinancialAccount(account: FinancialAccount, patch: Partial<FinancialAccount>, timestamp = new Date().toISOString()) {
  return normalizeFinancialAccounts([{ ...account, ...patch, id: account.id, createdAt: account.createdAt, updatedAt: timestamp }], timestamp).accounts[0];
}

export function deactivateFinancialAccount(account: FinancialAccount, timestamp?: string) {
  return updateFinancialAccount(account, { isActive: false }, timestamp);
}

export function restoreFinancialAccount(account: FinancialAccount, timestamp?: string) {
  return updateFinancialAccount(account, { isActive: true }, timestamp);
}

export function removeFinancialAccount(accounts: FinancialAccount[], id: string) {
  return accounts.filter(account => account.id !== id);
}

export function getFinancialAccountBalance(account: FinancialAccount, context?: { derivedBalances?: Record<string, number> }): FinancialAccountBalance {
  if (!account.isActive) return { value: 0, status: 'available' };
  if (account.balanceMode === 'manual') return { value: amount(account.manualBalance), status: 'available' };
  const value = context?.derivedBalances?.[account.id];
  return typeof value === 'number' && Number.isFinite(value) ? { value, status: 'available' } : { value: null, status: 'unavailable' };
}

export function financialAccountAssetTotal(accounts: FinancialAccount[]) {
  return accounts.reduce((total, account) => {
    const balance = getFinancialAccountBalance(account);
    return total + (balance.value ?? 0);
  }, 0);
}

export const isFinancialAccountLiability = (account: FinancialAccount) => ['creditCard', 'loan', 'mortgage'].includes(account.type);

export function financialAccountNetWorthContribution(accounts: FinancialAccount[], context?: { derivedBalances?: Record<string, number> }) {
  return accounts.reduce((total, account) => {
    const balance = getFinancialAccountBalance(account, context).value ?? 0;
    return total + (isFinancialAccountLiability(account) ? -balance : balance);
  }, 0);
}

export function financialAccountLiquidTotal(accounts: FinancialAccount[], context?: { derivedBalances?: Record<string, number> }) {
  return accounts.reduce((total, account) => {
    if (!['cash', 'bank', 'eWallet'].includes(account.type)) return total;
    return total + (getFinancialAccountBalance(account, context).value ?? 0);
  }, 0);
}
