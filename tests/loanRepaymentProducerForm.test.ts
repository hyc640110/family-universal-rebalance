import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LoanRepaymentProducerForm from '../src/components/loan/LoanRepaymentProducerForm';
import type { FinancialAccount } from '../src/lib/financialAccounts';
import type { LoanRepaymentCreationResult } from '../src/lib/loanRepaymentProducer';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const account = (id: string, currency: string, overrides: Partial<FinancialAccount> = {}): FinancialAccount => ({
  id, name: id, type: 'bank', balanceMode: 'manual', manualBalance: 0, currency, institutionName: '', note: '',
  isActive: true, sortOrder: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...overrides
});

const accounts: FinancialAccount[] = [account('cash-twd', 'TWD'), account('cash-usd', 'USD'), account('cash-inactive', 'TWD', { isActive: false })];
const loans = [{ id: 'loan-a', name: '房貸' }];
const successResult: LoanRepaymentCreationResult = { status: 'success', transaction: { id: 't' } as never, paymentId: 'p' };

test('form renders every required field and the loan option list', () => {
  const html = renderToStaticMarkup(createElement(LoanRepaymentProducerForm, { loans, accounts, onSubmit: () => successResult }));
  assert.match(html, /登記還款/);
  assert.match(html, /房貸/);
  assert.match(html, /本金/); assert.match(html, /利息/); assert.match(html, /手續費/); assert.match(html, /違約金/);
  assert.match(html, /還款日期/); assert.match(html, /扣款帳戶/);
});

test('account select only offers active TWD accounts', () => {
  const html = renderToStaticMarkup(createElement(LoanRepaymentProducerForm, { loans, accounts, onSubmit: () => successResult }));
  assert.match(html, /cash-twd（TWD）/);
  assert.doesNotMatch(html, /cash-usd/, 'non-TWD accounts must not be offered — loanAttribution only supports TWD');
  assert.doesNotMatch(html, /cash-inactive/, 'inactive accounts must not be offered');
});

test('total is derived and read-only — no independent settlement-amount input exists', () => {
  const html = renderToStaticMarkup(createElement(LoanRepaymentProducerForm, { loans, accounts, onSubmit: () => successResult }));
  assert.match(html, /還款總額/);
  assert.doesNotMatch(html, /name="settlementAmount"|還款總額.*<input/s);
});

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
const { window } = dom;
(globalThis as unknown as { window: typeof window }).window = window;
(globalThis as unknown as { document: Document }).document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
(globalThis as unknown as { HTMLElement: typeof window.HTMLElement }).HTMLElement = window.HTMLElement;
(globalThis as unknown as { Event: typeof window.Event }).Event = window.Event;
(globalThis as unknown as { MouseEvent: typeof window.MouseEvent }).MouseEvent = window.MouseEvent;
(globalThis as unknown as { requestAnimationFrame: typeof window.requestAnimationFrame }).requestAnimationFrame = window.requestAnimationFrame.bind(window);
(globalThis as unknown as { cancelAnimationFrame: typeof window.cancelAnimationFrame }).cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { act } = React;
const { createRoot } = await import('react-dom/client');

test('a rejected submit shows a specific, human-readable reason — never a generic error', async () => {
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(LoanRepaymentProducerForm, {
      loans, accounts,
      onSubmit: () => ({ status: 'invalid', reason: 'no-components' })
    }));
  });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.match(container.innerHTML, /請至少輸入一項大於 0 的金額/);
  assert.doesNotMatch(container.innerHTML, /發生錯誤/);
});

test('rapid double-click on submit only invokes onSubmit once (double-submit guard)', async () => {
  let callCount = 0;
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(LoanRepaymentProducerForm, {
      loans, accounts,
      onSubmit: () => { callCount += 1; return { status: 'invalid', reason: 'invalid-loan' } as LoanRepaymentCreationResult; }
    }));
  });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => {
    button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
  assert.equal(callCount, 1, 'two synchronous clicks must not both reach onSubmit');
});

test('after a successful submit, the guard releases and a later click can submit again', async () => {
  let callCount = 0;
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(LoanRepaymentProducerForm, {
      loans, accounts,
      onSubmit: () => { callCount += 1; return successResult; }
    }));
  });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(callCount, 2, 'the guard must release after each submit completes, not stay latched forever');
});
