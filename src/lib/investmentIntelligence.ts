export type IntelligenceTone = 'good' | 'warn' | 'bad' | 'neutral';
export type IntelligenceStatus = '正常' | '注意' | '高風險' | '資料不足';
export type IntelligenceAction = { label: string; route: string; reason: string; priority: number };
export type IntelligenceItem = { label: string; value: string; detail: string; tone: IntelligenceTone };

export type InvestmentIntelligenceInput = {
  dashboard: { dayPnl: number | null; dayPnlRate: number | null; quoteStatus: string; holdingsCount: number };
  sync: { dirty: boolean; status: string };
  risk: { overallLevel: number; overallLabel: string; primaryRisk: { title: string; status: string; reason: string } };
  portfolioRisk: { quality: { items: string[] }; allocation: { deviation: number; threshold: number; thresholdReached: boolean }; concentration: { largestPct: number }; drawdown: { canCalculate: boolean; maxDrawdown: number | null } };
  rebalance: { canRecommend: boolean; blockingReasons: string[]; thresholdReached: boolean; allocationDeviation: number | null };
  market: { freshness: 'today' | 'recent-effective' | 'stale' | 'unavailable' | 'invalid'; availableCount: number };
  performance: { canCalculateMaxDrawdown: boolean; snapshotCount: number; maxDrawdown: number | null };
  dividend: { yearAmount: number; yearCount: number };
  ai: { attention: Array<{ id: string; title: string; severity: 'critical' | 'warning'; reason: string; route: string }> };
};

const finite = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const pct = (value: number | null | undefined, signed = false) => {
  const amount = finite(value);
  return amount === null ? '資料不足' : `${signed && amount > 0 ? '+' : ''}${amount.toFixed(1)}%`;
};
const money = (value: number | null | undefined, signed = false) => {
  const amount = finite(value);
  if (amount === null) return '資料不足';
  return `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${Math.abs(Math.round(amount)).toLocaleString('zh-TW')} 元`;
};
const hasQualityProblem = (item: string) => /缺少持股|缺報價|過期報價|日期不明|備援價格|重複 symbol|目標比例超過 100%|投資資產歷史不足/.test(item);

/**
 * Combines already-derived centre views into one deterministic Dashboard summary.
 * It deliberately does not calculate portfolio values, read storage, fetch data,
 * or write user state.
 */
export function deriveInvestmentIntelligence(input: InvestmentIntelligenceInput) {
  const qualityItems = input.portfolioRisk.quality.items.filter(hasQualityProblem);
  const marketUnavailable = input.market.freshness === 'unavailable' || input.market.freshness === 'invalid';
  const qualityProblems = [...qualityItems, ...(marketUnavailable ? ['市場資料無法使用'] : [])];
  const qualityAction: IntelligenceAction = marketUnavailable && qualityItems.length === 0
    ? { label: '查看市場資料', route: '/market', reason: '市場資料無法使用。', priority: 1 }
    : qualityItems.some(item => item.includes('投資資產歷史不足'))
      ? { label: '查看投資績效', route: '/analytics', reason: qualityItems.find(item => item.includes('投資資產歷史不足'))!, priority: 1 }
      : { label: '前往資產頁確認資料', route: '/assets', reason: qualityItems[0] || '資料品質需要確認。', priority: 1 };
  const qualityTone: IntelligenceTone = qualityProblems.length ? 'bad' : input.dashboard.quoteStatus === '報價正常' ? 'good' : 'warn';
  const quoteDetail = qualityItems.length ? qualityItems.join('、') : input.dashboard.quoteStatus;
  const performanceUnavailable = !input.performance.canCalculateMaxDrawdown;
  const highRisk = input.risk.overallLevel >= 2;
  const allocationReached = input.portfolioRisk.allocation.thresholdReached || input.rebalance.thresholdReached;
  const rebalanceBlocked = allocationReached && !input.rebalance.canRecommend;
  const marketNeedsReview = input.market.freshness === 'stale';
  const drawdownNeedsReview = input.performance.canCalculateMaxDrawdown && (input.performance.maxDrawdown ?? 0) <= -0.2;
  const aiAttention = input.ai.attention[0] ?? null;

  const nextAction: IntelligenceAction = qualityProblems.length
    ? qualityAction
    : input.sync.dirty
      ? { label: '前往同步設定', route: '/settings', reason: input.sync.status || '本機資料尚未同步。', priority: 2 }
      : highRisk
        ? { label: '查看投資組合風險', route: '/tools/portfolio-risk', reason: `${input.risk.primaryRisk.title}：${input.risk.primaryRisk.status}`, priority: 3 }
        : rebalanceBlocked
          ? { label: '查看再平衡限制', route: '/tools/rebalance-recommendation', reason: input.rebalance.blockingReasons[0] || '配置已偏離，但資料品質尚未通過。', priority: 4 }
          : allocationReached
            ? { label: '查看再平衡狀態', route: '/tools/rebalance-recommendation', reason: '配置已達既有再平衡門檻。', priority: 5 }
            : marketNeedsReview
              ? { label: '查看市場資料', route: '/market', reason: '市場資料時間較舊，請先確認。', priority: 6 }
              : performanceUnavailable || drawdownNeedsReview
                ? { label: '查看投資績效', route: '/analytics', reason: performanceUnavailable ? '投資資產歷史不足，無法完整判讀回撤。' : '投資資產回撤需要留意。', priority: 7 }
                : input.dividend.yearCount > 0
                  ? { label: '查看股息摘要', route: '/tools/dividend-center', reason: '已有本年有效已入帳股息可檢視。', priority: 8 }
                  : { label: '查看 AI 決策摘要', route: '/tools/ai-decision', reason: '核心資料目前未出現優先處理事項。', priority: 9 };

  const overallStatus: IntelligenceStatus = qualityProblems.length ? '資料不足' : highRisk ? '高風險' : input.sync.dirty || rebalanceBlocked || allocationReached || marketNeedsReview || drawdownNeedsReview ? '注意' : '正常';
  const overallTone: IntelligenceTone = overallStatus === '資料不足' || overallStatus === '高風險' ? 'bad' : overallStatus === '注意' ? 'warn' : 'good';
  const todayAvailable = input.dashboard.dayPnl !== null && input.dashboard.dayPnlRate !== null;
  const marketValue = input.market.freshness === 'today' ? '今日資料' : input.market.freshness === 'recent-effective' ? '最近有效資料' : input.market.freshness === 'stale' ? '資料較舊' : '資料不足';

  const supportingItems: IntelligenceItem[] = [
    { label: '資料品質', value: qualityProblems.length ? '需要確認' : '報價品質正常', detail: qualityProblems.length ? quoteDetail : input.dashboard.quoteStatus, tone: qualityTone },
    { label: '今日投資狀態', value: todayAvailable ? `${money(input.dashboard.dayPnl, true)}｜${pct(input.dashboard.dayPnlRate, true)}` : '資料不足', detail: todayAvailable ? '僅計入當日有效報價。' : '今日損益無法可靠計算，未以 0 取代。', tone: todayAvailable ? (input.dashboard.dayPnl! < 0 ? 'warn' : 'good') : 'neutral' },
    { label: '最高優先風險', value: `${input.risk.primaryRisk.title}｜${input.risk.primaryRisk.status}`, detail: input.risk.primaryRisk.reason, tone: highRisk ? 'bad' : input.risk.overallLevel > 0 ? 'warn' : 'good' },
    { label: '配置與再平衡', value: allocationReached ? '已達門檻' : '門檻內', detail: rebalanceBlocked ? '再平衡建議已停止計算：' + (input.rebalance.blockingReasons[0] || '資料品質不足。') : `偏離 ${pct(input.portfolioRisk.allocation.deviation, true)}｜門檻 ${pct(input.portfolioRisk.allocation.threshold)}`, tone: rebalanceBlocked ? 'bad' : allocationReached ? 'warn' : 'good' },
    { label: '市場資料', value: marketValue, detail: input.market.availableCount > 0 ? `可用 ${input.market.availableCount} 項市場資料。` : '沒有可用市場資料，不解讀市場方向。', tone: marketUnavailable ? 'bad' : marketNeedsReview ? 'warn' : 'good' },
    { label: '績效／回撤', value: performanceUnavailable ? '資料不足' : `最大回撤 ${pct((input.performance.maxDrawdown ?? 0) * 100)}`, detail: performanceUnavailable ? `有效快照 ${input.performance.snapshotCount} 筆，無法可靠計算。` : '最大回撤僅使用投資資產口徑。', tone: performanceUnavailable ? 'neutral' : drawdownNeedsReview ? 'warn' : 'good' },
    { label: '股息摘要', value: input.dividend.yearCount ? `本年 ${input.dividend.yearCount} 筆` : '尚無有效資料', detail: input.dividend.yearCount ? `本年已入帳 ${money(input.dividend.yearAmount)}。` : '僅統計有效且已入帳的股息交易。', tone: input.dividend.yearCount ? 'good' : 'neutral' },
    { label: 'AI 決策', value: aiAttention ? aiAttention.title : '目前無優先警示', detail: aiAttention ? aiAttention.reason : '沿用既有本機規則；沒有新增主觀排序。', tone: aiAttention ? (aiAttention.severity === 'critical' ? 'bad' : 'warn') : 'good' }
  ];

  return {
    overallStatus,
    overallTone,
    title: overallStatus === '資料不足' ? '先確認資料品質' : overallStatus === '高風險' ? '優先檢視投資組合風險' : overallStatus === '注意' ? '有項目需要留意' : '今日投資狀態正常',
    summary: nextAction.reason,
    dataQuality: { problems: qualityProblems, quoteStatus: input.dashboard.quoteStatus },
    todayPerformance: supportingItems[1],
    topRisk: supportingItems[2],
    allocationStatus: supportingItems[3],
    rebalanceStatus: { canRecommend: input.rebalance.canRecommend, blocked: rebalanceBlocked, thresholdReached: allocationReached },
    marketStatus: supportingItems[4],
    performanceStatus: supportingItems[5],
    dividendStatus: supportingItems[6],
    nextAction,
    supportingItems,
    limitations: ['僅整合既有本機規則與資料狀態。', '本卡只提供狀態摘要與既有中心導覽。']
  };
}
