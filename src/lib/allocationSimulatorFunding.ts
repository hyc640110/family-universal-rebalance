export type AllocationSimulatorFundingInput = Readonly<{
  totalLiquidCash: number | null | undefined;
  protectedSafetyCash: number | null | undefined;
  externalContribution: number | null | undefined;
  plannedWithdrawal: number | null | undefined;
  allowSafetyCashUsage?: boolean;
}>;

export type AllocationSimulatorFundingBlockingReason =
  | 'TOTAL_LIQUID_CASH_UNAVAILABLE'
  | 'PROTECTED_SAFETY_CASH_UNAVAILABLE'
  | 'EXTERNAL_CONTRIBUTION_UNAVAILABLE'
  | 'PLANNED_WITHDRAWAL_UNAVAILABLE'
  | 'CALCULATION_OVERFLOW'
  | 'PLANNED_WITHDRAWAL_EXCEEDS_ALL_KNOWN_SOURCES';

export type AllocationSimulatorFundingWarning =
  | 'SAFETY_CASH_USAGE_ASSUMPTION'
  | 'SIMULATION_FUNDING_DEPLETED_BY_WITHDRAWAL';

export type AllocationSimulatorFunding = Readonly<{
  existingInvestableCash: number | null;
  externalContribution: number | null;
  protectedSafetyCash: number | null;
  plannedWithdrawal: number | null;
  usableProtectedSafetyCash: number | null;
  simulationAvailableFunding: number | null;
  isUnavailable: boolean;
  blockingReasons: AllocationSimulatorFundingBlockingReason[];
  warnings: AllocationSimulatorFundingWarning[];
}>;

const knownNonnegativeMoney = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * Derives Simulator-only funding semantics from explicit, already available values.
 * It deliberately neither imports nor changes the formal Household Liquidity model.
 */
export function deriveAllocationSimulatorFunding(input: AllocationSimulatorFundingInput): AllocationSimulatorFunding {
  const blockingReasons: AllocationSimulatorFundingBlockingReason[] = [];
  const warnings: AllocationSimulatorFundingWarning[] = [];
  const totalLiquidCash = knownNonnegativeMoney(input.totalLiquidCash) ? input.totalLiquidCash : null;
  const protectedSafetyCash = knownNonnegativeMoney(input.protectedSafetyCash) ? input.protectedSafetyCash : null;
  const externalContribution = knownNonnegativeMoney(input.externalContribution) ? input.externalContribution : null;
  const plannedWithdrawal = knownNonnegativeMoney(input.plannedWithdrawal) ? input.plannedWithdrawal : null;

  if (totalLiquidCash === null) blockingReasons.push('TOTAL_LIQUID_CASH_UNAVAILABLE');
  if (protectedSafetyCash === null) blockingReasons.push('PROTECTED_SAFETY_CASH_UNAVAILABLE');
  if (externalContribution === null) blockingReasons.push('EXTERNAL_CONTRIBUTION_UNAVAILABLE');
  if (plannedWithdrawal === null) blockingReasons.push('PLANNED_WITHDRAWAL_UNAVAILABLE');

  const existingInvestableCash = totalLiquidCash !== null && protectedSafetyCash !== null
    ? Math.max(0, totalLiquidCash - protectedSafetyCash)
    : null;
  const usableProtectedSafetyCash = totalLiquidCash !== null && protectedSafetyCash !== null
    ? Math.max(0, Math.min(protectedSafetyCash, totalLiquidCash))
    : null;

  if (totalLiquidCash === null || protectedSafetyCash === null || externalContribution === null || plannedWithdrawal === null
    || existingInvestableCash === null || usableProtectedSafetyCash === null) {
    if (input.allowSafetyCashUsage === true) warnings.push('SAFETY_CASH_USAGE_ASSUMPTION');
    return {
      existingInvestableCash,
      externalContribution,
      protectedSafetyCash,
      plannedWithdrawal,
      usableProtectedSafetyCash,
      simulationAvailableFunding: null,
      isUnavailable: true,
      blockingReasons,
      warnings
    };
  }

  const includeSafetyCash = input.allowSafetyCashUsage === true;
  if (includeSafetyCash) warnings.push('SAFETY_CASH_USAGE_ASSUMPTION');

  const allKnownSources = totalLiquidCash + externalContribution;
  const availableBeforeWithdrawal = existingInvestableCash + externalContribution + (includeSafetyCash ? usableProtectedSafetyCash : 0);
  if (!Number.isFinite(allKnownSources) || !Number.isFinite(availableBeforeWithdrawal)) {
    return {
      existingInvestableCash,
      externalContribution,
      protectedSafetyCash,
      plannedWithdrawal,
      usableProtectedSafetyCash,
      simulationAvailableFunding: null,
      isUnavailable: true,
      blockingReasons: [...blockingReasons, 'CALCULATION_OVERFLOW'],
      warnings
    };
  }

  if (plannedWithdrawal > allKnownSources) blockingReasons.push('PLANNED_WITHDRAWAL_EXCEEDS_ALL_KNOWN_SOURCES');
  const remainingFunding = availableBeforeWithdrawal - plannedWithdrawal;
  if (remainingFunding < 0) warnings.push('SIMULATION_FUNDING_DEPLETED_BY_WITHDRAWAL');

  return {
    existingInvestableCash,
    externalContribution,
    protectedSafetyCash,
    plannedWithdrawal,
    usableProtectedSafetyCash,
    simulationAvailableFunding: Math.max(0, remainingFunding),
    isUnavailable: false,
    blockingReasons,
    warnings
  };
}
