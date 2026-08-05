import { isCanonicalCalendarDay, shiftCanonicalCalendarDay } from './calendarDay';

/**
 * UR-TODO-041: a standalone, read-only per-loan staleness indicator.
 *
 * This deliberately never touches `HouseholdLoan`, `deriveHouseholdLiquidity()`,
 * `blockingReasons`, or `dataCompleteness` — the household liquidity core model's
 * `dataCompleteness` is a systemwide gate that already degrades buy eligibility,
 * dip-alert funding status, and the AI Decision cash card (013 §24.3) whenever it
 * leaves 'complete'. Routing loan staleness through that gate would make every
 * stale-but-otherwise-fine loan block or de-conservatize those unrelated outputs,
 * which is explicitly out of scope here (Plan A: presentation-only warning).
 */
export const LOAN_DATA_STALE_THRESHOLD_DAYS = 30;

export type LoanDataFreshness = {
  loanId: string;
  /** Null when missing or not a valid Asia/Taipei canonical calendar-day; never treated as stale. */
  asOf: string | null;
  isStale: boolean;
};

/** Uses the same Asia/Taipei canonical calendar-day contract established by UR-TODO-043-B; no new date comparison logic. */
export function isLoanDataStale(asOf: string, today: string): boolean {
  if (!isCanonicalCalendarDay(asOf) || !isCanonicalCalendarDay(today)) return false;
  return asOf < shiftCanonicalCalendarDay(today, -LOAN_DATA_STALE_THRESHOLD_DAYS);
}

export function deriveLoanDataFreshness(loans: readonly { id: string; asOf?: string }[], today: string): LoanDataFreshness[] {
  return loans.map(loan => {
    const asOf = typeof loan.asOf === 'string' && isCanonicalCalendarDay(loan.asOf) ? loan.asOf : null;
    return { loanId: loan.id, asOf, isStale: asOf !== null && isLoanDataStale(asOf, today) };
  });
}
