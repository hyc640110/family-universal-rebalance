import assert from 'node:assert/strict';
import test from 'node:test';
import { CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS, deriveCreditCardDueSoonReminders, nextCreditCardPaymentDueDate } from '../src/lib/creditCardReminders';

test('same-month due date on or after today resolves within the current month', () => {
  assert.equal(nextCreditCardPaymentDueDate(20, '2026-08-14'), '2026-08-20');
  assert.equal(nextCreditCardPaymentDueDate(14, '2026-08-14'), '2026-08-14', 'due today counts as the current occurrence, not next month');
});

test('due date already passed this month rolls to next month', () => {
  assert.equal(nextCreditCardPaymentDueDate(3, '2026-08-14'), '2026-09-03');
});

test('month-end boundary: today is month-end, due day is early next month', () => {
  assert.equal(nextCreditCardPaymentDueDate(3, '2026-08-29'), '2026-09-03');
});

test('December -> January year rollover', () => {
  assert.equal(nextCreditCardPaymentDueDate(5, '2026-12-14'), '2027-01-05');
});

test('due day beyond a short month clamps to that month\'s last day, never rolls over', () => {
  assert.equal(nextCreditCardPaymentDueDate(31, '2026-04-14'), '2026-04-30', 'April has 30 days');
  assert.equal(nextCreditCardPaymentDueDate(31, '2026-02-14'), '2026-02-28', '2026 is not a leap year');
});

test('invalid paymentDueDay returns null instead of guessing', () => {
  assert.equal(nextCreditCardPaymentDueDate(0, '2026-08-14'), null);
  assert.equal(nextCreditCardPaymentDueDate(32, '2026-08-14'), null);
  assert.equal(nextCreditCardPaymentDueDate(15.5, '2026-08-14'), null);
});

test('invalid today returns null instead of guessing', () => {
  assert.equal(nextCreditCardPaymentDueDate(15, 'not-a-date'), null);
  assert.equal(nextCreditCardPaymentDueDate(15, '2026-13-01'), null);
});

test('threshold boundary: exactly 3 days out is included, 4 days out is excluded', () => {
  const items = [
    { id: 'card-3', name: '3 天卡', paymentDueDay: 17, amount: 1000 },
    { id: 'card-4', name: '4 天卡', paymentDueDay: 18, amount: 1000 }
  ];
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-08-14');
  assert.deepEqual(reminders.map(r => r.id), ['card-3']);
  assert.equal(reminders[0]?.daysUntil, 3);
});

test('due today (0 days) is included', () => {
  const reminders = deriveCreditCardDueSoonReminders([{ id: 'card-today', name: '今天到期', paymentDueDay: 14, amount: 500 }], '2026-08-14');
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0]?.daysUntil, 0);
  assert.equal(reminders[0]?.dueDate, '2026-08-14');
});

test('no cards due within the threshold returns an empty array', () => {
  const reminders = deriveCreditCardDueSoonReminders([{ id: 'card-far', name: '很久以後', paymentDueDay: 25, amount: 500 }], '2026-08-14');
  assert.deepEqual(reminders, []);
});

test('empty input returns an empty array', () => {
  assert.deepEqual(deriveCreditCardDueSoonReminders([], '2026-08-14'), []);
});

test('a custom thresholdDays overrides the default', () => {
  const items = [{ id: 'card-5', name: '5 天卡', paymentDueDay: 19, amount: 500 }];
  assert.deepEqual(deriveCreditCardDueSoonReminders(items, '2026-08-14'), [], 'excluded under the default 3-day threshold');
  const withWiderThreshold = deriveCreditCardDueSoonReminders(items, '2026-08-14', 5);
  assert.equal(withWiderThreshold.length, 1);
});

test('results are sorted by soonest due date first', () => {
  const items = [
    { id: 'card-later', name: '較晚', paymentDueDay: 17, amount: 100 },
    { id: 'card-sooner', name: '較早', paymentDueDay: 14, amount: 200 }
  ];
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-08-14');
  assert.deepEqual(reminders.map(r => r.id), ['card-sooner', 'card-later']);
});

test('a card with an invalid paymentDueDay is silently excluded, not guessed at', () => {
  const items = [
    { id: 'card-invalid', name: '無效', paymentDueDay: 0, amount: 100 },
    { id: 'card-valid', name: '有效', paymentDueDay: 14, amount: 100 }
  ];
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-08-14');
  assert.deepEqual(reminders.map(r => r.id), ['card-valid']);
});

test('CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS is fixed at 3 (not user-configurable this Sprint)', () => {
  assert.equal(CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS, 3);
});
