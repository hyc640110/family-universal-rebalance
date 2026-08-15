import type { Quote } from '../App';
import { SYMBOL_NAMES, normalizeSymbol, safeNumber, type OrderHelperRow, type SymbolCode } from './rebalanceOrderHelper';
import type { HouseholdLiquidityOutput } from './householdLiquidity';
import { deriveDipLadderUpdate, type DipLadderState } from './dipLadderEngine';
import { quoteDateStatus } from './quoteMath';

// V7.0B sub-PR 5a (UR-TODO-008): dipAlertRows (逢低加碼觀察清單的價格判斷邏輯) moved out of App.tsx verbatim,
// mirroring the sub-PR 4a relocation of getOrderSuggestions, so tests/dipAlertRows.test.ts can import and exercise
// the real production code instead of a hand-rolled duplicate. This was a pure relocation (no logic, formula, or
// output change) — the dip signal itself remains a price-only condition (013 §14.1: "Dip Signal 是市場或價格條件
// 訊號，不是資金資格") and `triggered` below is derived from price alone, exactly as in 5a.
//
// V7.0B sub-PR 5b (013 §14.2 狀態矩陣): adds `fundingStatus`, a second, independent classification layered on top
// of (never replacing) the price-only `triggered` signal. `deriveDipFundingStatus` reuses the three
// HouseholdLiquidityOutput fields the caller already computed once (investableCash / dataCompleteness /
// safetyCashShortfall) — no parallel funding-eligibility formula is introduced here. `triggered` and `status`
// keep their pre-5b values verbatim; a safety-cash shortfall or a zero investableCash changes `fundingStatus` only,
// never the price signal itself. This mirrors sub-PR 4b's investableCash wiring into getOrderSuggestions, but for
// the dip-alert domain and using a categorical funding classification rather than a money basis, since a dip alert
// has no per-symbol requested amount of its own to reduce.

// UR-TODO-057 sub-PR 2: highWaterMark/triggeredLevel are the automatic-tracking counterpart to
// the pre-existing manual referencePrice/thresholdPct fields above — the two mechanisms are
// deliberately independent and coexist (see dipLadderEngine.ts's own doc comment: the ladder
// never reuses referencePrice as its baseline). Both new fields are additive: existing
// localStorage/JSON Backup records without them normalize to `null` (see
// normalizeDipAlertSetting() below), which is exactly "tracking not yet initialized" — the next
// accepted quote becomes the baseline, never a resurrected old manual value.
export type DipAlertSetting = { enabled: boolean; referencePrice: number; thresholdPct: number; highWaterMark: number | null; triggeredLevel: number | null };
export type DipFundingStatus = 'no-signal' | 'data-insufficient' | 'safety-cash-priority' | 'observe-only' | 'executable';
export type DipAlertRow = { symbol: SymbolCode; name: string; price: number; setting: DipAlertSetting; drawdownPct: number | null; status: string; triggered: boolean; fundingStatus: DipFundingStatus };
export type DipAlertLiquidityContext = Pick<HouseholdLiquidityOutput, 'investableCash' | 'dataCompleteness' | 'safetyCashShortfall'>;

export const DEFAULT_DIP_ALERT_THRESHOLD = -10;

export const defaultDipAlertSetting = (): DipAlertSetting => ({ enabled: false, referencePrice: 0, thresholdPct: DEFAULT_DIP_ALERT_THRESHOLD, highWaterMark: null, triggeredLevel: null });

const normalizeHighWaterMark = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null;
  const value = safeNumber(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const normalizeTriggeredLevel = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null;
  const value = safeNumber(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
};

export function normalizeDipAlertSetting(raw: unknown): DipAlertSetting {
  const r = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const rawThreshold = r.thresholdPct;
  const threshold = rawThreshold === undefined || rawThreshold === null || rawThreshold === '' ? DEFAULT_DIP_ALERT_THRESHOLD : safeNumber(rawThreshold);
  return {
    enabled: Boolean(r.enabled),
    referencePrice: Math.max(0, safeNumber(r.referencePrice)),
    thresholdPct: threshold,
    highWaterMark: normalizeHighWaterMark(r.highWaterMark),
    triggeredLevel: normalizeTriggeredLevel(r.triggeredLevel)
  };
}

/**
 * UR-TODO-057 sub-PR 2 (Strangler Pattern 串接階段): the bridge between a freshly-written
 * `quotes` map and `AppState.dipAlerts`. Runs `deriveDipLadderUpdate()` (sub-PR 1, dipLadderEngine.ts,
 * untouched by this function) for every symbol whose dip alert is enabled and has a quote
 * available. Returns the *same* `dipAlerts` reference, unchanged, when nothing actually advanced
 * — callers must skip writing state entirely in that case (normalizeState() always rebuilds a
 * fresh dipAlerts object regardless of content, so the caller cannot rely on downstream reference
 * equality to avoid marking state dirty; the check has to happen here, before any setState call).
 */
export function deriveDipAlertsAfterQuoteUpdate(
  dipAlerts: Record<SymbolCode, DipAlertSetting>,
  quotes: Record<SymbolCode, Quote>,
  now = new Date()
): Record<SymbolCode, DipAlertSetting> {
  let changed = false;
  const next: Record<SymbolCode, DipAlertSetting> = { ...dipAlerts };
  for (const symbol of Object.keys(dipAlerts)) {
    const setting = dipAlerts[symbol];
    if (!setting.enabled) continue;
    const quote = quotes[symbol];
    if (!quote) continue;
    const current: DipLadderState = { highWaterMark: setting.highWaterMark, triggeredLevel: setting.triggeredLevel };
    const result = deriveDipLadderUpdate(current, {
      price: quote.price,
      quoteStatus: quoteDateStatus(quote.quoteDate, quote.quoteTime, now),
      quoteSource: quote.source
    });
    if (result.ignored) continue;
    if (result.state.highWaterMark === setting.highWaterMark && result.state.triggeredLevel === setting.triggeredLevel) continue;
    next[symbol] = { ...setting, highWaterMark: result.state.highWaterMark, triggeredLevel: result.state.triggeredLevel };
    changed = true;
  }
  return changed ? next : dipAlerts;
}

// 013 §14.2 五列狀態矩陣：無訊號一律 no-signal；有訊號時再依資料完整度／安全存量／可投資現金分流。
// dataCompleteness !== 'complete'、investableCash === null、safetyCashShortfall === null 三者只要有一個成立，
// 代表家庭流動性資料不足以判斷資金資格，一律歸類 data-insufficient（對應矩陣第 2 列「否／未知／未知」）。
export function deriveDipFundingStatus(triggered: boolean, liquidity: DipAlertLiquidityContext): DipFundingStatus {
  if (!triggered) return 'no-signal';
  if (liquidity.dataCompleteness !== 'complete' || liquidity.investableCash === null || liquidity.safetyCashShortfall === null) return 'data-insufficient';
  if (liquidity.safetyCashShortfall > 0) return 'safety-cash-priority';
  if (liquidity.investableCash === 0) return 'observe-only';
  return 'executable';
}

export function getDipAlertRows(rows: OrderHelperRow[], quotes: Record<SymbolCode, Quote>, dipAlerts: Record<SymbolCode, DipAlertSetting> | undefined, liquidity: DipAlertLiquidityContext): DipAlertRow[] {
  return rows.map(row => {
    const symbol = normalizeSymbol(row.symbol);
    const setting = normalizeDipAlertSetting(dipAlerts?.[symbol] ?? defaultDipAlertSetting());
    const price = Math.max(0, safeNumber((quotes[symbol] || row.quote)?.price));
    const referencePrice = Math.max(0, safeNumber(setting.referencePrice));
    const drawdownPct = price > 0 && referencePrice > 0 ? (price - referencePrice) / referencePrice * 100 : null;
    const triggered = Boolean(setting.enabled && drawdownPct !== null && drawdownPct <= setting.thresholdPct);
    const status = !setting.enabled ? '未啟用' : drawdownPct === null ? '尚未設定有效波段最高價' : triggered ? '已達逢低加碼觀察條件，可列入加碼觀察' : '尚未觸發';
    const fundingStatus = deriveDipFundingStatus(triggered, liquidity);
    return { symbol, name: row.quote.name || SYMBOL_NAMES[symbol] || symbol, price, setting, drawdownPct, triggered, status, fundingStatus };
  });
}
