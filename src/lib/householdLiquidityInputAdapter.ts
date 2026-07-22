import type { CashFlowItem, CashFlowProfile } from './cashFlow';
import type { FinancialAccount, LegacyCashItem } from './financialAccounts';
import type { HouseholdLiquidityInput } from './householdLiquidity';

export type HouseholdLiquidityLoanSource = Readonly<{
  id: string;
  monthlyPayment: number;
}>;

export type HouseholdLiquidityAdapterSources = Readonly<{
  accounts: ReadonlyArray<FinancialAccount> | null | undefined;
  legacyCash: ReadonlyArray<LegacyCashItem> | null | undefined;
  derivedAccountBalances?: Readonly<Record<string, number>>;
  loans: ReadonlyArray<HouseholdLiquidityLoanSource> | null | undefined;
  cashFlowProfile: CashFlowProfile | null | undefined;
  configuredBudget: number | null | undefined;
  externalContribution: number | null | undefined;
  plannedWithdrawal: number | null | undefined;
}>;

const finiteNonnegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const unavailableMoney = (value: unknown): number => finiteNonnegative(value) ? value : Number.NaN;

const liquidAccount = (account: FinancialAccount, derivedAccountBalances: Readonly<Record<string, number>> | undefined) => {
  const base = { accountId: account.id, balance: null, status: 'unavailable' as const, source: 'financial-account' as const };
  if (account.currency !== 'TWD') return base;
  const balance = account.balanceMode === 'derived'
    ? derivedAccountBalances?.[account.id]
    : account.manualBalance;
  return finiteNonnegative(balance)
    ? { ...base, balance, status: 'available' as const }
    : base;
};

const legacyAccount = (cash: LegacyCashItem, index: number) => {
  const id = typeof cash.id === 'string' && cash.id ? cash.id : `invalid-${index}`;
  const balance = finiteNonnegative(cash.amount) ? cash.amount : null;
  return {
    accountId: `legacy-cash:${id}`,
    balance,
    status: balance === null ? 'unavailable' as const : 'available' as const,
    source: 'legacy-cash' as const
  };
};

const cashFlowRole = (item: CashFlowItem, loanIds: ReadonlySet<string>) => {
  if (!item.enabled) return 'excluded' as const;
  if (item.liquidityRole === 'essential-living' || item.liquidityRole === 'excluded' || item.liquidityRole === 'ambiguous') return item.liquidityRole;
  if (item.liquidityRole === 'debt-payment') return typeof item.linkedLoanId === 'string' && item.linkedLoanId && loanIds.has(item.linkedLoanId)
    ? 'debt-payment' as const
    : 'ambiguous' as const;
  return ['housing', 'loan', 'other'].includes(item.category) ? 'ambiguous' as const : 'essential-living' as const;
};

const planMoney = (value: number | null | undefined) => unavailableMoney(value);

/**
 * Maps explicit App-level source slices into the V6.17 core contract. It intentionally
 * preserves unavailable and ambiguous values so that deriveHouseholdLiquidity owns blocking.
 */
export function buildHouseholdLiquidityInput(sources: HouseholdLiquidityAdapterSources): HouseholdLiquidityInput {
  const accounts = Array.isArray(sources.accounts) ? sources.accounts : [];
  const legacyCash = Array.isArray(sources.legacyCash) ? sources.legacyCash : [];
  const loans = Array.isArray(sources.loans) ? sources.loans : [];
  const profile = sources.cashFlowProfile ?? null;
  const fixedExpenses = profile?.fixedExpenses ?? [];
  const loanIds = new Set(loans.map(loan => loan.id));

  return {
    liquidAccounts: [
      ...accounts.filter(account => account.isActive && ['cash', 'bank', 'eWallet'].includes(account.type))
        .map(account => liquidAccount(account, sources.derivedAccountBalances)),
      ...legacyCash.map(legacyAccount)
    ],
    livingExpenses: profile === null ? [] : [
      ...fixedExpenses.map(item => {
        const role = cashFlowRole(item, loanIds);
        return {
          sourceId: `cash-flow:${item.id}`,
          amount: finiteNonnegative(item.amount) ? item.amount : null,
          role,
          ...(role === 'debt-payment' && typeof item.linkedLoanId === 'string' && item.linkedLoanId && loanIds.has(item.linkedLoanId) ? { linkedLoanId: item.linkedLoanId } : {})
        };
      }),
      {
        sourceId: 'cash-flow:variable-expense-budget',
        amount: finiteNonnegative(profile.variableExpenseBudget) ? profile.variableExpenseBudget : null,
        role: 'essential-living' as const
      }
    ],
    loans: loans.map(loan => ({ loanId: loan.id, monthlyPayment: unavailableMoney(loan.monthlyPayment) })),
    configuredBudget: sources.configuredBudget === null || sources.configuredBudget === undefined
      ? null
      : unavailableMoney(sources.configuredBudget),
    protectedSafetyMonths: profile !== null ? unavailableMoney(profile.emergencyFundTargetMonths) : Number.NaN,
    externalContribution: planMoney(sources.externalContribution),
    plannedWithdrawal: planMoney(sources.plannedWithdrawal),
    allowSafetyCashUsage: false
  };
}
