import assert from 'node:assert/strict';
import test from 'node:test';
import { CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS, deriveCreditCardAccountOptions, deriveCreditCardDueSoonReminders, nextCreditCardPaymentDueDate, previousCreditCardPaymentDueDate, resolveCreditCardDisplayName } from '../src/lib/creditCardReminders';

// --- resolveCreditCardDisplayName (UR-TODO-060 scheme B: linkedAccountId is primary) ---

test('a card linked to an existing account resolves to that account\'s name — the account name IS the display name, name field is irrelevant', () => {
  const accounts = [{ id: 'acc-1', name: '國泰銀行信用卡' }, { id: 'acc-2', name: '其他帳戶' }];
  assert.equal(resolveCreditCardDisplayName({ name: '', linkedAccountId: 'acc-1' }, accounts), '國泰銀行信用卡');
  // Even if a stale manual name happens to exist, the linked account name always wins.
  assert.equal(resolveCreditCardDisplayName({ name: '舊的手動名稱', linkedAccountId: 'acc-1' }, accounts), '國泰銀行信用卡');
});

test('a card with no linked account resolves to the manually typed name', () => {
  assert.equal(resolveCreditCardDisplayName({ name: '我的信用卡' }, []), '我的信用卡');
  assert.equal(resolveCreditCardDisplayName({ name: '我的信用卡', linkedAccountId: undefined }, []), '我的信用卡');
});

test('no linked account and no manual name falls back to an explicit "unnamed" label, never blank/undefined', () => {
  assert.equal(resolveCreditCardDisplayName({ name: '' }, []), '未命名信用卡提醒');
});

test('a linkedAccountId that no longer resolves (the account was deleted) falls back to an explicit "deleted account" label, never the stale manual name and never a crash', () => {
  const accounts = [{ id: 'acc-1', name: '國泰銀行信用卡' }];
  assert.equal(resolveCreditCardDisplayName({ name: '', linkedAccountId: 'acc-missing' }, accounts), '已刪除的帳戶');
  assert.equal(resolveCreditCardDisplayName({ name: '舊名稱還在', linkedAccountId: 'acc-missing' }, accounts), '已刪除的帳戶', 'never silently falls back to the manual name once an account was linked');
});

test('an empty accounts list never crashes resolution, even for a linked card', () => {
  assert.equal(resolveCreditCardDisplayName({ name: '', linkedAccountId: 'acc-1' }, []), '已刪除的帳戶');
});

// --- deriveCreditCardAccountOptions (UR-TODO-060 scheme B follow-up: honest <select> options) ---

test('no linked account: only 不指定 plus the linkable account list, no synthetic option', () => {
  const accounts = [{ id: 'acc-1', name: '國泰銀行信用卡', type: 'creditCard' }, { id: 'acc-2', name: '其他信用卡帳戶', type: 'creditCard' }];
  const options = deriveCreditCardAccountOptions({}, accounts);
  assert.deepEqual(options, [
    { value: '', label: '不指定' },
    { value: 'acc-1', label: '國泰銀行信用卡' },
    { value: 'acc-2', label: '其他信用卡帳戶' }
  ]);
});

test('linked to an account that still exists: no synthetic option needed, the real account already covers it', () => {
  const accounts = [{ id: 'acc-1', name: '國泰銀行信用卡', type: 'creditCard' }];
  const options = deriveCreditCardAccountOptions({ linkedAccountId: 'acc-1' }, accounts);
  assert.deepEqual(options, [
    { value: '', label: '不指定' },
    { value: 'acc-1', label: '國泰銀行信用卡' }
  ]);
});

test('linked to an account that no longer exists: a synthetic "deleted account" option is inserted with the original id as its value, so the <select> can still show it as selected', () => {
  const accounts = [{ id: 'acc-1', name: '國泰銀行信用卡', type: 'creditCard' }];
  const options = deriveCreditCardAccountOptions({ linkedAccountId: 'acc-missing' }, accounts);
  assert.deepEqual(options, [
    { value: '', label: '不指定' },
    { value: 'acc-missing', label: '已刪除的帳戶（原連結）' },
    { value: 'acc-1', label: '國泰銀行信用卡' }
  ]);
});

test('linked to a deleted account with an empty accounts list: synthetic option still appears, never crashes', () => {
  const options = deriveCreditCardAccountOptions({ linkedAccountId: 'acc-missing' }, []);
  assert.deepEqual(options, [
    { value: '', label: '不指定' },
    { value: 'acc-missing', label: '已刪除的帳戶（原連結）' }
  ]);
});

test('a bank-type account appears in the picker alongside creditCard-type accounts (consolidated statement paid from a bank account)', () => {
  const accounts = [{ id: 'acc-bank', name: '國泰銀行活存', type: 'bank' }, { id: 'acc-cc', name: '國泰銀行信用卡', type: 'creditCard' }];
  const options = deriveCreditCardAccountOptions({}, accounts);
  assert.deepEqual(options, [
    { value: '', label: '不指定' },
    { value: 'acc-bank', label: '國泰銀行活存' },
    { value: 'acc-cc', label: '國泰銀行信用卡' }
  ]);
});

test('cash / securities / loan / mortgage / eWallet / other account types never appear in the picker', () => {
  const accounts = [
    { id: 'acc-cash', name: '現金', type: 'cash' },
    { id: 'acc-sec', name: '證券戶', type: 'securities' },
    { id: 'acc-loan', name: '信貸', type: 'loan' },
    { id: 'acc-mortgage', name: '房貸', type: 'mortgage' },
    { id: 'acc-ewallet', name: '電子錢包', type: 'eWallet' },
    { id: 'acc-other', name: '其他', type: 'other' }
  ];
  const options = deriveCreditCardAccountOptions({}, accounts);
  assert.deepEqual(options, [{ value: '', label: '不指定' }]);
});

test('linking to a bank-type account resolves as a normal link, not a "deleted account" fallback', () => {
  const accounts = [{ id: 'acc-bank', name: '國泰銀行活存', type: 'bank' }];
  const options = deriveCreditCardAccountOptions({ linkedAccountId: 'acc-bank' }, accounts);
  assert.deepEqual(options, [
    { value: '', label: '不指定' },
    { value: 'acc-bank', label: '國泰銀行活存' }
  ]);
});

test('a linkedAccountId pointing at a non-linkable-type account (e.g. its type changed to cash) is treated the same as deleted, via the synthetic fallback option', () => {
  const accounts = [{ id: 'acc-1', name: '已改為現金帳戶', type: 'cash' }];
  const options = deriveCreditCardAccountOptions({ linkedAccountId: 'acc-1' }, accounts);
  assert.deepEqual(options, [
    { value: '', label: '不指定' },
    { value: 'acc-1', label: '已刪除的帳戶（原連結）' }
  ]);
});

// --- nextCreditCardPaymentDueDate ---

test('same-month due date on or after today resolves within the current month', () => {
  assert.equal(nextCreditCardPaymentDueDate(20, '2026-08-14'), '2026-08-20');
  assert.equal(nextCreditCardPaymentDueDate(14, '2026-08-14'), '2026-08-14', 'due today counts as the current occurrence, not next month');
});

test('due date already passed this month rolls to next month', () => {
  assert.equal(nextCreditCardPaymentDueDate(3, '2026-08-14'), '2026-09-03');
});

test('(a) due day beyond a short month clamps to that month\'s last day, never rolls over', () => {
  assert.equal(nextCreditCardPaymentDueDate(31, '2026-04-14'), '2026-04-30', 'April has 30 days');
  assert.equal(nextCreditCardPaymentDueDate(31, '2026-02-14'), '2026-02-28', '2026 is not a leap year');
  assert.equal(nextCreditCardPaymentDueDate(30, '2026-02-14'), '2026-02-28');
  assert.equal(nextCreditCardPaymentDueDate(29, '2026-02-14'), '2026-02-28');
});

test('(d) December -> January year rollover', () => {
  assert.equal(nextCreditCardPaymentDueDate(5, '2026-12-14'), '2027-01-05');
});

test('invalid paymentDueDay or today returns null instead of guessing', () => {
  assert.equal(nextCreditCardPaymentDueDate(0, '2026-08-14'), null);
  assert.equal(nextCreditCardPaymentDueDate(32, '2026-08-14'), null);
  assert.equal(nextCreditCardPaymentDueDate(15, 'not-a-date'), null);
});

// --- previousCreditCardPaymentDueDate ---

test('previous occurrence strictly before today resolves within the current month when it already passed', () => {
  assert.equal(previousCreditCardPaymentDueDate(3, '2026-08-14'), '2026-08-03');
});

test('previous occurrence rolls back to last month when this month\'s day has not happened yet', () => {
  assert.equal(previousCreditCardPaymentDueDate(20, '2026-08-14'), '2026-07-20');
});

test('(a) previous occurrence clamps to a short month\'s last day', () => {
  assert.equal(previousCreditCardPaymentDueDate(31, '2026-03-14'), '2026-02-28', 'rolling back from March to a non-leap February');
});

test('(d) previous occurrence rolls back across a year boundary (January -> December)', () => {
  assert.equal(previousCreditCardPaymentDueDate(20, '2026-01-05'), '2025-12-20');
});

test('CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS is fixed at 3 (not user-configurable this Sprint)', () => {
  assert.equal(CREDIT_CARD_DUE_SOON_THRESHOLD_DAYS, 3);
});

// --- deriveCreditCardDueSoonReminders: basic due-soon behavior ---

test('threshold boundary: exactly 3 days out is included, 4 days out (with the prior cycle already acknowledged) is excluded', () => {
  const items = [
    { id: 'card-3', name: '3 天卡', paymentDueDay: 17, acknowledgedCycleDueDate: '2026-07-17' },
    { id: 'card-4', name: '4 天卡', paymentDueDay: 18, acknowledgedCycleDueDate: '2026-07-18' }
  ];
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-08-14');
  assert.deepEqual(reminders.map(r => r.id), ['card-3']);
  assert.equal(reminders[0]?.daysUntil, 3);
  assert.equal(reminders[0]?.status, 'due-soon');
});

test('due today (0 days) is included and status is due-soon, not overdue', () => {
  const reminders = deriveCreditCardDueSoonReminders([{ id: 'card-today', name: '今天到期', paymentDueDay: 14 }], '2026-08-14');
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0]?.daysUntil, 0);
  assert.equal(reminders[0]?.dueDate, '2026-08-14');
  assert.equal(reminders[0]?.status, 'due-soon');
});

test('no cards due within the threshold and no unacknowledged overdue cycle returns an empty array', () => {
  const reminders = deriveCreditCardDueSoonReminders([{ id: 'card-far', name: '很久以後', paymentDueDay: 25, acknowledgedCycleDueDate: '2026-07-25' }], '2026-08-14');
  assert.deepEqual(reminders, []);
});

test('empty input returns an empty array', () => {
  assert.deepEqual(deriveCreditCardDueSoonReminders([], '2026-08-14'), []);
});

test('a custom thresholdDays overrides the default', () => {
  const items = [{ id: 'card-5', name: '5 天卡', paymentDueDay: 19, acknowledgedCycleDueDate: '2026-07-19' }];
  assert.deepEqual(deriveCreditCardDueSoonReminders(items, '2026-08-14'), [], 'excluded under the default 3-day threshold');
  const withWiderThreshold = deriveCreditCardDueSoonReminders(items, '2026-08-14', 5);
  assert.equal(withWiderThreshold.length, 1);
});

// --- pure-function contract: a card with NO acknowledgment history at all is never silent
// (see App.tsx's CreditCardList, which seeds acknowledgedCycleDueDate at card-creation time
// specifically to avoid this surfacing as a false "overdue" the moment a new card is added) ---

test('a bare item with no acknowledgedCycleDueDate and no due-soon window open is treated as overdue for the most recent past cycle — this is why the App layer seeds acknowledgment on creation', () => {
  const reminders = deriveCreditCardDueSoonReminders([{ id: 'card-fresh', name: '剛新增的卡', paymentDueDay: 25 }], '2026-08-14');
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0]?.status, 'overdue');
  assert.equal(reminders[0]?.dueDate, '2026-07-25');
});

test('results are sorted soonest/most-overdue first', () => {
  const items = [
    { id: 'card-later', name: '較晚', paymentDueDay: 17 },
    { id: 'card-sooner', name: '較早', paymentDueDay: 14 }
  ];
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-08-14');
  assert.deepEqual(reminders.map(r => r.id), ['card-sooner', 'card-later']);
});

test('a card with an invalid paymentDueDay is silently excluded, not guessed at', () => {
  const items = [
    { id: 'card-invalid', name: '無效', paymentDueDay: 0 },
    { id: 'card-valid', name: '有效', paymentDueDay: 14 }
  ];
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-08-14');
  assert.deepEqual(reminders.map(r => r.id), ['card-valid']);
});

// --- overdue persistence (does not auto-clear once the due date passes) ---

test('an unacknowledged card past its due date is still shown, marked overdue', () => {
  // paymentDueDay=10, today=2026-08-14 -> most recent occurrence is 2026-08-10, 4 days ago,
  // and the next occurrence (2026-09-10) is far outside the 3-day window.
  const reminders = deriveCreditCardDueSoonReminders([{ id: 'card-overdue', name: '逾期卡', paymentDueDay: 10 }], '2026-08-14');
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0]?.status, 'overdue');
  assert.equal(reminders[0]?.dueDate, '2026-08-10');
  assert.equal(reminders[0]?.daysUntil, -4);
});

test('overdue persists arbitrarily far past the due date as long as unacknowledged and the next cycle window has not opened', () => {
  const reminders = deriveCreditCardDueSoonReminders([{ id: 'card-overdue', name: '逾期卡', paymentDueDay: 10 }], '2026-08-25');
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0]?.status, 'overdue');
  assert.equal(reminders[0]?.dueDate, '2026-08-10');
});

// --- acknowledgment ---

test('acknowledging the exact active cycle clears the reminder immediately', () => {
  const items = [{ id: 'card-1', name: '卡片', paymentDueDay: 17, acknowledgedCycleDueDate: '2026-08-17' }];
  assert.deepEqual(deriveCreditCardDueSoonReminders(items, '2026-08-14'), []);
});

test('(b) acknowledging inside the due-soon window stays cleared on later days within the same window', () => {
  const items = [{ id: 'card-1', name: '卡片', paymentDueDay: 17, acknowledgedCycleDueDate: '2026-08-17' }];
  assert.deepEqual(deriveCreditCardDueSoonReminders(items, '2026-08-15'), [], 'day after acknowledging, still within the window');
  assert.deepEqual(deriveCreditCardDueSoonReminders(items, '2026-08-16'), [], 'still within the window, one day before due');
  assert.deepEqual(deriveCreditCardDueSoonReminders(items, '2026-08-17'), [], 'due date itself');
});

test('acknowledging an overdue cycle clears it', () => {
  const items = [{ id: 'card-1', name: '卡片', paymentDueDay: 10, acknowledgedCycleDueDate: '2026-08-10' }];
  assert.deepEqual(deriveCreditCardDueSoonReminders(items, '2026-08-20'), []);
});

test('acknowledging a stale/wrong cycle date does not clear the current cycle', () => {
  const items = [{ id: 'card-1', name: '卡片', paymentDueDay: 17, acknowledgedCycleDueDate: '2026-07-17' }];
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-08-14');
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0]?.dueDate, '2026-08-17');
});

// --- cross-month cycle reset: acknowledging one cycle never suppresses the next month's ---

test('acknowledging this month\'s cycle does not suppress next month\'s cycle once its own window opens', () => {
  const items = [{ id: 'card-1', name: '卡片', paymentDueDay: 17, acknowledgedCycleDueDate: '2026-08-17' }];
  // Confirmed cleared during August's window.
  assert.deepEqual(deriveCreditCardDueSoonReminders(items, '2026-08-16'), []);
  // September's own due-soon window (Sep 17, threshold 3) reopens regardless of August's ack.
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-09-15');
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0]?.dueDate, '2026-09-17');
  assert.equal(reminders[0]?.status, 'due-soon');
});

// --- (c) skipping multiple consecutive unacknowledged cycles ---

test('(c) never acknowledging for two full months still shows exactly one reminder, resolved relative to today (most recent relevant cycle), not a backlog of every missed month', () => {
  const items = [{ id: 'card-1', name: '卡片', paymentDueDay: 10 }];
  // today is two months after the original 2026-06-10 due date; the design resolves this to
  // the most recent occurrence relative to today (2026-08-10), not the oldest unpaid one.
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-08-14');
  assert.equal(reminders.length, 1, 'exactly one reminder per card, never a pile of missed cycles');
  assert.equal(reminders[0]?.dueDate, '2026-08-10');
  assert.equal(reminders[0]?.status, 'overdue');
});

test('(c) once the next cycle\'s own due-soon window opens, the active cycle switches to it even if the previous one was never acknowledged', () => {
  const items = [{ id: 'card-1', name: '卡片', paymentDueDay: 10 }];
  // 2026-09-07 is within 3 days of 2026-09-10 -> the September cycle takes over, the
  // unacknowledged August cycle is no longer separately tracked.
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-09-07');
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0]?.dueDate, '2026-09-10');
  assert.equal(reminders[0]?.status, 'due-soon');
});

// --- month/year boundary combined with reminders ---

test('(a)+(d) February 29/30/31 paymentDueDay combined with a due-soon window near year-end still resolves correctly', () => {
  const items = [{ id: 'card-1', name: '卡片', paymentDueDay: 31 }];
  // today is 2026-01-29 (2026 not a leap year): next Jan 31 is 2 days away.
  const reminders = deriveCreditCardDueSoonReminders(items, '2026-01-29');
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0]?.dueDate, '2026-01-31');
  assert.equal(reminders[0]?.daysUntil, 2);
});
