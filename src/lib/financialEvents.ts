import { canonicalCalendarDay, isCanonicalCalendarDay } from './calendarDay';
import { normalizeGenericSplitAllocationLink, resolveActiveGenericSplitAllocationGroups, type GenericSplitAllocationLink } from './genericSplitAllocation';
import { validateLoanAttributionContract } from './loanAttributionContract';
import type { FinancialTransaction } from './transactions';

/**
 * UR-TODO-046-L1: v2 adds optional componentLink to represent an atomically
 * confirmed multi-component payment. v1 remains readable without migration;
 * an older client encountering v2 must keep it opaque and fail-safe.
 */
export const FINANCIAL_EVENT_SCHEMA_VERSION = 3;
export const SUPPORTED_FINANCIAL_EVENT_SCHEMA_VERSIONS = [1, 2, 3] as const;

export function isFinancialEventLedgerSchemaSupported(schemaVersion: number, supportedSchemaVersions: readonly number[] = SUPPORTED_FINANCIAL_EVENT_SCHEMA_VERSIONS): boolean {
  return supportedSchemaVersions.includes(schemaVersion);
}

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
  | 'loan-fee'
  | 'loan-penalty'
  | 'adjustment';

export type FinancialEventStatus = 'pending' | 'posted' | 'void';
/**
 * UR-TODO-046-C3C-C: 'attribution-confirmation' is an additive extension of the
 * v1 source domain (not a schema version bump — see createFinancialEventId /
 * appendFinancialEvent doc comments for why). It marks an event created when
 * the user explicitly confirmed a C3B/C3C-A derived-transaction attribution
 * evidence row, distinct from 'manual' (free-form entry) and
 * 'linked-transaction' (any other linked event).
 *
 * UR-TODO-046 void: 'void' is the same kind of additive extension. It marks a
 * forward-only "void marker" event — see voidedEventId below and
 * financialEventVoid.ts — never a mutation of the event it voids.
 */
export type FinancialEventSource = 'manual' | 'linked-transaction' | 'attribution-confirmation' | 'void';

/** A component group is the smallest persisted proof for a multi-component economic payment. */
export type FinancialEventComponentLink = {
  domain: 'loan-payment';
  paymentId: string;
  componentId: string;
  /** Fresh on every group confirmation: prevents re-recognition from mixing old and new components after a void. */
  confirmationGroupId: string;
  cashMovementId?: string;
};

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
  componentLink?: FinancialEventComponentLink;
  /** v3 generic, domain-neutral atomic allocation component. */
  splitAllocationLink?: GenericSplitAllocationLink;
  /** Only present on a source: 'void' event — the id of the event it voids. Forward-only: the voided event itself is never mutated. */
  voidedEventId?: string;
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

export type FinancialEventLedgerNormalizationOptions = {
  /** Allows the real normalization boundary to characterize an older client without changing global version constants. */
  supportedSchemaVersions?: readonly number[];
};

type V3OpaqueFinancialEventEnvelope = {
  financialEventOpaqueEnvelopeVersion: 3;
  /** A v2 runtime already excludes void-source records before attribution/reconciliation. */
  source: 'void';
  payload: unknown;
};

function isV3OpaqueFinancialEventEnvelope(value: unknown): value is V3OpaqueFinancialEventEnvelope {
  const record = asRecord(value);
  return record?.financialEventOpaqueEnvelopeVersion === 3
    && record.source === 'void'
    && asRecord(record.payload) !== undefined;
}

/**
 * v3 persists each record as an opaque, v2-safe envelope in the same Ledger field.
 * The envelope is still an array, so legacy localStorage/Backup/Firebase readers preserve it;
 * its `void` source makes a pre-v3 runtime skip it before attribution or reconciliation.
 */
export function serializeFinancialEventLedgerEvents(schemaVersion: number, events: readonly unknown[]): unknown {
  if (schemaVersion !== 3) return events;
  if (events.every(event => isV3OpaqueFinancialEventEnvelope(event))) return events;
  return events.map(event => ({ financialEventOpaqueEnvelopeVersion: 3, source: 'void', payload: event } satisfies V3OpaqueFinancialEventEnvelope));
}

function eventsForSupportedSchema(schemaVersion: number, rawEvents: unknown): unknown[] {
  if (!Array.isArray(rawEvents)) return [];
  return schemaVersion === 3
    ? rawEvents.map(event => isV3OpaqueFinancialEventEnvelope(event) ? event.payload : event)
    : rawEvents;
}

/** Decodes the same persisted v3 envelope used by upload/download before a supported merge. */
export function deserializeFinancialEventLedgerEvents(schemaVersion: number, rawEvents: unknown): FinancialEvent[] {
  return eventsForSupportedSchema(schemaVersion, rawEvents).filter((event): event is FinancialEvent => asRecord(event) !== undefined);
}

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
  'loan-fee',
  'loan-penalty',
  'adjustment'
]);
const EVENT_STATUSES = new Set<FinancialEventStatus>(['pending', 'posted', 'void']);
const EVENT_SOURCES = new Set<FinancialEventSource>(['manual', 'linked-transaction', 'attribution-confirmation', 'void']);
/** Both sources are inherently tied to one transactionId and share the same linkedTransactionReason() taxonomy check. */
const TRANSACTION_LINKED_SOURCES = new Set<FinancialEventSource>(['linked-transaction', 'attribution-confirmation']);
const LOAN_EVENT_TYPES = new Set<FinancialEventType>([
  'loan-disbursement',
  'loan-principal-payment',
  'loan-interest-payment',
  'loan-fee',
  'loan-penalty'
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
  for (const key of ['occurredAt', 'counterpartyAccountId', 'assetSymbol', 'loanId', 'transactionId', 'componentLink', 'splitAllocationLink', 'voidedEventId']) {
    if (mutable[key] === undefined) delete mutable[key];
  }
  return event;
}

function skip(skipped: string[], index: number, reason: string): undefined {
  skipped.push(`financialEvents[${index}]：${reason}`);
  return undefined;
}

/**
 * UR-TODO-046 void: scans raw (unvalidated) or already-normalized event
 * records for 'void' markers and returns the set of event ids they void.
 * Shared by normalizeFinancialEventLedger() (so a voided linked event's
 * transactionId is freed up for a future re-confirmation instead of being
 * permanently consumed — see normalizeEvent()'s consumedTransactionIds use
 * below) and runtimeAttributionComposition.ts (so a voided event's own
 * contribution and its transaction's reconciliation status both exclude it).
 */
export function collectVoidedEventIds(records: readonly Record<string, unknown>[]): Set<string> {
  const voided = new Set<string>();
  for (const record of records) {
    if (record.source !== 'void') continue;
    const target = typeof record.voidedEventId === 'string' ? record.voidedEventId.trim() : '';
    if (target) voided.add(target);
  }
  return voided;
}

/** Exported for reuse by the C3C-C attribution-confirmation → FinancialEvent converter, which must apply the identical taxonomy check before allowing a write. */
export function linkedTransactionReason(
  type: FinancialEventType,
  status: FinancialEventStatus,
  amount: number,
  currency: string,
  accountId: string,
  counterpartyAccountId: string | undefined,
  effectiveDate: string,
  transaction: FinancialTransaction,
  componentLink?: FinancialEventComponentLink,
  loanId?: string,
  splitAllocationLink?: GenericSplitAllocationLink
): string | undefined {
  if (transaction.status !== status) return 'linked transaction status 必須與事件一致';
  if (transaction.excluded) return 'linked transaction 不得是 excluded';
  if (transaction.accountId !== accountId) return 'linked transaction accountId 必須與事件一致';
  const isGroupedComponent = Boolean(componentLink?.domain === 'loan-payment' || splitAllocationLink);
  if ((!isGroupedComponent && transaction.amount !== amount) || transaction.currency.toUpperCase() !== currency) return 'linked transaction amount 與 currency 必須與事件一致';
  if (canonicalCalendarDay(transaction.occurredAt) !== effectiveDate) return 'linked transaction occurredAt 的 Asia/Taipei 日期必須與 effectiveDate 一致';
  if (transaction.investmentAttribution?.kind === 'cash-movement') return '投資 cash movement 必須由完整 trade contract 配對，不能作為獨立外部收支記帳';
  if (type === 'external-income') return transaction.type === 'income' && transaction.categoryId !== 'income-dividend' ? undefined : 'external-income 只可連結非股息 income transaction';
  if (type === 'external-expense') return transaction.type === 'expense'
    && transaction.categoryId !== 'expense-investment'
    && transaction.categoryId !== 'expense-housing'
    ? undefined
    : 'external-expense 不得連結 investment 或未具正式 Loan contract 的 housing expense transaction';
  if (type === 'internal-transfer') {
    return transaction.type === 'transfer' && transaction.transferAccountId === counterpartyAccountId
      ? undefined
      : 'internal-transfer 必須連結同帳戶、同對方帳戶的 transfer transaction';
  }
  if (type === 'investment-buy') {
    const investment = transaction.investmentAttribution;
    return investment?.kind === 'trade'
      && investment.side === 'buy'
      && transaction.type === 'expense'
      && investment.settlementAmount === transaction.amount
      ? undefined
      : 'investment-buy 必須連結完整且方向為 buy 的正式投資交易契約';
  }
  if (type === 'investment-sell') {
    const investment = transaction.investmentAttribution;
    return investment?.kind === 'trade'
      && investment.side === 'sell'
      && transaction.type === 'income'
      && investment.settlementAmount === transaction.amount
      ? undefined
      : 'investment-sell 必須連結完整且方向為 sell 的正式投資交易契約';
  }
  if (type === 'investment-fee') {
    const investment = transaction.investmentAttribution;
    return investment?.kind === 'cost'
      && transaction.type === 'expense'
      && !!investment.costId
      && investment.settlementCostTreatment === 'independent'
      ? undefined
      : 'investment-fee 必須連結具 stable costId 且明確證明為 settlement 之外獨立 fee 或 tax 的正式投資成本契約';
  }
  if (type === 'dividend') return transaction.type === 'income' && transaction.categoryId === 'income-dividend' ? undefined : 'dividend 只可連結 income-dividend transaction';
  if (type === 'adjustment') return transaction.type === 'adjustment' ? undefined : 'adjustment 只可連結 adjustment transaction';
  if (LOAN_EVENT_TYPES.has(type)) {
    const loan = transaction.loanAttribution;
    if (type === 'loan-disbursement') {
      return loan?.kind === 'disbursement'
        && loan.loanId === loanId
        && transaction.type === 'income'
        && loan.cashAccountId === transaction.accountId
        && loan.currency === transaction.currency
        && loan.settlementAmount === transaction.amount
        && loan.settlementAmount === amount
        ? undefined
        : 'loan-disbursement 必須連結完整 Loan disbursement contract';
    }
    if (!componentLink || componentLink.domain !== 'loan-payment' || loan?.kind !== 'repayment') return `${type} 必須連結完整 Loan repayment component contract`;
    if (loan.paymentId !== componentLink.paymentId || loan.loanId !== loanId || loan.cashAccountId !== transaction.accountId || loan.currency !== transaction.currency || loan.settlementAmount !== transaction.amount) return `${type} Loan repayment contract 與 transaction 不一致`;
    const component = loan.components.find(item => item.componentId === componentLink.componentId);
    const expectedType = component?.type === 'principal' ? 'loan-principal-payment' : component?.type === 'interest' ? 'loan-interest-payment' : component?.type === 'fee' ? 'loan-fee' : component?.type === 'penalty' ? 'loan-penalty' : undefined;
    return component && expectedType === type && component.amount === amount ? undefined : `${type} 必須對應唯一且金額一致的 Loan component`;
  }
  return `${type} 尚無可安全驗證的 transaction taxonomy`;
}

function normalizeComponentLink(value: unknown): FinancialEventComponentLink | undefined {
  const record = asRecord(value);
  if (!record || record.domain !== 'loan-payment') return undefined;
  const paymentId = requiredText(record.paymentId);
  const componentId = requiredText(record.componentId);
  const confirmationGroupId = requiredText(record.confirmationGroupId);
  const cashMovementId = optionalText(record.cashMovementId);
  return paymentId && componentId && confirmationGroupId
    ? { domain: 'loan-payment', paymentId, componentId, confirmationGroupId, ...(cashMovementId ? { cashMovementId } : {}) }
    : undefined;
}

export type LoanComponentGroupResolution = { validEventIds: ReadonlySet<string>; confirmedPaymentIds: ReadonlySet<string> };

/** Validates a whole active payment group. Incomplete/ambiguous groups remain persisted but are never consumed or attributed. */
export function resolveActiveLoanComponentGroups(events: readonly FinancialEvent[], context: FinancialEventReferenceContext): LoanComponentGroupResolution {
  const voided = collectVoidedEventIds(events as unknown as readonly Record<string, unknown>[]);
  const groups = new Map<string, FinancialEvent[]>();
  for (const event of events) {
    if (!event.componentLink || event.source === 'void' || voided.has(event.id)) continue;
    const group = groups.get(event.componentLink.confirmationGroupId) || [];
    group.push(event); groups.set(event.componentLink.confirmationGroupId, group);
  }
  const prelim = new Map<string, FinancialEvent[]>();
  for (const [groupId, group] of groups) {
    const first = group[0];
    const link = first?.componentLink;
    if (!first || !link || first.source !== 'attribution-confirmation' || first.status !== 'posted' || !first.transactionId || !first.loanId) continue;
    const transaction = context.transactionsById.get(first.transactionId);
    const contract = transaction?.loanAttribution;
    if (!transaction || contract?.kind !== 'repayment' || !context.loanIds.has(first.loanId)) continue;
    const checked = validateLoanAttributionContract({ transaction, transactions: [...context.transactionsById.values()], loanIds: context.loanIds });
    if (checked.status !== 'valid' || checked.attribution.kind !== 'repayment') continue;
    if (contract.paymentId !== link.paymentId || contract.loanId !== first.loanId || contract.cashAccountId !== first.accountId || contract.currency !== first.currency || contract.settlementAmount !== transaction.amount) continue;
    if (group.some(event => event.source !== 'attribution-confirmation' || event.status !== 'posted' || event.transactionId !== first.transactionId || event.loanId !== first.loanId || event.accountId !== first.accountId || event.currency !== first.currency || event.effectiveDate !== first.effectiveDate || event.componentLink?.paymentId !== link.paymentId || event.componentLink?.cashMovementId !== link.cashMovementId)) continue;
    if (group.some(event => linkedTransactionReason(
      event.type,
      event.status,
      event.amount,
      event.currency,
      event.accountId || '',
      event.counterpartyAccountId,
      event.effectiveDate,
      transaction,
      event.componentLink,
      event.loanId
    ))) continue;
    if (new Set(group.map(event => event.componentLink?.componentId)).size !== group.length) continue;
    if (contract.components.length !== group.length || contract.components.reduce((sum, component) => sum + component.amount, 0) !== contract.settlementAmount) continue;
    const expected = new Map(contract.components.map(component => [component.componentId, component]));
    if (group.some(event => {
      const component = event.componentLink ? expected.get(event.componentLink.componentId) : undefined;
      const type = component?.type === 'principal' ? 'loan-principal-payment' : component?.type === 'interest' ? 'loan-interest-payment' : component?.type === 'fee' ? 'loan-fee' : component?.type === 'penalty' ? 'loan-penalty' : undefined;
      return !component || component.amount !== event.amount || type !== event.type;
    })) continue;
    if (contract.cashMovementId !== link.cashMovementId) continue;
    if (contract.cashMovementId) {
      const movements = [...context.transactionsById.values()].filter(candidate => candidate.loanAttribution?.kind === 'cash-movement' && candidate.loanAttribution.cashMovementId === contract.cashMovementId);
      const movement = movements[0];
      if (movements.length !== 1 || !movement || movement.loanAttribution?.kind !== 'cash-movement' || movement.type !== 'expense'
        || movement.accountId !== first.accountId || movement.currency !== first.currency || movement.amount !== transaction.amount
        || movement.loanAttribution.direction !== 'decrease' || movement.loanAttribution.cashAccountId !== first.accountId
        || movement.loanAttribution.currency !== first.currency || movement.loanAttribution.settlementAmount !== transaction.amount) continue;
    }
    prelim.set(groupId, group);
  }
  const paymentCounts = new Map<string, number>();
  const transactionCounts = new Map<string, number>();
  for (const group of prelim.values()) {
    const first = group[0]!;
    paymentCounts.set(first.componentLink!.paymentId, (paymentCounts.get(first.componentLink!.paymentId) || 0) + 1);
    transactionCounts.set(first.transactionId!, (transactionCounts.get(first.transactionId!) || 0) + 1);
  }
  const validEventIds = new Set<string>();
  const confirmedPaymentIds = new Set<string>();
  for (const group of prelim.values()) {
    const first = group[0]!;
    if (paymentCounts.get(first.componentLink!.paymentId) !== 1 || transactionCounts.get(first.transactionId!) !== 1) continue;
    group.forEach(event => validEventIds.add(event.id));
    confirmedPaymentIds.add(first.componentLink!.paymentId);
  }
  return { validEventIds, confirmedPaymentIds };
}

function linkedInvestmentCostReason(transaction: FinancialTransaction, transactionsById: ReadonlyMap<string, FinancialTransaction>): string | undefined {
  const cost = transaction.investmentAttribution;
  if (cost?.kind !== 'cost' || !cost.costId || cost.settlementCostTreatment !== 'independent') return 'investment-fee 必須有 stable costId 且明確證明為 settlement 之外獨立成本';
  const transactions = [...transactionsById.values()];
  const matchingTrades = transactions.filter(candidate => candidate.investmentAttribution?.kind === 'trade' && candidate.investmentAttribution.tradeId === cost.tradeId);
  if (matchingTrades.length !== 1) return 'investment-fee 必須連結唯一且完整的正式 tradeId';
  const matchingCosts = transactions.filter(candidate => candidate.investmentAttribution?.kind === 'cost' && candidate.investmentAttribution.costId === cost.costId);
  return matchingCosts.length === 1 ? undefined : 'investment-fee stable costId 不得重複';
}

function normalizeEvent(
  raw: unknown,
  index: number,
  context: FinancialEventReferenceContext,
  knownIds: Set<string>,
  consumedTransactionIds: Set<string>,
  voidedEventIds: ReadonlySet<string>,
  schemaVersion: number,
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

  const componentLink = record.componentLink === undefined ? undefined : normalizeComponentLink(record.componentLink);
  if (record.componentLink !== undefined && !componentLink) return skip(skipped, index, 'componentLink 必須是完整 loan-payment linkage');
  const splitAllocationLink = record.splitAllocationLink === undefined ? undefined : normalizeGenericSplitAllocationLink(record.splitAllocationLink);
  if (record.splitAllocationLink !== undefined && !splitAllocationLink) return skip(skipped, index, 'splitAllocationLink 必須是完整 generic split allocation linkage');
  const isLoanComponent = LOAN_EVENT_TYPES.has(type as FinancialEventType) && type !== 'loan-disbursement';
  if (schemaVersion === 1 && componentLink) return skip(skipped, index, 'v1 Ledger 不支援 componentLink');
  if (schemaVersion < 3 && splitAllocationLink) return skip(skipped, index, `v${schemaVersion} Ledger 不支援 splitAllocationLink`);
  if (schemaVersion >= 2 && isLoanComponent && !componentLink) return skip(skipped, index, `${type} 在 v${schemaVersion} 必須有 componentLink`);
  if (componentLink && (!isLoanComponent || !loanId || !TRANSACTION_LINKED_SOURCES.has(source as FinancialEventSource))) return skip(skipped, index, 'componentLink 只能用於 transaction-linked Loan component event');
  if (componentLink && splitAllocationLink) return skip(skipped, index, 'componentLink 與 splitAllocationLink 不得同時存在');
  if (splitAllocationLink && (LOAN_EVENT_TYPES.has(type as FinancialEventType) || source !== 'attribution-confirmation' || status !== 'posted')) return skip(skipped, index, 'splitAllocationLink 只能用於 posted attribution-confirmation 的非 Loan event');

  const transactionId = optionalText(record.transactionId);
  if (source === 'manual' && transactionId) return skip(skipped, index, 'manual event 不得設定 transactionId');
  if (TRANSACTION_LINKED_SOURCES.has(source as FinancialEventSource)) {
    if (!transactionId || !context.transactionIds.has(transactionId)) return skip(skipped, index, `${source} 必須連結既有 transactionId`);
    const transaction = context.transactionsById.get(transactionId);
    if (!transaction) return skip(skipped, index, `${source} 缺少可驗證的 transaction 資料`);
    const reason = linkedTransactionReason(type as FinancialEventType, status as FinancialEventStatus, amount, currency, accountId, counterpartyAccountId, effectiveDate, transaction, componentLink, loanId, splitAllocationLink);
    if (reason) return skip(skipped, index, reason);
    if (type === 'investment-fee') {
      const costReason = linkedInvestmentCostReason(transaction, context.transactionsById);
      if (costReason) return skip(skipped, index, costReason);
    }
    // UR-TODO-046 void: a voided event's own status is never mutated (forward-only), so a voided
    // linked event must stop consuming its transactionId here too — otherwise the transactionId
    // stays permanently claimed and a future re-confirmation of the same transaction would be
    // silently dropped as a "duplicate" on the very next normalize pass.
    const isVoided = voidedEventIds.has(id);
    if (!componentLink && !splitAllocationLink && status !== 'void' && !isVoided && consumedTransactionIds.has(transactionId)) return skip(skipped, index, `transactionId「${transactionId}」已被另一個有效 linked event 消費`);
    if (!componentLink && !splitAllocationLink && status !== 'void' && !isVoided) consumedTransactionIds.add(transactionId);
  }

  const voidedEventId = optionalText(record.voidedEventId);
  if (source === 'void' && !voidedEventId) return skip(skipped, index, 'void 事件必須指定 voidedEventId');
  if (source !== 'void' && voidedEventId) return skip(skipped, index, '只有 void 事件可以設定 voidedEventId');

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
    ...(componentLink ? { componentLink } : {}),
    ...(splitAllocationLink ? { splitAllocationLink } : {}),
    ...(voidedEventId ? { voidedEventId } : {}),
    note,
    createdAt,
    updatedAt
  });
}

/**
 * Normalizes only an explicitly supplied Ledger. Legacy records remain ledger-free;
 * this boundary never infers or converts historical transactions into events.
 */
export function normalizeFinancialEventLedger(raw: unknown, context: FinancialEventReferenceContext, options: FinancialEventLedgerNormalizationOptions = {}): FinancialEventLedger {
  const record = asRecord(raw) ?? {};
  const hasLedgerPayload = record.financialEventSchemaVersion !== undefined || record.financialEvents !== undefined || record.financialEventAttributionStartDate !== undefined;
  const requestedSchemaVersion = typeof record.financialEventSchemaVersion === 'number' ? record.financialEventSchemaVersion : FINANCIAL_EVENT_SCHEMA_VERSION;
  if (hasLedgerPayload && !isFinancialEventLedgerSchemaSupported(requestedSchemaVersion, options.supportedSchemaVersions)) {
    return {
      schemaVersion: requestedSchemaVersion,
      events: record.financialEvents as FinancialEvent[],
      ...(record.financialEventAttributionStartDate !== undefined ? { attributionStartDate: record.financialEventAttributionStartDate as string } : {}),
      skipped: [],
      supported: false
    };
  }
  const skipped: string[] = [];
  const knownIds = new Set<string>();
  const consumedTransactionIds = new Set<string>();
  const schemaEvents = eventsForSupportedSchema(requestedSchemaVersion, record.financialEvents);
  const rawEventRecords = schemaEvents.map(event => asRecord(event)).filter((event): event is Record<string, unknown> => Boolean(event));
  const voidedEventIds = collectVoidedEventIds(rawEventRecords);
  const events = schemaEvents.map((event, index) => normalizeEvent(event, index, context, knownIds, consumedTransactionIds, voidedEventIds, requestedSchemaVersion, skipped)).filter((event): event is FinancialEvent => Boolean(event));
  const attributionStartDate = optionalText(record.financialEventAttributionStartDate);

  return {
    schemaVersion: requestedSchemaVersion,
    events,
    ...(attributionStartDate && isCanonicalCalendarDay(attributionStartDate) ? { attributionStartDate } : {}) ,
    skipped,
    supported: true
  };
}

/**
 * UR-TODO-046-C3C-C: matches the createTransactionId()/createFinancialAccountId()
 * convention (crypto.randomUUID with a deterministic-shape fallback for
 * environments without it).
 */
export function createFinancialEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export type AppendFinancialEventResult =
  | { rejected: false; events: FinancialEvent[] }
  | { rejected: true; reason: string };

/**
 * UR-TODO-046-C3C-C: the only sanctioned write path for state.financialEvents.
 * Enforces the forward-only contract at write time (normalizeFinancialEventLedger
 * only rejects duplicate ids found *within the same read*, it has no way to
 * compare against "what was already persisted" — this function is the actual
 * append-only guard): a new event may only be appended, never used to replace
 * an existing id. There is deliberately no update/delete counterpart in this
 * Sprint (void/undo is an explicit Remaining Boundary).
 */
export function appendFinancialEvent(existingEvents: readonly FinancialEvent[], event: FinancialEvent): AppendFinancialEventResult {
  if (event.componentLink) return { rejected: true, reason: 'Loan component event 必須使用 appendFinancialEventGroup() 原子寫入。' };
  if (event.splitAllocationLink) return { rejected: true, reason: 'Generic split component event 必須使用 appendGenericSplitAllocationGroup() 原子寫入。' };
  if (existingEvents.some(existing => existing.id === event.id)) {
    return { rejected: true, reason: `事件 id「${event.id}」已存在，Ledger 為 forward-only，不允許覆寫既有事件。` };
  }
  return { rejected: false, events: [...existingEvents, event] };
}

/** The only sanctioned write path for a multi-component Loan payment confirmation. */
export function appendFinancialEventGroup(existingEvents: readonly FinancialEvent[], group: readonly FinancialEvent[], context: FinancialEventReferenceContext): AppendFinancialEventResult {
  if (!group.length) return { rejected: true, reason: 'Loan component group 不得為空。' };
  if (group.some(event => event.source !== 'attribution-confirmation' || event.status !== 'posted' || !event.componentLink)) return { rejected: true, reason: 'Loan component group 的每個 event 必須是 posted attribution-confirmation 並有 componentLink。' };
  if (new Set(group.map(event => event.id)).size !== group.length || group.some(event => existingEvents.some(existing => existing.id === event.id))) return { rejected: true, reason: 'Loan component group 含重複 event id。' };
  const transactionIds = new Set(group.map(event => event.transactionId));
  if (transactionIds.size !== 1) return { rejected: true, reason: 'Loan component group 必須唯一連結一筆 transaction。' };
  const transactionId = [...transactionIds][0];
  const transaction = transactionId ? context.transactionsById.get(transactionId) : undefined;
  const checked = transaction
    ? validateLoanAttributionContract({ transaction, transactions: [...context.transactionsById.values()], loanIds: context.loanIds })
    : { status: 'unsupported' as const, reason: 'Loan component group 缺少可驗證 transaction。' };
  if (checked.status !== 'valid' || checked.attribution.kind !== 'repayment') return { rejected: true, reason: 'Loan component group 未通過完整 repayment contract 驗證。' };
  for (const event of group) {
    const reason = linkedTransactionReason(event.type, event.status, event.amount, event.currency, event.accountId || '', event.counterpartyAccountId, event.effectiveDate, transaction!, event.componentLink, event.loanId);
    if (reason) return { rejected: true, reason: `Loan component group 未通過寫入邊界驗證：${reason}` };
  }
  const all = [...existingEvents, ...group];
  const resolution = resolveActiveLoanComponentGroups(all, context);
  if (group.some(event => !resolution.validEventIds.has(event.id))) return { rejected: true, reason: 'Loan component group 不完整、重複或與正式 repayment contract 不一致。' };
  return { rejected: false, events: all };
}

/** The only sanctioned write path for a v3 generic split allocation group. */
export function appendGenericSplitAllocationGroup(existingEvents: readonly FinancialEvent[], group: readonly FinancialEvent[], context: FinancialEventReferenceContext): AppendFinancialEventResult {
  if (!group.length) return { rejected: true, reason: 'Generic split allocation group 不得為空。' };
  const firstLink = group[0]?.splitAllocationLink;
  if (!firstLink || group.some(event => event.source !== 'attribution-confirmation' || event.status !== 'posted' || !event.splitAllocationLink)) return { rejected: true, reason: 'Generic split allocation group 的每個 event 必須是 posted attribution-confirmation 並有 splitAllocationLink。' };
  if (group.some(event => event.splitAllocationLink?.domain !== firstLink.domain || event.splitAllocationLink?.allocationGroupId !== firstLink.allocationGroupId || event.splitAllocationLink?.replacementOfGroupId !== firstLink.replacementOfGroupId)) return { rejected: true, reason: 'Generic split allocation group linkage 必須一致。' };
  if (new Set(group.map(event => event.id)).size !== group.length || group.some(event => existingEvents.some(existing => existing.id === event.id))) return { rejected: true, reason: 'Generic split allocation group 含重複 event id。' };
  const transactionIds = new Set(group.map(event => event.transactionId));
  if (transactionIds.size !== 1) return { rejected: true, reason: 'Generic split allocation group 必須唯一連結一筆 transaction。' };
  const transactionId = [...transactionIds][0];
  const transaction = transactionId ? context.transactionsById.get(transactionId) : undefined;
  if (!transaction) return { rejected: true, reason: 'Generic split allocation group 缺少可驗證 transaction。' };
  for (const event of group) {
    const reason = linkedTransactionReason(event.type, event.status, event.amount, event.currency, event.accountId || '', event.counterpartyAccountId, event.effectiveDate, transaction, undefined, undefined, event.splitAllocationLink);
    if (reason) return { rejected: true, reason: `Generic split allocation group 未通過寫入邊界驗證：${reason}` };
  }
  const all = [...existingEvents, ...group];
  const resolution = resolveActiveGenericSplitAllocationGroups(all, { transactionsById: context.transactionsById });
  if (group.some(event => !resolution.validEventIds.has(event.id))) return { rejected: true, reason: 'Generic split allocation group 不完整、重複、未守恆或缺少已作廢 replacement target。' };
  return { rejected: false, events: all };
}

export type LedgerMergeOutcome =
  | { ok: true; schemaVersion: number; events: FinancialEvent[] }
  | { ok: false; reason: string };

/**
 * UR-TODO-046 Firebase Ledger sync: takes the union of two Ledgers by id — every
 * event unique to either side survives; a shared id (which under the
 * forward-only contract should always be byte-identical on both sides)
 * collapses to one. appendFinancialEvent() is not reusable here — it is a
 * single-event, reject-on-collision guard, not a two-array union.
 *
 * Deliberately refuses to merge when either side's schemaVersion is not the
 * currently-supported one: an opaque future-version Ledger's `events` are
 * unvalidated raw data with no guaranteed shape (may not even have a
 * reliable `.id`), so deduping against it would be unsafe. The caller is
 * expected to treat a rejection here as a fail-safe that blocks the whole
 * sync operation, same as this Ledger blocked all Firebase sync entirely
 * before this feature existed.
 *
 * Output order is sorted (createdAt, then id) rather than left as
 * insertion order — canonicalSyncJson() treats array order as
 * business-significant, so a merge that produced a different order on every
 * call would make the Ledger's sync fingerprint perpetually "dirty".
 */
export function mergeFinancialEventLedgers(
  local: { schemaVersion: number; events: readonly FinancialEvent[] },
  remote: { schemaVersion: number; events: readonly FinancialEvent[] }
): LedgerMergeOutcome {
  if (!isFinancialEventLedgerSchemaSupported(local.schemaVersion) || !isFinancialEventLedgerSchemaSupported(remote.schemaVersion) || local.schemaVersion !== remote.schemaVersion) {
    return {
      ok: false,
      reason: `Financial Event Ledger schema 版本不受支援或無法合併（本機 v${local.schemaVersion}／雲端 v${remote.schemaVersion}），為避免資料損毀，本次同步已中止。`
    };
  }
  const byId = new Map<string, FinancialEvent>();
  for (const event of local.events) byId.set(event.id, event);
  for (const event of remote.events) {
    const existing = byId.get(event.id);
    if (existing && stableJson(existing) !== stableJson(event)) return { ok: false, reason: `Financial Event Ledger event id「${event.id}」在兩端內容不同，為避免任取一方覆寫，本次同步已中止。` };
    if (!existing) byId.set(event.id, event);
  }
  const events = [...byId.values()].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return { ok: true, schemaVersion: local.schemaVersion, events };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
