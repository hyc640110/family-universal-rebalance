import type { InvestmentActionCenterModel, InvestmentActionItem } from './investmentActionCenter';

export type InvestmentActionEvidence = { id: string; label: string; valueText: string; status: InvestmentActionItem['status']; source: string; route?: string };
export type InvestmentActionExplanation = { actionId: string; category: InvestmentActionItem['category']; sourceModule: InvestmentActionItem['source']; sourceLabel: string; status: InvestmentActionItem['status']; priority: number; reasonSummary: string; evidenceItems: InvestmentActionEvidence[]; route: string; actionLabel: string; ariaLabel: string; titleAttribute: string; isPrimary: boolean };

const sourceLabel = (action: InvestmentActionItem) => action.category === 'risk-review' ? 'AI Decision 與 Portfolio Risk' : action.category === 'rebalance-review' ? 'Rebalance Recommendation' : action.category === 'performance-review' ? 'Performance Center' : action.category === 'market-information' ? 'Market Intelligence／Dividend Center' : 'Daily Decision Workflow';

/** Only repackages existing Action Center fields; no investment values or rules are calculated. */
export function deriveInvestmentActionExplanations(model: InvestmentActionCenterModel): InvestmentActionExplanation[] {
  return model.actions.map(action => ({
    actionId: action.id, category: action.category, sourceModule: action.source, sourceLabel: sourceLabel(action), status: action.status, priority: action.priority,
    reasonSummary: action.reason, route: action.route, actionLabel: action.actionLabel, ariaLabel: action.ariaLabel, titleAttribute: action.titleAttribute, isPrimary: action.isPrimary,
    evidenceItems: [
      { id: `${action.id}-status`, label: '既有狀態', valueText: action.status === 'unavailable' ? '資料不足' : action.status === 'blocked' ? '暫時無法判斷' : '需要留意', status: action.status, source: action.source },
      { id: `${action.id}-priority`, label: '既有優先順序', valueText: `優先順序 ${action.priority}`, status: action.status, source: 'DailyDecisionWorkflow' },
      { id: `${action.id}-reason`, label: '既有摘要', valueText: action.reason, status: action.status, source: action.source, route: action.route }
    ]
  }));
}
