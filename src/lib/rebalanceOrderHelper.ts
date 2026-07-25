import type { AppState, Holding, Quote } from '../App';

// V7.0B sub-PR 4a (UR-TODO-008): getOrderSuggestions (the "交易建議清單" / Order Helper engine) and the shared
// primitives it depends on, moved out of App.tsx verbatim so tests/getOrderSuggestions.test.ts can import and
// exercise the real production code. App.tsx cannot be imported by tests/*.test.ts at all — it (and its
// ./constants/appInfo import) reference import.meta.env at module scope, which is a Vite-only global and throws
// under the plain Node ESM runtime tsx --test uses. AppState/Holding/Quote are imported here as `import type` only
// (fully erased at compile time, zero runtime import), so this file stays free of that problem while still sharing
// App.tsx's real state shape instead of a hand-rolled duplicate. RebalanceMode/SymbolCode are trivial aliases
// re-declared locally rather than imported, since they cannot drift from App.tsx's identical definitions.
// sub-PR 4a itself was a pure relocation (no logic, formula, or output change). sub-PR 4b then wired investableCash
// into getOrderSuggestions below as its first intentional behavior change since the move — see that function's own
// comment for the money-basis change (013 §12~14).

export type SymbolCode = string;
export type RebalanceMode = 'standard' | 'buy-only';

export type OrderSuggestion = { symbol: SymbolCode; name: string; diff: number; amount: number; price: number; targetPercent: number; currentValue: number; targetValue: number; shares: number | null; lots: number; oddLots: number; conversionText: string };
export type DefensiveReminder = { status: 'missing' | 'under' | 'over' | 'ok'; message: string; item?: OrderSuggestion; items: OrderSuggestion[]; currentWeight: number; targetPercent: number };
export type OrderHelper = { growthBuy: OrderSuggestion[]; growthSell: OrderSuggestion[]; skippedSell: OrderSuggestion[]; defensiveReminder: DefensiveReminder; cash: number; investableCash: number | null; totalBuyAmount: number; fullBuyGap: number; shortage: number; cashEnough: boolean; cashLimited: boolean; mode: RebalanceMode; modeLabel: string; buyOnlyBudget: number; buyOnlyLimit: number; hasInvalidBuyOnlyBudget: boolean };

export type OrderHelperRow = Holding & { quote: Quote; marketValue: number };
export type OrderHelperMetrics = { rows: OrderHelperRow[]; totalAssets: number; cash: number; defensiveHoldingsValue: number };
export type OrderHelperState = Pick<AppState, 'rebalanceMode' | 'buyOnlyBudget' | 'holdings'>;

export const SYMBOL_NAMES: Record<SymbolCode, string> = {
  '00662': '富邦NASDAQ',
  '00670L': '富邦NASDAQ正2',
  '00631L': '元大台灣50正2',
  '00865B': '國泰US短期公債',
  '00685L': '群益臺灣加權正2',
  '00895': '富邦未來車',
  '0050': '元大台灣50'
};

export const DEFAULT_REBALANCE_MODE: RebalanceMode = 'buy-only';

export const num = (n: number) => Number.isFinite(n) ? n : 0;
export const safeNumber = (value: unknown) => {
  const n = Number(value) || 0;
  return Number.isFinite(n) ? n : 0;
};
export const normalizeSymbol = (value: unknown) => String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
export const rawTargetOf = (asset: unknown) => {
  const a = asset && typeof asset === 'object' ? asset as Record<string, unknown> : {};
  return a.targetWeight ?? a.targetPercent ?? a.targetRatio ?? a.allocation ?? 0;
};
export const safeHoldings = (holdings: unknown): Holding[] => Array.isArray(holdings) ? holdings.filter(Boolean) as Holding[] : [];
export const isDefensiveHolding = (asset: Pick<Holding, 'assetClass'> | null | undefined) => asset?.assetClass === 'defensive';
export const getEffectiveTargetPercent = (asset: Holding | null | undefined, holdings: unknown) => {
  if (!asset) return 0;
  return Math.max(0, safeNumber(rawTargetOf(asset)));
};
export const getDefensiveStockTargetTotal = (holdings: unknown) => {
  return safeHoldings(holdings)
    .filter(asset => isDefensiveHolding(asset))
    .reduce((total, asset) => total + Math.max(0, safeNumber(rawTargetOf(asset))), 0);
};
export const normalizeRebalanceMode = (value: unknown): RebalanceMode => value === 'standard' ? 'standard' : DEFAULT_REBALANCE_MODE;
export const normalizeBuyOnlyBudget = (value: unknown) => Math.max(0, safeNumber(value));
export const rebalanceModeLabel = (mode: RebalanceMode) => mode === 'standard' ? '標準再平衡' : '只買不賣';

function getLotAndOddLot(shares: number) {
  const safeShares = Math.max(0, Math.floor(safeNumber(shares)));
  return { lots: Math.floor(safeShares / 1000), oddLots: safeShares % 1000 };
}
function formatShares(shares: number | null) {
  if (shares === null) return '價格不足，無法換算股數';
  const { lots, oddLots } = getLotAndOddLot(shares);
  return `${shares.toLocaleString('zh-TW')} 股（${lots} 張 + ${oddLots} 股）`;
}
function withOrderAmount(item: Omit<OrderSuggestion, 'amount' | 'shares' | 'lots' | 'oddLots' | 'conversionText'>, amount: number): OrderSuggestion {
  const safeAmount = Math.max(0, safeNumber(amount));
  const shares = item.price > 0 ? Math.floor(safeAmount / item.price) : null;
  const lotInfo = getLotAndOddLot(shares ?? 0);
  return {
    ...item,
    amount: safeAmount,
    shares,
    lots: lotInfo.lots,
    oddLots: lotInfo.oddLots,
    conversionText: formatShares(shares)
  };
}
// V7.0B sub-PR 4b (UR-TODO-008, 013 §12~14, §13.1/§13.2): `investableCash` is the executable-cash basis for
// buyOnlyLimit/remainingBudget/shortage/cashEnough/cashLimited below (protected-safety-reserve-aware, from
// deriveHouseholdLiquidity via App.tsx's householdLiquidityForRebalance). `m.cash` (raw account total) stays only
// as the informational `cash` field on the returned OrderHelper — it no longer drives any funding decision, mirroring
// rebalanceRecommendation.ts's existing liquidCash-vs-investableCash split (013 §12.3: 可投資現金／實際可執行／外部
// 資金需求 must stay separate from the raw account total). This is the intentional sub-PR 4b behavior change from
// sub-PR 4a's characterization baseline (tests/getOrderSuggestions.test.ts), documented per-test where it applies.
export function getOrderSuggestions(state: OrderHelperState, quotes: Record<SymbolCode, Quote>, m: OrderHelperMetrics, investableCash: number | null): OrderHelper {
  const mode = normalizeRebalanceMode(state.rebalanceMode);
  const rows = m.rows.map(row => {
    const targetPercent = getEffectiveTargetPercent(row, state.holdings);
    const targetValue = m.totalAssets * (targetPercent / 100);
    const diff = num(targetValue - row.marketValue);
    const quote = quotes[row.symbol] || row.quote;
    const price = Math.max(0, safeNumber(quote?.price));
    return {
      symbol: row.symbol,
      name: row.quote.name || SYMBOL_NAMES[row.symbol] || row.symbol,
      diff,
      price,
      targetPercent,
      currentValue: row.marketValue,
      targetValue
    };
  });
  const cash = Math.max(0, safeNumber(m.cash));
  // When investableCash is unconfirmed (null), the executable basis is conservatively treated as 0 so no buy order
  // is ever silently funded from unconfirmed cash (013 §12.4 prohibits displaying a precise buy order when data is
  // incomplete). investableCash itself is still returned as null on the output below, never coerced to 0, so
  // callers can tell "confirmed zero" apart from "unconfirmed".
  const investableCashBasis = investableCash === null ? 0 : Math.max(0, safeNumber(investableCash));
  const buyOnlyBudget = normalizeBuyOnlyBudget(state.buyOnlyBudget);
  const buyOnlyLimit = Math.min(buyOnlyBudget, investableCashBasis);
  const hasInvalidBuyOnlyBudget = mode === 'buy-only' && buyOnlyBudget <= 0;
  const rowClassMap = Object.fromEntries(m.rows.map(row => [normalizeSymbol(row.symbol), row.assetClass])) as Record<SymbolCode, Holding['assetClass']>;
  const growthRows = rows.filter(item => rowClassMap[normalizeSymbol(item.symbol)] !== 'defensive');
  const defensiveRows = rows.filter(item => rowClassMap[normalizeSymbol(item.symbol)] === 'defensive');
  const buyGaps = growthRows.filter(item => item.diff > 0).sort((a, b) => b.diff - a.diff);
  const fullBuyGap = buyGaps.reduce((total, item) => total + Math.max(0, safeNumber(item.diff)), 0);
  let remainingBudget = mode === 'buy-only' ? buyOnlyLimit : investableCashBasis;
  const growthBuy = buyGaps.map(item => {
    const amount = mode === 'buy-only' ? Math.min(Math.max(0, item.diff), remainingBudget) : Math.max(0, item.diff);
    remainingBudget = mode === 'buy-only' ? Math.max(0, remainingBudget - amount) : remainingBudget;
    return withOrderAmount(item, amount);
  }).filter(item => item.amount >= 1);
  const overTargets = growthRows.filter(item => item.diff < 0).map(item => withOrderAmount(item, Math.abs(item.diff))).sort((a, b) => b.amount - a.amount);
  const growthSell = mode === 'standard' ? overTargets : [];
  const skippedSell = mode === 'buy-only' ? overTargets : [];
  const defensiveTargetPercent = getDefensiveStockTargetTotal(state.holdings);
  const defensiveCurrentWeight = m.totalAssets ? m.defensiveHoldingsValue / m.totalAssets * 100 : 0;
  const defensiveUnder = defensiveRows.filter(item => item.diff > 999).map(item => withOrderAmount(item, item.diff)).sort((a, b) => b.amount - a.amount);
  const defensiveOver = defensiveRows.filter(item => item.diff < -999).map(item => withOrderAmount(item, Math.abs(item.diff))).sort((a, b) => b.amount - a.amount);
  const defensiveNeutral = defensiveRows.filter(item => Math.abs(item.diff) <= 999).map(item => withOrderAmount(item, Math.abs(item.diff)));
  const defensiveItems = defensiveUnder.length ? defensiveUnder : defensiveOver.length ? defensiveOver : defensiveNeutral;
  const defensiveReminder: DefensiveReminder = defensiveRows.length === 0
    ? { status: 'missing', message: '目前沒有防守股票，防守資產由現金承擔。', items: [], currentWeight: defensiveCurrentWeight, targetPercent: defensiveTargetPercent }
    : defensiveUnder.length
      ? { status: 'under', message: '以下防守標的低於自訂目標，可依現金與還款安全存量分批補足。', item: defensiveUnder[0], items: defensiveUnder, currentWeight: defensiveCurrentWeight, targetPercent: defensiveTargetPercent }
      : defensiveOver.length
        ? { status: 'over', message: '以下防守標的高於自訂目標，標準再平衡時可作為資金來源。', item: defensiveOver[0], items: defensiveOver, currentWeight: defensiveCurrentWeight, targetPercent: defensiveTargetPercent }
        : { status: 'ok', message: '防守股票目前未明顯低配或高配。', item: defensiveItems[0], items: defensiveItems, currentWeight: defensiveCurrentWeight, targetPercent: defensiveTargetPercent };
  const totalBuyAmount = growthBuy.reduce((total, item) => total + item.amount, 0);
  const shortage = mode === 'standard' ? Math.max(0, totalBuyAmount - investableCashBasis) : Math.max(0, fullBuyGap - buyOnlyLimit);
  return { growthBuy, growthSell, skippedSell, defensiveReminder, cash, investableCash, totalBuyAmount, fullBuyGap, shortage, cashEnough: investableCashBasis >= totalBuyAmount, cashLimited: mode === 'buy-only' && fullBuyGap > buyOnlyLimit, mode, modeLabel: rebalanceModeLabel(mode), buyOnlyBudget, buyOnlyLimit, hasInvalidBuyOnlyBudget };
}
