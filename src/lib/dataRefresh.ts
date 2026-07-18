export type QuoteRefreshResult = { symbol: string; error?: string };
export type MarketRefreshOutcome = 'updated' | 'unchanged' | 'partial' | 'failed';
type RefreshableQuote = { source: string; error?: string };

export const mergeQuoteRefresh = <T extends RefreshableQuote>(previous: T | undefined, incoming: T): T =>
  incoming.error && previous ? { ...previous, error: incoming.error, source: `${previous.source} / 更新失敗` } : incoming;

export const isValidQuoteTimestamp = (quoteDate: unknown, quoteTime: unknown) =>
  typeof quoteDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(quoteDate) &&
  typeof quoteTime === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(quoteTime);

export const refreshUrl = (endpoint: string, path: string, manual = false, requestId = Date.now()) => {
  const url = new URL(`${endpoint.replace(/\/$/, '')}${path}`, 'https://refresh.invalid');
  if (manual) {
    url.searchParams.set('refresh', '1');
    url.searchParams.set('request', String(requestId));
  }
  return endpoint.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`;
};

export const quoteRefreshRequestInit = (manual = false): RequestInit => ({ cache: manual ? 'no-store' : 'default' });

export const quoteRefreshStatus = (results: QuoteRefreshResult[], at: string) => {
  const failed = results.filter(result => result.error);
  const succeeded = results.length - failed.length;
  if (!results.length) return { succeeded, failed, message: '目前沒有可更新的持股代號。' };
  if (!succeeded) return { succeeded, failed, message: `股價更新失敗：${failed.map(result => `${result.symbol}: ${result.error}`).join(' / ')}` };
  if (failed.length) return { succeeded, failed, message: `股價部分更新成功（${succeeded}/${results.length}）：${failed.map(result => `${result.symbol}: ${result.error}`).join(' / ')}` };
  return { succeeded, failed, message: `股價更新成功（${succeeded}/${results.length}）：${at}` };
};

export const quoteRefreshErrorLabel = (error?: string) => {
  const value = String(error || '').toLowerCase();
  if (value.includes('429') || value.includes('rate limit')) return '請求過於頻繁，已保留前次報價。';
  if (value.includes('timeout') || value.includes('timed out') || value.includes('abort')) return '上游暫時無回應，已保留前次報價。';
  if (value.includes('date') || value.includes('time') || value.includes('timestamp')) return '報價日期格式異常，已保留前次報價。';
  if (value.includes('worker') || value.includes('endpoint') || value.includes('cors')) return 'Preview Worker 設定異常，已保留前次報價。';
  if (value.includes('http') || value.includes('upstream') || value.includes('schema')) return '上游報價服務暫時失敗，已保留前次報價。';
  return '部分標的更新失敗，已保留前次報價。';
};

export const marketContentSignature = (snapshot: { status: string; items: Array<{ id: string; value: number | null; change: number | null; changePct: number | null; asOf: string | null; status: string }> }) =>
  JSON.stringify({ status: snapshot.status, items: snapshot.items.map(item => ({ id: item.id, value: item.value, change: item.change, changePct: item.changePct, asOf: item.asOf, status: item.status })) });

export const marketRefreshOutcome = (previousSignature: string | null, snapshot: { fetchedAt: string | null; status: string; items: Array<{ id: string; value: number | null; change: number | null; changePct: number | null; asOf: string | null; status: string }> }) : MarketRefreshOutcome => {
  if (!snapshot.fetchedAt || snapshot.status === 'failed') return 'failed';
  return previousSignature === marketContentSignature(snapshot) ? 'unchanged' : 'updated';
};

export const marketRefreshMessage = (outcome: MarketRefreshOutcome, fetchedAt: string | null, formatTime: (value: string) => string, detail = '', unavailable = '') => {
  if (outcome === 'failed') return '市場資料重新取得失敗；保留目前可用資料並顯示服務狀態。';
  const at = fetchedAt ? formatTime(fetchedAt) : '時間不明';
  const sourceNote = unavailable ? `。${unavailable}` : '';
  if (outcome === 'partial') return `本次取得完成：${at}。部分區塊沿用前次有效資料${detail ? `：${detail}` : ''}${sourceNote}`;
  return outcome === 'unchanged' ? `已重新取得，受管理資料內容未變：${at}${detail ? `（${detail}）` : ''}${sourceNote}` : `已重新取得：${at}${detail ? `（${detail}）` : ''}${sourceNote}`;
};
