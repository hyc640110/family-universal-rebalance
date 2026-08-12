import { isCanonicalCalendarDay } from './calendarDay';
import { getFinancialAccountBalance, type FinancialAccount } from './financialAccounts';

export const FX_VALUATION_CURRENCY = 'TWD' as const;
export const USD_TWD_REFERENCE_CLOSE_RATE_TYPE = 'reference-close' as const;
export const FX_MAX_STALE_CALENDAR_DAYS = 3;
export const FX_RATE_POLICY_VERSION = 'fx-a1-v1' as const;

export type FxRateRecord = {
  id: string;
  baseCurrency: 'USD';
  quoteCurrency: typeof FX_VALUATION_CURRENCY;
  quotePerBase: number;
  rateType: typeof USD_TWD_REFERENCE_CLOSE_RATE_TYPE;
  provider: string;
  providerRecordId?: string;
  rateDate: string;
  sourcePublishedAt?: string;
  capturedAt: string;
  policyVersion: string;
};

export type FxRateHistoryNormalization = { records: FxRateRecord[]; skipped: string[] };

type ForeignCashValuationBase = {
  accountId: string;
  originalAmount: number | null;
  originalCurrency: string;
  valuationCurrency: typeof FX_VALUATION_CURRENCY;
  valuationDate: string;
};

export type ForeignCashValuation =
  | (ForeignCashValuationBase & {
    status: 'available'; rateId: string; quotePerBase: number; rateDate: string; staleDays: number; carriedForward: boolean;
    unroundedValue: number; roundedValue: number; policyVersion: string;
  })
  | (ForeignCashValuationBase & { status: 'missing-rate' })
  | (ForeignCashValuationBase & { status: 'balance-unavailable' })
  | (ForeignCashValuationBase & { status: 'unsupported-currency' })
  | (ForeignCashValuationBase & {
    status: 'stale-rate'; rateId: string; rateDate: string; staleDays: number; carriedForward: boolean; policyVersion: string;
  });

export type PinnedForeignCashValuation = Extract<ForeignCashValuation, { status: 'available' }>;

export type ForeignCashValuationInput = {
  account: FinancialAccount;
  valuationDate: string;
  rate: FxRateRecord | undefined;
  derivedBalances?: Record<string, number>;
};

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const timestamp = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
};
const dayIndex = (value: string) => Date.parse(`${value}T00:00:00.000Z`) / 86_400_000;
const isRateRecord = (value: unknown): value is FxRateRecord => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return text(row.id) !== ''
    && row.baseCurrency === 'USD'
    && row.quoteCurrency === FX_VALUATION_CURRENCY
    && Number.isFinite(row.quotePerBase) && Number(row.quotePerBase) > 0
    && row.rateType === USD_TWD_REFERENCE_CLOSE_RATE_TYPE
    && text(row.provider) !== ''
    && isCanonicalCalendarDay(row.rateDate)
    && timestamp(row.capturedAt) !== undefined
    && text(row.policyVersion) !== '';
};

function normalizeFxRateRecord(value: unknown): FxRateRecord | undefined {
  if (!isRateRecord(value)) return undefined;
  const row = value as Record<string, unknown>;
  return {
    id: text(row.id), baseCurrency: 'USD', quoteCurrency: FX_VALUATION_CURRENCY, quotePerBase: Number(row.quotePerBase),
    rateType: USD_TWD_REFERENCE_CLOSE_RATE_TYPE, provider: text(row.provider), ...(text(row.providerRecordId) ? { providerRecordId: text(row.providerRecordId) } : {}),
    rateDate: row.rateDate as string, ...(timestamp(row.sourcePublishedAt) ? { sourcePublishedAt: timestamp(row.sourcePublishedAt) } : {}),
    capturedAt: timestamp(row.capturedAt)!, policyVersion: text(row.policyVersion)
  };
}

const stableRecordKey = (record: FxRateRecord) => JSON.stringify({
  id: record.id, baseCurrency: record.baseCurrency, quoteCurrency: record.quoteCurrency, quotePerBase: record.quotePerBase,
  rateType: record.rateType, provider: record.provider, providerRecordId: record.providerRecordId ?? '', rateDate: record.rateDate,
  sourcePublishedAt: record.sourcePublishedAt ?? '', capturedAt: record.capturedAt, policyVersion: record.policyVersion
});

/** Normalizes a provider-independent, append-only rate history without overwriting an existing identity. */
export function normalizeFxRateHistory(raw: unknown): FxRateHistoryNormalization {
  const candidates = (Array.isArray(raw) ? raw : []).flatMap((value, index) => {
    const record = normalizeFxRateRecord(value);
    return record ? [{ record, index }] : [];
  });
  const skipped = (Array.isArray(raw) ? raw : []).flatMap((value, index) => normalizeFxRateRecord(value) ? [] : [`第 ${index + 1} 筆 FX rate 無效`]);
  const byId = new Map<string, FxRateRecord>();
  for (const { record } of candidates.sort((left, right) => stableRecordKey(left.record).localeCompare(stableRecordKey(right.record)))) {
    if (!byId.has(record.id)) byId.set(record.id, record);
    else skipped.push(`FX rate id 重複：${record.id}`);
  }
  return { records: [...byId.values()].sort((left, right) => left.rateDate.localeCompare(right.rateDate) || left.id.localeCompare(right.id)), skipped };
}

/** Selects only a previously published USD/TWD reference-close record; never searches after the valuation day. */
export function selectUsdTwdReferenceCloseRate(history: readonly FxRateRecord[], valuationDate: string): FxRateRecord | undefined {
  if (!isCanonicalCalendarDay(valuationDate)) return undefined;
  return normalizeFxRateHistory(history).records
    .filter(rate => rate.rateDate <= valuationDate)
    .sort((left, right) => right.rateDate.localeCompare(left.rateDate) || left.id.localeCompare(right.id))[0];
}

export function deriveForeignCashValuation(input: ForeignCashValuationInput): ForeignCashValuation | null {
  const currency = input.account.currency;
  if (currency === FX_VALUATION_CURRENCY) return null;
  const balance = getFinancialAccountBalance(input.account, { derivedBalances: input.derivedBalances });
  const base: ForeignCashValuationBase = {
    accountId: input.account.id, originalAmount: balance.value, originalCurrency: currency,
    valuationCurrency: FX_VALUATION_CURRENCY, valuationDate: input.valuationDate
  };
  if (currency !== 'USD') return { ...base, status: 'unsupported-currency' };
  if (!isCanonicalCalendarDay(input.valuationDate)) return { ...base, status: 'missing-rate' };
  if (balance.status !== 'available' || balance.value === null) return { ...base, status: 'balance-unavailable' };
  const rate = input.rate && normalizeFxRateRecord(input.rate);
  if (!rate || rate.rateDate > input.valuationDate) return { ...base, status: 'missing-rate' };
  const staleDays = dayIndex(input.valuationDate) - dayIndex(rate.rateDate);
  const carriedForward = staleDays > 0;
  if (staleDays > FX_MAX_STALE_CALENDAR_DAYS) return { ...base, status: 'stale-rate', rateId: rate.id, rateDate: rate.rateDate, staleDays, carriedForward, policyVersion: rate.policyVersion };
  const unroundedValue = balance.value * rate.quotePerBase;
  return {
    ...base, status: 'available', rateId: rate.id, quotePerBase: rate.quotePerBase, rateDate: rate.rateDate, staleDays, carriedForward,
    unroundedValue, roundedValue: Math.round(unroundedValue), policyVersion: rate.policyVersion
  };
}

function normalizePinnedForeignCashValuation(value: unknown): PinnedForeignCashValuation | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  const originalAmount = Number(row.originalAmount);
  const quotePerBase = Number(row.quotePerBase);
  const unroundedValue = Number(row.unroundedValue);
  const roundedValue = Number(row.roundedValue);
  const staleDays = Number(row.staleDays);
  if (row.status !== 'available' || text(row.accountId) === '' || row.originalCurrency !== 'USD' || row.valuationCurrency !== FX_VALUATION_CURRENCY
    || !isCanonicalCalendarDay(row.valuationDate) || text(row.rateId) === '' || !isCanonicalCalendarDay(row.rateDate)
    || !Number.isFinite(originalAmount) || originalAmount < 0 || !Number.isFinite(quotePerBase) || quotePerBase <= 0
    || !Number.isInteger(staleDays) || staleDays < 0 || staleDays > FX_MAX_STALE_CALENDAR_DAYS || row.carriedForward !== (staleDays > 0)
    || !Number.isFinite(unroundedValue) || unroundedValue !== originalAmount * quotePerBase || !Number.isFinite(roundedValue) || roundedValue !== Math.round(unroundedValue)
    || text(row.policyVersion) === '') return undefined;
  return {
    status: 'available', accountId: text(row.accountId), originalAmount, originalCurrency: 'USD', valuationCurrency: FX_VALUATION_CURRENCY,
    valuationDate: row.valuationDate as string, rateId: text(row.rateId), quotePerBase, rateDate: row.rateDate as string, staleDays,
    carriedForward: staleDays > 0, unroundedValue, roundedValue, policyVersion: text(row.policyVersion)
  };
}

/** Keeps only self-contained pinned results; no provider lookup or historical backfill occurs here. */
export function normalizePinnedForeignCashValuations(raw: unknown): PinnedForeignCashValuation[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const byAccount = new Map<string, PinnedForeignCashValuation>();
  for (const value of raw.map(normalizePinnedForeignCashValuation).filter((value): value is PinnedForeignCashValuation => value !== undefined)
    .sort((left, right) => stablePinnedKey(left).localeCompare(stablePinnedKey(right)))) {
    if (!byAccount.has(value.accountId)) byAccount.set(value.accountId, value);
  }
  const values = [...byAccount.values()].sort((left, right) => left.accountId.localeCompare(right.accountId));
  return values.length ? values : undefined;
}

const stablePinnedKey = (value: PinnedForeignCashValuation) => JSON.stringify({
  accountId: value.accountId, originalAmount: value.originalAmount, originalCurrency: value.originalCurrency, valuationCurrency: value.valuationCurrency,
  valuationDate: value.valuationDate, rateId: value.rateId, quotePerBase: value.quotePerBase, rateDate: value.rateDate, staleDays: value.staleDays,
  carriedForward: value.carriedForward, unroundedValue: value.unroundedValue, roundedValue: value.roundedValue, policyVersion: value.policyVersion
});
