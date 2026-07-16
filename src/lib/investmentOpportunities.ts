import type { DailyDecisionStatus, DailyDecisionStep, DailyDecisionWorkflow } from './dailyDecisionWorkflow';

export type OpportunityCategory = 'data-update' | 'risk-review' | 'rebalance-review' | 'performance-review' | 'market-information';
export type OpportunityActionType = 'review-data' | 'review-risk' | 'review-rebalance' | 'review-performance' | 'review-market';
export type InvestmentOpportunity = {
  id: string;
  category: OpportunityCategory;
  priority: number;
  title: string;
  description: string;
  source: 'DailyDecisionWorkflow';
  route: string;
  status: Exclude<DailyDecisionStatus, 'completed'>;
  actionType: OpportunityActionType;
  actionLabel: string;
  ariaLabel: string;
};

export const investmentOpportunityMetadataForStep = (step: DailyDecisionStep): [OpportunityCategory, OpportunityActionType] => {
  switch (step.id) {
    case 'data-and-quotes': return ['data-update', 'review-data'];
    case 'risk-and-safety': return ['risk-review', 'review-risk'];
    case 'rebalance': return ['rebalance-review', 'review-rebalance'];
    case 'performance': return ['performance-review', 'review-performance'];
    case 'market-and-dividend': return ['market-information', 'review-market'];
  }
};

/**
 * Selects the first three existing Daily Decision steps that need review.
 * It receives no raw financial inputs and deliberately does not calculate,
 * enrich, or infer an investment opportunity.
 */
export function deriveInvestmentOpportunities(workflow: DailyDecisionWorkflow): InvestmentOpportunity[] {
  return workflow.steps
    .filter((step): step is DailyDecisionStep & { status: Exclude<DailyDecisionStatus, 'completed'> } => step.status !== 'completed')
    .slice()
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id))
    .slice(0, 3)
    .map(step => {
      const [category, actionType] = investmentOpportunityMetadataForStep(step);
      return {
        id: `daily-${step.id}`,
        category,
        priority: step.priority,
        title: step.title,
        description: step.description,
        source: 'DailyDecisionWorkflow',
        route: step.route,
        status: step.status,
        actionType,
        actionLabel: step.linkLabel,
        ariaLabel: step.ariaLabel
      };
    });
}
