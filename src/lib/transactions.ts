export const TRANSACTION_SCHEMA_VERSION = 2;
export const TRANSACTION_TYPES = ['income', 'expense', 'transfer', 'adjustment'] as const;
export const TRANSACTION_STATUSES = ['posted', 'pending', 'void'] as const;
export const TRANSACTION_SOURCES = ['manual', 'import', 'gmail'] as const;
const LEGACY_TRANSACTION_FALLBACK = '1970-01-01T00:00:00.000Z';
export type TransactionType = typeof TRANSACTION_TYPES[number];
export type TransactionStatus = typeof TRANSACTION_STATUSES[number];
export type TransactionSource = typeof TRANSACTION_SOURCES[number];
export type AccountReference = { id: string; currency: string; isActive: boolean };
export type InvestmentTradeAttribution = {
  kind: 'trade';
  tradeId: string;
  /** Optional only when the trade is represented by a separately-recorded cash movement. */
  cashMovementId?: string;
  side: 'buy' | 'sell';
  assetSymbol: string;
  quantity: number;
  settlementAmount: number;
  currency: string;
  cashAccountId: string;
};
export type InvestmentCostAttribution = {
  kind: 'cost';
  tradeId: string;
  /** Stable source identity; without it the cost cannot be safely de-duplicated. */
  costId?: string;
  costType: 'fee' | 'tax';
  /** Only `independent` can affect attribution; legacy/unknown/included costs remain fail-safe. */
  settlementCostTreatment?: 'independent' | 'included' | 'unknown';
  assetSymbol: string;
  currency: string;
  cashAccountId: string;
};
export type InvestmentCashMovementAttribution = {
  kind: 'cash-movement';
  cashMovementId: string;
  direction: 'decrease' | 'increase';
  currency: string;
  cashAccountId: string;
};
export type InvestmentAttribution = InvestmentTradeAttribution | InvestmentCostAttribution | InvestmentCashMovementAttribution;
export type LoanPaymentComponent = { componentId: string; type: 'principal' | 'interest' | 'fee' | 'penalty'; amount: number };
/** Explicit historical repayment/disbursement proof. It is optional and is never inferred from text, taxonomy, balance, or amortization data. */
export type LoanRepaymentAttribution = { kind: 'repayment'; paymentId: string; loanId: string; cashAccountId: string; currency: string; settlementAmount: number; components: LoanPaymentComponent[]; cashMovementId?: string };
export type LoanDisbursementAttribution = { kind: 'disbursement'; paymentId: string; loanId: string; cashAccountId: string; currency: string; settlementAmount: number; cashMovementId?: string };
export type LoanCashMovementAttribution = { kind: 'cash-movement'; cashMovementId: string; direction: 'decrease' | 'increase'; cashAccountId: string; currency: string; settlementAmount: number };
export type LoanAttribution = LoanRepaymentAttribution | LoanDisbursementAttribution | LoanCashMovementAttribution;
/**
 * UR-TODO-046 FX-F2C-1: additive marker identifying a `FinancialTransaction` as one principal
 * leg of a future FX conversion (see fxConversionIdentity.ts for the opaque envelope contract).
 * Deliberately minimal — no amount/currency/accountId/executedRate/fee, all of which already
 * live on the transaction itself or the (not-yet-produced) opaque envelope payload, to avoid a
 * second, competing source of truth. `conversionId` is expected to equal a future
 * `OpaqueFinancialTransactionEnvelope.id`, but this module never creates or resolves envelopes —
 * it only lets consumers (cash-flow summary, reconciliation, delete guard) recognize the leg.
 */
export type FxConversionLegAttribution = { conversionId: string; role: 'source' | 'destination' };
export type FinancialTransaction = { id: string; accountId: string; transferAccountId?: string; type: TransactionType; status: TransactionStatus; source: TransactionSource; amount: number; currency: string; categoryId: string; description: string; merchant: string; note: string; occurredAt: string; fingerprint: string; excluded: boolean; createdAt: string; updatedAt: string; assetSymbol?: string; assetName?: string; grossAmount?: number; withholdingTax?: number; investmentAttribution?: InvestmentAttribution; loanAttribution?: LoanAttribution; fxConversionLeg?: FxConversionLegAttribution };

/**
 * UR-TODO-046 FX-F1A: an explicit, versioned marker for a transaction record whose economic
 * semantics this client does not yet understand. `payload` is never interpreted — not read for
 * `type`/`amount`/`currency`, not merged into a `FinancialTransaction`, not shown as an ordinary
 * income/expense row. Its only job is safe, lossless custody until a newer client can read it.
 * A record only takes this path when it explicitly carries `transactionOpaqueEnvelopeVersion`;
 * an ordinary transaction that merely fails known-shape validation is skipped, never preserved
 * here (see normalizeTransactions()).
 */
export const TRANSACTION_OPAQUE_ENVELOPE_VERSION = 1;
export type OpaqueFinancialTransactionEnvelope = {
  transactionOpaqueEnvelopeVersion: typeof TRANSACTION_OPAQUE_ENVELOPE_VERSION;
  id: string;
  payload: Record<string, unknown>;
};
/** The union only exists at the raw/serialized boundary (see serializeTransactionCollection()); AppState keeps `transactions` and `opaqueTransactions` as two separately-typed fields so existing consumers of `FinancialTransaction[]` need no narrowing. */
export type PersistedFinancialTransaction = FinancialTransaction | OpaqueFinancialTransactionEnvelope;
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
const optionalText = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
const optionalNonNegative = (value: unknown, label: string) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label}必須是有限且不小於 0 的數字`);
  return parsed;
};
function normalizeInvestmentAttribution(value: unknown, transaction: { type: TransactionType; accountId: string; amount: number; currency: string }): InvestmentAttribution | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const tradeId = optionalText(record.tradeId);
  const assetSymbol = optionalText(record.assetSymbol)?.toUpperCase();
  const currency = optionalText(record.currency)?.toUpperCase();
  const cashAccountId = optionalText(record.cashAccountId);
  if (!currency || !cashAccountId || cashAccountId !== transaction.accountId || currency !== transaction.currency) return undefined;
  if (record.kind === 'cash-movement') {
    const cashMovementId = optionalText(record.cashMovementId);
    const direction = record.direction === 'decrease' || record.direction === 'increase' ? record.direction : undefined;
    return cashMovementId && direction
      ? { kind: 'cash-movement', cashMovementId, direction, currency, cashAccountId }
      : undefined;
  }
  if (!tradeId || !assetSymbol) return undefined;
  if (record.kind === 'cost') {
    const costType = record.costType === 'fee' || record.costType === 'tax' ? record.costType : undefined;
    const costId = optionalText(record.costId);
    const settlementCostTreatment = record.settlementCostTreatment === 'independent' || record.settlementCostTreatment === 'included' || record.settlementCostTreatment === 'unknown'
      ? record.settlementCostTreatment
      : undefined;
    return costType && transaction.type === 'expense'
      ? { kind: 'cost', tradeId, ...(costId ? { costId } : {}), costType, ...(settlementCostTreatment ? { settlementCostTreatment } : {}), assetSymbol, currency, cashAccountId }
      : undefined;
  }
  if (record.kind !== 'trade') return undefined;
  const side = record.side === 'buy' || record.side === 'sell' ? record.side : undefined;
  const quantity = Number(record.quantity);
  const settlementAmount = Number(record.settlementAmount);
  const cashMovementId = optionalText(record.cashMovementId);
  const expectedType: TransactionType | undefined = side === 'buy' ? 'expense' : side === 'sell' ? 'income' : undefined;
  if (!tradeId || !side || !assetSymbol || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(settlementAmount) || settlementAmount <= 0 || !currency || !cashAccountId) return undefined;
  if (expectedType !== transaction.type || cashAccountId !== transaction.accountId || settlementAmount !== transaction.amount || currency !== transaction.currency) return undefined;
  return { kind: 'trade', tradeId, ...(cashMovementId ? { cashMovementId } : {}), side, assetSymbol, quantity, settlementAmount, currency, cashAccountId };
}
function normalizeLoanAttribution(value: unknown, transaction: { type: TransactionType; accountId: string; amount: number; currency: string }): LoanAttribution | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const currency = optionalText(record.currency)?.toUpperCase();
  const cashAccountId = optionalText(record.cashAccountId);
  if (!currency || !cashAccountId || currency !== transaction.currency || cashAccountId !== transaction.accountId) return undefined;
  if (record.kind === 'cash-movement') {
    const cashMovementId = optionalText(record.cashMovementId);
    const direction = record.direction === 'decrease' || record.direction === 'increase' ? record.direction : undefined;
    const settlementAmount = Number(record.settlementAmount);
    return cashMovementId && direction && Number.isFinite(settlementAmount) && settlementAmount > 0 && settlementAmount === transaction.amount
      ? { kind: 'cash-movement', cashMovementId, direction, cashAccountId, currency, settlementAmount }
      : undefined;
  }
  const paymentId = optionalText(record.paymentId);
  const loanId = optionalText(record.loanId);
  const settlementAmount = Number(record.settlementAmount);
  const cashMovementId = optionalText(record.cashMovementId);
  if (!paymentId || !loanId || !Number.isFinite(settlementAmount) || settlementAmount <= 0 || settlementAmount !== transaction.amount) return undefined;
  if (record.kind === 'disbursement') {
    return transaction.type === 'income'
      ? { kind: 'disbursement', paymentId, loanId, cashAccountId, currency, settlementAmount, ...(cashMovementId ? { cashMovementId } : {}) }
      : undefined;
  }
  if (record.kind !== 'repayment' || transaction.type !== 'expense' || !Array.isArray(record.components)) return undefined;
  const components = record.components.flatMap(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    const component = value as Record<string, unknown>;
    const componentId = optionalText(component.componentId);
    const componentType = component.type === 'principal' || component.type === 'interest' || component.type === 'fee' || component.type === 'penalty' ? component.type : undefined;
    const amount = Number(component.amount);
    return componentId && componentType && Number.isFinite(amount) && amount > 0 ? [{ componentId, type: componentType as LoanPaymentComponent['type'], amount }] : [];
  });
  if (components.length !== record.components.length || !components.length || new Set(components.map(component => component.componentId)).size !== components.length) return undefined;
  if (components.reduce((total, component) => total + component.amount, 0) !== settlementAmount) return undefined;
  return { kind: 'repayment', paymentId, loanId, cashAccountId, currency, settlementAmount, components, ...(cashMovementId ? { cashMovementId } : {}) };
}
/**
 * Malformed metadata is dropped to `undefined` — it never falls back to becoming an F1A opaque
 * envelope, and it never blocks normalization of the rest of the transaction. No cross-validation
 * against the transaction's own fields is performed here (there is nothing to cross-validate:
 * this metadata deliberately carries no amount/currency/accountId).
 */
function normalizeFxConversionLegAttribution(value: unknown): FxConversionLegAttribution | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const conversionId = optionalText(record.conversionId);
  const role = record.role === 'source' || record.role === 'destination' ? record.role : undefined;
  return conversionId && role ? { conversionId, role } : undefined;
}

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
  const categoryId = normalizeTransactionCategory(resolvedType, text(candidate.categoryId ?? current?.categoryId));
  const grossAmount = resolvedType === 'income' && categoryId === 'income-dividend' ? optionalNonNegative(candidate.grossAmount, '稅前股息') : undefined;
  const withholdingTax = resolvedType === 'income' && categoryId === 'income-dividend' ? optionalNonNegative(candidate.withholdingTax, '扣繳稅額') : undefined;
  if (grossAmount !== undefined && withholdingTax !== undefined && withholdingTax > grossAmount) throw new Error('扣繳稅額不得大於稅前股息');
  const amount = grossAmount !== undefined && withholdingTax !== undefined ? grossAmount - withholdingTax : positive(candidate.amount ?? current?.amount);
  if (!sourceAccount || !sourceAccount.isActive || !(amount > 0)) throw new Error('請選擇有效啟用帳戶並輸入大於 0 的金額');
  const transferAccountId = text(candidate.transferAccountId ?? current?.transferAccountId) || undefined;
  if (resolvedType === 'transfer') {
    const message = validateTransferAccounts(accountId, transferAccountId || '', amount, accountList);
    if (message) throw new Error(message);
  }
  const currency = (resolvedType === 'transfer' ? sourceAccount.currency : text(candidate.currency ?? current?.currency, sourceAccount.currency)).toUpperCase().slice(0, 8);
  const investmentAttribution = normalizeInvestmentAttribution(candidate.investmentAttribution, { type: resolvedType, accountId, amount, currency });
  const loanAttribution = normalizeLoanAttribution(candidate.loanAttribution ?? current?.loanAttribution, { type: resolvedType, accountId, amount, currency });
  const fxConversionLeg = normalizeFxConversionLegAttribution(candidate.fxConversionLeg ?? current?.fxConversionLeg);
  const normalized: FinancialTransaction = {
    id,
    accountId,
    ...(resolvedType === 'transfer' && transferAccountId ? { transferAccountId } : {}),
    type: resolvedType,
    status: status(candidate.status ?? current?.status),
    source: source(candidate.source ?? current?.source),
    amount,
    currency,
    categoryId,
    description: text(candidate.description ?? current?.description),
    merchant: text(candidate.merchant ?? current?.merchant),
    note: text(candidate.note ?? current?.note),
    occurredAt: iso(candidate.occurredAt ?? current?.occurredAt, fallback),
    fingerprint: '',
    excluded: Boolean(candidate.excluded ?? current?.excluded),
    createdAt: current?.createdAt || iso(candidate.createdAt, fallback),
    updatedAt: current ? fallback : iso(candidate.updatedAt, iso(candidate.createdAt, fallback)),
    ...(resolvedType === 'income' && categoryId === 'income-dividend' ? {
      ...(optionalText(candidate.assetSymbol) ? { assetSymbol: optionalText(candidate.assetSymbol)!.toUpperCase() } : {}),
      ...(optionalText(candidate.assetName) ? { assetName: optionalText(candidate.assetName) } : {}),
      ...(grossAmount !== undefined ? { grossAmount } : {}),
      ...(withholdingTax !== undefined ? { withholdingTax } : {})
    } : {}),
    ...(investmentAttribution ? { investmentAttribution } : {}),
    ...(loanAttribution ? { loanAttribution } : {}),
    ...(fxConversionLeg ? { fxConversionLeg } : {})
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

/** Deterministic collision-avoidance shared by known and opaque records so neither kind can silently steal the other's id (UR-TODO-046 FX-F1A R9). */
function resolveUniqueTransactionId(candidateId: string, fingerprintSource: unknown, used: Set<string>): string {
  let id = candidateId && !used.has(candidateId) ? candidateId : `legacy-transaction-${hash(JSON.stringify(fingerprintSource))}`;
  let n = 1;
  while (used.has(id)) id = `legacy-transaction-${hash(`${JSON.stringify(fingerprintSource)}:${n++}`)}`;
  return id;
}

/** True only when the record explicitly opts into the opaque path; malformed-but-silent records must never be routed here. */
function isOpaqueTransactionEnvelopeCandidate(record: Record<string, unknown>): boolean {
  return 'transactionOpaqueEnvelopeVersion' in record;
}

function normalizeOpaqueTransactionEnvelope(record: Record<string, unknown>): { payload: Record<string, unknown> } | undefined {
  if (record.transactionOpaqueEnvelopeVersion !== TRANSACTION_OPAQUE_ENVELOPE_VERSION) return undefined;
  const payload = record.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  return { payload: payload as Record<string, unknown> };
}

export function normalizeTransactions(raw: unknown, accountInput: AccountReference[] | Set<string>, fallback = LEGACY_TRANSACTION_FALLBACK) {
  const accountList = references(accountInput); const used = new Set<string>(), skipped: string[] = [];
  const transactions: FinancialTransaction[] = [];
  const opaqueTransactions: OpaqueFinancialTransactionEnvelope[] = [];
  for (const [index, value] of (Array.isArray(raw) ? raw : []).entries()) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) { skipped.push(`第 ${index + 1} 筆不是交易物件`); continue; }
    const record = value as Record<string, unknown>;
    if (isOpaqueTransactionEnvelopeCandidate(record)) {
      const envelope = normalizeOpaqueTransactionEnvelope(record);
      if (!envelope) { skipped.push(`第 ${index + 1} 筆為無效的未支援格式交易（opaque envelope 格式錯誤）`); continue; }
      const candidateId = text(record.id);
      if (!candidateId) { skipped.push(`第 ${index + 1} 筆未支援格式交易缺少 id`); continue; }
      const id = resolveUniqueTransactionId(candidateId, record, used);
      used.add(id);
      opaqueTransactions.push({ transactionOpaqueEnvelopeVersion: TRANSACTION_OPAQUE_ENVELOPE_VERSION, id, payload: envelope.payload });
      continue;
    }
    const candidateId = text(record.id);
    const id = resolveUniqueTransactionId(candidateId, record, used);
    try {
      const normalized = normalizeCandidate(value as Partial<FinancialTransaction>, accountList, fallback, id);
      used.add(id); transactions.push(normalized);
    } catch (error) { skipped.push(`第 ${index + 1} 筆交易無效：${error instanceof Error ? error.message : '格式錯誤'}`); }
  }
  return { transactions, opaqueTransactions, skipped };
}

/** The single inverse of normalizeTransactions()'s split: merges known and opaque records back into one raw array so localStorage/Backup persist exactly one `transactions` field, matching what any other version of this client reads from and writes to. */
export function serializeTransactionCollection(transactions: readonly FinancialTransaction[], opaqueTransactions: readonly OpaqueFinancialTransactionEnvelope[]): PersistedFinancialTransaction[] {
  return [...transactions, ...opaqueTransactions];
}

export function deriveTransactionAccountBalances(transactions: FinancialTransaction[]) { const balances: Record<string, number> = {}; for (const t of transactions) { if (t.status !== 'posted' || t.excluded) continue; const add = (id: string, value: number) => balances[id] = (balances[id] || 0) + value; if (t.type === 'income' || t.type === 'adjustment') add(t.accountId, t.amount); else if (t.type === 'expense') add(t.accountId, -t.amount); else { add(t.accountId, -t.amount); if (t.transferAccountId) add(t.transferAccountId, t.amount); } } return balances; }
/** UR-TODO-046 FX-F2C-1: FX conversion principal legs are internal asset reallocation, not household income/expense — excluded regardless of `type`, mirroring the existing zero-cash-flow-effect treatment of `transfer`. */
export function transactionCashFlowSummary(transactions: FinancialTransaction[]) { return transactions.filter(t => t.status === 'posted' && !t.excluded && !t.fxConversionLeg).reduce((s, t) => ({ income: s.income + (t.type === 'income' ? t.amount : 0), expense: s.expense + (t.type === 'expense' ? t.amount : 0) }), { income: 0, expense: 0 }); }
export const accountHasTransactions = (transactions: FinancialTransaction[], accountId: string) => transactions.some(t => t.accountId === accountId || t.transferAccountId === accountId);
