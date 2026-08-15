import { normalizeSymbol, safeHoldings, type SymbolCode } from './rebalanceOrderHelper';

/**
 * UR-TODO-061: normalizes `AppState.focusedSymbols` — the homepage "重點標的" card's selection.
 * Array-shaped for future multi-symbol flexibility, but the current UI invariant is "at most
 * one", enforced here too (`slice(0, 1)`), not only in the UI layer.
 *
 * `raw` MUST be the truly-raw persisted value (e.g. `r.focusedSymbols` from an un-merged parsed
 * JSON blob), never a value already merged with a default — that is what lets this distinguish:
 *   - "this field has never existed in this user's persisted data before" (`!Array.isArray(raw)`)
 *     → one-time migration to `['00631L']`, matching the homepage's pre-061 hardcoded behavior
 *     every existing (and brand-new) user has always seen.
 *   - "this field exists and is an empty array" (`Array.isArray(raw) && raw.length === 0`) → the
 *     user explicitly cleared their selection; respected as-is, never silently repopulated.
 * Once this function has run once and its output has been persisted (even `[]`), the persisted
 * value is always an array from then on, so the migration branch never fires again for that user.
 *
 * Reuses the same holdings-presence filter dipAlerts normalization already applies elsewhere in
 * this codebase (App.tsx's normalizeDipAlerts) — a symbol no longer present in `holdings` is
 * dropped, with no separate existence-tracking mechanism to maintain.
 */
export function normalizeFocusedSymbols(raw: unknown, holdings: unknown): SymbolCode[] {
  const migrated = Array.isArray(raw) ? raw : ['00631L'];
  const existingSymbols = new Set(safeHoldings(holdings).map(holding => normalizeSymbol(holding?.symbol)));
  const filtered = migrated
    .map(value => normalizeSymbol(String(value ?? '')))
    .filter(symbol => symbol && existingSymbols.has(symbol));
  return [...new Set(filtered)].slice(0, 1);
}

/**
 * Pure toggle: selecting the already-focused symbol clears the selection; selecting any other
 * symbol replaces whatever was selected before (no separate "clear the old one" step needed).
 * Does not validate `symbol` against `holdings` — the caller's next normalizeFocusedSymbols()
 * pass (e.g. via setState → normalizeState()) is what enforces that invariant.
 */
export function toggleFocusedSymbol(current: SymbolCode[], symbol: SymbolCode): SymbolCode[] {
  const normalizedSymbol = normalizeSymbol(symbol);
  return current.includes(normalizedSymbol) ? [] : [normalizedSymbol];
}
