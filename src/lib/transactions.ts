export const TRANSACTION_SCHEMA_VERSION = 1;
export const TRANSACTION_TYPES = ['income', 'expense', 'transfer', 'adjustment'] as const;
export const TRANSACTION_STATUSES = ['posted', 'pending', 'void'] as const;
export const TRANSACTION_SOURCES = ['manual', 'import', 'gmail'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];
export type TransactionStatus = typeof TRANSACTION_STATUSES[number];
export type TransactionSource = typeof TRANSACTION_SOURCES[number];
export type FinancialTransaction = { id: string; accountId: string; transferAccountId?: string; type: TransactionType; status: TransactionStatus; source: TransactionSource; amount: number; currency: string; categoryId: string; note: string; occurredAt: string; fingerprint: string; excluded: boolean; createdAt: string; updatedAt: string };
export type TransactionCategory = { id: string; name: string; kind: 'income' | 'expense' | 'transfer' | 'other'; isActive: boolean; sortOrder: number };
export const DEFAULT_TRANSACTION_CATEGORIES: TransactionCategory[] = [{ id: 'income-other', name: '其他收入', kind: 'income', isActive: true, sortOrder: 0 }, { id: 'expense-other', name: '其他支出', kind: 'expense', isActive: true, sortOrder: 1 }, { id: 'transfer', name: '帳戶轉帳', kind: 'transfer', isActive: true, sortOrder: 2 }];
const text = (value: unknown, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
const positive = (value: unknown) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
const iso = (value: unknown, fallback: string) => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : fallback;
const hash = (value: string) => { let h = 2166136261; for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
export const createTransactionId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `transaction-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
export const transactionFingerprint = (input: Pick<FinancialTransaction, 'accountId' | 'transferAccountId' | 'type' | 'amount' | 'currency' | 'occurredAt' | 'categoryId'>) => hash([input.accountId, input.transferAccountId || '', input.type, input.amount, input.currency, input.occurredAt.slice(0, 10), input.categoryId].join('|'));
const type = (value: unknown): TransactionType => TRANSACTION_TYPES.includes(value as TransactionType) ? value as TransactionType : 'adjustment';
const status = (value: unknown): TransactionStatus => TRANSACTION_STATUSES.includes(value as TransactionStatus) ? value as TransactionStatus : 'posted';
const source = (value: unknown): TransactionSource => TRANSACTION_SOURCES.includes(value as TransactionSource) ? value as TransactionSource : 'manual';
export function validateTransferAccounts(from: string, to: string, amountValue: number, accounts: Array<{ id: string; currency: string; isActive: boolean }>) { const sourceAccount = accounts.find(account => account.id === from && account.isActive); const destinationAccount = accounts.find(account => account.id === to && account.isActive); if (!sourceAccount || !destinationAccount) return '請選擇兩個有效啟用帳戶'; if (from === to) return '來源與目的帳戶不得相同'; if (!(amountValue > 0)) return '轉帳金額必須大於 0'; if (sourceAccount.currency !== destinationAccount.currency) return '目前尚未支援跨幣別轉帳'; return ''; }
export function createTransferTransaction(input: Omit<FinancialTransaction, 'id' | 'fingerprint' | 'createdAt' | 'updatedAt' | 'type' | 'categoryId'>, accounts: Array<{ id: string; currency: string; isActive: boolean }>, timestamp = new Date().toISOString()) { const message = validateTransferAccounts(input.accountId, input.transferAccountId || '', input.amount, accounts); if (message) throw new Error(message); const transaction: FinancialTransaction = { ...input, id: createTransactionId(), type: 'transfer', categoryId: 'transfer', fingerprint: '', createdAt: timestamp, updatedAt: timestamp }; return { ...transaction, fingerprint: transactionFingerprint(transaction) }; }
export function updateTransferTransaction(current: FinancialTransaction, patch: Partial<FinancialTransaction>, accounts: Array<{ id: string; currency: string; isActive: boolean }>, timestamp = new Date().toISOString()) { return createTransferTransaction({ ...current, ...patch, accountId: patch.accountId ?? current.accountId, transferAccountId: patch.transferAccountId ?? current.transferAccountId, amount: patch.amount ?? current.amount, status: patch.status ?? current.status, source: patch.source ?? current.source, currency: patch.currency ?? current.currency, note: patch.note ?? current.note, occurredAt: patch.occurredAt ?? current.occurredAt, excluded: patch.excluded ?? current.excluded }, accounts, timestamp); }
export function normalizeTransactions(raw: unknown, accountIds: Set<string>, fallback = new Date().toISOString()) {
  const used = new Set<string>(), skipped: string[] = [];
  const transactions = (Array.isArray(raw) ? raw : []).flatMap((value, index) => {
    if (!value || typeof value !== 'object') { skipped.push(`第 ${index + 1} 筆不是交易物件`); return []; }
    const v = value as Partial<FinancialTransaction>; const occurredAt = iso(v.occurredAt, fallback); const accountId = text(v.accountId);
    if (!accountId || !accountIds.has(accountId)) { skipped.push(`第 ${index + 1} 筆缺少有效帳戶`); return []; }
    const candidate = text(v.id); let id = candidate && !used.has(candidate) ? candidate : `legacy-transaction-${hash(JSON.stringify(v))}`; let n = 1; while (used.has(id)) id = `legacy-transaction-${hash(`${JSON.stringify(v)}:${n++}`)}`; used.add(id);
    const resolvedType = type(v.type); const transferAccountId = text(v.transferAccountId) || undefined;
    if (resolvedType === 'transfer' && (!transferAccountId || !accountIds.has(transferAccountId) || transferAccountId === accountId)) { skipped.push(`第 ${index + 1} 筆轉帳帳戶無效`); return []; }
    const result: FinancialTransaction = { id, accountId, ...(transferAccountId ? { transferAccountId } : {}), type: resolvedType, status: status(v.status), source: source(v.source), amount: positive(v.amount), currency: text(v.currency, 'TWD').toUpperCase().slice(0, 8), categoryId: text(v.categoryId, resolvedType === 'transfer' ? 'transfer' : resolvedType === 'income' ? 'income-other' : 'expense-other'), note: text(v.note), occurredAt, fingerprint: text(v.fingerprint), excluded: Boolean(v.excluded), createdAt: iso(v.createdAt, fallback), updatedAt: iso(v.updatedAt, fallback) };
    return [{ ...result, fingerprint: result.fingerprint || transactionFingerprint(result) }];
  });
  return { transactions, skipped };
}
export function deriveTransactionAccountBalances(transactions: FinancialTransaction[]) { const balances: Record<string, number> = {}; for (const t of transactions) { if (t.status !== 'posted' || t.excluded) continue; const add = (id: string, value: number) => balances[id] = (balances[id] || 0) + value; if (t.type === 'income' || t.type === 'adjustment') add(t.accountId, t.amount); else if (t.type === 'expense') add(t.accountId, -t.amount); else { add(t.accountId, -t.amount); if (t.transferAccountId) add(t.transferAccountId, t.amount); } } return balances; }
export function transactionCashFlowSummary(transactions: FinancialTransaction[]) { return transactions.filter(t => t.status === 'posted' && !t.excluded).reduce((s, t) => ({ income: s.income + (t.type === 'income' ? t.amount : 0), expense: s.expense + (t.type === 'expense' ? t.amount : 0) }), { income: 0, expense: 0 }); }
export const accountHasTransactions = (transactions: FinancialTransaction[], accountId: string) => transactions.some(t => t.accountId === accountId || t.transferAccountId === accountId);
