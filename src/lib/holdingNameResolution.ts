import { SYMBOL_NAMES, normalizeSymbol, type SymbolCode } from './rebalanceOrderHelper';

// UR-TODO-005 (Phase 1 read-only investigation): pure relocation of the holding-name resolution
// chain out of src/App.tsx verbatim so tests/holdingNameResolution.test.ts can import and exercise
// the real production code. App.tsx cannot be imported by tests/*.test.ts, since it references
// import.meta.env at module scope, a Vite-only global that throws under the plain Node ESM runtime
// tsx --test uses. This is a pure relocation: no logic, formula, or output change. sanitizeHolding()
// itself stays in App.tsx (unextracted) because it also depends on DEPLOYMENT_ENVIRONMENT and
// PREVIEW_ARCHIVED_FIXTURE_SYMBOL, both import.meta.env-derived, and on REMOVED_SYMBOLS, which is
// intentionally not relocated here.

export const TAIWAN_SYMBOL_RE = /^\d{4,6}[A-Z]{0,3}(\.(TW|TWO))?$/;

export const isTaiwanSymbol = (value: unknown) => TAIWAN_SYMBOL_RE.test(normalizeSymbol(value));

export const sanitizeName = (value: unknown) => String(value ?? '').trim();

export const pickName = (...values: unknown[]) => {
  for (const value of values) {
    const name = sanitizeName(value);
    if (name) return name;
  }
  return '';
};

export const quoteNameFields = (data: unknown) => {
  const d = data && typeof data === 'object' ? data as Record<string, any> : {};
  const meta = d.raw?.chart?.result?.[0]?.meta || {};
  return [
    d.name,
    d.shortName,
    d.longName,
    d.displayName,
    d.securityName,
    d.stockName,
    d.zhName,
    d.raw?.name,
    d.raw?.shortName,
    d.raw?.longName,
    d.raw?.displayName,
    meta.shortName,
    meta.longName,
    meta.symbolName
  ];
};

export const resolveSymbolName = (symbol: SymbolCode, ...sources: unknown[]) => pickName(...sources, SYMBOL_NAMES[symbol], symbol) || symbol;
