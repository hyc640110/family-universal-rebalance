import type { DecisionItem } from './aiDecision';
import type { InvestmentIntelligenceInput } from './investmentIntelligence';

export type InvestmentIntelligenceAdapterInput = Omit<InvestmentIntelligenceInput, 'ai'> & { aiDecisions: DecisionItem[] };

const categoryPriority: Record<DecisionItem['category'], number> = { 'data-quality': 1, 'quote-freshness': 1, leverage: 2, drawdown: 2, cash: 3, concentration: 5, market: 6, dividend: 6, today: 7 };
const severityPriority: Record<DecisionItem['severity'], number> = { critical: 0, warning: 1, unavailable: 2, info: 3, normal: 4 };

/** Adapts existing AI decision output only; no formula, storage, or network work occurs here. */
export function adaptInvestmentIntelligenceInput(input: InvestmentIntelligenceAdapterInput): InvestmentIntelligenceInput {
  const attention = input.aiDecisions.filter((item): item is DecisionItem & { severity: 'critical' | 'warning' } => item.severity === 'critical' || item.severity === 'warning').slice().sort((left, right) => categoryPriority[left.category] - categoryPriority[right.category] || severityPriority[left.severity] - severityPriority[right.severity] || left.id.localeCompare(right.id)).map(item => ({ id: item.id, title: item.title, severity: item.severity, reason: item.reason, route: item.action?.to ?? '/tools/ai-decision' }));
  return { ...input, ai: { attention } };
}
