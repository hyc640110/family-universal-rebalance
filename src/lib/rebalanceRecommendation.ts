import type { QuoteDateStatus } from './quoteMath';

export type RebalanceRecommendationMode = 'standard' | 'buy-only';
export type RecommendationAction = 'buy' | 'sell' | 'hold' | 'blocked';
export type RecommendationHolding = {
  symbol: string; name: string; marketValue: number; currentWeight: number; targetWeight: number;
  assetClass: 'growth' | 'defensive'; price: number; quoteStatus: QuoteDateStatus; quoteSource: string; quoteError?: string;
};
export type RebalanceRecommendationInput = {
  totalAssets: number; liquidCash: number; buyOnlyBudget: number; rebalanceMode: RebalanceRecommendationMode;
  rebalanceThreshold: number; allocationDeviation: number; targetTotal: number; cashTargetPct: number;
  holdings: RecommendationHolding[]; duplicateSymbols: string[]; otherAssetValue?: number;
  allocation: { growth: { currentValue: number; targetWeight: number }; defensive: { currentValue: number; targetWeight: number }; cash: { currentValue: number } };
};
export type RebalanceRecommendationRow = {
  symbol: string; name: string; assetClass: 'growth' | 'defensive'; currentValue: number; currentWeight: number; targetWeight: number;
  targetValue: number; difference: number; action: RecommendationAction; recommendedAmount: number | null; unresolvedAmount: number | null; reason: string; priority: number | null;
};

const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const number = (value: unknown) => finite(value) ? Number(value) : 0;
const backup = (source: unknown) => /備援|成交均價|離線/.test(String(source ?? ''));
const amountFloor = 1;

/** Pure, amount-only recommendation model. It never reads storage, fetches data, or mutates its input. */
export function deriveRebalanceRecommendation(input: RebalanceRecommendationInput) {
  const totalAssets = number(input.totalAssets);
  const liquidCash = Math.max(0, number(input.liquidCash));
  const targetTotal = number(input.targetTotal);
  const cashTargetPct = Math.max(0, number(input.cashTargetPct));
  const mode = input.rebalanceMode === 'standard' ? 'standard' as const : 'buy-only' as const;
  const blockingReasons = [
    !input.holdings.length ? '尚無持股資料，無法計算個別標的建議。' : '',
    !finite(input.totalAssets) || totalAssets <= 0 ? '總資產不是有效正數，無法計算目標市值。' : '',
    !finite(input.targetTotal) || targetTotal > 100 ? '持股目標比例總和超過 100%，請先修正目標比例。' : '',
    input.duplicateSymbols.length ? `偵測到重複 symbol：${input.duplicateSymbols.join('、')}，請先合併或修正持股資料。` : '',
    number(input.otherAssetValue) > amountFloor ? '總資產含有未分類的非持股／非流動現金資產，無法可靠分配投資目標。' : '',
    ...input.holdings.flatMap(holding => [
      holding.quoteError ? `${holding.symbol} 缺少可用報價：${holding.quoteError}` : '',
      !finite(holding.price) || holding.price <= 0 ? `${holding.symbol} 價格不足或不是有效正數。` : '',
      holding.quoteStatus === 'stale' ? `${holding.symbol} 為過期報價。` : '',
      holding.quoteStatus === 'unknown' ? `${holding.symbol} 報價日期不明。` : '',
      holding.quoteStatus === 'unavailable' ? `${holding.symbol} 交易日資料未涵蓋。` : '',
      backup(holding.quoteSource) ? `${holding.symbol} 使用備援價格。` : '',
      !finite(holding.marketValue) || holding.marketValue < 0 || !finite(holding.targetWeight) || holding.targetWeight < 0 ? `${holding.symbol} 持股或目標資料不足。` : ''
    ])
  ].filter(Boolean);
  const thresholdReached = Math.abs(number(input.allocationDeviation)) >= Math.max(0, number(input.rebalanceThreshold));
  const thresholdGap = Math.max(0, Math.abs(number(input.allocationDeviation)) - Math.max(0, number(input.rebalanceThreshold)));
  const canRecommend = blockingReasons.length === 0;
  const baseRows = input.holdings.map(holding => {
    const currentValue = Math.max(0, number(holding.marketValue));
    const targetWeight = Math.max(0, number(holding.targetWeight));
    const targetValue = totalAssets > 0 ? totalAssets * targetWeight / 100 : 0;
    return { ...holding, currentValue, targetWeight, targetValue, difference: targetValue - currentValue };
  });
  if (!canRecommend) {
    return {
      canRecommend, blockingReasons, mode, totalAssets: finite(input.totalAssets) ? totalAssets : null, liquidCash, cashTargetPct, cashTargetValue: totalAssets > 0 ? totalAssets * cashTargetPct / 100 : null, targetTotal,
      thresholdReached, allocationDeviation: finite(input.allocationDeviation) ? number(input.allocationDeviation) : null, thresholdGap,
      allocation: input.allocation, rows: baseRows.map(row => ({ ...row, action: 'blocked' as const, recommendedAmount: null, unresolvedAmount: null, reason: '資料品質 gate 尚未通過，停止所有具體金額建議。', priority: null })),
      buyTotal: null, sellTotal: null, netCashImpact: null, availableBuyBudget: null, usedBuyBudget: null, remainingBudget: null, unresolvedGap: null, cashShortfall: null,
      notices: ['請先更新或修正上述資料，再重新計算。'], limitations: ['不以 0 元取代無法計算結果。']
    };
  }
  const rankedBuys = baseRows.filter(row => row.difference > amountFloor).sort((a, b) => b.difference - a.difference || a.symbol.localeCompare(b.symbol));
  const availableBuyBudget = mode === 'buy-only' ? Math.max(0, Math.min(number(input.buyOnlyBudget), liquidCash)) : liquidCash;
  const buyAmounts = new Map<string, number>();
  if (mode === 'buy-only') {
    let remaining = availableBuyBudget;
    rankedBuys.forEach(row => {
      const amount = Math.min(row.difference, remaining);
      buyAmounts.set(row.symbol, amount);
      remaining = Math.max(0, remaining - amount);
    });
  }
  let rank = 0;
  const rows = baseRows.map(row => {
    if (Math.abs(row.difference) <= amountFloor) return { ...row, action: 'hold' as const, recommendedAmount: 0, unresolvedAmount: 0, reason: '目前市值已接近目標市值。', priority: null };
    if (row.difference < 0) {
      if (mode === 'buy-only') return { ...row, action: 'hold' as const, recommendedAmount: 0, unresolvedAmount: 0, reason: '只買不賣模式下，超配標的不賣出也不加碼。', priority: null };
      const amount = Math.min(row.currentValue, Math.abs(row.difference));
      return { ...row, action: 'sell' as const, recommendedAmount: amount, unresolvedAmount: Math.max(0, Math.abs(row.difference) - amount), reason: '目前市值高於目標市值。', priority: ++rank };
    }
    const amount = mode === 'buy-only' ? buyAmounts.get(row.symbol) ?? 0 : row.difference;
    return { ...row, action: 'buy' as const, recommendedAmount: amount, unresolvedAmount: Math.max(0, row.difference - amount), reason: mode === 'buy-only' ? '依低配缺口由大到小分配可投入預算。' : '目前市值低於目標市值。', priority: rankedBuys.findIndex(item => item.symbol === row.symbol) + 1 };
  });
  const buyTotal = rows.reduce((sum, row) => sum + (row.action === 'buy' ? row.recommendedAmount ?? 0 : 0), 0);
  const sellTotal = rows.reduce((sum, row) => sum + (row.action === 'sell' ? row.recommendedAmount ?? 0 : 0), 0);
  const unresolvedGap = rows.reduce((sum, row) => sum + Math.max(0, row.unresolvedAmount ?? 0), 0);
  return {
    canRecommend, blockingReasons, mode, totalAssets, liquidCash, cashTargetPct, cashTargetValue: totalAssets * cashTargetPct / 100, targetTotal,
    thresholdReached, allocationDeviation: number(input.allocationDeviation), thresholdGap, allocation: input.allocation, rows,
    buyTotal, sellTotal, netCashImpact: buyTotal - sellTotal, availableBuyBudget, usedBuyBudget: buyTotal, remainingBudget: mode === 'buy-only' ? Math.max(0, availableBuyBudget - buyTotal) : Math.max(0, liquidCash - buyTotal), unresolvedGap,
    cashShortfall: mode === 'standard' ? Math.max(0, buyTotal - liquidCash) : 0,
    notices: [thresholdReached ? `配置偏離已達門檻，超過 ${thresholdGap.toFixed(2)} 個百分點。` : '目前未達執行門檻；以下僅為理論配置差額。', mode === 'standard' ? '理論賣出所得與現有流動現金分開呈現，不假設可立即用於買入。' : '只買不賣模式依最大缺口優先，預算用完即停止。'],
    limitations: ['金額為理論試算，未含手續費、交易稅與滑價。', '不構成投資建議，不代表必須立即執行。', '不預測價格或市場時機。']
  };
}
