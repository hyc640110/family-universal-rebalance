import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CreditCardDueSoonCard from '../src/components/CreditCardDueSoonCard';
import type { CreditCardDueSoonReminder } from '../src/lib/creditCardReminders';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const dueSoonReminder: CreditCardDueSoonReminder = { id: 'card-1', name: '國泰 CUBE 卡', dueDate: '2026-08-17', daysUntil: 3, status: 'due-soon' };
const overdueReminder: CreditCardDueSoonReminder = { id: 'card-2', name: '逾期卡', dueDate: '2026-08-10', daysUntil: -4, status: 'overdue' };

test('renders nothing (empty string) when there are no due-soon reminders', () => {
  const html = renderToStaticMarkup(createElement(CreditCardDueSoonCard, { reminders: [], onAcknowledge: () => {} }));
  assert.equal(html, '', 'must not render any placeholder/empty-state chrome');
});

test('renders card name, due date, and a 完成 button when a due-soon reminder exists', () => {
  const html = renderToStaticMarkup(createElement(CreditCardDueSoonCard, { reminders: [dueSoonReminder], onAcknowledge: () => {} }));
  assert.match(html, /國泰 CUBE 卡/);
  assert.match(html, /2026-08-17/);
  assert.match(html, /信用卡繳費提醒/);
  assert.match(html, /完成/);
  assert.doesNotMatch(html, /已逾期/);
});

test('an overdue reminder is visually distinguished from a due-soon one', () => {
  const html = renderToStaticMarkup(createElement(CreditCardDueSoonCard, { reminders: [overdueReminder], onAcknowledge: () => {} }));
  assert.match(html, /已逾期/);
  assert.match(html, /dashboard-credit-card-due-item-overdue/);
});

test('a due-soon reminder never carries the overdue class or copy', () => {
  const html = renderToStaticMarkup(createElement(CreditCardDueSoonCard, { reminders: [dueSoonReminder], onAcknowledge: () => {} }));
  assert.doesNotMatch(html, /dashboard-credit-card-due-item-overdue/);
});

test('renders one list item per reminder, in the order provided', () => {
  const html = renderToStaticMarkup(createElement(CreditCardDueSoonCard, { reminders: [dueSoonReminder, overdueReminder], onAcknowledge: () => {} }));
  const firstIndex = html.indexOf('國泰 CUBE 卡');
  const secondIndex = html.indexOf('逾期卡');
  assert.ok(firstIndex >= 0 && secondIndex >= 0 && firstIndex < secondIndex);
  assert.equal((html.match(/<li/g) || []).length, 2);
});

// --- real DOM interaction: clicking 完成 invokes onAcknowledge with (id, dueDate) ---

const dom = new (await import('jsdom')).JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
const { window } = dom;
(globalThis as unknown as { window: typeof window }).window = window;
(globalThis as unknown as { document: Document }).document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
(globalThis as unknown as { HTMLElement: typeof window.HTMLElement }).HTMLElement = window.HTMLElement;
(globalThis as unknown as { Event: typeof window.Event }).Event = window.Event;
(globalThis as unknown as { MouseEvent: typeof window.MouseEvent }).MouseEvent = window.MouseEvent;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { act } = React;
const { createRoot } = await import('react-dom/client');

async function renderCard(props: Parameters<typeof CreditCardDueSoonCard>[0]) {
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(createElement(CreditCardDueSoonCard, props)); });
  return container;
}

test('clicking 完成 invokes onAcknowledge with the reminder id and its exact dueDate', async () => {
  let received: [string, string] | null = null;
  const container = await renderCard({ reminders: [dueSoonReminder], onAcknowledge: (id, dueDate) => { received = [id, dueDate]; } });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '完成') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.deepEqual(received, ['card-1', '2026-08-17']);
});

test('each reminder has its own independent 完成 button', async () => {
  const calls: string[] = [];
  const container = await renderCard({ reminders: [dueSoonReminder, overdueReminder], onAcknowledge: id => { calls.push(id); } });
  const buttons = [...container.querySelectorAll('button')].filter(b => b.textContent === '完成');
  assert.equal(buttons.length, 2);
  await act(async () => { buttons[1].dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.deepEqual(calls, ['card-2']);
});
