import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CreditCardDueSoonCard from '../src/components/CreditCardDueSoonCard';
import type { CreditCardDueSoonReminder } from '../src/lib/creditCardReminders';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const reminder: CreditCardDueSoonReminder = { id: 'card-1', name: '國泰 CUBE 卡', dueDate: '2026-08-17', amount: 12345, daysUntil: 3 };

test('renders nothing (empty string) when there are no due-soon reminders', () => {
  const html = renderToStaticMarkup(createElement(CreditCardDueSoonCard, { reminders: [] }));
  assert.equal(html, '', 'must not render any placeholder/empty-state chrome');
});

test('renders card name, due date, and amount when a reminder exists', () => {
  const html = renderToStaticMarkup(createElement(CreditCardDueSoonCard, { reminders: [reminder] }));
  assert.match(html, /國泰 CUBE 卡/);
  assert.match(html, /2026-08-17/);
  assert.match(html, /12,345 元/);
  assert.match(html, /信用卡繳費提醒/);
});

test('renders one list item per reminder, in the order provided', () => {
  const second: CreditCardDueSoonReminder = { id: 'card-2', name: '第二張卡', dueDate: '2026-08-15', amount: 500, daysUntil: 1 };
  const html = renderToStaticMarkup(createElement(CreditCardDueSoonCard, { reminders: [reminder, second] }));
  const firstIndex = html.indexOf('國泰 CUBE 卡');
  const secondIndex = html.indexOf('第二張卡');
  assert.ok(firstIndex >= 0 && secondIndex >= 0 && firstIndex < secondIndex);
  assert.equal((html.match(/<li/g) || []).length, 2);
});
