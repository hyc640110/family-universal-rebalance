import type { AllocationPreset } from './allocationPresets';
import type { ClecRuleInput, ClecRuleThresholds, ClecQuoteFreshness } from './clecStrategyRules';

export type ClecStrategyRuleAdapterSource = {
  allocationPresetId: AllocationPreset;
  rebalanceMode: 'standard' | 'buy-only';
  asOfDate: string;
  portfolioValue: number | null;
  holdings: Array<{ symbol: string; currentWeight: number | null; targetWeight: number | null; quoteFreshness: ClecQuoteFreshness; leverage?: boolean }>;
  availableCash: number | null;
  plannedContribution: number | null;
  plannedWithdrawal: number | null;
  debtBalance: number | null;
  cashReserve: number | null;
  leverageExposure: number | null;
  threshold: ClecRuleThresholds;
  dataQualityFlags: string[];
};

export type ClecFundingSemanticsSource = {
  householdLiquidity: { investableCash: number | null; protectedSafetyCash: number | null };
  cashFlowProfile?: { externalContribution?: number; plannedWithdrawal?: number } | null;
};

export function buildClecFundingSemantics(source: ClecFundingSemanticsSource) {
  return {
    availableCash: source.householdLiquidity.investableCash,
    cashReserve: source.householdLiquidity.protectedSafetyCash,
    plannedContribution: source.cashFlowProfile?.externalContribution ?? null,
    plannedWithdrawal: source.cashFlowProfile?.plannedWithdrawal ?? null
  };
}

/** Boundary adapter: it converts existing selectors into the pure rule contract without mutating App state. */
export function buildClecStrategyRuleInput(source: ClecStrategyRuleAdapterSource): ClecRuleInput {
  return {
    strategyId: 'clec-rule-foundation', allocationPresetId: source.allocationPresetId, rebalanceMode: source.rebalanceMode, asOfDate: source.asOfDate,
    portfolioValue: source.portfolioValue, investableAssets: source.holdings.map(holding => ({ ...holding, symbol: holding.symbol.trim().toUpperCase() })),
    availableCash: source.availableCash, plannedContribution: source.plannedContribution, plannedWithdrawal: source.plannedWithdrawal, debtBalance: source.debtBalance, cashReserve: source.cashReserve,
    leverageExposure: source.leverageExposure, threshold: { ...source.threshold }, dataQualityFlags: [...source.dataQualityFlags]
  };
}
