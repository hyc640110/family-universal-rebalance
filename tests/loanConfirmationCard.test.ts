import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LoanConfirmationCard from '../src/components/loan/LoanConfirmationCard';
import type { LoanRepaymentGroupPresentation } from '../src/lib/loanConfirmationPresentation';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const loans = [{ id: 'loan-a', name: '房貸' }];

const candidateGroup: LoanRepaymentGroupPresentation = {
  paymentId: 'payment-1', transactionId: 'txn-1', loanId: 'loan-a', effectiveDate: '2026-08-14T00:00:00.000Z',
  settlementAmount: 20_300, currency: 'TWD',
  components: [
    { componentId: 'c-principal', type: 'principal', amount: 15_000 },
    { componentId: 'c-interest', type: 'interest', amount: 5_000 },
    { componentId: 'c-fee', type: 'fee', amount: 100 },
    { componentId: 'c-penalty', type: 'penalty', amount: 200 }
  ],
  status: 'candidate', everConfirmed: false
};

const matchedGroup: LoanRepaymentGroupPresentation = {
  ...candidateGroup, paymentId: 'payment-2', transactionId: 'txn-2', status: 'matched', everConfirmed: true, voidTargetEventId: 'event-principal-2'
};

test('renders nothing when there are no groups', () => {
  const html = renderToStaticMarkup(createElement(LoanConfirmationCard, { groups: [], loans, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.equal(html, '');
});

test('candidate group renders one group-level confirm button, no per-component buttons', () => {
  const html = renderToStaticMarkup(createElement(LoanConfirmationCard, { groups: [candidateGroup], loans, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /確認正式記帳/);
  // Exactly one confirm button for the whole group (not one per component).
  const confirmButtonCount = (html.match(/確認正式記帳/g) || []).length;
  assert.equal(confirmButtonCount, 1);
  assert.doesNotMatch(html, /撤銷整組/, 'a candidate group must never show a void control');
  assert.doesNotMatch(html, /<button[^>]*>\s*撤銷/, 'a candidate group must never render a void button');
  assert.match(html, /本金/); assert.match(html, /利息/); assert.match(html, /手續費/); assert.match(html, /違約金/);
  assert.match(html, /此還款由本金、利息及其他費用組成/, 'atomic safety note must be present');
});

test('matched group renders one group-level void button (撤銷整組), no per-component void buttons, no confirm button', () => {
  const html = renderToStaticMarkup(createElement(LoanConfirmationCard, { groups: [matchedGroup], loans, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /撤銷整組/);
  const voidButtonCount = (html.match(/撤銷整組/g) || []).length;
  assert.equal(voidButtonCount, 1);
  assert.doesNotMatch(html, /確認正式記帳/, 'a matched group must never show a confirm control');
  assert.match(html, /已正式記帳/);
});

test('loan display label resolves from the loans list, falling back gracefully for unknown loanId', () => {
  const html = renderToStaticMarkup(createElement(LoanConfirmationCard, { groups: [candidateGroup], loans, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /房貸/);
  const unknownLoanGroup = { ...candidateGroup, loanId: 'loan-missing' };
  const fallbackHtml = renderToStaticMarkup(createElement(LoanConfirmationCard, { groups: [unknownLoanGroup], loans, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(fallbackHtml, /未命名借款/);
});

test('a group with two components only renders those two amount rows, never a phantom 0 for an absent component', () => {
  const twoComponentGroup: LoanRepaymentGroupPresentation = {
    ...candidateGroup,
    components: [
      { componentId: 'c-principal', type: 'principal', amount: 15_000 },
      { componentId: 'c-interest', type: 'interest', amount: 5_000 }
    ]
  };
  const html = renderToStaticMarkup(createElement(LoanConfirmationCard, { groups: [twoComponentGroup], loans, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.doesNotMatch(html, /手續費/);
  assert.doesNotMatch(html, /違約金/);
});

test('rejection reason from onConfirm is surfaced verbatim as feedback, not a generic error', async () => {
  const dom = await import('jsdom');
  const { JSDOM } = dom;
  const browser = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  (globalThis as unknown as { window: typeof browser.window }).window = browser.window;
  (globalThis as unknown as { document: Document }).document = browser.window.document;
  Object.defineProperty(globalThis, 'navigator', { value: browser.window.navigator, configurable: true });
  (globalThis as unknown as { HTMLElement: typeof browser.window.HTMLElement }).HTMLElement = browser.window.HTMLElement;
  (globalThis as unknown as { Event: typeof browser.window.Event }).Event = browser.window.Event;
  (globalThis as unknown as { MouseEvent: typeof browser.window.MouseEvent }).MouseEvent = browser.window.MouseEvent;
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  browser.window.confirm = () => true;
  const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const container = browser.window.document.createElement('div');
  browser.window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(LoanConfirmationCard, {
      groups: [candidateGroup], loans,
      onConfirm: () => ({ rejected: true, reason: '這筆還款候選資料與正式 contract 不一致，無法確認。' }),
      onVoid: () => ({ rejected: false })
    }));
  });
  const button = [...container.querySelectorAll('button')].find(candidate => candidate.textContent === '確認正式記帳') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true })); });
  assert.match(container.innerHTML, /這筆還款候選資料與正式 contract 不一致，無法確認。/);
  assert.doesNotMatch(container.innerHTML, /發生錯誤/);
});

test('UR-TODO-054-A PR #331 Preview blocker regression: an onConfirm that throws (instead of returning a rejected outcome) must still surface a visible message, never a silent no-op click', async () => {
  const dom = await import('jsdom');
  const { JSDOM } = dom;
  const browser = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  (globalThis as unknown as { window: typeof browser.window }).window = browser.window;
  (globalThis as unknown as { document: Document }).document = browser.window.document;
  Object.defineProperty(globalThis, 'navigator', { value: browser.window.navigator, configurable: true });
  (globalThis as unknown as { HTMLElement: typeof browser.window.HTMLElement }).HTMLElement = browser.window.HTMLElement;
  (globalThis as unknown as { Event: typeof browser.window.Event }).Event = browser.window.Event;
  (globalThis as unknown as { MouseEvent: typeof browser.window.MouseEvent }).MouseEvent = browser.window.MouseEvent;
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  browser.window.confirm = () => true;
  const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const container = browser.window.document.createElement('div');
  browser.window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(LoanConfirmationCard, {
      groups: [candidateGroup], loans,
      onConfirm: () => { throw new RangeError('Invalid calendar-day input'); },
      onVoid: () => ({ rejected: false })
    }));
  });
  const button = [...container.querySelectorAll('button')].find(candidate => candidate.textContent === '確認正式記帳') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true })); });
  assert.match(container.innerHTML, /確認時發生未預期的錯誤/, 'a thrown onConfirm must still produce a visible message — this is what silently failed before the PR #331 Preview fix');
  assert.match(container.innerHTML, /Invalid calendar-day input/);
});
