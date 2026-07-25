import type { Quote } from '../App';
import { SYMBOL_NAMES, normalizeSymbol, safeNumber, type OrderHelperRow, type SymbolCode } from './rebalanceOrderHelper';

// V7.0B sub-PR 5a (UR-TODO-008): dipAlertRows (逢低加碼觀察清單的價格判斷邏輯) moved out of App.tsx verbatim,
// mirroring the sub-PR 4a relocation of getOrderSuggestions, so tests/dipAlertRows.test.ts can import and exercise
// the real production code instead of a hand-rolled duplicate. This is a pure relocation (no logic, formula, or
// output change) — the dip signal here remains a price-only condition (013 §14.1: "Dip Signal 是市場或價格條件
// 訊號，不是資金資格"). Household Liquidity investableCash / funding-eligibility gating (013 §14.2 狀態矩陣) is
// explicitly out of scope for 5a and is planned for sub-PR 5b.

export type DipAlertSetting = { enabled: boolean; referencePrice: number; thresholdPct: number };
export type DipAlertRow = { symbol: SymbolCode; name: string; price: number; setting: DipAlertSetting; drawdownPct: number | null; status: string; triggered: boolean };

export const DEFAULT_DIP_ALERT_THRESHOLD = -10;

export const defaultDipAlertSetting = (): DipAlertSetting => ({ enabled: false, referencePrice: 0, thresholdPct: DEFAULT_DIP_ALERT_THRESHOLD });

export function normalizeDipAlertSetting(raw: unknown): DipAlertSetting {
  const r = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const rawThreshold = r.thresholdPct;
  const threshold = rawThreshold === undefined || rawThreshold === null || rawThreshold === '' ? DEFAULT_DIP_ALERT_THRESHOLD : safeNumber(rawThreshold);
  return { enabled: Boolean(r.enabled), referencePrice: Math.max(0, safeNumber(r.referencePrice)), thresholdPct: threshold };
}

export function getDipAlertRows(rows: OrderHelperRow[], quotes: Record<SymbolCode, Quote>, dipAlerts: Record<SymbolCode, DipAlertSetting> | undefined): DipAlertRow[] {
  return rows.map(row => {
    const symbol = normalizeSymbol(row.symbol);
    const setting = normalizeDipAlertSetting(dipAlerts?.[symbol] ?? defaultDipAlertSetting());
    const price = Math.max(0, safeNumber((quotes[symbol] || row.quote)?.price));
    const referencePrice = Math.max(0, safeNumber(setting.referencePrice));
    const drawdownPct = price > 0 && referencePrice > 0 ? (price - referencePrice) / referencePrice * 100 : null;
    const triggered = Boolean(setting.enabled && drawdownPct !== null && drawdownPct <= setting.thresholdPct);
    const status = !setting.enabled ? '未啟用' : drawdownPct === null ? '尚未設定有效波段最高價' : triggered ? '已達逢低加碼觀察條件，可列入加碼觀察' : '尚未觸發';
    return { symbol, name: row.quote.name || SYMBOL_NAMES[symbol] || symbol, price, setting, drawdownPct, triggered, status };
  });
}
