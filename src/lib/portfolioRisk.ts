import { quoteDateStatus, type QuoteDateStatus } from './quoteMath';
import type { SeriesStats } from './investmentPerformanceHistory';

export type PortfolioRiskQuote = { symbol: string; marketValue: number; assetClass: 'growth' | 'defensive'; quote: { quoteDate?: string; quoteTime?: string; source: string; error?: string } };
export type PortfolioRiskInput = {
  totalAssets: number; investmentValue: number; growthValue: number; defensiveValue: number; cash: number;
  growthTargetPct: number; defensiveTargetPct: number; cashTargetPct: number; targetTotalPct: number;
  allocationDeviation: number; rebalanceThreshold: number; thresholdReached: boolean;
  risk: { overallLabel: string; primaryRisk: { title: string; status: string; reason: string }; largestHoldingRatio: number; topTwoRatio: number; topThreeRatio: number; leveragedValue: number; leveragedRatio: number; leveragedGrowthRatio: number; leveragedAssets: Array<{ symbol: string }>; debt: number; monthlyPayment: number; cashSafetyMonths: number | null };
  performance: { stats: SeriesStats; canCalculateMaxDrawdown: boolean; snapshotCount: number };
  quotes: PortfolioRiskQuote[]; rawSymbols: string[];
};

export type PortfolioRiskView = ReturnType<typeof derivePortfolioRisk>;
const n = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const backup = (source: string) => /備援|成交均價|離線/.test(source);

/** Integrates existing calculations without mutating user data or recalculating core risk formulas. */
export function derivePortfolioRisk(input: PortfolioRiskInput) {
  const totalAssets = Math.max(0, n(input.totalAssets));
  const quotes = input.quotes.map(row => ({ ...row, marketValue: Math.max(0, n(row.marketValue)), quote: { ...row.quote } }));
  const quoteStatuses = quotes.map(row => quoteDateStatus(row.quote.quoteDate, row.quote.quoteTime));
  const duplicateSymbols = [...new Set(input.rawSymbols.map(symbol => String(symbol || '').trim().toUpperCase()).filter((symbol, index, rows) => symbol && rows.indexOf(symbol) !== index))];
  const count = (status: QuoteDateStatus) => quoteStatuses.filter(value => value === status).length;
  const quality = [
    input.quotes.length === 0 ? '缺少持股資料' : '',
    quotes.filter(row => Boolean(row.quote.error)).length ? '缺報價' : '',
    count('stale') ? '過期報價' : '', count('unknown') ? '日期不明或時間不明' : '', count('unavailable') ? '交易日資料未涵蓋' : '', count('recent-trading-day') ? '最近有效交易日' : '',
    quotes.filter(row => backup(row.quote.source)).length ? '備援價格（估值可用，報價品質不足）' : '',
    duplicateSymbols.length ? `重複 symbol：${duplicateSymbols.join('、')}` : '',
    input.targetTotalPct > 100 ? '目標比例超過 100%' : '',
    !input.performance.canCalculateMaxDrawdown ? '投資資產歷史不足，無法計算最大回撤' : ''
  ].filter(Boolean);
  const denominatorLabel = '占總資產';
  return {
    risk: input.risk, totalAssets, investmentValue: Math.max(0, n(input.investmentValue)), denominatorLabel,
    current: { growth: n(input.growthValue), defensive: n(input.defensiveValue), cash: Math.max(0, n(input.cash)), growthPct: totalAssets ? n(input.growthValue) / totalAssets * 100 : 0, defensivePct: totalAssets ? n(input.defensiveValue) / totalAssets * 100 : 0, cashPct: totalAssets ? Math.max(0, n(input.cash)) / totalAssets * 100 : 0 },
    target: { growthPct: n(input.growthTargetPct), defensivePct: n(input.defensiveTargetPct), cashPct: n(input.cashTargetPct), totalPct: n(input.targetTotalPct), status: input.targetTotalPct > 100 ? '目標比例異常' : input.targetTotalPct < 100 ? '未分配比例由現金承擔' : '目標比例正常' },
    allocation: { deviation: n(input.allocationDeviation), threshold: n(input.rebalanceThreshold), thresholdReached: input.thresholdReached },
    concentration: { largestPct: n(input.risk.largestHoldingRatio), topTwoPct: n(input.risk.topTwoRatio), topThreePct: n(input.risk.topThreeRatio) },
    leverage: { value: n(input.risk.leveragedValue), totalPct: n(input.risk.leveragedRatio), growthPct: n(input.risk.leveragedGrowthRatio), symbols: input.risk.leveragedAssets.map(asset => asset.symbol) },
    cashLoan: { cash: Math.max(0, n(input.cash)), debt: n(input.risk.debt), monthlyPayment: n(input.risk.monthlyPayment), safetyMonths: input.risk.cashSafetyMonths },
    drawdown: { canCalculate: input.performance.canCalculateMaxDrawdown, snapshotCount: input.performance.snapshotCount, maxDrawdown: input.performance.stats.maxDrawdown, distanceFromHigh: input.performance.stats.distanceFromHighRate },
    quality: { items: quality, quoteStatuses, duplicateSymbols, backupCount: quotes.filter(row => backup(row.quote.source)).length }
  };
}
