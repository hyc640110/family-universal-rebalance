import type { DailyDecisionStatus, DailyDecisionStep, DailyDecisionWorkflow } from './dailyDecisionWorkflow';
import { investmentOpportunityMetadataForStep, type InvestmentOpportunity, type OpportunityActionType, type OpportunityCategory } from './investmentOpportunities';

export type InvestmentActionItem = {
  id: string;
  category: OpportunityCategory;
  priority: number;
  status: Exclude<DailyDecisionStatus, 'completed'>;
  title: string;
  description: string;
  reason: string;
  source: 'DailyDecisionWorkflow' | 'InvestmentOpportunity';
  route: string;
  actionType: OpportunityActionType;
  actionLabel: string;
  ariaLabel: string;
  titleAttribute: string;
  isPrimary: boolean;
};

export type InvestmentActionSummary = {
  status: DailyDecisionWorkflow['conclusion']['status'];
  title: string;
  description: string;
  completedStepCount: number;
  normalCategories: string[];
};

export type InvestmentActionCenterModel = {
  summary: InvestmentActionSummary;
  primaryAction: InvestmentActionItem | null;
  actions: InvestmentActionItem[];
};

const pending = (step: DailyDecisionStep): step is DailyDecisionStep & { status: Exclude<DailyDecisionStatus, 'completed'> } => step.status !== 'completed';

/**
 * Presentation-only view of the existing Daily Decision Workflow. The supplied
 * Opportunity rows are reused when available; remaining pending workflow steps
 * stay visible and the adapter does not calculate financial inputs, rules, or priority.
 */
export function deriveInvestmentActionCenter(workflow: DailyDecisionWorkflow, opportunities: InvestmentOpportunity[]): InvestmentActionCenterModel {
  const opportunitiesByStepId = new Map(opportunities.map(opportunity => [opportunity.id.replace(/^daily-/, ''), opportunity]));
  const actions = workflow.steps.filter(pending).slice().sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id)).map(step => {
    const opportunity = opportunitiesByStepId.get(step.id);
    const [category, actionType] = investmentOpportunityMetadataForStep(step);
    return {
      id: opportunity?.id ?? `daily-${step.id}`,
      category: opportunity?.category ?? category,
      priority: opportunity?.priority ?? step.priority,
      status: opportunity?.status ?? step.status,
      title: opportunity?.title ?? step.title,
      description: opportunity?.description ?? step.description,
      reason: step.description,
      source: opportunity ? 'InvestmentOpportunity' as const : 'DailyDecisionWorkflow' as const,
      route: opportunity?.route ?? step.route,
      actionType: opportunity?.actionType ?? actionType,
      actionLabel: opportunity?.actionLabel ?? step.linkLabel,
      ariaLabel: opportunity?.ariaLabel ?? step.ariaLabel,
      titleAttribute: opportunity?.ariaLabel ?? step.ariaLabel,
      isPrimary: workflow.primaryNextStep?.id === step.id
    };
  });
  const primaryAction = actions.find(action => action.isPrimary) ?? null;
  return {
    summary: {
      status: workflow.conclusion.status,
      title: workflow.conclusion.title,
      description: workflow.conclusion.description,
      completedStepCount: workflow.steps.filter(step => step.status === 'completed').length,
      normalCategories: workflow.steps.filter(step => step.status === 'completed').map(step => step.title)
    },
    primaryAction,
    actions
  };
}
