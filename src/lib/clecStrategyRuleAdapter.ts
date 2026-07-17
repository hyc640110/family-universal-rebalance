import type { AllocationPreset } from './allocationPresets';
import type { ClecRuleInput, ClecRuleThresholds, ClecQuoteFreshness } from './clecStrategyRules';

export type ClecStrategyRuleAdapterSource = {
  allocationPresetId: AllocationPreset;
  rebalanceMode: 'standard' | 'buy-only';
  asOfDate: string;
  portfolioValue: number | null;
  holdings: Array<{ symbol: string; currentWeight: number | null; targetWeight: number | null; quoteFreshness: ClecQuoteFreshness; leverage?: boolean }>;
  availableCash: number | null;
  debtBalance: number | null;
  leverageExposure: number | null;
  threshold: ClecRuleThresholds;
  dataQualityFlags: string[];
};

/** Boundary adapter: it converts existing selectors into the pure rule contract without mutating App state. */
export function buildClecStrategyRuleInput(source: ClecStrategyRuleAdapterSource): ClecRuleInput {
  return {
    strategyId: 'clec-rule-foundation', allocationPresetId: source.allocationPresetId, rebalanceMode: source.rebalanceMode, asOfDate: source.asOfDate,
    portfolioValue: source.portfolioValue, investableAssets: source.holdings.map(holding => ({ ...holding, symbol: holding.symbol.trim().toUpperCase() })),
    availableCash: source.availableCash, plannedContribution: null, plannedWithdrawal: null, debtBalance: source.debtBalance, cashReserve: source.availableCash,
    leverageExposure: source.leverageExposure, threshold: { ...source.threshold }, dataQualityFlags: [...source.dataQualityFlags]
  };
}
