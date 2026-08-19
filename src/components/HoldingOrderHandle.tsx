import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Menu } from 'lucide-react';

export type HoldingOrderHandleProps = {
  label: string;
  isDragging: boolean;
  onDragStart: (clientY: number) => void;
  onDragMove: (clientY: number) => void;
  onDragEnd: () => void;
  onDragCancel: () => void;
  onKeyboardMove: (direction: 'up' | 'down') => void;
};

/**
 * UR-TODO-071: the sole interactive surface that can start a holding-card reorder. Pointer events
 * are wired ONLY to this button — never to the card body — so normal page scrolling and other
 * card interactions (詳細, dip alert fields, etc.) never accidentally trigger a drag. Native
 * Pointer Events only (no HTML5 Drag and Drop API, no drag library, no long-press threshold —
 * pointerdown on the handle enters drag immediately, per Decision 1). `touch-action: none` /
 * `user-select: none` / `-webkit-touch-callout: none` are scoped to `.holding-order-handle` alone
 * (see styles.css), never applied to the card or the list, so vertical page scrolling elsewhere is
 * untouched.
 *
 * iPhone Preview round 2 root cause: element-level `setPointerCapture` is fragile here because the
 * captured button itself MOVES in the DOM on every live-reorder step (React repositions it to its
 * new array index). Per the Pointer Events spec this is implementation-defined territory, and
 * Safari is materially more willing than Chromium to silently drop capture when the captured
 * element is repositioned (not removed, just moved among siblings) — once that happens, subsequent
 * `pointermove` only reaches this button via normal hit-testing, i.e. only while the pointer is
 * still physically over the button's NEW on-screen position. A short/adjacent reorder can survive
 * this by luck; a long drag (e.g. first→last, needing several repositions) reliably doesn't —
 * matching the reported "downward reorder often fails, upward mostly worked" split, since the
 * repro'd cases needed more steps in one direction than the other.
 *
 * Fix: track the drag via `document`-level `pointermove`/`pointerup`/`pointercancel` listeners
 * (added on pointerdown, removed on end/cancel/unmount) instead of element capture. `document`
 * never moves or gets removed, so this is immune to the whole class of repositioning issues —
 * this is also the standard pattern most drag-list implementations use for exactly this reason.
 * `touch-action: none` on the handle still does its job of stopping the browser's native scroll
 * gesture from engaging when the touch STARTS here; that part never depended on capture.
 *
 * Keyboard: this is a real `<button>`, so it's natively focusable — no explicit `role`/`tabIndex`
 * needed. ArrowUp/ArrowDown call `onKeyboardMove`, which the caller wires to the existing
 * single-step `moveHoldingDisplayOrder` (first-item ArrowUp / last-item ArrowDown are already a
 * no-op at that layer, so this component carries no boundary bookkeeping of its own). Per Decision
 * 3, this is deliberately the full keyboard contract for v1 — no Space-to-grab-mode / Enter-to-drop
 * sequence.
 */
export default function HoldingOrderHandle({ label, isDragging, onDragStart, onDragMove, onDragEnd, onDragCancel, onKeyboardMove }: HoldingOrderHandleProps) {
  const activePointerId = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Safety net: if this card is ever unmounted mid-drag (e.g. archived while dragging), make sure
  // the document listeners don't leak.
  useEffect(() => () => { cleanupRef.current?.(); }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pointerId = event.pointerId;
    activePointerId.current = pointerId;

    const handleMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      onDragMove(moveEvent.clientY);
    };
    const cleanup = () => {
      activePointerId.current = null;
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleCancel);
      cleanupRef.current = null;
    };
    const handleUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      cleanup();
      onDragEnd();
    };
    const handleCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      cleanup();
      onDragCancel();
    };

    cleanupRef.current = cleanup;
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleCancel);
    onDragStart(event.clientY);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp') { event.preventDefault(); onKeyboardMove('up'); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); onKeyboardMove('down'); }
  };

  return (
    <button
      type="button"
      className={`holding-order-handle${isDragging ? ' is-dragging' : ''}`}
      aria-label={`${label} 拖曳排序，可使用方向鍵上下移動`}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    >
      <Menu size={16} aria-hidden="true" />
    </button>
  );
}
