import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

/**
 * UR-TODO-071: exercises the real `HoldingOrderHandle` component against real jsdom PointerEvents
 * (not fabricated callback invocations), so this fails against a broken pointer-capture guard or a
 * stray-pointerId leak and passes only when the actual component logic is correct.
 *
 * jsdom (as of the version pinned in this repo) does not implement `setPointerCapture` /
 * `hasPointerCapture` / `releasePointerCapture` on Element — real browsers (including iOS Safari,
 * the target for this feature) do. This file polyfills a minimal, faithful-enough stub purely so
 * the component's actual pointer-capture *call pattern* (captures on down, checks/releases on
 * up/cancel) can be exercised here; it is a test-environment shim, not a change to the component.
 */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
const { window } = dom;
(globalThis as unknown as { window: typeof window }).window = window;
(globalThis as unknown as { document: Document }).document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
(globalThis as unknown as { HTMLElement: typeof window.HTMLElement }).HTMLElement = window.HTMLElement;
(globalThis as unknown as { Event: typeof window.Event }).Event = window.Event;
(globalThis as unknown as { PointerEvent: typeof window.PointerEvent }).PointerEvent = window.PointerEvent;
(globalThis as unknown as { KeyboardEvent: typeof window.KeyboardEvent }).KeyboardEvent = window.KeyboardEvent;
(globalThis as unknown as { requestAnimationFrame: typeof window.requestAnimationFrame }).requestAnimationFrame = window.requestAnimationFrame.bind(window);
(globalThis as unknown as { cancelAnimationFrame: typeof window.cancelAnimationFrame }).cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

type CaptureCarrier = { __capturedPointerId?: number };
Object.defineProperty(window.HTMLElement.prototype, 'setPointerCapture', {
  configurable: true,
  value: function (this: HTMLElement & CaptureCarrier, pointerId: number) { this.__capturedPointerId = pointerId; }
});
Object.defineProperty(window.HTMLElement.prototype, 'hasPointerCapture', {
  configurable: true,
  value: function (this: HTMLElement & CaptureCarrier, pointerId: number) { return this.__capturedPointerId === pointerId; }
});
Object.defineProperty(window.HTMLElement.prototype, 'releasePointerCapture', {
  configurable: true,
  value: function (this: HTMLElement & CaptureCarrier, pointerId: number) { if (this.__capturedPointerId === pointerId) delete this.__capturedPointerId; }
});

const React = await import('react');
const { act } = React;
(globalThis as unknown as { React: typeof React; IS_REACT_ACT_ENVIRONMENT: boolean }).React = React;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { createElement } = React;
const { default: HoldingOrderHandle } = await import('../src/components/HoldingOrderHandle');

function renderHandle(overrides: Partial<React.ComponentProps<typeof HoldingOrderHandle>> = {}) {
  const calls = { dragStart: [] as number[], dragMove: [] as number[], dragEnd: 0, dragCancel: 0, keyboardMove: [] as Array<'up' | 'down'> };
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  const props = {
    label: '富邦NASDAQ',
    isDragging: false,
    onDragStart: (clientY: number) => calls.dragStart.push(clientY),
    onDragMove: (clientY: number) => calls.dragMove.push(clientY),
    onDragEnd: () => { calls.dragEnd += 1; },
    onDragCancel: () => { calls.dragCancel += 1; },
    onKeyboardMove: (direction: 'up' | 'down') => calls.keyboardMove.push(direction),
    ...overrides
  };
  return { calls, container, root, props };
}

test('UR-TODO-071 HoldingOrderHandle: renders an accessible, focusable button naming the holding and arrow-key capability', async () => {
  const { container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  assert.ok(button);
  assert.match(button.getAttribute('aria-label') || '', /富邦NASDAQ/);
  assert.match(button.getAttribute('aria-label') || '', /方向鍵/);
});

test('UR-TODO-071 HoldingOrderHandle: pointerdown on the handle captures the pointer and starts a drag', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  assert.deepEqual(calls.dragStart, [100]);
  assert.equal((button as unknown as { hasPointerCapture: (id: number) => boolean }).hasPointerCapture(1), true);
});

test('UR-TODO-071 HoldingOrderHandle: pointermove with the captured pointerId reports the new clientY', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 1, clientY: 180, bubbles: true })); });
  assert.deepEqual(calls.dragMove, [180]);
});

test('UR-TODO-071 HoldingOrderHandle: pointermove from an uncaptured/stray pointerId is ignored', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  // No pointerdown happened for pointerId 1 at all — this simulates a stray/unrelated pointer event.
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 1, clientY: 180, bubbles: true })); });
  assert.deepEqual(calls.dragMove, []);
});

test('UR-TODO-071 HoldingOrderHandle: pointerup commits the drag (onDragEnd) and releases capture', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerup', { pointerId: 1, clientY: 200, bubbles: true })); });
  assert.equal(calls.dragEnd, 1);
  assert.equal(calls.dragCancel, 0);
  assert.equal((button as unknown as { hasPointerCapture: (id: number) => boolean }).hasPointerCapture(1), false);
});

test('UR-TODO-071 HoldingOrderHandle: pointercancel aborts the drag (onDragCancel), never onDragEnd', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointercancel', { pointerId: 1, bubbles: true })); });
  assert.equal(calls.dragCancel, 1);
  assert.equal(calls.dragEnd, 0);
});

test('UR-TODO-071 HoldingOrderHandle: pointerup/pointercancel is a no-op if it never started a drag on this handle', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerup', { pointerId: 9, bubbles: true })); });
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointercancel', { pointerId: 9, bubbles: true })); });
  assert.equal(calls.dragEnd, 0);
  assert.equal(calls.dragCancel, 0);
});

test('UR-TODO-071 HoldingOrderHandle: ArrowUp/ArrowDown on the focused handle call onKeyboardMove with the right direction', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })); });
  await act(async () => { button.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })); });
  assert.deepEqual(calls.keyboardMove, ['up', 'down']);
});

test('UR-TODO-071 HoldingOrderHandle: unrelated keys never trigger a reorder', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); });
  await act(async () => { button.dispatchEvent(new window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })); });
  await act(async () => { button.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })); });
  assert.deepEqual(calls.keyboardMove, []);
});

test('UR-TODO-071 HoldingOrderHandle: onDragStart still fires even if setPointerCapture throws (must never leave the caller\'s cancel-safety snapshot unset)', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  // setPointerCapture is defined non-writable on HTMLElement.prototype by this file's own
  // top-of-file polyfill — shadow it on the instance via defineProperty, not plain assignment.
  Object.defineProperty(button, 'setPointerCapture', {
    configurable: true,
    value: () => { throw new DOMException('No active pointer with the given id is found.', 'NotFoundError'); }
  });
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 7, clientY: 50, bubbles: true })); });
  assert.deepEqual(calls.dragStart, [50]);
  // pointermove for the same pointerId must still be honored — activePointerId was set before the
  // capture attempt, so a captureless drag still degrades gracefully rather than being abandoned.
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 7, clientY: 90, bubbles: true })); });
  assert.deepEqual(calls.dragMove, [90]);
});

test('UR-TODO-071 HoldingOrderHandle: isDragging toggles a dragging-state class for minimal visual feedback', async () => {
  const idle = renderHandle({ isDragging: false });
  await act(async () => { idle.root.render(createElement(HoldingOrderHandle, idle.props)); });
  const idleButton = idle.container.querySelector('button') as HTMLButtonElement;
  assert.equal(idleButton.className.includes('is-dragging'), false);

  const dragging = renderHandle({ isDragging: true });
  await act(async () => { dragging.root.render(createElement(HoldingOrderHandle, dragging.props)); });
  const draggingButton = dragging.container.querySelector('button') as HTMLButtonElement;
  assert.equal(draggingButton.className.includes('is-dragging'), true);
});
