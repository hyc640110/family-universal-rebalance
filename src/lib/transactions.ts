export const TRANSACTION_SCHEMA_VERSION = 1;
export const TRANSACTION_TYPES = ['income', 'expense', 'transfer', 'adjustment'] as const;
export const TRANSACTION_STATUSES = ['posted', 'pending', 'void'] as const;
export const TRANSACTION_SOURCES = ['manual', 'import', 'gmail'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];
export type TransactionStatus = typeof TRANSACTION_STATUSES[number];
export type TransactionSource = typeof TRANSACTION_SOURCES[number];
export type AccountReference = { id: string; currency: string; isActive: boolean };
export type FinancialTransaction = { id: string; accountId: string; transferAccountId?: string; type: TransactionType; status: TransactionStatus; source: TransactionSource; amount: number; currency: string; categoryId: string; description: string; merchant: string; note: string; occurredAt: string; fingerprint: string; excluded: boolean; createdAt: string; updatedAt: string };
export type TransactionCategory = { id: string; name: string; kind: 'income' | 'expense' | 'transfer' | 'other'; isActive: boolean; sortOrder: number };
export const DEFAULT_TRANSACTION_CATEGORIES: TransactionCategory[] = [
  { id: 'income-salary', name: '薪資', kind: 'income', isActive: true, sortOrder: 0 }, { id: 'income-interest', name: '利息', kind: 'income', isActive: true, sortOrder: 1 }, { id: 'income-dividend', name: '股息', kind: 'income', isActive: true, sortOrder: 2 }, { id: 'income-refund', name: '退款', kind: 'income', isActive: true, sortOrder: 3 }, { id: 'income-other', name: '其他收入', kind: 'income', isActive: true, sortOrder: 4 },
  { id: 'expense-food', name: '餐飲', kind: 'expense', isActive: true, sortOrder: 10 }, { id: 'expense-transport', name: '交通', kind: 'expense', isActive: true, sortOrder: 11 }, { id: 'expense-shopping', name: '購物', kind: 'expense', isActive: true, sortOrder: 12 }, { id: 'expense-housing', name: '居住', kind: 'expense', isActive: true, sortOrder: 13 }, { id: 'expense-utilities', name: '水電', kind: 'expense', isActive: true, sortOrder: 14 }, { id: 'expense-communication', name: '通訊', kind: 'expense', isActive: true, sortOrder: 15 }, { id: 'expense-medical', name: '醫療', kind: 'expense', isActive: true, sortOrder: 16 }, { id: 'expense-insurance', name: '保險', kind: 'expense', isActive: true, sortOrder: 17 }, { id: 'expense-tax', name: '稅費', kind: 'expense', isActive: true, sortOrder: 18 }, { id: 'expense-investment', name: '投資', kind: 'expense', isActive: true, sortOrder: 19 }, { id: 'expense-other', name: '其他支出', kind: 'expense', isActive: true, sortOrder: 20 },
  { id: 'transfer-account', name: '帳戶轉帳', kind: 'transfer', isActive: true, sortOrder: 30 }, { id: 'adjustment-other', name: '其他調整', kind: 'other', isActive: true, sortOrder: 40 }
];
export const transactionTypeLabel = (value: TransactionType) => ({ income: '收入', expense: '支出', transfer: '帳戶轉帳', adjustment: '調整' })[value];
export const transactionStatusLabel = (value: TransactionStatus) => ({ posted: '已入帳', pending: '待入帳', void: '已作廢' })[value];
export const transactionSourceLabel = (value: TransactionSource) => ({ manual: '手動建立', import: '匯入', gmail: 'Gmail' })[value];
export const transactionCategoryLabel = (id: string) => DEFAULT_TRANSACTION_CATEGORIES.find(category => category.id === id)?.name || '未分類';
export const categoriesForTransactionType = (transactionType: TransactionType) => DEFAULT_TRANSACTION_CATEGORIES.filter(category => category.kind === (transactionType === 'adjustment' ? 'other' : transactionType));
const text = (value: unknown, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
const positive = (value: unknown) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
const iso = (value: unknown, fallback: string) => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : fallback;
const hash = (value: string) => { let h = 2166136261; for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
const type = (value: unknown): TransactionType => TRANSACTION_TYPES.includes(value as TransactionType) ? value as TransactionType : 'adjustment';
const status = (value: unknown): TransactionStatus => TRANSACTION_STATUSES.includes(value as TransactionStatus) ? value as TransactionStatus : 'posted';
const source = (value: unknown): TransactionSource => TRANSACTION_SOURCES.includes(value as TransactionSource) ? value as TransactionSource : 'manual';
const references = (accounts: AccountReference[] | Set<string>): AccountReference[] => accounts instanceof Set ? [...accounts].map(id => ({ id, currency: 'TWD', isActive: true })) : accounts;
const account = (id: string, accounts: AccountReference[]) => accounts.find(candidate => candidate.id === id);
/** Safely repairs legacy or mismatched categories before state is persisted. */
export const normalizeTransactionCategory = (transactionType: TransactionType, categoryId: string) => {
  const available = categoriesForTransactionType(transactionType);
  return available.some(category => category.id === categoryId) ? categoryId : (transactionType === 'income' ? 'income-other' : transactionType === 'expense' ? 'expense-other' : transactionType === 'transfer' ? 'transfer-account' : 'adjustment-other');
};

export const createTransactionId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `transaction-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
/** Deliberately excludes note: notes are private annotations, not duplicate-detection identity. */
export const transactionFingerprint = (input: Pick<FinancialTransaction, 'accountId' | 'transferAccountId' | 'type' | 'amount' | 'currency' | 'occurredAt' | 'categoryId' | 'description' | 'merchant'>) => hash([input.accountId, input.transferAccountId || '', input.type, input.amount, input.currency, input.occurredAt.slice(0, 10), input.categoryId, input.description, input.merchant].join('|'));

export function validateTransferAccounts(from: string, to: string, amountValue: number, accountList: AccountReference[]) {
  const sourceAccount = account(from, accountList); const destinationAccount = account(to, accountList);
  if (!sourceAccount || !destinationAccount || !sourceAccount.isActive || !destinationAccount.isActive) return '請選擇兩個有效啟用帳戶';
  if (from === to) return '來源與目的帳戶不得相同';
  if (!(amountValue > 0)) return '轉帳金額必須大於 0';
  if (sourceAccount.currency !== destinationAccount.currency) return '目前尚未支援跨幣別轉帳';
  return '';
}

function normalizeCandidate(candidate: Partial<FinancialTransaction>, accountList: AccountReference[], fallback: string, id = createTransactionId(), current?: FinancialTransaction): FinancialTransaction {
  const resolvedType = type(candidate.type ?? current?.type); const accountId = text(candidate.accountId ?? current?.accountId);
  const sourceAccount = account(accountId, accountList);
  const amount = positive(candidate.amount ?? current?.amount);
  if (!sourceAccount || !sourceAccount.isActive || !(amount > 0)) throw new Error('請選擇有效啟用帳戶並輸入大於 0 的金額');
  const transferAccountId = text(candidate.transferAccountId ?? current?.transferAccountId) || undefined;
  if (resolvedType === 'transfer') {
    const message = validateTransferAccounts(accountId, transferAccountId || '', amount, accountList);
    if (message) throw new Error(message);
  }
  const normalized: FinancialTransaction = {
    id,
    accountId,
    ...(resolvedType === 'transfer' && transferAccountId ? { transferAccountId } : {}),
    type: resolvedType,
    status: status(candidate.status ?? current?.status),
    source: source(candidate.source ?? current?.source),
    amount,
    currency: (resolvedType === 'transfer' ? sourceAccount.currency : text(candidate.currency ?? current?.currency, sourceAccount.currency)).toUpperCase().slice(0, 8),
    categoryId: normalizeTransactionCategory(resolvedType, text(candidate.categoryId ?? current?.categoryId)),
    description: text(candidate.description ?? current?.description),
    merchant: text(candidate.merchant ?? current?.merchant),
    note: text(candidate.note ?? current?.note),
    occurredAt: iso(candidate.occurredAt ?? current?.occurredAt, fallback),
    fingerprint: '',
    excluded: Boolean(candidate.excluded ?? current?.excluded),
    createdAt: current?.createdAt || iso(candidate.createdAt, fallback),
    updatedAt: fallback
  };
  const fingerprintChanged = !current || ['accountId', 'transferAccountId', 'type', 'amount', 'currency', 'occurredAt', 'categoryId', 'description', 'merchant'].some(key => String(current[key as keyof FinancialTransaction] ?? '') !== String(normalized[key as keyof FinancialTransaction] ?? ''));
  return { ...normalized, fingerprint: fingerprintChanged ? transactionFingerprint(normalized) : current.fingerprint };
}

export function createTransferTransaction(input: Omit<FinancialTransaction, 'id' | 'fingerprint' | 'createdAt' | 'updatedAt' | 'type' | 'categoryId'>, accounts: AccountReference[], timestamp = new Date().toISOString()) {
  return normalizeCandidate({ ...input, type: 'transfer', categoryId: 'transfer-account' }, accounts, timestamp);
}

export function updateTransferTransaction(current: FinancialTransaction, patch: Partial<FinancialTransaction>, accounts: AccountReference[], timestamp = new Date().toISOString()) {
  return normalizeCandidate({ ...current, ...patch, type: 'transfer' }, accounts, timestamp, current.id, current);
}

/** All UI edits share this path. Conversion away from transfer clears its destination. */
export function updateTransaction(current: FinancialTransaction, patch: Partial<FinancialTransaction>, accounts: AccountReference[], timestamp = new Date().toISOString()) {
  const nextType = type(patch.type ?? current.type);
  return normalizeCandidate({ ...current, ...patch, type: nextType, ...(nextType === 'transfer' ? {} : { transferAccountId: undefined }) }, accounts, timestamp, current.id, current);
}

export function normalizeTransactions(raw: unknown, accountInput: AccountReference[] | Set<string>, fallback = new Date().toISOString()) {
  const accountList = references(accountInput); const used = new Set<string>(), skipped: string[] = [];
  const transactions = (Array.isArray(raw) ? raw : []).flatMap((value, index) => {
    if (!value || typeof value !== 'object') { skipped.push(`第 ${index + 1} 筆不是交易物件`); return []; }
    const v = value as Partial<FinancialTransaction>; const candidateId = text(v.id); let id = candidateId && !used.has(candidateId) ? candidateId : `legacy-transaction-${hash(JSON.stringify(v))}`; let n = 1; while (used.has(id)) id = `legacy-transaction-${hash(`${JSON.stringify(v)}:${n++}`)}`;
    try {
      const normalized = normalizeCandidate(v, accountList, fallback, id);
      used.add(id); return [normalized];
    } catch (error) { skipped.push(`第 ${index + 1} 筆交易無效：${error instanceof Error ? error.message : '格式錯誤'}`); return []; }
  });
  return { transactions, skipped };
}

export function deriveTransactionAccountBalances(transactions: FinancialTransaction[]) { const balances: Record<string, number> = {}; for (const t of transactions) { if (t.status !== 'posted' || t.excluded) continue; const add = (id: string, value: number) => balances[id] = (balances[id] || 0) + value; if (t.type === 'income' || t.type === 'adjustment') add(t.accountId, t.amount); else if (t.type === 'expense') add(t.accountId, -t.amount); else { add(t.accountId, -t.amount); if (t.transferAccountId) add(t.transferAccountId, t.amount); } } return balances; }
export function transactionCashFlowSummary(transactions: FinancialTransaction[]) { return transactions.filter(t => t.status === 'posted' && !t.excluded).reduce((s, t) => ({ income: s.income + (t.type === 'income' ? t.amount : 0), expense: s.expense + (t.type === 'expense' ? t.amount : 0) }), { income: 0, expense: 0 }); }
export const accountHasTransactions = (transactions: FinancialTransaction[], accountId: string) => transactions.some(t => t.accountId === accountId || t.transferAccountId === accountId);
