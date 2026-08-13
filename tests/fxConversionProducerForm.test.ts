import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FxConversionProducerForm from '../src/components/fx/FxConversionProducerForm';
import type { FinancialAccount } from '../src/lib/financialAccounts';
import type { FxConversionCreationResult } from '../src/lib/fxConversionProducer';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const account = (id: string, currency: string, overrides: Partial<FinancialAccount> = {}): FinancialAccount => ({
  id, name: id, type: 'bank', balanceMode: 'manual', manualBalance: 0, currency, institutionName: '', note: '',
  isActive: true, sortOrder: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...overrides
});

const accounts: FinancialAccount[] = [account('acc-twd', 'TWD'), account('acc-usd', 'USD'), account('acc-jpy', 'JPY'), account('acc-inactive-usd', 'USD', { isActive: false })];

const successResult: FxConversionCreationResult = {
  status: 'success', conversionId: 'conv-1',
  sourceLeg: { id: 'src-1' } as never, destinationLeg: { id: 'dst-1' } as never, envelope: { id: 'conv-1' } as never
};

// --- Gate visibility (32) ---

test('gate OFF: enabled=false renders nothing — no producer entry point at all', () => {
  const html = renderToStaticMarkup(createElement(FxConversionProducerForm, { enabled: false, accounts, transactions: [], onSubmit: () => successResult }));
  assert.equal(html, '');
});

test('gate ON: enabled=true renders the form', () => {
  const html = renderToStaticMarkup(createElement(FxConversionProducerForm, { enabled: true, accounts, transactions: [], onSubmit: () => successResult }));
  assert.match(html, /建立換匯記錄/);
});

// --- Account selection determines currency (35) ---

test('account selects only offer active TWD/USD accounts, each showing its own currency — no separate currency selector', () => {
  const html = renderToStaticMarkup(createElement(FxConversionProducerForm, { enabled: true, accounts, transactions: [], onSubmit: () => successResult }));
  assert.match(html, /acc-twd（TWD）/);
  assert.match(html, /acc-usd（USD）/);
  assert.doesNotMatch(html, /acc-jpy/, 'unsupported-currency accounts must not even be offered');
  assert.doesNotMatch(html, /acc-inactive-usd/, 'inactive accounts must not be offered');
  assert.doesNotMatch(html, /<select[^>]*currency/i, 'no independent currency selector should exist');
});

// --- Fee default (36) ---

test('fee defaults to unknown, not none', () => {
  const html = renderToStaticMarkup(createElement(FxConversionProducerForm, { enabled: true, accounts, transactions: [], onSubmit: () => successResult }));
  assert.match(html, /<option value="unknown"[^>]*selected[^>]*>尚未確認<\/option>/);
});

// --- Derived rate is read-only (34) ---

test('derived rate has no input/editable control anywhere in the form markup', () => {
  const html = renderToStaticMarkup(createElement(FxConversionProducerForm, { enabled: true, accounts, transactions: [], onSubmit: () => successResult }));
  assert.doesNotMatch(html, /executedRate|derived-rate-input/i);
});

// --- Double submit guard (37), driven with real jsdom clicks like UR-TODO-049's precedent ---

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

test('rapid double-click on submit only invokes onSubmit once (double-submit guard, real DOM clicks)', async () => {
  let callCount = 0;
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(FxConversionProducerForm, {
      enabled: true, accounts, transactions: [],
      onSubmit: () => { callCount += 1; return { status: 'invalid', reason: 'invalid-source-account' } as FxConversionCreationResult; }
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
    root.render(createElement(FxConversionProducerForm, {
      enabled: true, accounts, transactions: [],
      onSubmit: () => { callCount += 1; return successResult; }
    }));
  });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(callCount, 2, 'the guard must release after each submit completes, not stay latched forever');
});
