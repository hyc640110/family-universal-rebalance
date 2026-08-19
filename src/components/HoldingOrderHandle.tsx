import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { GripVertical } from 'lucide-react';

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
 * `setPointerCapture` on pointerdown means subsequent `pointermove` events keep firing on this
 * button even once the pointer physically leaves it — that's what lets a drag continue as the
 * finger/cursor moves down across other cards. `onLostPointerCapture` is a safety net for capture
 * being revoked unexpectedly (e.g. by the browser); it's treated the same as `pointercancel` (an
 * abandoned drag) so the caller always gets a definitive end signal and never gets stuck "still
 * dragging". `endDrag` is idempotent per pointerId (guarded by `activePointerId`), so a normal
 * pointerup naturally followed by a lostpointercapture event never double-fires the callbacks.
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

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (cancelled) onDragCancel(); else onDragEnd();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    activePointerId.current = event.pointerId;
    // setPointerCapture failing (e.g. an already-invalidated pointer session) must never prevent
    // onDragStart from firing — the caller's cancel-safety snapshot (dragStartOrderRef in App.tsx)
    // is taken inside onDragStart, so skipping it here would leave a cancelled drag with nothing
    // to restore to. Capture failing only means pointermove won't keep firing once the pointer
    // physically leaves the handle — a graceful degradation, not a reason to corrupt the sequence.
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* degrade gracefully */ }
    onDragStart(event.clientY);
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (activePointerId.current !== event.pointerId) return;
    onDragMove(event.clientY);
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
      onPointerMove={handlePointerMove}
      onPointerUp={event => endDrag(event, false)}
      onPointerCancel={event => endDrag(event, true)}
      onLostPointerCapture={event => endDrag(event, true)}
      onKeyDown={handleKeyDown}
    >
      <GripVertical size={16} aria-hidden="true" />
    </button>
  );
}
