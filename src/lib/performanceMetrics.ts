export type PerformanceAssetInput = {
  symbol: string;
  name?: string;
  shares: number;
  avgCost: number;
  marketValue: number;
  cost: number;
  pnl: number;
  dayPnl: number;
  previousClose?: number;
};

export type PerformanceAsset = {
  symbol: string;
  name: string;
  shares: number;
  cost: number;
  marketValue: number;
  unrealizedPnl: number;
  returnRate: number | null;
  contributionAmount: number;
  contributionRatio: number | null;
  previousMarketValue: number | null;
};

export type PortfolioPerformance = {
  assets: PerformanceAsset[];
  totalCost: number;
  totalMarketValue: number;
  unrealizedPnl: number;
  returnRate: number | null;
  todayPnl: number;
  todayReturnRate: number | null;
  totalPositivePnl: number;
};

export type PortfolioConcentration = {
  largestMarketValueRatio: number | null;
  topThreeMarketValueRatio: number | null;
  largestProfitRatio: number | null;
  topThreeProfitRatio: number | null;
  largestAsset?: PerformanceAsset;
  largestProfitAsset?: PerformanceAsset;
};

const finite = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const safeRatio = (numerator: number, denominator: number): number | null => denominator > 0 && Number.isFinite(numerator) && Number.isFinite(denominator) ? numerator / denominator : null;

export function calculateAssetCost(asset: Pick<PerformanceAssetInput, 'shares' | 'avgCost' | 'cost'>): number {
  const explicitCost = finite(asset.cost);
  return explicitCost > 0 ? explicitCost : Math.max(0, finite(asset.shares)) * Math.max(0, finite(asset.avgCost));
}

export function calculateAssetMarketValue(asset: Pick<PerformanceAssetInput, 'marketValue'>): number {
  return Math.max(0, finite(asset.marketValue));
}

export function calculateAssetUnrealizedPnl(asset: Pick<PerformanceAssetInput, 'marketValue' | 'cost'>): number {
  return calculateAssetMarketValue(asset) - Math.max(0, finite(asset.cost));
}

export function calculateAssetReturnRate(asset: Pick<PerformanceAssetInput, 'marketValue' | 'cost'>): number | null {
  return safeRatio(calculateAssetUnrealizedPnl(asset), Math.max(0, finite(asset.cost)));
}

export function calculatePortfolioPerformance(inputs: PerformanceAssetInput[]): PortfolioPerformance {
  const baseAssets = inputs
    .filter(asset => finite(asset.shares) > 0)
    .map(asset => {
      const cost = calculateAssetCost(asset);
      const marketValue = calculateAssetMarketValue(asset);
      const unrealizedPnl = marketValue - cost;
      const previousClose = finite(asset.previousClose);
      const shares = Math.max(0, finite(asset.shares));
      return {
        symbol: asset.symbol || '未命名資產',
        name: asset.name?.trim() || asset.symbol || '未命名資產',
        shares,
        cost,
        marketValue,
        unrealizedPnl,
        returnRate: safeRatio(unrealizedPnl, cost),
        contributionAmount: unrealizedPnl,
        contributionRatio: null,
        previousMarketValue: previousClose > 0 ? shares * previousClose : null
      };
    });
  const totalCost = baseAssets.reduce((sum, asset) => sum + asset.cost, 0);
  const totalMarketValue = baseAssets.reduce((sum, asset) => sum + asset.marketValue, 0);
  const unrealizedPnl = totalMarketValue - totalCost;
  const previousValues = baseAssets.map(asset => asset.previousMarketValue);
  const hasAllPreviousValues = baseAssets.length > 0 && previousValues.every((value): value is number => value !== null && value > 0);
  const previousMarketValue = hasAllPreviousValues ? previousValues.reduce((sum, value) => sum + value, 0) : null;
  const todayPnl = previousMarketValue === null ? 0 : totalMarketValue - previousMarketValue;
  const assets = baseAssets.map(asset => ({ ...asset, contributionRatio: safeRatio(asset.unrealizedPnl, Math.abs(unrealizedPnl)) }));
  return {
    assets,
    totalCost,
    totalMarketValue,
    unrealizedPnl,
    returnRate: safeRatio(unrealizedPnl, totalCost),
    todayPnl,
    todayReturnRate: previousMarketValue === null ? null : safeRatio(todayPnl, previousMarketValue),
    totalPositivePnl: assets.filter(asset => asset.unrealizedPnl > 0).reduce((sum, asset) => sum + asset.unrealizedPnl, 0)
  };
}

export function calculatePnlContribution(assets: PerformanceAsset[]): PerformanceAsset[] {
  return [...assets].sort((left, right) => right.contributionAmount - left.contributionAmount);
}

export function calculatePortfolioConcentration(performance: PortfolioPerformance): PortfolioConcentration {
  const byMarketValue = [...performance.assets].sort((left, right) => right.marketValue - left.marketValue);
  const profitable = performance.assets.filter(asset => asset.unrealizedPnl > 0).sort((left, right) => right.unrealizedPnl - left.unrealizedPnl);
  const largestAsset = byMarketValue[0];
  const largestProfitAsset = profitable[0];
  return {
    largestAsset,
    largestProfitAsset,
    largestMarketValueRatio: largestAsset ? safeRatio(largestAsset.marketValue, performance.totalMarketValue) : null,
    topThreeMarketValueRatio: safeRatio(byMarketValue.slice(0, 3).reduce((sum, asset) => sum + asset.marketValue, 0), performance.totalMarketValue),
    largestProfitRatio: largestProfitAsset ? safeRatio(largestProfitAsset.unrealizedPnl, performance.totalPositivePnl) : null,
    topThreeProfitRatio: safeRatio(profitable.slice(0, 3).reduce((sum, asset) => sum + asset.unrealizedPnl, 0), performance.totalPositivePnl)
  };
}

export function performanceSummary(performance: PortfolioPerformance, concentration: PortfolioConcentration): string[] {
  if (!performance.assets.length) return ['尚無有效持股資料，新增股數、平均成本與有效報價後即可查看即時績效。'];
  const percent = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
  const lines = [`目前總報酬為 ${performance.returnRate === null ? '—' : percent(performance.returnRate)}。`];
  if (concentration.largestProfitAsset && concentration.largestProfitRatio !== null) lines.push(`主要獲利來源為 ${concentration.largestProfitAsset.symbol}，占總正報酬 ${(concentration.largestProfitRatio * 100).toFixed(1)}%。`);
  if (concentration.largestMarketValueRatio !== null) {
    const label = concentration.largestMarketValueRatio < 0.4 ? '分散' : concentration.largestMarketValueRatio <= 0.6 ? '集中' : '高度集中';
    lines.push(`目前最大資產占比 ${(concentration.largestMarketValueRatio * 100).toFixed(1)}%，資產配置${label}。`);
  }
  return lines.slice(0, 3);
}
