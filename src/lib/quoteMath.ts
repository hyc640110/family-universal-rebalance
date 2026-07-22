import { latestTaiwanTradingDate } from './taiwanTradingCalendar';

const taipeiParts = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).reduce<Record<string, string>>((parts, part) => ({ ...parts, [part.type]: part.value }), {});
export const taipeiDate = (value = new Date()) => { const parts = taipeiParts(value); return `${parts.year}-${parts.month}-${parts.day}`; };
export type QuoteDateStatus = 'today' | 'recent-trading-day' | 'stale' | 'unknown' | 'unavailable';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (date: string) => { if (!datePattern.test(date)) return false; const [year, month, day] = date.split('-').map(Number); const value = new Date(Date.UTC(year, month - 1, day)); return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day; };
const validTime = (value: string | undefined) => typeof value === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(value);

export const quoteDateStatus = (quoteDate: string | undefined, quoteTime: string | undefined, now = new Date()): QuoteDateStatus => {
  if (!quoteDate || !validDate(quoteDate) || !validTime(quoteTime)) return 'unknown';
  const today = taipeiDate(now);
  const latestTradingDate = latestTaiwanTradingDate(today);
  if (!latestTradingDate) return 'unavailable';
  if (quoteDate !== latestTradingDate) return 'stale';
  return quoteDate === today ? 'today' : 'recent-trading-day';
};
export const quoteDateStatusLabel = (status: QuoteDateStatus) => ({ today: '今日報價', 'recent-trading-day': '最近交易日', stale: '非今日報價', unknown: '日期或時間不明', unavailable: '交易日資料未涵蓋' })[status];
export const isTodayQuote = (quoteDate: string | undefined, quoteTime: string | undefined, now = new Date()) => quoteDateStatus(quoteDate, quoteTime, now) === 'today';
const stableNumber = (value: number, decimals = 8) => Number(value.toFixed(decimals));
export const calculateQuoteChange = (latestPrice: number, previousClose: number) => Number.isFinite(latestPrice) && Number.isFinite(previousClose) && previousClose > 0 ? stableNumber(latestPrice - previousClose) : null;
export type DailyChangeDirection = 'up' | 'down' | 'flat' | 'unknown';
export type TrustedDailyChangeInput = {
  currentPrice: number;
  previousClose: number | null | undefined;
  previousCloseDate: string | null | undefined;
  quoteDate: string | null | undefined;
  previousCloseTrusted: boolean | undefined;
};
export type TrustedDailyChange = {
  currentPrice: number;
  previousClose: number | null;
  previousCloseDate: string | null;
  change: number | null;
  changePercent: number | null;
  direction: DailyChangeDirection;
  isTrusted: boolean;
  reason: string | null;
};
export const deriveTrustedDailyChange = (input: TrustedDailyChangeInput): TrustedDailyChange => {
  const currentPrice = Number(input.currentPrice);
  const previousClose = Number(input.previousClose);
  const previousCloseDate = typeof input.previousCloseDate === 'string' ? input.previousCloseDate : null;
  const quoteDate = typeof input.quoteDate === 'string' ? input.quoteDate : null;
  const validTrustedPair = input.previousCloseTrusted === true
    && Number.isFinite(currentPrice) && currentPrice > 0
    && Number.isFinite(previousClose) && previousClose > 0
    && previousCloseDate !== null && quoteDate !== null
    && validDate(previousCloseDate) && validDate(quoteDate) && previousCloseDate < quoteDate;
  if (!validTrustedPair) return { currentPrice: Number.isFinite(currentPrice) ? currentPrice : 0, previousClose: null, previousCloseDate: null, change: null, changePercent: null, direction: 'unknown', isTrusted: false, reason: 'previous_close_untrusted' };
  const change = stableNumber(currentPrice - previousClose);
  const changePercent = stableNumber(change / previousClose * 100);
  return { currentPrice, previousClose, previousCloseDate, change, changePercent, direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat', isTrusted: true, reason: null };
};
export const calculateDailyProfitLoss = (shares: number, change: number | null, quoteDate: string | undefined, quoteTime: string | undefined, now = new Date(), previousCloseTrusted = true) => previousCloseTrusted && isTodayQuote(quoteDate, quoteTime, now) && Number.isFinite(shares) && change !== null ? stableNumber(shares * change, 4) : null;
