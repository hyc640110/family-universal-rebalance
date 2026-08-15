import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FxConfirmationCard from '../src/components/fx/FxConfirmationCard';
import type { FxConversionPresentation } from '../src/lib/fxConversionPresentation';

// UR-TODO-054-B: mirrors tests/loanConfirmationCard.test.ts's structure and defense-in-depth
// conventions, adapted for FX's simpler always-exactly-one-event shape.

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const candidateItem: FxConversionPresentation = {
  conversionId: 'conv-1', sourceTransactionId: 'txn-src-1', destinationTransactionId: 'txn-dst-1',
  sourceCurrency: 'TWD', destinationCurrency: 'USD', sourceAmount: 32000, destinationAmount: 1000,
  effectiveDate: '2026-08-14', status: 'candidate', everConfirmed: false
};

const matchedItem: FxConversionPresentation = {
  ...candidateItem, conversionId: 'conv-2', status: 'matched', everConfirmed: true, voidTargetEventId: 'event-1'
};

test('renders nothing when there are no items', () => {
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { items: [], onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.equal(html, '');
});

test('candidate item renders exactly one confirm button, no void button, and both leg amounts', () => {
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { items: [candidateItem], onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /確認正式記帳/);
  assert.equal((html.match(/確認正式記帳/g) || []).length, 1);
  assert.doesNotMatch(html, /<button[^>]*>\s*撤銷/, 'a candidate item must never render a void button');
  assert.match(html, /32,000 TWD/);
  assert.match(html, /1,000 USD/);
});

test('matched item renders exactly one void button, no confirm button', () => {
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { items: [matchedItem], onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /撤銷/);
  assert.equal((html.match(/<button[^>]*>撤銷<\/button>/g) || []).length, 1);
  assert.doesNotMatch(html, /確認正式記帳/, 'a matched item must never show a confirm control');
  assert.match(html, /已正式記帳/);
});

test('multiple items each render independently in a single list, one row per conversionId', () => {
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { items: [candidateItem, matchedItem], onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /確認正式記帳/);
  assert.match(html, /已正式記帳/);
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
    root.render(createElement(FxConfirmationCard, {
      items: [candidateItem],
      onConfirm: () => ({ rejected: true, reason: '這筆換匯候選資料已有其他有效確認紀錄，無法重複確認。' }),
      onVoid: () => ({ rejected: false })
    }));
  });
  const button = [...container.querySelectorAll('button')].find(candidate => candidate.textContent === '確認正式記帳') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true })); });
  assert.match(container.innerHTML, /這筆換匯候選資料已有其他有效確認紀錄，無法重複確認。/);
  assert.doesNotMatch(container.innerHTML, /發生錯誤/);
});

test('an onConfirm that throws (instead of returning a rejected outcome) must still surface a visible message, never a silent no-op click', async () => {
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
    root.render(createElement(FxConfirmationCard, {
      items: [candidateItem],
      onConfirm: () => { throw new RangeError('Invalid calendar-day input'); },
      onVoid: () => ({ rejected: false })
    }));
  });
  const button = [...container.querySelectorAll('button')].find(candidate => candidate.textContent === '確認正式記帳') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true })); });
  assert.match(container.innerHTML, /確認時發生未預期的錯誤/, 'a thrown onConfirm must still produce a visible message, mirroring the LoanConfirmationCard PR #331 defense-in-depth fix');
  assert.match(container.innerHTML, /Invalid calendar-day input/);
});

test('void with a missing voidTargetEventId surfaces a specific fail-safe message instead of calling onVoid', async () => {
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
  const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const container = browser.window.document.createElement('div');
  browser.window.document.body.appendChild(container);
  const root = createRoot(container);
  let onVoidCalled = false;
  const matchedWithoutTarget: FxConversionPresentation = { ...matchedItem, voidTargetEventId: undefined };
  await act(async () => {
    root.render(createElement(FxConfirmationCard, {
      items: [matchedWithoutTarget],
      onConfirm: () => ({ rejected: false }),
      onVoid: () => { onVoidCalled = true; return { rejected: false }; }
    }));
  });
  const button = [...container.querySelectorAll('button')].find(candidate => candidate.textContent === '撤銷') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true })); });
  assert.equal(onVoidCalled, false, 'onVoid must never be called without a valid voidTargetEventId');
  assert.match(container.innerHTML, /目前找不到可撤銷的記帳事件/);
});
