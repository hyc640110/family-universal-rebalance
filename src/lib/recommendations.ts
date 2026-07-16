import type { DecisionItem } from './aiDecision';
import type { PortfolioRiskView } from './portfolioRisk';
import type { RebalanceRecommendationRow } from './rebalanceRecommendation';

export type RecommendationCategory = 'rebalance' | 'cash' | 'concentration' | 'leverage' | 'risk';
export type RecommendationTone = 'good' | 'warn' | 'bad' | 'neutral';
export type RecommendationModel = {
  id: string;
  category: RecommendationCategory;
  tone: RecommendationTone;
  title: string;
  status: string;
  summary: string;
  detail: string;
  source: 'rebalance' | 'portfolio-risk' | 'ai-decision';
};

export const RECOMMENDATION_CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  rebalance: '再平衡', cash: '現金', concentration: '集中度', leverage: '槓桿', risk: '風險'
};

const money = (value: number | null) => value === null || !Number.isFinite(value) ? '不可計算' : `${(Math.abs(value) / 10000).toLocaleString('zh-TW', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 萬元`;
const pct = (value: number | null) => value === null || !Number.isFinite(value) ? '不可計算' : `${value.toFixed(1)}%`;
const actionLabel = (action: RebalanceRecommendationRow['action']) => action === 'buy' ? '理論增加' : action === 'sell' ? '理論減少' : action === 'blocked' ? '已停止計算' : '維持';
const rebalanceTone = (action: RebalanceRecommendationRow['action']): RecommendationTone => action === 'blocked' ? 'bad' : action === 'buy' || action === 'sell' ? 'warn' : 'good';
const severityTone = (severity: DecisionItem['severity']): RecommendationTone => severity === 'critical' ? 'bad' : severity === 'warning' ? 'warn' : severity === 'normal' ? 'good' : 'neutral';

/**
 * Adapts already-derived results into a stable, reusable presentation model.
 * It intentionally performs no portfolio calculation and does not mutate its inputs.
 */
export function createRecommendationModels(input: {
  rebalance: { canRecommend: boolean; mode: 'standard' | 'buy-only'; liquidCash: number; availableBuyBudget: number | null; cashShortfall: number | null; rows: RebalanceRecommendationRow[] };
  portfolioRisk: PortfolioRiskView;
}): RecommendationModel[] {
  const { rebalance, portfolioRisk } = input;
  const rebalanceModels = rebalance.rows.map(row => ({
    id: `rebalance-${row.symbol}`,
    category: 'rebalance' as const,
    tone: rebalanceTone(row.action),
    title: `${row.symbol}｜${row.name}`,
    status: actionLabel(row.action),
    summary: `建議金額 ${money(row.recommendedAmount)}`,
    detail: row.reason,
    source: 'rebalance' as const,
  }));
  const cashStatus = !rebalance.canRecommend ? '資料不足' : rebalance.mode === 'buy-only' ? '只買不賣預算' : rebalance.cashShortfall && rebalance.cashShortfall > 0 ? '現金缺口' : '流動現金正常';
  const cashModels: RecommendationModel[] = [{
    id: 'cash-rebalance-budget', category: 'cash', tone: !rebalance.canRecommend ? 'bad' : rebalance.cashShortfall && rebalance.cashShortfall > 0 ? 'warn' : 'good',
    title: '現金與再平衡預算', status: cashStatus,
    summary: rebalance.mode === 'buy-only' ? `可投入預算 ${money(rebalance.availableBuyBudget)}` : `流動現金 ${money(rebalance.liquidCash)}`,
    detail: rebalance.mode === 'buy-only' ? '沿用既有只買不賣預算結果。' : rebalance.cashShortfall && rebalance.cashShortfall > 0 ? `既有理論買入需求尚差 ${money(rebalance.cashShortfall)}。` : '沿用既有理論再平衡現金結果。',
    source: 'rebalance'
  }];
  const risk = portfolioRisk.risk;
  const concentrationModels: RecommendationModel[] = [{
    id: 'portfolio-concentration', category: 'concentration', tone: risk.largestHoldingRatio >= 50 ? 'warn' : 'good', title: '持股集中度', status: risk.largestHoldingRatio >= 50 ? '需要留意' : '目前正常',
    summary: `最大單一持股 ${pct(portfolioRisk.concentration.largestPct)}`,
    detail: `前二大 ${pct(portfolioRisk.concentration.topTwoPct)}｜前三大 ${pct(portfolioRisk.concentration.topThreePct)}。`, source: 'portfolio-risk'
  }];
  const leverageModels: RecommendationModel[] = [{
    id: 'portfolio-leverage', category: 'leverage', tone: portfolioRisk.leverage.totalPct >= 40 ? 'warn' : 'good', title: '槓桿暴露', status: portfolioRisk.leverage.symbols.length ? '已辨識槓桿資產' : '未辨識槓桿資產',
    summary: `占總資產 ${pct(portfolioRisk.leverage.totalPct)}`,
    detail: portfolioRisk.leverage.symbols.length ? `標的：${portfolioRisk.leverage.symbols.join('、')}。` : '沿用既有名稱／代號辨識結果。', source: 'portfolio-risk'
  }];
  const riskModels: RecommendationModel[] = [{
    id: 'portfolio-primary-risk', category: 'risk', tone: risk.overallLabel === '高風險' ? 'bad' : risk.overallLabel === '偏高風險' ? 'warn' : 'good', title: risk.primaryRisk.title, status: risk.primaryRisk.status,
    summary: `整體風險：${risk.overallLabel}`,
    detail: risk.primaryRisk.reason, source: 'portfolio-risk'
  }];
  return [...rebalanceModels, ...cashModels, ...concentrationModels, ...leverageModels, ...riskModels];
}

/** Adapter for the existing AI Decision Center model; kept pure for future shared surfaces. */
export function createAiRecommendationModels(items: DecisionItem[]): RecommendationModel[] {
  return items.filter(item => item.id !== 'today').map(item => ({
    id: `ai-${item.id}`, category: item.category === 'cash' ? 'cash' : item.category === 'concentration' ? 'concentration' : item.category === 'leverage' ? 'leverage' : 'risk',
    tone: severityTone(item.severity), title: item.title, status: item.conclusion, summary: item.reason, detail: item.evidence.map(row => `${row.label}：${row.value}`).join('｜'), source: 'ai-decision'
  }));
}
