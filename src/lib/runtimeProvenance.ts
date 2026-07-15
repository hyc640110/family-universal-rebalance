export type QuoteProvenance = { symbol: string; source: string; quoteDate?: string; quoteTime?: string; updatedAt: string; error?: string };

const display = (value: string | undefined) => value?.trim() || '—';

export function describeMarketRuntime(endpoint: string, cacheControl?: string | null) {
  if (!endpoint) return { endpoint: '未設定（此環境不會請求 Market Worker）', cache: '未發出請求；沒有可回報的 response cache header。' };
  return {
    endpoint,
    cache: cacheControl || '本次 response 未提供 Cache-Control；前端僅保留本頁記憶體快照，不寫入 localStorage。',
  };
}

export function quoteProvenanceText(quotes: QuoteProvenance[]) {
  return quotes.map(quote => `${quote.symbol}｜來源：${display(quote.source)}｜報價日：${display(quote.quoteDate)}｜報價時：${display(quote.quoteTime)}｜本機更新：${display(quote.updatedAt)}${quote.error ? `｜錯誤：${quote.error}` : ''}`);
}
