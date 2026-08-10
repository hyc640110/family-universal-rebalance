import { canonicalCalendarDay } from './calendarDay';
import type { FinancialTransaction } from './transactions';

/**
 * Financial Event schema v3's domain-neutral, atomic allocation component.
 * `domain` identifies the future owning contract; L2B deliberately registers no
 * production domain here. `loan-payment` remains v2's separate Loan contract.
 */
export type GenericSplitAllocationLink = {
  domain: string;
  allocationGroupId: string;
  componentId: string;
  replacementOfGroupId?: string;
};

type SplitAllocationEvent = {
  id: string;
  type: string;
  status: string;
  source: string;
  effectiveDate: string;
  amount: number;
  currency: string;
  accountId?: string;
  transactionId?: string;
  splitAllocationLink?: GenericSplitAllocationLink;
};

export type GenericSplitAllocationResolution = {
  validEventIds: ReadonlySet<string>;
  validGroupIds: ReadonlySet<string>;
  matchedTransactionIds: ReadonlySet<string>;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function normalizeGenericSplitAllocationLink(value: unknown): GenericSplitAllocationLink | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const domain = text(record.domain);
  const allocationGroupId = text(record.allocationGroupId);
  const componentId = text(record.componentId);
  const replacementOfGroupId = record.replacementOfGroupId === undefined ? undefined : text(record.replacementOfGroupId);
  if (!domain || domain === 'loan-payment' || !allocationGroupId || !componentId || (record.replacementOfGroupId !== undefined && !replacementOfGroupId)) return undefined;
  return { domain, allocationGroupId, componentId, ...(replacementOfGroupId ? { replacementOfGroupId } : {}) };
}

function transactionDay(transaction: FinancialTransaction): string | undefined {
  try {
    return canonicalCalendarDay(transaction.occurredAt);
  } catch {
    return undefined;
  }
}

/**
 * Validates generic split evidence as an all-or-nothing economic event. Invalid
 * records remain in the immutable Ledger but never become attribution evidence,
 * reconciliation consumption, or derived-evidence suppression.
 */
export function resolveActiveGenericSplitAllocationGroups(
  events: readonly SplitAllocationEvent[],
  context: { transactionsById: ReadonlyMap<string, FinancialTransaction> }
): GenericSplitAllocationResolution {
  const voidedEventIds = new Set<string>();
  for (const event of events) {
    const record = event as unknown as Record<string, unknown>;
    if (record.source === 'void' && typeof record.voidedEventId === 'string' && record.voidedEventId.trim()) voidedEventIds.add(record.voidedEventId.trim());
  }
  const groups = new Map<string, SplitAllocationEvent[]>();
  for (const event of events) {
    const link = event.splitAllocationLink;
    if (!link || event.source === 'void') continue;
    const group = groups.get(link.allocationGroupId) || [];
    group.push(event);
    groups.set(link.allocationGroupId, group);
  }
  const voidedGroupIds = new Set<string>();
  for (const [groupId, group] of groups) if (group.some(event => voidedEventIds.has(event.id))) voidedGroupIds.add(groupId);

  const preliminary = new Map<string, SplitAllocationEvent[]>();
  for (const [groupId, group] of groups) {
    const first = group[0];
    const link = first?.splitAllocationLink;
    if (!first || !link || voidedGroupIds.has(groupId)) continue;
    if (first.source !== 'attribution-confirmation' || first.status !== 'posted' || !first.transactionId || !first.accountId) continue;
    const transaction = context.transactionsById.get(first.transactionId);
    if (!transaction || transaction.status !== 'posted' || transaction.excluded || transaction.accountId !== first.accountId || transaction.currency !== first.currency || transactionDay(transaction) !== first.effectiveDate) continue;
    if (group.some(event => {
      const item = event.splitAllocationLink;
      return event.source !== 'attribution-confirmation'
        || event.status !== 'posted'
        || !item
        || item.domain !== link.domain
        || event.transactionId !== first.transactionId
        || event.accountId !== first.accountId
        || event.currency !== first.currency
        || event.effectiveDate !== first.effectiveDate
        || item.replacementOfGroupId !== link.replacementOfGroupId
        || !Number.isFinite(event.amount)
        || event.amount <= 0;
    })) continue;
    if (new Set(group.map(event => event.splitAllocationLink?.componentId)).size !== group.length) continue;
    if (group.reduce((sum, event) => sum + event.amount, 0) !== transaction.amount) continue;
    if (link.replacementOfGroupId && (!groups.has(link.replacementOfGroupId) || !voidedGroupIds.has(link.replacementOfGroupId))) continue;
    preliminary.set(groupId, group);
  }

  const transactionCounts = new Map<string, number>();
  for (const group of preliminary.values()) {
    const transactionId = group[0]?.transactionId;
    if (transactionId) transactionCounts.set(transactionId, (transactionCounts.get(transactionId) || 0) + 1);
  }
  const validEventIds = new Set<string>();
  const validGroupIds = new Set<string>();
  const matchedTransactionIds = new Set<string>();
  for (const [groupId, group] of preliminary) {
    const transactionId = group[0]?.transactionId;
    if (!transactionId || transactionCounts.get(transactionId) !== 1) continue;
    validGroupIds.add(groupId);
    matchedTransactionIds.add(transactionId);
    for (const event of group) validEventIds.add(event.id);
  }
  return { validEventIds, validGroupIds, matchedTransactionIds };
}
