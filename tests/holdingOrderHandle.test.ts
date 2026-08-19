import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

/**
 * UR-TODO-071: exercises the real `HoldingOrderHandle` component against real jsdom PointerEvents
 * (not fabricated callback invocations), so this fails against a broken listener-lifecycle guard
 * and passes only when the actual component logic is correct.
 *
 * iPhone Preview round 2: the original design used element-level `setPointerCapture`, which turned
 * out to be fragile precisely because the captured button MOVES in the DOM on every live-reorder
 * step (Safari is more willing than Chromium to drop capture on reposition). The fix tracks a drag
 * via `document`-level pointermove/pointerup/pointercancel listeners instead, which are immune to
 * the element moving. The most important test below (`pointermove reaches onDragMove even when
 * dispatched on a completely different element`) is what directly proves that fix — it's the
 * scenario that would have failed under the old capture-based design once the button repositioned
 * and the pointer was no longer physically over it.
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
  // Decision 3 explicit requirement: never a menu/menuitem role — a plain button describing reorder.
  assert.equal(button.getAttribute('role'), null);
});

test('UR-TODO-071 HoldingOrderHandle: pointerdown on the handle starts a drag', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  assert.deepEqual(calls.dragStart, [100]);
});

test('UR-TODO-071 HoldingOrderHandle: pointermove with the active pointerId reports the new clientY', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 1, clientY: 180, bubbles: true })); });
  assert.deepEqual(calls.dragMove, [180]);
});

test('UR-TODO-071 HoldingOrderHandle: CRITICAL — pointermove reaches onDragMove even when dispatched on a completely different, unrelated element (proves immunity to the button being repositioned mid-drag)', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });

  // Simulate the exact failure mode from the iPhone repro: the handle has moved to a new DOM
  // position (as it does on every live-reorder step) and the pointer is now physically over some
  // completely unrelated element, not the handle at all. A capture-based design would silently
  // drop this event; a document-level listener does not care what the target is.
  const unrelated = window.document.createElement('article');
  window.document.body.appendChild(unrelated);
  await act(async () => { unrelated.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 1, clientY: 260, bubbles: true })); });
  assert.deepEqual(calls.dragMove, [260]);
});

test('UR-TODO-071 HoldingOrderHandle: pointermove from an unrelated/stray pointerId (no matching pointerdown) is ignored', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 1, clientY: 180, bubbles: true })); });
  assert.deepEqual(calls.dragMove, []);
});

test('UR-TODO-071 HoldingOrderHandle: pointerup commits the drag (onDragEnd), never onDragCancel', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointerup', { pointerId: 1, clientY: 200, bubbles: true })); });
  assert.equal(calls.dragEnd, 1);
  assert.equal(calls.dragCancel, 0);
});

test('UR-TODO-071 HoldingOrderHandle: pointercancel aborts the drag (onDragCancel), never onDragEnd', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointercancel', { pointerId: 1, bubbles: true })); });
  assert.equal(calls.dragCancel, 1);
  assert.equal(calls.dragEnd, 0);
});

test('UR-TODO-071 HoldingOrderHandle: pointerup/pointermove after a drag already ended are no-ops (listeners are torn down)', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointerup', { pointerId: 1, clientY: 200, bubbles: true })); });
  assert.equal(calls.dragEnd, 1);
  // A stray pointermove/pointerup for the SAME pointerId after the drag ended must not re-fire.
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 1, clientY: 300, bubbles: true })); });
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointerup', { pointerId: 1, clientY: 300, bubbles: true })); });
  assert.deepEqual(calls.dragMove, []);
  assert.equal(calls.dragEnd, 1);
});

test('UR-TODO-071 HoldingOrderHandle: a second, unrelated pointerId never affects an in-progress drag', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 99, clientY: 500, bubbles: true })); });
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointerup', { pointerId: 99, bubbles: true })); });
  assert.deepEqual(calls.dragMove, []);
  assert.equal(calls.dragEnd, 0);
  assert.equal(calls.dragCancel, 0);
  // The original pointerId's drag is still live and still works.
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 1, clientY: 180, bubbles: true })); });
  assert.deepEqual(calls.dragMove, [180]);
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

test('UR-TODO-071 HoldingOrderHandle: unmounting mid-drag tears down the document listeners (no leak, no late callbacks)', async () => {
  const { calls, container, root, props } = renderHandle();
  await act(async () => { root.render(createElement(HoldingOrderHandle, props)); });
  const button = container.querySelector('button') as HTMLButtonElement;
  await act(async () => { button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 1, clientY: 100, bubbles: true })); });
  await act(async () => { root.unmount(); });
  await act(async () => { window.document.dispatchEvent(new window.PointerEvent('pointermove', { pointerId: 1, clientY: 300, bubbles: true })); });
  assert.deepEqual(calls.dragMove, []);
});
