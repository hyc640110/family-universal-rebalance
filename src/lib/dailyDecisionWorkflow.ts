import type { deriveInvestmentIntelligence } from './investmentIntelligence';
import { INVESTMENT_DECISION_ROUTES } from './toolNavigation';

export type DailyDecisionStatus = 'completed' | 'attention' | 'blocked' | 'unavailable';
export type DailyDecisionStep = {
  id: 'data-and-quotes' | 'risk-and-safety' | 'rebalance' | 'performance' | 'market-and-dividend';
  title: string;
  description: string;
  status: DailyDecisionStatus;
  priority: number;
  route: string;
  linkLabel: string;
  ariaLabel: string;
  isPrimaryNextStep: boolean;
};
export type DailyDecisionConclusion = {
  status: 'action-required' | 'review-available' | 'no-action' | 'insufficient-data';
  title: string;
  description: string;
};
export type DailyDecisionWorkflow = {
  conclusion: DailyDecisionConclusion;
  steps: DailyDecisionStep[];
  primaryNextStep: DailyDecisionStep | null;
};

type Intelligence = ReturnType<typeof deriveInvestmentIntelligence>;

const statusText: Record<DailyDecisionStatus, string> = {
  completed: '已完成', attention: '需要留意', blocked: '暫時無法判斷', unavailable: '資料不足'
};

const actionFor = (intelligence: Intelligence, route: string, fallback: string) =>
  intelligence.nextAction.route === route ? intelligence.nextAction.label : fallback;

/**
 * Turns the already-derived Investment Intelligence result into a stable daily
 * reading sequence. It intentionally does not accept raw portfolio data or
 * calculate values, percentages, risk levels, or recommendations.
 */
export function deriveDailyDecisionWorkflow(intelligence: Intelligence): DailyDecisionWorkflow {
  const dataUnavailable = intelligence.dataQuality.problems.length > 0;
  const quoteNeedsAttention = !dataUnavailable && intelligence.dataQuality.quoteStatus !== '報價正常';
  const riskNeedsAttention = intelligence.topRisk.tone === 'bad' || intelligence.topRisk.tone === 'warn';
  const rebalanceStatus: DailyDecisionStatus = intelligence.rebalanceStatus.blocked ? 'blocked'
    : intelligence.rebalanceStatus.thresholdReached ? 'attention' : 'completed';
  const marketUnavailable = intelligence.marketStatus.tone === 'bad';
  const marketNeedsAttention = intelligence.marketStatus.tone === 'warn';
  const performanceUnavailable = intelligence.performanceStatus.value === '資料不足';
  const performanceNeedsAttention = intelligence.performanceStatus.tone === 'warn';
  // The foundation adapter keeps performance availability separate from its
  // overall status. Preserve that unavailable state rather than presenting it
  // as a normal day in this workflow.
  const hasAction = intelligence.overallStatus !== '正常' || performanceUnavailable;
  const dataRoute = intelligence.nextAction.priority <= 2 ? intelligence.nextAction.route : INVESTMENT_DECISION_ROUTES.assets;
  const dataLinkLabel = dataRoute === intelligence.nextAction.route ? intelligence.nextAction.label : '查看資產資料';

  const steps: DailyDecisionStep[] = [
    {
      id: 'data-and-quotes', title: '資料與報價', priority: 1,
      description: dataUnavailable ? intelligence.dataQuality.problems.join('、') : intelligence.dataQuality.quoteStatus,
      status: dataUnavailable ? 'unavailable' : quoteNeedsAttention ? 'attention' : 'completed',
      route: dataRoute,
      linkLabel: dataLinkLabel,
      ariaLabel: dataLinkLabel,
      isPrimaryNextStep: false
    },
    {
      id: 'risk-and-safety', title: '風險與安全', priority: 2,
      description: intelligence.topRisk.detail,
      status: riskNeedsAttention ? 'attention' : 'completed',
      route: INVESTMENT_DECISION_ROUTES.portfolioRisk,
      linkLabel: actionFor(intelligence, INVESTMENT_DECISION_ROUTES.portfolioRisk, '查看投資組合風險'),
      ariaLabel: actionFor(intelligence, INVESTMENT_DECISION_ROUTES.portfolioRisk, '查看投資組合風險'),
      isPrimaryNextStep: false
    },
    {
      id: 'rebalance', title: '再平衡', priority: 3,
      description: intelligence.allocationStatus.detail,
      status: rebalanceStatus,
      route: INVESTMENT_DECISION_ROUTES.rebalanceRecommendation,
      linkLabel: actionFor(intelligence, INVESTMENT_DECISION_ROUTES.rebalanceRecommendation, '查看再平衡建議'),
      ariaLabel: actionFor(intelligence, INVESTMENT_DECISION_ROUTES.rebalanceRecommendation, '查看再平衡建議'),
      isPrimaryNextStep: false
    },
    {
      id: 'performance', title: '績效與回撤', priority: 4,
      description: intelligence.performanceStatus.detail,
      status: performanceUnavailable ? 'unavailable' : performanceNeedsAttention ? 'attention' : 'completed',
      route: INVESTMENT_DECISION_ROUTES.analytics,
      linkLabel: actionFor(intelligence, INVESTMENT_DECISION_ROUTES.analytics, '查看投資績效'),
      ariaLabel: actionFor(intelligence, INVESTMENT_DECISION_ROUTES.analytics, '查看投資績效'),
      isPrimaryNextStep: false
    },
    {
      id: 'market-and-dividend', title: '市場與股息', priority: 5,
      description: marketUnavailable || marketNeedsAttention ? intelligence.marketStatus.detail : intelligence.dividendStatus.detail,
      status: marketUnavailable ? 'unavailable' : marketNeedsAttention ? 'attention' : 'completed',
      route: marketUnavailable || marketNeedsAttention ? INVESTMENT_DECISION_ROUTES.market : INVESTMENT_DECISION_ROUTES.dividendCenter,
      linkLabel: marketUnavailable || marketNeedsAttention
        ? actionFor(intelligence, INVESTMENT_DECISION_ROUTES.market, '查看市場資料')
        : actionFor(intelligence, INVESTMENT_DECISION_ROUTES.dividendCenter, '查看股息摘要'),
      ariaLabel: marketUnavailable || marketNeedsAttention
        ? actionFor(intelligence, INVESTMENT_DECISION_ROUTES.market, '查看市場資料')
        : actionFor(intelligence, INVESTMENT_DECISION_ROUTES.dividendCenter, '查看股息摘要'),
      isPrimaryNextStep: false
    }
  ];

  const primaryIndex = hasAction ? steps.findIndex(step => step.route === intelligence.nextAction.route) : -1;
  const primaryNextStep = primaryIndex >= 0 ? { ...steps[primaryIndex], isPrimaryNextStep: true } : null;
  if (primaryIndex >= 0) steps[primaryIndex] = primaryNextStep!;
  const conclusion: DailyDecisionConclusion = dataUnavailable || marketUnavailable || performanceUnavailable
    ? { status: 'insufficient-data', title: '資料不足，暫時不能形成判斷', description: intelligence.nextAction.reason }
    : hasAction
      ? { status: intelligence.overallStatus === '注意' ? 'review-available' : 'action-required', title: '今日有項目需要查看', description: intelligence.nextAction.reason }
      : { status: 'no-action', title: '今日無需進行投資操作', description: '資料與既有規則未出現需要優先處理的事項。' };

  return { conclusion, steps, primaryNextStep };
}

export { statusText as dailyDecisionStatusText };
