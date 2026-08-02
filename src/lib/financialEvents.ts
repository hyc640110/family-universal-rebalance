import { canonicalCalendarDay, isCanonicalCalendarDay } from './calendarDay';
import type { FinancialTransaction } from './transactions';

export const FINANCIAL_EVENT_SCHEMA_VERSION = 1;

export type FinancialEventType =
  | 'external-income'
  | 'external-expense'
  | 'internal-transfer'
  | 'investment-buy'
  | 'investment-sell'
  | 'dividend'
  | 'investment-fee'
  | 'loan-disbursement'
  | 'loan-principal-payment'
  | 'loan-interest-payment'
  | 'adjustment';

export type FinancialEventStatus = 'pending' | 'posted' | 'void';
export type FinancialEventSource = 'manual' | 'linked-transaction';

export type FinancialEvent = {
  id: string;
  type: FinancialEventType;
  status: FinancialEventStatus;
  source: FinancialEventSource;
  effectiveDate: string;
  occurredAt?: string;
  amount: number;
  currency: string;
  accountId?: string;
  counterpartyAccountId?: string;
  assetSymbol?: string;
  loanId?: string;
  transactionId?: string;
  note: string;
  createdAt: string;
  updatedAt: string;
} & Record<string, unknown>;

export type FinancialEventReferenceContext = {
  accountIds: ReadonlySet<string>;
  loanIds: ReadonlySet<string>;
  transactionIds: ReadonlySet<string>;
  transactionsById: ReadonlyMap<string, FinancialTransaction>;
};

export type FinancialEventLedger = {
  schemaVersion: number;
  events: FinancialEvent[];
  attributionStartDate?: string;
  skipped: string[];
  /** false means this Ledger is opaque future data and must never be interpreted as C1. */
  supported: boolean;
};

const EVENT_TYPES = new Set<FinancialEventType>([
  'external-income',
  'external-expense',
  'internal-transfer',
  'investment-buy',
  'investment-sell',
  'dividend',
  'investment-fee',
  'loan-disbursement',
  'loan-principal-payment',
  'loan-interest-payment',
  'adjustment'
]);
const EVENT_STATUSES = new Set<FinancialEventStatus>(['pending', 'posted', 'void']);
const EVENT_SOURCES = new Set<FinancialEventSource>(['manual', 'linked-transaction']);
const LOAN_EVENT_TYPES = new Set<FinancialEventType>([
  'loan-disbursement',
  'loan-principal-payment',
  'loan-interest-payment'
]);
const INVESTMENT_EVENT_TYPES = new Set<FinancialEventType>(['investment-buy', 'investment-sell']);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function requiredText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeIsoTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) || new Date(timestamp).toISOString() !== value ? undefined : value;
}

function omitOptionalKnownFields(event: FinancialEvent): FinancialEvent {
  const mutable = event as Record<string, unknown>;
  for (const key of ['occurredAt', 'counterpartyAccountId', 'assetSymbol', 'loanId', 'transactionId']) {
    if (mutable[key] === undefined) delete mutable[key];
  }
  return event;
}

function skip(skipped: string[], index: number, reason: string): undefined {
  skipped.push(`financialEvents[${index}]：${reason}`);
  return undefined;
}

function linkedTransactionReason(
  type: FinancialEventType,
  status: FinancialEventStatus,
  amount: number,
  currency: string,
  accountId: string,
  counterpartyAccountId: string | undefined,
  effectiveDate: string,
  transaction: FinancialTransaction
): string | undefined {
  if (transaction.status !== status) return 'linked transaction status 必須與事件一致';
  if (transaction.excluded) return 'linked transaction 不得是 excluded';
  if (transaction.accountId !== accountId) return 'linked transaction accountId 必須與事件一致';
  if (transaction.amount !== amount || transaction.currency.toUpperCase() !== currency) return 'linked transaction amount 與 currency 必須與事件一致';
  if (canonicalCalendarDay(transaction.occurredAt) !== effectiveDate) return 'linked transaction occurredAt 的 Asia/Taipei 日期必須與 effectiveDate 一致';
  if (type === 'external-income') return transaction.type === 'income' && transaction.categoryId !== 'income-dividend' ? undefined : 'external-income 只可連結非股息 income transaction';
  if (type === 'external-expense') return transaction.type === 'expense' && transaction.categoryId !== 'expense-investment' ? undefined : 'external-expense 不得連結 investment expense transaction';
  if (type === 'internal-transfer') {
    return transaction.type === 'transfer' && transaction.transferAccountId === counterpartyAccountId
      ? undefined
      : 'internal-transfer 必須連結同帳戶、同對方帳戶的 transfer transaction';
  }
  if (type === 'dividend') return transaction.type === 'income' && transaction.categoryId === 'income-dividend' ? undefined : 'dividend 只可連結 income-dividend transaction';
  if (type === 'adjustment') return transaction.type === 'adjustment' ? undefined : 'adjustment 只可連結 adjustment transaction';
  return `${type} 尚無可安全驗證的 transaction taxonomy`;
}

function normalizeEvent(
  raw: unknown,
  index: number,
  context: FinancialEventReferenceContext,
  knownIds: Set<string>,
  consumedTransactionIds: Set<string>,
  skipped: string[]
): FinancialEvent | undefined {
  const record = asRecord(raw);
  if (!record) return skip(skipped, index, '必須是物件');

  const id = requiredText(record.id);
  if (!id) return skip(skipped, index, '缺少 id');
  if (knownIds.has(id)) return skip(skipped, index, `重複 id「${id}」`);

  const type = record.type;
  if (typeof type !== 'string' || !EVENT_TYPES.has(type as FinancialEventType)) return skip(skipped, index, 'type 無效');
  const status = record.status;
  if (typeof status !== 'string' || !EVENT_STATUSES.has(status as FinancialEventStatus)) return skip(skipped, index, 'status 無效');
  const source = record.source;
  if (typeof source !== 'string' || !EVENT_SOURCES.has(source as FinancialEventSource)) return skip(skipped, index, 'source 無效');

  const effectiveDate = requiredText(record.effectiveDate);
  if (!effectiveDate || !isCanonicalCalendarDay(effectiveDate)) return skip(skipped, index, 'effectiveDate 必須是有效 Asia/Taipei YYYY-MM-DD');
  const occurredAt = record.occurredAt === undefined ? undefined : normalizeIsoTimestamp(record.occurredAt);
  if (record.occurredAt !== undefined && !occurredAt) return skip(skipped, index, 'occurredAt 必須是有效 ISO UTC timestamp');

  const amount = record.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return skip(skipped, index, 'amount 必須是正的有限數值');
  const currency = requiredText(record.currency)?.toUpperCase();
  if (!currency || !/^[A-Z]{3}$/.test(currency)) return skip(skipped, index, 'currency 必須是三碼貨幣代號');

  const accountId = optionalText(record.accountId);
  if (!accountId || !context.accountIds.has(accountId)) return skip(skipped, index, 'accountId 必須連結既有帳戶');
  const counterpartyAccountId = optionalText(record.counterpartyAccountId);
  if (type === 'internal-transfer') {
    if (!counterpartyAccountId || !context.accountIds.has(counterpartyAccountId)) return skip(skipped, index, 'internal-transfer 必須連結既有對方帳戶');
    if (counterpartyAccountId === accountId) return skip(skipped, index, 'internal-transfer 的兩個帳戶不得相同');
  }

  const assetSymbol = optionalText(record.assetSymbol)?.toUpperCase();
  if (INVESTMENT_EVENT_TYPES.has(type as FinancialEventType) && !assetSymbol) return skip(skipped, index, `${type} 必須連結 assetSymbol`);
  const loanId = optionalText(record.loanId);
  if (LOAN_EVENT_TYPES.has(type as FinancialEventType) && (!loanId || !context.loanIds.has(loanId))) return skip(skipped, index, `${type} 必須連結既有 loanId`);

  const transactionId = optionalText(record.transactionId);
  if (source === 'manual' && transactionId) return skip(skipped, index, 'manual event 不得設定 transactionId');
  if (source === 'linked-transaction') {
    if (!transactionId || !context.transactionIds.has(transactionId)) return skip(skipped, index, 'linked-transaction 必須連結既有 transactionId');
    const transaction = context.transactionsById.get(transactionId);
    if (!transaction) return skip(skipped, index, 'linked-transaction 缺少可驗證的 transaction 資料');
    const reason = linkedTransactionReason(type as FinancialEventType, status as FinancialEventStatus, amount, currency, accountId, counterpartyAccountId, effectiveDate, transaction);
    if (reason) return skip(skipped, index, reason);
    if (status !== 'void' && consumedTransactionIds.has(transactionId)) return skip(skipped, index, `transactionId「${transactionId}」已被另一個有效 linked event 消費`);
    if (status !== 'void') consumedTransactionIds.add(transactionId);
  }

  const note = typeof record.note === 'string' ? record.note : '';
  const createdAt = normalizeIsoTimestamp(record.createdAt);
  const updatedAt = normalizeIsoTimestamp(record.updatedAt);
  if (!createdAt || !updatedAt) return skip(skipped, index, 'createdAt 與 updatedAt 必須是有效 ISO UTC timestamp');

  knownIds.add(id);
  return omitOptionalKnownFields({
    ...record,
    id,
    type: type as FinancialEventType,
    status: status as FinancialEventStatus,
    source: source as FinancialEventSource,
    effectiveDate,
    ...(occurredAt ? { occurredAt } : {}),
    amount,
    currency,
    accountId,
    ...(counterpartyAccountId ? { counterpartyAccountId } : {}),
    ...(assetSymbol ? { assetSymbol } : {}),
    ...(loanId ? { loanId } : {}),
    ...(transactionId ? { transactionId } : {}),
    note,
    createdAt,
    updatedAt
  });
}

/**
 * Normalizes only an explicitly supplied Ledger. Legacy records remain ledger-free;
 * this boundary never infers or converts historical transactions into events.
 */
export function normalizeFinancialEventLedger(raw: unknown, context: FinancialEventReferenceContext): FinancialEventLedger {
  const record = asRecord(raw) ?? {};
  const hasLedgerPayload = record.financialEventSchemaVersion !== undefined || record.financialEvents !== undefined || record.financialEventAttributionStartDate !== undefined;
  if (hasLedgerPayload && record.financialEventSchemaVersion !== FINANCIAL_EVENT_SCHEMA_VERSION) {
    return {
      schemaVersion: record.financialEventSchemaVersion as number,
      events: record.financialEvents as FinancialEvent[],
      ...(record.financialEventAttributionStartDate !== undefined ? { attributionStartDate: record.financialEventAttributionStartDate as string } : {}),
      skipped: [],
      supported: false
    };
  }
  const skipped: string[] = [];
  const knownIds = new Set<string>();
  const consumedTransactionIds = new Set<string>();
  const events = Array.isArray(record.financialEvents)
    ? record.financialEvents.map((event, index) => normalizeEvent(event, index, context, knownIds, consumedTransactionIds, skipped)).filter((event): event is FinancialEvent => Boolean(event))
    : [];
  const attributionStartDate = optionalText(record.financialEventAttributionStartDate);

  return {
    schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION,
    events,
    ...(attributionStartDate && isCanonicalCalendarDay(attributionStartDate) ? { attributionStartDate } : {}) ,
    skipped,
    supported: true
  };
}
