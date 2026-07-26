import type { DefensiveReminder } from './rebalanceOrderHelper';

// UR-TODO-009 sub-PR 1 (Sprint 4 safety prep, 013 §11.2/§30): pure relocation of the "今日決策" conclusion
// logic out of src/App.tsx into its own file, mirroring the V7.0B sub-PR 4a/5a pattern (getOrderSuggestions,
// getDipAlertRows) so tests/todayDecision.test.ts can import and exercise the real production function —
// App.tsx cannot be imported by tests/*.test.ts, since it references import.meta.env at module scope, a
// Vite-only global that throws under the plain Node ESM runtime tsx --test uses. This sub-PR is a pure
// relocation: no logic, formula, or output change. The two-layer conclusion below (data-availability check,
// then a flat priority chain led by `lowCashSafety`) is deliberately unchanged; rewriting it into the 013
// §11.2/§24.2 six-layer priority order (資料完整性→安全存量→可投資現金→配置偏離→逢低訊號→其他投資機會) is
// out of scope for this sub-PR and requires a separate architecture decision on which
// HouseholdLiquidityOutput fields replace `repaymentSafetyMonths`.
export type TodayDecisionInput = {
  totalAssets: number;
  monthlyPayment: number;
  repaymentSafetyMonths: number;
  thresholdReached: boolean;
  triggeredDipAlertCount: number;
  defensiveReminderStatus: DefensiveReminder['status'];
  totalBuyAmount: number;
};

export type TodayDecision = { conclusion: string; dipTriggered: boolean; lowCashSafety: boolean };

export function deriveTodayDecision(input: TodayDecisionInput): TodayDecision {
  const dipTriggered = input.triggeredDipAlertCount > 0;
  const lowCashSafety = input.monthlyPayment > 0 && input.repaymentSafetyMonths < 3;
  const defensiveUnder = input.defensiveReminderStatus === 'under';
  const conclusion = !input.totalAssets ? '資料不足，暫時無法產生建議'
    : lowCashSafety ? '現金安全存量不足'
    : input.thresholdReached ? '已達再平衡門檻'
    : dipTriggered ? '建議分批加碼觀察'
    : defensiveUnder ? '防守資產不足'
    : input.totalBuyAmount > 0 ? '建議分批加碼'
    : '維持持有，暫不需要操作';
  return { conclusion, dipTriggered, lowCashSafety };
}
