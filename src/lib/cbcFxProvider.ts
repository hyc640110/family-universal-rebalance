import { isCanonicalCalendarDay } from './calendarDay';
import { FX_MAX_STALE_CALENDAR_DAYS, FX_RATE_POLICY_VERSION, FX_VALUATION_CURRENCY, USD_TWD_REFERENCE_CLOSE_RATE_TYPE, normalizeFxRateHistory, type FxRateRecord } from './fxValuation';

export const CBC_USD_TWD_PROVIDER = 'Central Bank of the Republic of China (Taiwan) — Interbank Closing Rate';

export type CbcUsdTwdUnavailableReason = 'provider-http' | 'timeout' | 'provider-invalid-json' | 'schema-changed' | 'invalid-latest' | 'provider-conflict' | 'stale-latest' | 'empty-result';
export type CbcUsdTwdAvailableResponse = {
  status: 'available'; baseCurrency: 'USD'; quoteCurrency: typeof FX_VALUATION_CURRENCY; rateType: typeof USD_TWD_REFERENCE_CLOSE_RATE_TYPE;
  rateDate: string; quotePerBase: number; provider: typeof CBC_USD_TWD_PROVIDER; capturedAt: string;
};
export type CbcUsdTwdUnavailableResponse = { status: 'unavailable'; reason: CbcUsdTwdUnavailableReason; capturedAt: string };
export type CbcUsdTwdWorkerResponse = CbcUsdTwdAvailableResponse | CbcUsdTwdUnavailableResponse;
export type CbcUsdTwdAppendResult = { status: 'appended' | 'unchanged' | 'provider-conflict'; history: FxRateRecord[] };
export type CbcUsdTwdRefreshResult = CbcUsdTwdAppendResult | { status: CbcUsdTwdUnavailableReason; history: FxRateRecord[] };

const timestamp = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
};
const dayIndex = (value: string) => Date.parse(`${value}T00:00:00.000Z`) / 86_400_000;
const unavailable = (reason: CbcUsdTwdUnavailableReason, capturedAt: string): CbcUsdTwdUnavailableResponse => ({ status: 'unavailable', reason, capturedAt });

/** Validates the narrow normalized Worker contract; CBC raw JSON never reaches the App. */
export function parseCbcUsdTwdWorkerResponse(raw: unknown): CbcUsdTwdWorkerResponse {
  const row = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : undefined;
  const capturedAt = timestamp(row?.capturedAt);
  if (!row || !capturedAt || typeof row.status !== 'string') return unavailable('provider-invalid-json', capturedAt ?? new Date().toISOString());
  if (row.status === 'unavailable') {
    const reason = row.reason;
    const reasons: CbcUsdTwdUnavailableReason[] = ['provider-http', 'timeout', 'provider-invalid-json', 'schema-changed', 'invalid-latest', 'provider-conflict', 'stale-latest', 'empty-result'];
    return typeof reason === 'string' && reasons.includes(reason as CbcUsdTwdUnavailableReason)
      ? unavailable(reason as CbcUsdTwdUnavailableReason, capturedAt)
      : unavailable('provider-invalid-json', capturedAt);
  }
  if (row.status !== 'available' || row.baseCurrency !== 'USD' || row.quoteCurrency !== FX_VALUATION_CURRENCY || row.rateType !== USD_TWD_REFERENCE_CLOSE_RATE_TYPE
    || row.provider !== CBC_USD_TWD_PROVIDER || !isCanonicalCalendarDay(row.rateDate) || !Number.isFinite(row.quotePerBase) || Number(row.quotePerBase) <= 0) {
    return unavailable('provider-invalid-json', capturedAt);
  }
  return { status: 'available', baseCurrency: 'USD', quoteCurrency: FX_VALUATION_CURRENCY, rateType: USD_TWD_REFERENCE_CLOSE_RATE_TYPE,
    rateDate: row.rateDate, quotePerBase: Number(row.quotePerBase), provider: CBC_USD_TWD_PROVIDER, capturedAt };
}

export function toCbcUsdTwdFxRateRecord(response: CbcUsdTwdAvailableResponse, policyVersion = FX_RATE_POLICY_VERSION): FxRateRecord {
  return { id: `cbc-ftd-usd-twd-reference-close-${response.rateDate}`, baseCurrency: 'USD', quoteCurrency: FX_VALUATION_CURRENCY,
    quotePerBase: response.quotePerBase, rateType: USD_TWD_REFERENCE_CLOSE_RATE_TYPE, provider: CBC_USD_TWD_PROVIDER,
    rateDate: response.rateDate, capturedAt: response.capturedAt, policyVersion };
}

/** Appends only a new, unambiguous CBC close and never mutates a persisted record. */
export function appendCbcUsdTwdFxRate(history: readonly FxRateRecord[], candidate: FxRateRecord): CbcUsdTwdAppendResult {
  if (normalizeFxRateHistory([candidate]).records.length !== 1) return { status: 'provider-conflict', history: [...history] };
  const sameDay = history.filter(rate => rate.baseCurrency === 'USD' && rate.quoteCurrency === FX_VALUATION_CURRENCY
    && rate.rateType === USD_TWD_REFERENCE_CLOSE_RATE_TYPE && rate.rateDate === candidate.rateDate);
  if (sameDay.some(rate => rate.quotePerBase !== candidate.quotePerBase)) return { status: 'provider-conflict', history: [...history] };
  if (sameDay.length) return { status: 'unchanged', history: [...history] };
  return { status: 'appended', history: [...history, candidate] };
}

export async function fetchCbcUsdTwdFxRateHistory(input: {
  endpoint: string; history: readonly FxRateRecord[]; today: string; manual?: boolean; fetchFn?: typeof fetch; policyVersion?: typeof FX_RATE_POLICY_VERSION;
}): Promise<CbcUsdTwdRefreshResult> {
  const history = [...input.history];
  if (!isCanonicalCalendarDay(input.today)) return { status: 'invalid-latest', history };
  try {
    const fetchFn = input.fetchFn ?? fetch;
    const url = new URL(`${input.endpoint.replace(/\/$/, '')}/fx-rates/usd-twd`);
    if (input.manual) url.searchParams.set('refresh', '1');
    const response = await fetchFn(url, { cache: input.manual ? 'no-store' : 'default', headers: { accept: 'application/json' } });
    if (!response.ok) return { status: 'provider-http', history };
    let raw: unknown;
    try { raw = await response.json(); } catch { return { status: 'provider-invalid-json', history }; }
    const parsed = parseCbcUsdTwdWorkerResponse(raw);
    if (parsed.status === 'unavailable') return { status: parsed.reason, history };
    if (parsed.rateDate > input.today) return { status: 'invalid-latest', history };
    if (dayIndex(input.today) - dayIndex(parsed.rateDate) > FX_MAX_STALE_CALENDAR_DAYS) return { status: 'stale-latest', history };
    return appendCbcUsdTwdFxRate(history, toCbcUsdTwdFxRateRecord(parsed, input.policyVersion));
  } catch {
    return { status: 'provider-http', history };
  }
}
