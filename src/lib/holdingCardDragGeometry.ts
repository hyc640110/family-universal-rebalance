/**
 * UR-TODO-071: pure pointer-position-to-index geometry for the holding card drag handle.
 *
 * The asset page's holding list is always rendered as a single vertical column (mobile, the
 * 769–900px band, and desktop ≥901px all collapse `.holdings` to `grid-template-columns:1fr`),
 * so reordering is a plain single-axis (Y) list-reorder problem — no need to reason about rows vs.
 * columns.
 *
 * `siblingMidpoints` is the vertical midpoint (`getBoundingClientRect()` `top + height / 2`, in
 * viewport coordinates — consistent with `PointerEvent.clientY`) of every OTHER card currently in
 * the list, in their current top-to-bottom visual order, with the dragged card itself excluded
 * (it moves with the pointer, so it never participates in its own target-index calculation).
 *
 * Returns the 0-based index the dragged card should occupy if dropped at `pointerClientY`: the
 * count of sibling midpoints strictly above the pointer. This is a simple, safe count — it never
 * throws, and the caller is expected to pass rects already in visual order, but a malformed
 * (unsorted) input degrades to "count how many entries are above the pointer" rather than
 * crashing or producing an out-of-range index.
 */
export function resolveDragTargetIndex(pointerClientY: number, siblingMidpoints: number[]): number {
  return siblingMidpoints.filter(midpoint => midpoint < pointerClientY).length;
}
