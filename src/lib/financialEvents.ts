import { canonicalCalendarDay, isCanonicalCalendarDay } from './calendarDay';
import type { FinancialTransaction } from './transactions';

/**
 * UR-TODO-046-C3C-C decision: adding the 'attribution-confirmation' source
 * value deliberately does NOT bump this constant. Every existing user's
 * persisted state already carries financialEventSchemaVersion: 1 with an
 * empty financialEvents array. Bumping this constant would make
 * normalizeFinancialEventLedger() treat that (still-empty) v1 payload as
 * opaque future data on next read — and critically, App.tsx's
 * hasLocalFinancialEventLedger() / stateFromFirebasePayload() would then
 * treat every existing user as "has a local Ledger", permanently blocking
 * Firebase download for accounts that have never written a single event.
 * A new enum value on an already-versioned field is additive per 013 §29.2
 * ("採加法式欄位"); it does not change the FinancialEvent object shape, so it
 * does not warrant a version bump. Bump this only for a structural change
 * (field added/removed/retyped).
 */
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
const EVENT_SOURCES = new Set<FinancialEventSource>(['manual', 'linked-transaction', 'attribution-confirmation', 'void']);
/** Both sources are inherently tied to one transactionId and share the same linkedTransactionReason() taxonomy check. */
const TRANSACTION_LINKED_SOURCES = new Set<FinancialEventSource>(['linked-transaction', 'attribution-confirmation']);
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
  for (const key of ['occurredAt', 'counterpartyAccountId', 'assetSymbol', 'loanId', 'transactionId', 'voidedEventId']) {
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
      ? undefined
      : 'investment-fee 必須連結完整且明確標示 fee 或 tax 的正式投資成本契約';
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
  voidedEventIds: ReadonlySet<string>,
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
  if (TRANSACTION_LINKED_SOURCES.has(source as FinancialEventSource)) {
    if (!transactionId || !context.transactionIds.has(transactionId)) return skip(skipped, index, `${source} 必須連結既有 transactionId`);
    const transaction = context.transactionsById.get(transactionId);
    if (!transaction) return skip(skipped, index, `${source} 缺少可驗證的 transaction 資料`);
    const reason = linkedTransactionReason(type as FinancialEventType, status as FinancialEventStatus, amount, currency, accountId, counterpartyAccountId, effectiveDate, transaction);
    if (reason) return skip(skipped, index, reason);
    // UR-TODO-046 void: a voided event's own status is never mutated (forward-only), so a voided
    // linked event must stop consuming its transactionId here too — otherwise the transactionId
    // stays permanently claimed and a future re-confirmation of the same transaction would be
    // silently dropped as a "duplicate" on the very next normalize pass.
    const isVoided = voidedEventIds.has(id);
    if (status !== 'void' && !isVoided && consumedTransactionIds.has(transactionId)) return skip(skipped, index, `transactionId「${transactionId}」已被另一個有效 linked event 消費`);
    if (status !== 'void' && !isVoided) consumedTransactionIds.add(transactionId);
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
  const rawEventRecords = Array.isArray(record.financialEvents)
    ? record.financialEvents.map(event => asRecord(event)).filter((event): event is Record<string, unknown> => Boolean(event))
    : [];
  const voidedEventIds = collectVoidedEventIds(rawEventRecords);
  const events = Array.isArray(record.financialEvents)
    ? record.financialEvents.map((event, index) => normalizeEvent(event, index, context, knownIds, consumedTransactionIds, voidedEventIds, skipped)).filter((event): event is FinancialEvent => Boolean(event))
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
  if (existingEvents.some(existing => existing.id === event.id)) {
    return { rejected: true, reason: `事件 id「${event.id}」已存在，Ledger 為 forward-only，不允許覆寫既有事件。` };
  }
  return { rejected: false, events: [...existingEvents, event] };
}

export type LedgerMergeOutcome =
  | { ok: true; events: FinancialEvent[] }
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
  if (local.schemaVersion !== FINANCIAL_EVENT_SCHEMA_VERSION || remote.schemaVersion !== FINANCIAL_EVENT_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: `Financial Event Ledger schema 版本不受支援（本機 v${local.schemaVersion}／雲端 v${remote.schemaVersion}，目前支援 v${FINANCIAL_EVENT_SCHEMA_VERSION}），為避免資料損毀，本次同步已中止。請先將兩端 App 更新到同一個版本。`
    };
  }
  const byId = new Map<string, FinancialEvent>();
  for (const event of local.events) byId.set(event.id, event);
  for (const event of remote.events) if (!byId.has(event.id)) byId.set(event.id, event);
  const events = [...byId.values()].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return { ok: true, events };
}
