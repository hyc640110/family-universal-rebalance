import { mergeQuoteRefresh, quoteRefreshStatus } from './dataRefresh';

export type QuoteRefreshRequestOptions = { endpoint: string; manual: boolean };

type RefreshableQuote = { symbol: string; source: string; error?: string };
type RefreshableHolding = { symbol: string };
type QuoteRefreshEntry<Symbol extends string, Quote extends RefreshableQuote> = readonly [Symbol, Quote];

export type QuoteRefreshControllerOptions<
  Holding extends RefreshableHolding,
  Symbol extends string,
  Quote extends RefreshableQuote,
> = {
  endpoint: string;
  getSnapshot: () => { holdings: Holding[]; symbols: Symbol[] };
  findHolding: (holdings: Holding[], symbol: Symbol) => Holding | undefined;
  requestQuote: (symbol: Symbol, holding: Holding | undefined, options: QuoteRefreshRequestOptions) => Promise<Quote>;
  setQuotes: (updater: (current: Record<Symbol, Quote>) => Record<Symbol, Quote>) => void;
  setHasUpdatedQuotes: (value: boolean) => void;
  setStatus: (value: string) => void;
  setIsRefreshing: (value: boolean) => void;
  formatRefreshTime: () => string;
  applyNameAutofill: (entries: QuoteRefreshEntry<Symbol, Quote>[], holdings: Holding[]) => void;
};

export const createQuoteRefreshController = <
  Holding extends RefreshableHolding,
  Symbol extends string,
  Quote extends RefreshableQuote,
>(options: QuoteRefreshControllerOptions<Holding, Symbol, Quote>) => {
  let inFlight = false;

  const refresh = async (manual = false) => {
    if (inFlight) return;
    inFlight = true;
    options.setIsRefreshing(true);
    options.setStatus('股價更新中…');
    try {
      const { holdings, symbols } = options.getSnapshot();
      if (!symbols.length) {
        options.setHasUpdatedQuotes(false);
        options.setStatus('目前沒有可更新的持股代號。');
        return;
      }
      const entries = await Promise.all(symbols.map(async symbol => [
        symbol,
        await options.requestQuote(symbol, options.findHolding(holdings, symbol), { endpoint: options.endpoint, manual }),
      ] as const));
      const summary = quoteRefreshStatus(entries.map(([symbol, quote]) => ({ symbol, error: quote.error })), options.formatRefreshTime());
      options.setQuotes(current => Object.fromEntries(entries.map(([symbol, quote]) => [
        symbol,
        mergeQuoteRefresh(current[symbol], quote),
      ])) as Record<Symbol, Quote>);
      options.setHasUpdatedQuotes(summary.succeeded > 0);
      options.applyNameAutofill(entries, holdings);
      options.setStatus(summary.message);
    } catch (error) {
      options.setStatus(`股價更新失敗：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      inFlight = false;
      options.setIsRefreshing(false);
    }
  };

  return { refresh, isInFlight: () => inFlight };
};
