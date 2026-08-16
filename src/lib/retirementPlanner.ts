import { DEFAULT_CASH_FLOW_PROFILE, normalizeCashFlowProfile, type CashFlowItem, type CashFlowProfile } from './cashFlow';
import { calculateRequiredMonthlyContribution } from './wealthGoal';

export type RetirementAnnualBigExpenses = {
  travelBudget: number;
  insuranceFee: number;
};

export type RetirementPlan = {
  fixedExpenses: CashFlowItem[];
  customFixedExpenseIds: string[];
  annualBigExpenses: RetirementAnnualBigExpenses;
  withdrawalRatePercent: number;
  retirementYears: number;
  expectedAnnualReturnPercent: number;
};

export type RetirementPlanCalculation = {
  monthlyFixedExpenses: number;
  annualExpenses: number;
  fireTarget: number;
  progressPercent: number;
  averageMonthlyContribution: number | null;
  annualContribution: number | null;
};

const DEFAULT_RETIREMENT_PLAN: Omit<RetirementPlan, 'fixedExpenses'> = {
  customFixedExpenseIds: [],
  annualBigExpenses: { travelBudget: 0, insuranceFee: 0 },
  withdrawalRatePercent: 4,
  retirementYears: 20,
  expectedAnnualReturnPercent: 5
};

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function nonNegative(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function clamp(value: unknown, minimum: number, maximum: number, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

function normalizeFixedExpenses(value: unknown): CashFlowItem[] {
  if (!Array.isArray(value)) return [];
  return normalizeCashFlowProfile({ ...DEFAULT_CASH_FLOW_PROFILE, fixedExpenses: value }).fixedExpenses.map(item => ({ ...item }));
}

function customExpenseIds(value: unknown, fixedExpenses: readonly CashFlowItem[]): string[] {
  if (!Array.isArray(value)) return [];
  const validIds = new Set(fixedExpenses.map(item => item.id));
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && validIds.has(item)))].slice(0, 5);
}

export function normalizeRetirementPlan(value: unknown): RetirementPlan | undefined {
  const raw = record(value);
  if (!raw) return undefined;
  const fixedExpenses = normalizeFixedExpenses(raw.fixedExpenses);
  const bigExpenses = record(raw.annualBigExpenses);
  return {
    fixedExpenses,
    customFixedExpenseIds: customExpenseIds(raw.customFixedExpenseIds, fixedExpenses),
    annualBigExpenses: {
      travelBudget: nonNegative(bigExpenses?.travelBudget),
      insuranceFee: nonNegative(bigExpenses?.insuranceFee)
    },
    withdrawalRatePercent: clamp(raw.withdrawalRatePercent, 1, 20, DEFAULT_RETIREMENT_PLAN.withdrawalRatePercent),
    retirementYears: Math.floor(clamp(raw.retirementYears, 0, 60, DEFAULT_RETIREMENT_PLAN.retirementYears)),
    expectedAnnualReturnPercent: clamp(raw.expectedAnnualReturnPercent, 0, 20, DEFAULT_RETIREMENT_PLAN.expectedAnnualReturnPercent)
  };
}

export function createRetirementPlanDraft(profile?: CashFlowProfile, overrides: Partial<RetirementPlan> = {}): RetirementPlan {
  const seededExpenses = overrides.fixedExpenses ?? (profile ? normalizeCashFlowProfile(profile).fixedExpenses : []);
  const fixedExpenses = normalizeFixedExpenses(seededExpenses);
  return {
    fixedExpenses,
    customFixedExpenseIds: customExpenseIds(overrides.customFixedExpenseIds ?? DEFAULT_RETIREMENT_PLAN.customFixedExpenseIds, fixedExpenses),
    annualBigExpenses: {
      travelBudget: nonNegative(overrides.annualBigExpenses?.travelBudget, DEFAULT_RETIREMENT_PLAN.annualBigExpenses.travelBudget),
      insuranceFee: nonNegative(overrides.annualBigExpenses?.insuranceFee, DEFAULT_RETIREMENT_PLAN.annualBigExpenses.insuranceFee)
    },
    withdrawalRatePercent: clamp(overrides.withdrawalRatePercent, 1, 20, DEFAULT_RETIREMENT_PLAN.withdrawalRatePercent),
    retirementYears: Math.floor(clamp(overrides.retirementYears, 0, 60, DEFAULT_RETIREMENT_PLAN.retirementYears)),
    expectedAnnualReturnPercent: clamp(overrides.expectedAnnualReturnPercent, 0, 20, DEFAULT_RETIREMENT_PLAN.expectedAnnualReturnPercent)
  };
}

export function calculateRetirementPlan(plan: RetirementPlan, currentNetWorth: number): RetirementPlanCalculation {
  const normalized = normalizeRetirementPlan(plan) ?? createRetirementPlanDraft();
  const monthlyFixedExpenses = normalized.fixedExpenses.reduce((total, item) => total + (item.enabled ? nonNegative(item.amount) : 0), 0);
  const annualExpenses = monthlyFixedExpenses * 12 + normalized.annualBigExpenses.travelBudget + normalized.annualBigExpenses.insuranceFee;
  const fireTarget = annualExpenses / (normalized.withdrawalRatePercent / 100);
  const current = nonNegative(currentNetWorth);
  const months = normalized.retirementYears * 12;
  const averageMonthlyContribution = calculateRequiredMonthlyContribution(current, {
    targetAmount: fireTarget,
    monthlyContribution: 0,
    annualReturnRate: normalized.expectedAnnualReturnPercent,
    annualContributionGrowthRate: 0,
    inflationRate: 0
  }, months);
  return {
    monthlyFixedExpenses,
    annualExpenses,
    fireTarget,
    progressPercent: fireTarget > 0 ? current / fireTarget * 100 : 0,
    averageMonthlyContribution,
    annualContribution: averageMonthlyContribution === null ? null : averageMonthlyContribution * 12
  };
}
