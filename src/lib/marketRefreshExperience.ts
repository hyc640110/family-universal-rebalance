// UI freshness policy only; never changes financial eligibility or source timestamps.
export const MARKET_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export function shouldRefreshMarket(lastAttemptAt: number | null, now: number): boolean {
  return lastAttemptAt === null || !Number.isFinite(lastAttemptAt) || lastAttemptAt > now
    || now - lastAttemptAt >= MARKET_REFRESH_INTERVAL_MS;
}

const calendarDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' });
const timestamp = (value: string | null): number => value ? Date.parse(value) : NaN;

export function marketDateAge(asOf: string | null, now: number): { text: string; attention: boolean } {
  const time = timestamp(asOf);
  if (!Number.isFinite(time) || !Number.isFinite(now)) return { text: '資料時間待確認', attention: true };
  const days = Math.round((Date.parse(calendarDate.format(now)) - Date.parse(calendarDate.format(time))) / 86_400_000);
  if (days < 0) return { text: '資料時間待確認', attention: true };
  return { text: days === 0 ? '今日資料' : `資料日期距今 ${days} 天`, attention: days > 7 };
}

export function safeMarketTime(value: string | null): string {
  const time = timestamp(value);
  return Number.isFinite(time)
    ? new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'short', timeStyle: 'short', hour12: false }).format(time)
    : '—';
}
