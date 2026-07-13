const taipeiParts = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).reduce<Record<string, string>>((parts, part) => ({ ...parts, [part.type]: part.value }), {});
export const taipeiDate = (value = new Date()) => { const parts = taipeiParts(value); return `${parts.year}-${parts.month}-${parts.day}`; };
export const isTodayQuote = (quoteDate: string | undefined, now = new Date()) => Boolean(quoteDate && quoteDate === taipeiDate(now));
const stableNumber = (value: number, decimals = 8) => Number(value.toFixed(decimals));
export const calculateQuoteChange = (latestPrice: number, previousClose: number) => Number.isFinite(latestPrice) && Number.isFinite(previousClose) && previousClose > 0 ? stableNumber(latestPrice - previousClose) : null;
export const calculateDailyProfitLoss = (shares: number, change: number | null, quoteDate: string | undefined, now = new Date()) => isTodayQuote(quoteDate, now) && Number.isFinite(shares) && change !== null ? stableNumber(shares * change, 4) : null;
