import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

/**
 * UR-TODO-072: exercises the real `HoldingDetailDialog` shell against real jsdom (not fabricated
 * callback invocations), following the same render harness pattern as holdingOrderHandle.test.ts.
 * This component has no dependency on App.tsx-local helpers (DraftInput, updateHolding, etc.), so it
 * can be imported and rendered directly — unlike App.tsx itself, which uses import.meta.env at module
 * scope and cannot be imported by tests (see holdingCardDragReorderStructure.test.ts).
 */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
const { window } = dom;
(globalThis as unknown as { window: typeof window }).window = window;
(globalThis as unknown as { document: Document }).document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
(globalThis as unknown as { HTMLElement: typeof window.HTMLElement }).HTMLElement = window.HTMLElement;
(globalThis as unknown as { Event: typeof window.Event }).Event = window.Event;
(globalThis as unknown as { KeyboardEvent: typeof window.KeyboardEvent }).KeyboardEvent = window.KeyboardEvent;
(globalThis as unknown as { MouseEvent: typeof window.MouseEvent }).MouseEvent = window.MouseEvent;

const React = await import('react');
const { act } = React;
(globalThis as unknown as { React: typeof React; IS_REACT_ACT_ENVIRONMENT: boolean }).React = React;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { createElement } = React;
const { default: HoldingDetailDialog } = await import('../src/components/HoldingDetailDialog');

function renderDialog(overrides: Partial<React.ComponentProps<typeof HoldingDetailDialog>> = {}) {
  const calls = { close: 0 };
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const originalBodyOverflow = window.document.body.style.overflow;
  const root = createRoot(container);
  const props = {
    titleId: 'holding-detail-dialog-title',
    title: createElement('span', null, '元大台灣50正2 00631L'),
    onClose: () => { calls.close += 1; },
    children: createElement('p', null, 'detail content'),
    ...overrides
  };
  return { calls, container, root, props, originalBodyOverflow };
}

test('UR-TODO-072 HoldingDetailDialog: renders accessible dialog semantics naming the holding', async () => {
  const { container, root, props } = renderDialog();
  await act(async () => { root.render(createElement(HoldingDetailDialog, props)); });
  const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
  assert.ok(dialog);
  assert.equal(dialog.getAttribute('aria-modal'), 'true');
  assert.equal(dialog.getAttribute('aria-labelledby'), 'holding-detail-dialog-title');
  const heading = container.querySelector('#holding-detail-dialog-title');
  assert.ok(heading);
  assert.match(heading?.textContent || '', /00631L/);
  await act(async () => { root.unmount(); });
});

test('UR-TODO-072 HoldingDetailDialog: renders the passed-in content as children, not a duplicate copy', async () => {
  const { container, root, props } = renderDialog();
  await act(async () => { root.render(createElement(HoldingDetailDialog, props)); });
  assert.match(container.textContent || '', /detail content/);
  await act(async () => { root.unmount(); });
});

test('UR-TODO-072 HoldingDetailDialog: has a close button that calls onClose', async () => {
  const { calls, container, root, props } = renderDialog();
  await act(async () => { root.render(createElement(HoldingDetailDialog, props)); });
  const closeButton = container.querySelector('.holding-detail-close') as HTMLButtonElement;
  assert.ok(closeButton);
  await act(async () => { closeButton.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(calls.close, 1);
  await act(async () => { root.unmount(); });
});

test('UR-TODO-072 HoldingDetailDialog: Escape key calls onClose', async () => {
  const { calls, root, props } = renderDialog();
  await act(async () => { root.render(createElement(HoldingDetailDialog, props)); });
  await act(async () => { window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  assert.equal(calls.close, 1);
  await act(async () => { root.unmount(); });
});

test('UR-TODO-072 HoldingDetailDialog: clicking the backdrop itself calls onClose', async () => {
  const { calls, container, root, props } = renderDialog();
  await act(async () => { root.render(createElement(HoldingDetailDialog, props)); });
  const backdrop = container.querySelector('.holding-detail-backdrop') as HTMLElement;
  assert.ok(backdrop);
  await act(async () => { backdrop.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(calls.close, 1);
  await act(async () => { root.unmount(); });
});

test('UR-TODO-072 HoldingDetailDialog: clicking inside the dialog body does NOT call onClose (no accidental close while editing)', async () => {
  const { calls, container, root, props } = renderDialog();
  await act(async () => { root.render(createElement(HoldingDetailDialog, props)); });
  const body = container.querySelector('.holding-detail-body') as HTMLElement;
  assert.ok(body);
  await act(async () => { body.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  assert.equal(calls.close, 0);
  await act(async () => { root.unmount(); });
});

test('UR-TODO-072 HoldingDetailDialog: locks body scroll while mounted and restores it on unmount', async () => {
  const { container, root, props, originalBodyOverflow } = renderDialog();
  await act(async () => { root.render(createElement(HoldingDetailDialog, props)); });
  assert.equal(window.document.body.style.overflow, 'hidden');
  await act(async () => { root.unmount(); });
  assert.equal(window.document.body.style.overflow, originalBodyOverflow);
  void container;
});

test('UR-TODO-072 HoldingDetailDialog: focus moves into the dialog (close button) on mount', async () => {
  const { container, root, props } = renderDialog();
  await act(async () => { root.render(createElement(HoldingDetailDialog, props)); });
  const closeButton = container.querySelector('.holding-detail-close') as HTMLButtonElement;
  assert.equal(window.document.activeElement, closeButton);
  await act(async () => { root.unmount(); });
});
