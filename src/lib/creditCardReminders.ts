import { isCanonicalCalendarDay } from './calendarDay';

// UR-TODO-060: minimal "monthly payment due-soon" reminder — date only (no amount, no
// transaction linkage, no attribution/taxonomy contract). A reminder is scoped to one billing
// cycle, identified by that cycle's own clamped due date string (mirrors Loan's
// confirmationGroupId concept: each cycle is independent and can be "reconfirmed" — here,
// re-acknowledged — without affecting any other cycle). This is purely a reminder-display
// state, never FinancialEvent/Ledger data.

export const CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS = 3;

export type CreditCardReminderInput = {
  id: string;
  name: string;
  paymentDueDay: number;
  acknowledgedCycleDueDate?: string;
};

export type CreditCardReminderStatus = 'due-soon' | 'overdue';

export type CreditCardDueSoonReminder = {
  id: string;
  name: string;
  dueDate: string;
  daysUntil: number;
  status: CreditCardReminderStatus;
};

function daysInMonth(year: number, month: number): number {
  // Day 0 of the following month is the last calendar day of `month`.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function isValidPaymentDueDay(paymentDueDay: number): boolean {
  return Number.isInteger(paymentDueDay) && paymentDueDay >= 1 && paymentDueDay <= 31;
}

/**
 * Resolves the next occurrence of a monthly payment-due day on or after `today`
 * (canonical Asia/Taipei YYYY-MM-DD). A due day beyond a given month's length
 * (e.g. 31 in a 30-day month) clamps to that month's last day, matching common
 * credit-card billing conventions, rather than rolling over into the next month.
 * Returns null for invalid input instead of guessing.
 */
export function nextCreditCardPaymentDueDate(paymentDueDay: number, today: string): string | null {
  if (!isCanonicalCalendarDay(today) || !isValidPaymentDueDay(paymentDueDay)) return null;
  const [year, month] = today.split('-').map(Number);
  const thisMonthCandidate = `${year}-${pad2(month)}-${pad2(Math.min(paymentDueDay, daysInMonth(year, month)))}`;
  if (thisMonthCandidate >= today) return thisMonthCandidate;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${pad2(nextMonth)}-${pad2(Math.min(paymentDueDay, daysInMonth(nextYear, nextMonth)))}`;
}

/**
 * Resolves the most recent occurrence of a monthly payment-due day strictly before
 * `today`, with the same clamping rule as nextCreditCardPaymentDueDate. Always
 * resolves to some date (every card has an unbounded past) unless input is invalid.
 */
export function previousCreditCardPaymentDueDate(paymentDueDay: number, today: string): string | null {
  if (!isCanonicalCalendarDay(today) || !isValidPaymentDueDay(paymentDueDay)) return null;
  const [year, month] = today.split('-').map(Number);
  const thisMonthCandidate = `${year}-${pad2(month)}-${pad2(Math.min(paymentDueDay, daysInMonth(year, month)))}`;
  if (thisMonthCandidate < today) return thisMonthCandidate;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${pad2(prevMonth)}-${pad2(Math.min(paymentDueDay, daysInMonth(prevYear, prevMonth)))}`;
}

function daysBetweenCanonicalDays(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

/**
 * Determines the single "active" billing cycle for a card as of `today`, then surfaces
 * it as a reminder unless the user has already acknowledged that exact cycle
 * (`acknowledgedCycleDueDate` matches its due date string byte-for-byte).
 *
 * Active-cycle rule (deliberate design decision — see UR-TODO-060 PR #335 report for the
 * rationale, since the Sprint instructions left "user ignores multiple consecutive cycles"
 * unspecified):
 *   1. If the next upcoming occurrence is within `thresholdDays`, IT is the active cycle
 *      (the ordinary "due soon" case, including due-today).
 *   2. Otherwise, the most recent PAST occurrence is the active cycle if unacknowledged —
 *      this is what makes an overdue reminder persist indefinitely instead of
 *      auto-clearing once the due date passes.
 *   3. Only ever one reminder per card at a time. If a card has been ignored for several
 *      consecutive months, this always resolves to the single most recent relevant
 *      occurrence (relative to `today`), not a backlog of every missed month — there is no
 *      concept of "owing for N cycles" in a pure reminder (no amount is tracked at all).
 *      As soon as the NEXT cycle's own due-soon window opens, the active cycle switches to
 *      it even if the previous one was never acknowledged.
 */
export function deriveCreditCardDueSoonReminders(
  items: readonly CreditCardReminderInput[],
  today: string,
  thresholdDays: number = CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS
): CreditCardDueSoonReminder[] {
  if (!isCanonicalCalendarDay(today)) return [];
  const reminders: CreditCardDueSoonReminder[] = [];
  for (const item of items) {
    if (!isValidPaymentDueDay(item.paymentDueDay)) continue;
    const upcoming = nextCreditCardPaymentDueDate(item.paymentDueDay, today);
    if (!upcoming) continue;
    const daysUntilUpcoming = daysBetweenCanonicalDays(today, upcoming);
    let activeDueDate: string;
    if (daysUntilUpcoming <= thresholdDays) {
      activeDueDate = upcoming;
    } else {
      const previous = previousCreditCardPaymentDueDate(item.paymentDueDay, today);
      if (!previous) continue;
      activeDueDate = previous;
    }
    if (item.acknowledgedCycleDueDate === activeDueDate) continue;
    const daysUntil = daysBetweenCanonicalDays(today, activeDueDate);
    reminders.push({ id: item.id, name: item.name || '信用卡', dueDate: activeDueDate, daysUntil, status: daysUntil < 0 ? 'overdue' : 'due-soon' });
  }
  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
}
