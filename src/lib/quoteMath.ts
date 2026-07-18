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
export const calculateDailyProfitLoss = (shares: number, change: number | null, quoteDate: string | undefined, quoteTime: string | undefined, now = new Date()) => isTodayQuote(quoteDate, quoteTime, now) && Number.isFinite(shares) && change !== null ? stableNumber(shares * change, 4) : null;
