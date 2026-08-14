import { isCanonicalCalendarDay } from './calendarDay';

// UR-TODO-060: minimal "monthly payment due-soon" reminder — date + manually entered amount
// only (B1 scope). No transaction-derived amount, no blocking-reason/Ambiguous-Debt-Gate
// contract: a manually entered amount is either present or it isn't, there is no ambiguous
// intermediate state to guard against here.

export const CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS = 3;

export type CreditCardReminderInput = {
  id: string;
  name: string;
  paymentDueDay: number;
  amount: number;
};

export type CreditCardDueSoonReminder = {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  daysUntil: number;
};

function daysInMonth(year: number, month: number): number {
  // Day 0 of the following month is the last calendar day of `month`.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Resolves the next occurrence of a monthly payment-due day on or after `today`
 * (canonical Asia/Taipei YYYY-MM-DD). A due day beyond a given month's length
 * (e.g. 31 in a 30-day month) clamps to that month's last day, matching common
 * credit-card billing conventions, rather than rolling over into the next month.
 * Returns null for invalid input instead of guessing.
 */
export function nextCreditCardPaymentDueDate(paymentDueDay: number, today: string): string | null {
  if (!isCanonicalCalendarDay(today)) return null;
  if (!Number.isInteger(paymentDueDay) || paymentDueDay < 1 || paymentDueDay > 31) return null;
  const [year, month] = today.split('-').map(Number);
  const thisMonthCandidate = `${year}-${pad2(month)}-${pad2(Math.min(paymentDueDay, daysInMonth(year, month)))}`;
  if (thisMonthCandidate >= today) return thisMonthCandidate;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${pad2(nextMonth)}-${pad2(Math.min(paymentDueDay, daysInMonth(nextYear, nextMonth)))}`;
}

function daysBetweenCanonicalDays(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

/**
 * Only surfaces cards whose next payment due date falls within `thresholdDays`
 * (inclusive, counting today as 0) of `today`. Cards with an invalid
 * `paymentDueDay` are silently excluded rather than guessed at.
 */
export function deriveCreditCardDueSoonReminders(
  items: readonly CreditCardReminderInput[],
  today: string,
  thresholdDays: number = CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS
): CreditCardDueSoonReminder[] {
  if (!isCanonicalCalendarDay(today)) return [];
  const reminders: CreditCardDueSoonReminder[] = [];
  for (const item of items) {
    const dueDate = nextCreditCardPaymentDueDate(item.paymentDueDay, today);
    if (!dueDate) continue;
    const daysUntil = daysBetweenCanonicalDays(today, dueDate);
    if (daysUntil >= 0 && daysUntil <= thresholdDays) {
      reminders.push({ id: item.id, name: item.name || '信用卡', amount: Math.max(0, item.amount), dueDate, daysUntil });
    }
  }
  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
}
