import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FxConfirmationCard from '../src/components/fx/FxConfirmationCard';
import type { FxConversionPresentation } from '../src/lib/fxConversionPresentation';

// UR-TODO-054-B: mirrors tests/loanConfirmationCard.test.ts's structure and defense-in-depth
// conventions, adapted for FX's simpler always-exactly-one-event shape. Several tests below were
// carried forward from the closed PR #333 Closeout Audit (cancel-dialog behavior, double-submit,
// Producer-gate independence, and symmetric onVoid throw handling).

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const candidateItem: FxConversionPresentation = {
  conversionId: 'conv-1', sourceTransactionId: 'txn-src-1', destinationTransactionId: 'txn-dst-1',
  sourceCurrency: 'TWD', destinationCurrency: 'USD', sourceAmount: 32000, destinationAmount: 1000,
  effectiveDate: '2026-08-14', status: 'candidate', everConfirmed: false
};

const matchedItem: FxConversionPresentation = {
  ...candidateItem, conversionId: 'conv-2', status: 'matched', everConfirmed: true, voidTargetEventId: 'event-1'
};

/** Shared jsdom + react-dom/client setup, mirroring the pattern each test below previously repeated inline. */
async function mountInJsdom(element: React.ReactElement, confirmReturnValue = true) {
  const { JSDOM } = await import('jsdom');
  const browser = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  (globalThis as unknown as { window: typeof browser.window }).window = browser.window;
  (globalThis as unknown as { document: Document }).document = browser.window.document;
  Object.defineProperty(globalThis, 'navigator', { value: browser.window.navigator, configurable: true });
  (globalThis as unknown as { HTMLElement: typeof browser.window.HTMLElement }).HTMLElement = browser.window.HTMLElement;
  (globalThis as unknown as { Event: typeof browser.window.Event }).Event = browser.window.Event;
  (globalThis as unknown as { MouseEvent: typeof browser.window.MouseEvent }).MouseEvent = browser.window.MouseEvent;
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  browser.window.confirm = () => confirmReturnValue;
  const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const container = browser.window.document.createElement('div');
  browser.window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(element); });
  const click = async (button: HTMLButtonElement) => { await act(async () => { button.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true })); }); };
  const findButton = (text: string) => [...container.querySelectorAll('button')].find(candidate => candidate.textContent === text) as HTMLButtonElement;
  return { container, click, findButton };
}

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
  const { container, click, findButton } = await mountInJsdom(createElement(FxConfirmationCard, {
    items: [candidateItem],
    onConfirm: () => ({ rejected: true, reason: '這筆換匯候選資料已有其他有效確認紀錄，無法重複確認。' }),
    onVoid: () => ({ rejected: false })
  }));
  await click(findButton('確認正式記帳'));
  assert.match(container.innerHTML, /這筆換匯候選資料已有其他有效確認紀錄，無法重複確認。/);
  assert.doesNotMatch(container.innerHTML, /發生錯誤/);
});

test('an onConfirm that throws (instead of returning a rejected outcome) must still surface a visible message, never a silent no-op click', async () => {
  const { container, click, findButton } = await mountInJsdom(createElement(FxConfirmationCard, {
    items: [candidateItem],
    onConfirm: () => { throw new RangeError('Invalid calendar-day input'); },
    onVoid: () => ({ rejected: false })
  }));
  await click(findButton('確認正式記帳'));
  assert.match(container.innerHTML, /確認時發生未預期的錯誤/, 'a thrown onConfirm must still produce a visible message, mirroring the LoanConfirmationCard PR #331 defense-in-depth fix');
  assert.match(container.innerHTML, /Invalid calendar-day input/);
});

test('an onVoid that throws (instead of returning a rejected outcome) must still surface a visible message, symmetric with the onConfirm throw guard', async () => {
  const { container, click, findButton } = await mountInJsdom(createElement(FxConfirmationCard, {
    items: [matchedItem],
    onConfirm: () => ({ rejected: false }),
    onVoid: () => { throw new RangeError('Invalid calendar-day input'); }
  }));
  await click(findButton('撤銷'));
  assert.match(container.innerHTML, /撤銷時發生未預期的錯誤/);
  assert.match(container.innerHTML, /Invalid calendar-day input/);
});

test('void with a missing voidTargetEventId surfaces a specific fail-safe message instead of calling onVoid', async () => {
  let onVoidCalled = false;
  const matchedWithoutTarget: FxConversionPresentation = { ...matchedItem, voidTargetEventId: undefined };
  const { container, click, findButton } = await mountInJsdom(createElement(FxConfirmationCard, {
    items: [matchedWithoutTarget],
    onConfirm: () => ({ rejected: false }),
    onVoid: () => { onVoidCalled = true; return { rejected: false }; }
  }));
  await click(findButton('撤銷'));
  assert.equal(onVoidCalled, false, 'onVoid must never be called without a valid voidTargetEventId');
  assert.match(container.innerHTML, /目前找不到可撤銷的記帳事件/);
});

test('confirm dialog cancel: window.confirm() returning false never calls onConfirm', async () => {
  let onConfirmCalled = false;
  const { click, findButton } = await mountInJsdom(createElement(FxConfirmationCard, {
    items: [candidateItem],
    onConfirm: () => { onConfirmCalled = true; return { rejected: false }; },
    onVoid: () => ({ rejected: false })
  }), /* confirmReturnValue */ false);
  await click(findButton('確認正式記帳'));
  assert.equal(onConfirmCalled, false, 'onConfirm must never be called when the user cancels the browser confirm dialog');
});

test('void dialog cancel: window.confirm() returning false never calls onVoid', async () => {
  let onVoidCalled = false;
  const { click, findButton } = await mountInJsdom(createElement(FxConfirmationCard, {
    items: [matchedItem],
    onConfirm: () => ({ rejected: false }),
    onVoid: () => { onVoidCalled = true; return { rejected: false }; }
  }), /* confirmReturnValue */ false);
  await click(findButton('撤銷'));
  assert.equal(onVoidCalled, false, 'onVoid must never be called when the user cancels the browser confirm dialog');
});

test('double-submit: two rapid clicks on confirm each independently go through their own dialog+call — no built-in dedupe, but each click accurately invokes onConfirm once', async () => {
  let callCount = 0;
  const { click, findButton } = await mountInJsdom(createElement(FxConfirmationCard, {
    items: [candidateItem],
    onConfirm: () => { callCount += 1; return { rejected: false }; },
    onVoid: () => ({ rejected: false })
  }));
  const button = findButton('確認正式記帳');
  await click(button);
  await click(button);
  assert.equal(callCount, 2, 'each click must invoke onConfirm exactly once — this component has no double-submit guard of its own, so App.tsx-level idempotency (confirmFxConversionAndAppend rejecting a second active confirmation) is what actually protects against a real double-submit');
});

test('FxConfirmationCard renders purely from candidate/matched presentation data with no Producer-gate prop — a candidate that exists (e.g. from a Preview build, or a future Backup-restored Production record) always renders regardless of whether the Producer that created it is currently enabled', () => {
  // FxConfirmationCard's own props type is `{ items, onConfirm, onVoid }` — it has no
  // `enabled`/`gate`/`deploymentEnvironment`-shaped field at all (unlike FxConversionProducerForm,
  // which does gate on isFxOpaqueProducerEnabled()). Passing only those three props and getting a
  // full, correct render is itself the proof that this component structurally cannot consult the
  // Producer gate — there is nowhere for that information to reach it.
  const html = renderToStaticMarkup(createElement(FxConfirmationCard, { items: [candidateItem], onConfirm: () => ({ rejected: false }), onVoid: () => ({ rejected: false }) }));
  assert.match(html, /確認正式記帳/);
  assert.match(html, /32,000 TWD/);
});
