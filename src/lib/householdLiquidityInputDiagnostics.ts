import type { CashFlowProfile } from './cashFlow';

export type HouseholdLiquidityInputDiagnosticCode =
  | 'CASH_FLOW_PROFILE_MISSING'
  | 'CASH_FLOW_ROLE_UNASSIGNED'
  | 'CASH_FLOW_ROLE_AMBIGUOUS'
  | 'DEBT_PAYMENT_LINK_REQUIRED'
  | 'LOAN_SOURCE_UNAVAILABLE'
  | 'DEBT_PAYMENT_LINK_ORPHANED'
  | 'EXTERNAL_CONTRIBUTION_UNSET'
  | 'PLANNED_WITHDRAWAL_UNSET';

export type HouseholdLiquidityInputDiagnostic = Readonly<{
  code: HouseholdLiquidityInputDiagnosticCode;
  sourceId?: string;
  loanId?: string;
}>;

export type HouseholdLiquidityInputDiagnosticSources = Readonly<{
  cashFlowProfile: CashFlowProfile | null | undefined;
  loans: ReadonlyArray<Readonly<{ id: string }>> | null | undefined;
}>;

const requiresExplicitRole = (category: string) => ['housing', 'loan', 'other'].includes(category);

/**
 * Derives action-oriented data diagnostics without changing persisted Cash Flow or Loan data.
 * Explicit zero remains configured, while an absent plan value remains actionable.
 */
export function deriveHouseholdLiquidityInputDiagnostics(
  sources: HouseholdLiquidityInputDiagnosticSources
): HouseholdLiquidityInputDiagnostic[] {
  const profile = sources.cashFlowProfile;
  if (!profile) return [{ code: 'CASH_FLOW_PROFILE_MISSING' }];

  const loansAvailable = Array.isArray(sources.loans);
  const loanIds = new Set((sources.loans ?? []).map(loan => loan.id));
  const diagnostics: HouseholdLiquidityInputDiagnostic[] = [];

  for (const item of profile.fixedExpenses) {
    if (!item.enabled) continue;
    const sourceId = `cash-flow:${item.id}`;
    if (item.liquidityRole === undefined && requiresExplicitRole(item.category)) {
      diagnostics.push({ code: 'CASH_FLOW_ROLE_UNASSIGNED', sourceId });
    } else if (item.liquidityRole === 'ambiguous') {
      diagnostics.push({ code: 'CASH_FLOW_ROLE_AMBIGUOUS', sourceId });
    } else if (item.liquidityRole === 'debt-payment') {
      if (!item.linkedLoanId) diagnostics.push({ code: 'DEBT_PAYMENT_LINK_REQUIRED', sourceId });
      else if (!loansAvailable) diagnostics.push({ code: 'LOAN_SOURCE_UNAVAILABLE', sourceId, loanId: item.linkedLoanId });
      else if (!loanIds.has(item.linkedLoanId)) diagnostics.push({ code: 'DEBT_PAYMENT_LINK_ORPHANED', sourceId, loanId: item.linkedLoanId });
    }
  }

  if (profile.externalContribution === undefined) diagnostics.push({ code: 'EXTERNAL_CONTRIBUTION_UNSET' });
  if (profile.plannedWithdrawal === undefined) diagnostics.push({ code: 'PLANNED_WITHDRAWAL_UNSET' });
  return diagnostics;
}
