export type CashFlowCategory = 'housing' | 'loan' | 'insurance' | 'utilities' | 'transportation' | 'family' | 'subscription' | 'other';
export const CASH_FLOW_SCHEMA_VERSION = 3;
export const CASH_FLOW_LIQUIDITY_ROLES = ['essential-living', 'debt-payment', 'excluded', 'ambiguous'] as const;
export type CashFlowLiquidityRole = typeof CASH_FLOW_LIQUIDITY_ROLES[number];
export type CashFlowItem = { id: string; name: string; amount: number; category: CashFlowCategory; enabled: boolean; liquidityRole?: CashFlowLiquidityRole; linkedLoanId?: string };
export type HouseholdLiquidityPlanInput = Readonly<{
  externalContribution?: number;
  plannedWithdrawal?: number;
}>;
export type CashFlowProfile = { schemaVersion?: number; monthlyIncome: number | null; fixedExpenses: CashFlowItem[]; variableExpenseBudget: number | null; monthlyInvestmentBudget: number | null; emergencyFundTargetMonths: number; notes?: string } & HouseholdLiquidityPlanInput;
export type CashFlowStatus = '穩定' | '偏緊' | '赤字' | '資料不足';

const n = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? value : Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableMoney = (value: unknown): number | null => value === null || value === undefined || value === '' ? null : Math.max(0, n(value));
export const DEFAULT_CASH_FLOW_PROFILE: CashFlowProfile = { schemaVersion: CASH_FLOW_SCHEMA_VERSION, monthlyIncome: null, fixedExpenses: [], variableExpenseBudget: null, monthlyInvestmentBudget: null, emergencyFundTargetMonths: 6, notes: '' };
export const categoryLabels: Record<CashFlowCategory, string> = { housing: '房貸／房租', loan: '信貸', insurance: '保險', utilities: '水電瓦斯／電信', transportation: '交通', family: '家庭支出', subscription: '訂閱服務', other: '其他' };

const liquidityRole = (value: unknown): CashFlowLiquidityRole | undefined =>
  CASH_FLOW_LIQUIDITY_ROLES.includes(value as CashFlowLiquidityRole) ? value as CashFlowLiquidityRole : undefined;
const linkedLoanId = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
const planMoney = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
const schemaVersion = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > CASH_FLOW_SCHEMA_VERSION
  ? value
  : CASH_FLOW_SCHEMA_VERSION;

/**
 * Normalizes the persisted, decision-cycle plan inputs without converting an absent
 * value or invalid legacy data into a zero amount. `undefined` is intentionally the
 * only absence representation; zero remains an explicit user declaration.
 */
export function normalizeHouseholdLiquidityPlanInput(raw: unknown): HouseholdLiquidityPlanInput {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const externalContribution = planMoney(source.externalContribution);
  const plannedWithdrawal = planMoney(source.plannedWithdrawal);
  return {
    ...(externalContribution === undefined ? {} : { externalContribution }),
    ...(plannedWithdrawal === undefined ? {} : { plannedWithdrawal })
  };
}

export function normalizeCashFlowProfile(raw: unknown): CashFlowProfile {
  const source = raw && typeof raw === 'object' ? raw as Partial<CashFlowProfile> : {};
  const planInput = normalizeHouseholdLiquidityPlanInput(source);
  const expenses = Array.isArray(source.fixedExpenses) ? source.fixedExpenses.map((item, index) => {
    const row = item && typeof item === 'object' ? item as Partial<CashFlowItem> : {};
    const category = Object.hasOwn(categoryLabels, row.category ?? '') ? row.category as CashFlowCategory : 'other';
    const role = liquidityRole(row.liquidityRole);
    const loanId = role === 'debt-payment' ? linkedLoanId(row.linkedLoanId) : undefined;
    return { id: row.id || `cash-flow-${index}`, name: String(row.name ?? '').trim(), amount: Math.max(0, n(row.amount)), category, enabled: row.enabled !== false, ...(role ? { liquidityRole: role } : {}), ...(loanId ? { linkedLoanId: loanId } : {}) };
  }).filter(item => item.name) : [];
  return { schemaVersion: schemaVersion(source.schemaVersion), monthlyIncome: nullableMoney(source.monthlyIncome), fixedExpenses: expenses, variableExpenseBudget: nullableMoney(source.variableExpenseBudget), monthlyInvestmentBudget: nullableMoney(source.monthlyInvestmentBudget), emergencyFundTargetMonths: Math.min(24, Math.max(1, Math.round(n(source.emergencyFundTargetMonths) || 6))), notes: typeof source.notes === 'string' ? source.notes : '', ...planInput };
}

/** The existing Cash Flow normalization boundary is the deterministic, idempotent provenance migration. */
export const migrateCashFlowProfile = (raw: unknown): CashFlowProfile => normalizeCashFlowProfile(raw);

export const wanToYuan = (value: string): number | null => {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 10000) : null;
};
export const yuanToWan = (value: number | null | undefined): string => value === null || value === undefined || !Number.isFinite(value) ? '' : String(value / 10000);
export const formatWanInput = yuanToWan;
export const parseWanInput = wanToYuan;

const ratio = (numerator: number, denominator: number | null): number | null => denominator !== null && denominator > 0 && Number.isFinite(numerator) ? numerator / denominator : null;
export function calculateFixedExpenses(profile: CashFlowProfile): number { return profile.fixedExpenses.filter(item => item.enabled).reduce((total, item) => total + Math.max(0, n(item.amount)), 0); }
export function calculateTotalLivingExpenses(profile: CashFlowProfile): number { return calculateFixedExpenses(profile) + Math.max(0, profile.variableExpenseBudget ?? 0); }
export function calculatePreInvestmentCashFlow(profile: CashFlowProfile): number | null { return profile.monthlyIncome === null ? null : profile.monthlyIncome - calculateTotalLivingExpenses(profile); }
export function calculatePostInvestmentCashFlow(profile: CashFlowProfile): number | null { const before = calculatePreInvestmentCashFlow(profile); return before === null ? null : before - Math.max(0, profile.monthlyInvestmentBudget ?? 0); }
export function calculateSavingsRate(profile: CashFlowProfile): number | null { const before = calculatePreInvestmentCashFlow(profile); return before === null ? null : ratio(before, profile.monthlyIncome); }
export function calculateInvestmentRate(profile: CashFlowProfile): number | null { return ratio(Math.max(0, profile.monthlyInvestmentBudget ?? 0), profile.monthlyIncome); }
export function calculateEmergencyFundTarget(profile: CashFlowProfile): number { return calculateTotalLivingExpenses(profile) * profile.emergencyFundTargetMonths; }
export function calculateExpenseRatios(profile: CashFlowProfile) { const income = profile.monthlyIncome; const fixed = calculateFixedExpenses(profile); const living = calculateTotalLivingExpenses(profile); const investmentCapacity = calculatePostInvestmentCashFlow(profile); return { fixedExpenseRate: ratio(fixed, income), totalExpenseRate: ratio(living, income), investmentCapacity }; }
export function classifyCashFlowStatus(profile: CashFlowProfile): CashFlowStatus { const after = calculatePostInvestmentCashFlow(profile); if (after === null || profile.monthlyIncome === null) return '資料不足'; if (after < 0) return '赤字'; return after >= profile.monthlyIncome * 0.1 ? '穩定' : '偏緊'; }
export function deriveCashFlow(profile: CashFlowProfile, currentCash: number | null) { const fixedExpenses = calculateFixedExpenses(profile); const livingExpenses = calculateTotalLivingExpenses(profile); const beforeInvestment = calculatePreInvestmentCashFlow(profile); const afterInvestment = calculatePostInvestmentCashFlow(profile); const emergencyFundTarget = calculateEmergencyFundTarget(profile); const cash = currentCash === null || !Number.isFinite(currentCash) ? null : Math.max(0, currentCash); return { fixedExpenses, livingExpenses, beforeInvestment, afterInvestment, savingsRate: calculateSavingsRate(profile), investmentRate: calculateInvestmentRate(profile), emergencyFundTarget, currentCash: cash, emergencyGap: cash === null ? null : cash - emergencyFundTarget, emergencyProgress: emergencyFundTarget > 0 && cash !== null ? cash / emergencyFundTarget : null, ratios: calculateExpenseRatios(profile), status: classifyCashFlowStatus(profile) }; }
