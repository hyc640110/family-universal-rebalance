import { canonicalCalendarDay } from './calendarDay';
import { appendFinancialEvent, createFinancialEventId, type FinancialEvent } from './financialEvents';

export type VoidFinancialEventInput = {
  eventId: string;
  /** Caller-supplied ISO UTC timestamp so this stays a pure, testable function. */
  now: string;
};

export type BuildVoidEventResult =
  | { rejected: false; event: FinancialEvent }
  | { rejected: true; reason: string };

export type VoidFinancialEventResult =
  | { rejected: false; events: FinancialEvent[]; event: FinancialEvent }
  | { rejected: true; reason: string };

const VOID_EVENT_NOTE_PREFIX = 'UR-TODO-046：使用者於「本次已正式記帳」清單按下「撤銷」';

/**
 * Voids a Ledger event by appending a new marker event (source: 'void',
 * voidedEventId pointing at the target) rather than mutating the original —
 * forward-only, same as every other Ledger write. type: 'adjustment' is
 * reused so the marker itself is inert to netWorthAttribution.ts's existing
 * zero-effect classification even before runtimeAttributionComposition.ts's
 * own voided-id filtering runs. One-way: there is no restore/un-void path in
 * this Sprint (see UR-TODO-046 void triage's Remaining Boundaries).
 */
export function buildVoidEvent(existingEvents: readonly FinancialEvent[], input: VoidFinancialEventInput): BuildVoidEventResult {
  const { eventId, now } = input;
  const target = existingEvents.find(event => event.id === eventId);
  if (!target) return { rejected: true, reason: '找不到要撤銷的記帳事件，可能已被撤銷或資料已變更，請重新整理後再試一次。' };
  if (existingEvents.some(event => event.source === 'void' && event.voidedEventId === eventId)) {
    return { rejected: true, reason: '這筆記帳事件已經撤銷過，無法重複撤銷。' };
  }
  if (!target.accountId) return { rejected: true, reason: '找不到原始事件的帳戶資訊，無法撤銷。' };

  let effectiveDate: string;
  try { effectiveDate = canonicalCalendarDay(now); } catch { return { rejected: true, reason: '目前日期無效，無法撤銷。' }; }

  return {
    rejected: false,
    event: {
      id: createFinancialEventId(),
      type: 'adjustment',
      status: 'posted',
      source: 'void',
      voidedEventId: eventId,
      effectiveDate,
      amount: target.amount,
      currency: target.currency,
      accountId: target.accountId,
      note: `${VOID_EVENT_NOTE_PREFIX}（${now}）`,
      createdAt: now,
      updatedAt: now
    }
  };
}

/**
 * Convenience wrapper composing buildVoidEvent() with the forward-only
 * appendFinancialEvent() write guard, so callers (App.tsx) have one entry
 * point that either yields the next state.financialEvents array or a single
 * explicit rejection reason.
 */
export function voidFinancialEventAndAppend(existingEvents: readonly FinancialEvent[], input: VoidFinancialEventInput): VoidFinancialEventResult {
  const built = buildVoidEvent(existingEvents, input);
  if (built.rejected) return built;
  const appended = appendFinancialEvent(existingEvents, built.event);
  if (appended.rejected) return appended;
  return { rejected: false, events: appended.events, event: built.event };
}
