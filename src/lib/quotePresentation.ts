import { quoteDateStatus, quoteDateStatusLabel, type QuoteDateStatus } from './quoteMath';

export type QuotePresentationInput = {
  source: string;
  quoteDate?: string;
  quoteTime?: string;
  updatedAt?: string;
  error?: string;
};

export type QuoteSourceKind = 'worker' | 'preserved' | 'backup' | 'average-cost';

const clean = (value: string | undefined) => value?.trim() || '';

export function describeQuotePresentation(quote: QuotePresentationInput, now = new Date()) {
  const source = clean(quote.source) || '來源未提供';
  const hasFailure = Boolean(clean(quote.error)) || source.includes('更新失敗');
  const isAverageCost = source.includes('成交均價');
  const isBackup = source.includes('備援');
  const isPreserved = hasFailure && !isAverageCost && Boolean(quote.quoteDate && quote.quoteTime);
  const sourceKind: QuoteSourceKind = isAverageCost ? 'average-cost' : isPreserved ? 'preserved' : isBackup ? 'backup' : 'worker';
  const freshness: QuoteDateStatus = quoteDateStatus(quote.quoteDate, quote.quoteTime, now);
  const marketTimestamp = quote.quoteDate && quote.quoteTime ? `${quote.quoteDate} ${quote.quoteTime}` : null;
  const receiptTimestamp = clean(quote.updatedAt) || null;
  const isFallback = sourceKind !== 'worker';
  const statusLabel = sourceKind === 'average-cost'
    ? '成交均價備援，非市場報價。'
    : sourceKind === 'preserved'
      ? `已保留前次有效報價；本次更新失敗${clean(quote.error) ? `：${clean(quote.error)}` : '。'}`
      : sourceKind === 'backup'
        ? '備援報價，非即時市場報價。'
        : quoteDateStatusLabel(freshness);

  return { source, sourceKind, freshness, freshnessLabel: quoteDateStatusLabel(freshness), marketTimestamp, receiptTimestamp, isFallback, isPreserved, statusLabel };
}
