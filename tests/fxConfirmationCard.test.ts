import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FxConfirmationCard from '../src/components/fx/FxConfirmationCard';
import type { FxConfirmationGroupPresentation } from '../src/lib/fxConfirmationPresentation';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const accounts = [{ id: 'acc-twd', name: '台幣帳戶' }, { id: 'acc-usd', name: '美元帳戶' }];

const candidateGroup: FxConfirmationGroupPresentation = {
  conversionId: 'conv-1', sourceTransactionId: 'src-1', sourceAccountId: 'acc-twd', sourceAmount: 32000, sourceCurrency: 'TWD',
  destinationTransactionId: 'dst-1', destinationAccountId: 'acc-usd', destinationAmount: 1000, destinationCurrency: 'USD',
  effectiveDate: '2026-08-14', executedRate: 32, feeResolution: { status: 'unknown' },
  status: 'candidate', everConfirmed: false
};

const matchedGroup: FxConfirmationGroupPresentation = { ...candidateGroup, conversionId: 'conv-2', status: 'matched', everConfirmed: true, voidTargetEventId: 'event-1' };

// --- 13-15: status-driven button rendering ---

test('13. candidate group renders exactly one group-level confirm button, no per-leg buttons', () => {
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { groups: [candidateGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /確認正式記帳/);
  assert.equal((html.match(/確認正式記帳/g) || []).length, 1);
  assert.doesNotMatch(html, /撤銷整筆換匯/);
  assert.match(html, /換出/); assert.match(html, /換入/); assert.match(html, /台幣帳戶/); assert.match(html, /美元帳戶/);
  assert.match(html, /此換匯由換出、換入兩筆交易組成/);
});

test('14. matched group renders exactly one group-level void button, no confirm button', () => {
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { groups: [matchedGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /撤銷整筆換匯/);
  assert.equal((html.match(/撤銷整筆換匯/g) || []).length, 1);
  assert.doesNotMatch(html, /確認正式記帳/);
  assert.match(html, /已正式記帳/);
});

test('15. voided (everConfirmed=true, status=candidate) group shows 待重新確認 and a reconfirm-labeled confirm button', () => {
  const voidedGroup = { ...candidateGroup, everConfirmed: true };
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { groups: [voidedGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /待重新確認/);
  assert.match(html, /確認正式記帳/);
});

// --- fee unknown never shown as 0/none ---

test('fee unknown renders an explicit "尚未確認" label, never 0 or 無費用', () => {
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { groups: [candidateGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /費用狀態尚未確認/);
  assert.doesNotMatch(html, />0 元</);
});

test('executed rate unavailable renders 無法取得, never a guessed value', () => {
  const noRateGroup = { ...candidateGroup, executedRate: undefined };
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { groups: [noRateGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /無法取得/);
});

// --- real DOM interaction tests ---

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

async function renderCard(props: Parameters<typeof FxConfirmationCard>[0]) {
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(createElement(FxConfirmationCard, props)); });
  return container;
}

test('16. confirm dialog cancel: window.confirm() returning false never calls onConfirm', async () => {
  window.confirm = () => false;
  let called = false;
  const container = await renderCard({ groups: [candidateGroup], accounts, onConfirm: () => { called = true; return { rejected: false }; }, onVoid: () => ({ rejected: false }) });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '確認正式記帳') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(called, false);
});

test('17. confirm success: onConfirm invoked with the conversionId, no error shown', async () => {
  window.confirm = () => true;
  let receivedId = '';
  const container = await renderCard({ groups: [candidateGroup], accounts, onConfirm: (id) => { receivedId = id; return { rejected: false }; }, onVoid: () => ({ rejected: false }) });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '確認正式記帳') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(receivedId, 'conv-1');
  assert.doesNotMatch(container.innerHTML, /warning-message/);
});

test('18. confirm rejected: the exact rejection reason is rendered, not a generic error', async () => {
  window.confirm = () => true;
  const container = await renderCard({ groups: [candidateGroup], accounts, onConfirm: () => ({ rejected: true, reason: '此換匯記錄尚未通過完整驗證，無法確認。' }), onVoid: () => ({ rejected: false }) });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '確認正式記帳') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.match(container.innerHTML, /此換匯記錄尚未通過完整驗證，無法確認。/);
  assert.doesNotMatch(container.innerHTML, /^發生錯誤$/);
});

test('19. onConfirm throwing surfaces a visible message, never a silent no-op', async () => {
  window.confirm = () => true;
  const container = await renderCard({ groups: [candidateGroup], accounts, onConfirm: () => { throw new Error('unexpected'); }, onVoid: () => ({ rejected: false }) });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '確認正式記帳') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.match(container.innerHTML, /確認時發生未預期的錯誤/);
  assert.match(container.innerHTML, /unexpected/);
});

test('20. double-submit: two rapid clicks on confirm still only apply the dialog+call semantics per click (no built-in duplicate call from a single click)', async () => {
  window.confirm = () => true;
  let callCount = 0;
  const container = await renderCard({ groups: [candidateGroup], accounts, onConfirm: () => { callCount += 1; return { rejected: false }; }, onVoid: () => ({ rejected: false }) });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '確認正式記帳') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(callCount, 1, 'a single click must result in exactly one onConfirm call');
});

test('21. void dialog cancel: window.confirm() returning false never calls onVoid', async () => {
  window.confirm = () => false;
  let called = false;
  const container = await renderCard({ groups: [matchedGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => { called = true; return { rejected: false }; } });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '撤銷整筆換匯') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(called, false);
});

test('22. void success: onVoid invoked with the voidTargetEventId', async () => {
  window.confirm = () => true;
  let receivedEventId = '';
  const container = await renderCard({ groups: [matchedGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: (id) => { receivedEventId = id; return { rejected: false }; } });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '撤銷整筆換匯') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(receivedEventId, 'event-1');
});

test('23. void failure: rejection reason rendered, not a generic error', async () => {
  window.confirm = () => true;
  const container = await renderCard({ groups: [matchedGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: true, reason: '找不到要撤銷的記帳事件，可能已被撤銷或資料已變更，請重新整理後再試一次。' }) });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '撤銷整筆換匯') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.match(container.innerHTML, /找不到要撤銷的記帳事件/);
});

test('void with a missing voidTargetEventId shows a clear message and never calls onVoid', async () => {
  window.confirm = () => true;
  let called = false;
  const brokenGroup = { ...matchedGroup, voidTargetEventId: undefined };
  const container = await renderCard({ groups: [brokenGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => { called = true; return { rejected: false }; } });
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === '撤銷整筆換匯') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(called, false);
  assert.match(container.innerHTML, /目前找不到可撤銷的記帳事件/);
});

test('39-41. FxConfirmationCard renders purely from candidate/matched presentation data — it has no Producer-gate prop at all, so it cannot depend on FX_OPAQUE_PRODUCER_SOURCE_GATE or deploymentEnvironment; a candidate that exists (e.g. from a Preview build, or a future Backup-restored Production record) always renders regardless of whether the Producer that created it is currently enabled', () => {
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { groups: [candidateGroup], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /確認正式記帳/, 'the component takes no gate/environment prop — this assertion alone proves it cannot be gate-dependent by construction');
});

test('renders nothing when there are no groups', () => {
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { groups: [], accounts, onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.equal(html, '');
});
