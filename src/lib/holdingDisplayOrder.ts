import { normalizeSymbol, safeHoldings, type SymbolCode } from './rebalanceOrderHelper';

/**
 * UR-TODO-070: normalizes `AppState.holdingDisplayOrder` — a display-only ordering preference for
 * the asset page's active holding cards. This never reorders `AppState.holdings` itself and never
 * feeds Rebalance/AI Decision/attribution/any financial calculation; it only decides the order
 * `m.rows` (from calculateMetrics) is rendered in for the "持股資產管理" card list.
 *
 * `raw` MUST be the truly-raw persisted value (e.g. `r.holdingDisplayOrder` from an un-merged
 * parsed JSON blob), matching the same contract normalizeFocusedSymbols() uses elsewhere in this
 * codebase. `holdings` should be the already-sanitized holdings list (post sanitizeHolding), so
 * every symbol this function considers "active" is already a valid, deduplicated symbol.
 *
 * Behavior:
 *   - Archived holdings (isArchived) are never included, regardless of whether they appear in `raw`.
 *   - Symbols in `raw` that are invalid, duplicated, or not a currently-active holding are dropped.
 *   - Active symbols missing from `raw` are appended, in `holdings`' own original order — this is
 *     also the fallback path when `raw` is not an array at all (undefined, a legacy backup with no
 *     such field, or any other non-array value): the result is simply `holdings`' original active
 *     order, never a value carried over from a prior/local preference.
 *   - Deterministic and non-mutating: the same (raw, holdings) pair always produces the same array,
 *     and neither input is modified.
 */
export function normalizeHoldingDisplayOrder(raw: unknown, holdings: unknown): SymbolCode[] {
  const activeHoldings = safeHoldings(holdings).filter(holding => !holding.isArchived);
  const activeSymbols = activeHoldings.map(holding => normalizeSymbol(holding.symbol));
  const activeSymbolSet = new Set(activeSymbols);
  const preference = Array.isArray(raw) ? raw.map(value => normalizeSymbol(String(value ?? ''))) : [];
  const ordered: SymbolCode[] = [];
  const seen = new Set<SymbolCode>();
  for (const symbol of preference) {
    if (symbol && activeSymbolSet.has(symbol) && !seen.has(symbol)) {
      ordered.push(symbol);
      seen.add(symbol);
    }
  }
  for (const symbol of activeSymbols) {
    if (!seen.has(symbol)) {
      ordered.push(symbol);
      seen.add(symbol);
    }
  }
  return ordered;
}

/**
 * UR-TODO-070: pure single-step reorder for the manual ↑/↓ controls. Swaps `symbol` with its
 * immediate neighbor in `direction`; a no-op (returns `order` as-is) when `symbol` is already at
 * that end of the list, or is not present in `order` at all. Never mutates `order`.
 */
export function moveHoldingDisplayOrder(order: SymbolCode[], symbol: SymbolCode, direction: 'up' | 'down'): SymbolCode[] {
  const normalizedSymbol = normalizeSymbol(symbol);
  const index = order.indexOf(normalizedSymbol);
  if (index === -1) return order;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= order.length) return order;
  const next = [...order];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

/**
 * UR-TODO-071: pure index-to-index reorder for the drag handle (and, via keyboard, the same
 * single-step semantics as `moveHoldingDisplayOrder` remain the keyboard path — this helper is
 * only for pointer-drag "move to arbitrary position"). Moves `symbol` to `targetIndex`, shifting
 * everything between its old and new position; a no-op (returns `order` as-is) when `symbol` is
 * not present in `order`, or `targetIndex` already equals its current index. `targetIndex` is
 * clamped to `[0, order.length - 1]` rather than rejected, so a drag that overshoots the list's
 * edge (e.g. the pointer moves past the last card) still resolves to a safe, valid order instead
 * of failing the whole gesture. Never mutates `order`; deterministic for the same inputs.
 */
export function moveHoldingDisplayOrderToIndex(order: SymbolCode[], symbol: SymbolCode, targetIndex: number): SymbolCode[] {
  const normalizedSymbol = normalizeSymbol(symbol);
  const fromIndex = order.indexOf(normalizedSymbol);
  if (fromIndex === -1) return order;
  const clampedTargetIndex = Math.max(0, Math.min(order.length - 1, targetIndex));
  if (clampedTargetIndex === fromIndex) return order;
  const next = [...order];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(clampedTargetIndex, 0, moved);
  return next;
}

/**
 * UR-TODO-070: applies a normalized display order to an already-computed row list (e.g.
 * `calculateMetrics(...).rows`) purely for rendering — never mutates `rows` and never reorders the
 * underlying `AppState.holdings`. Rows whose symbol is absent from `order` (e.g. a symbol just
 * added this render pass, before the next setState/normalizeState pass has caught up) are appended
 * in `rows`' own original order, so nothing already computed is ever silently dropped from view.
 */
export function orderHoldingRows<T extends { symbol: SymbolCode }>(rows: T[], order: SymbolCode[]): T[] {
  const bySymbol = new Map(rows.map(row => [normalizeSymbol(row.symbol), row] as const));
  const seen = new Set<SymbolCode>();
  const ordered: T[] = [];
  for (const symbol of order) {
    const row = bySymbol.get(symbol);
    if (row && !seen.has(symbol)) {
      ordered.push(row);
      seen.add(symbol);
    }
  }
  for (const row of rows) {
    const symbol = normalizeSymbol(row.symbol);
    if (!seen.has(symbol)) {
      ordered.push(row);
      seen.add(symbol);
    }
  }
  return ordered;
}
