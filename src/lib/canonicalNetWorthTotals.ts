import { getFinancialAccountBalance, isFinancialAccountLiability, type FinancialAccount } from './financialAccounts';
import {
  deriveForeignCashValuation,
  selectUsdTwdReferenceCloseRate,
  FX_VALUATION_CURRENCY,
  type ForeignCashValuation,
  type FxRateRecord,
  type PinnedForeignCashValuation
} from './fxValuation';

const LIQUID_ACCOUNT_TYPES = new Set(['cash', 'bank', 'eWallet']);

export type CanonicalAccountValuation = {
  accountId: string;
  /** TWD contribution; 0 when the account cannot be safely valued (never a naked foreign-currency sum). */
  value: number;
  available: boolean;
  valuation: ForeignCashValuation | null;
};

export type CanonicalNetWorthTotals = {
  cash: number;
  cashAvailable: boolean;
  accountNetWorth: number;
  accountNetWorthAvailable: boolean;
  /** Only status:'available' results — ready to pin onto a NetWorthSnapshot. */
  fxValuations: PinnedForeignCashValuation[];
};

/**
 * Inactive accounts already contribute 0 via getFinancialAccountBalance regardless of currency
 * (pre-existing, non-FX behavior); this must stay a no-op here so a disabled foreign account can
 * never taint availability for a total it was never part of in the first place.
 */
function canonicalAccountValuation(
  account: FinancialAccount,
  rate: FxRateRecord | undefined,
  valuationDate: string,
  derivedBalances: Record<string, number> | undefined
): CanonicalAccountValuation {
  if (!account.isActive) return { accountId: account.id, value: 0, available: true, valuation: null };
  if (account.currency === FX_VALUATION_CURRENCY) {
    const balance = getFinancialAccountBalance(account, { derivedBalances });
    return { accountId: account.id, value: balance.value ?? 0, available: true, valuation: null };
  }
  const valuation = deriveForeignCashValuation({ account, valuationDate, rate, derivedBalances });
  if (valuation && valuation.status === 'available') {
    return { accountId: account.id, value: valuation.roundedValue, available: true, valuation };
  }
  return { accountId: account.id, value: 0, available: false, valuation };
}

/**
 * Canonical TWD-only cash / net-worth totals producer (UR-TODO-046 FX-A3).
 *
 * Reuses FX-A1's `deriveForeignCashValuation`/`selectUsdTwdReferenceCloseRate` — no second FX
 * conversion path is introduced here. A non-TWD account never contributes its raw balance to any
 * total (no naked-currency sum); when it cannot be safely valued (missing/stale rate, unsupported
 * currency, or an invalid/non-finite balance) its contribution is 0 and the relevant total is
 * marked unavailable rather than silently presented as complete.
 */
export function deriveCanonicalNetWorthTotals(
  accounts: readonly FinancialAccount[],
  fxRateHistory: readonly FxRateRecord[],
  valuationDate: string,
  context?: { derivedBalances?: Record<string, number> }
): CanonicalNetWorthTotals {
  const rate = selectUsdTwdReferenceCloseRate(fxRateHistory, valuationDate);
  const derivedBalances = context?.derivedBalances;

  let cash = 0;
  let cashAvailable = true;
  let accountNetWorth = 0;
  let accountNetWorthAvailable = true;
  const fxValuations: PinnedForeignCashValuation[] = [];

  for (const account of accounts) {
    const result = canonicalAccountValuation(account, rate, valuationDate, derivedBalances);
    const signed = isFinancialAccountLiability(account) ? -result.value : result.value;
    accountNetWorth += signed;
    if (!result.available) accountNetWorthAvailable = false;
    if (LIQUID_ACCOUNT_TYPES.has(account.type)) {
      cash += result.value;
      if (!result.available) cashAvailable = false;
    }
    if (result.valuation && result.valuation.status === 'available') fxValuations.push(result.valuation);
  }

  return { cash, cashAvailable, accountNetWorth, accountNetWorthAvailable, fxValuations };
}
