export type DefensiveConfigurationExecutionMethod = 'standard' | 'buy-only' | null;

export type DefensiveConfigurationBlockingReason = {
  code: string;
  message: string;
};

export type DefensiveConfigurationPresentationInput = {
  defensiveTotalRatio: number | null;
  protectedSafetyCash: number | null;
  defensiveHoldingsRatio: number | null;
  investableCash: number | null;
  theoreticalDefensiveConfigurationShortfall: number | null;
  safetyCashShortfall: number | null;
  executionMethod: DefensiveConfigurationExecutionMethod;
  canExecute: boolean;
  blockingReasons: readonly DefensiveConfigurationBlockingReason[];
};

export type DefensiveConfigurationPresentationValue = {
  status: 'known' | 'unavailable';
  value: number | null;
  isExplicitZero: boolean;
};

export type DefensiveConfigurationPresentation = {
  defensiveTotalRatio: DefensiveConfigurationPresentationValue;
  protectedSafetyCash: DefensiveConfigurationPresentationValue;
  defensiveHoldingsRatio: DefensiveConfigurationPresentationValue;
  investableCash: DefensiveConfigurationPresentationValue;
  theory: {
    defensiveConfigurationShortfall: DefensiveConfigurationPresentationValue;
    safetyCashShortfall: DefensiveConfigurationPresentationValue;
  };
  execution: {
    status: 'available' | 'blocked' | 'unavailable';
    method: DefensiveConfigurationExecutionMethod;
    blockingReasons: DefensiveConfigurationBlockingReason[];
  };
};

function presentNumber(value: number | null): DefensiveConfigurationPresentationValue {
  if (value === null || !Number.isFinite(value)) {
    return { status: 'unavailable', value: null, isExplicitZero: false };
  }

  return {
    status: 'known',
    value,
    isExplicitZero: value === 0,
  };
}

/**
 * Maps already-derived household-liquidity and rebalance values for display.
 * It intentionally performs no financial calculation or fallback coercion.
 */
export function deriveDefensiveConfigurationPresentation(
  input: DefensiveConfigurationPresentationInput,
): DefensiveConfigurationPresentation {
  const blockingReasons = input.blockingReasons.map(({ code, message }) => ({ code, message }));
  const executionStatus = blockingReasons.length > 0
    ? 'blocked'
    : input.executionMethod !== null && input.canExecute
      ? 'available'
      : 'unavailable';

  return {
    defensiveTotalRatio: presentNumber(input.defensiveTotalRatio),
    protectedSafetyCash: presentNumber(input.protectedSafetyCash),
    defensiveHoldingsRatio: presentNumber(input.defensiveHoldingsRatio),
    investableCash: presentNumber(input.investableCash),
    theory: {
      defensiveConfigurationShortfall: presentNumber(input.theoreticalDefensiveConfigurationShortfall),
      safetyCashShortfall: presentNumber(input.safetyCashShortfall),
    },
    execution: {
      status: executionStatus,
      method: input.executionMethod,
      blockingReasons,
    },
  };
}
