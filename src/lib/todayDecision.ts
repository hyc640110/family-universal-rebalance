import type { DefensiveReminder } from './rebalanceOrderHelper';
import type { HouseholdLiquidityOutput } from './householdLiquidity';

// UR-TODO-009 sub-PR 1 (Sprint 4 safety prep, 013 §11.2/§30): pure relocation of the "今日決策" conclusion
// logic out of src/App.tsx into its own file, mirroring the V7.0B sub-PR 4a/5a pattern (getOrderSuggestions,
// getDipAlertRows) so tests/todayDecision.test.ts can import and exercise the real production function —
// App.tsx cannot be imported by tests/*.test.ts, since it references import.meta.env at module scope, a
// Vite-only global that throws under the plain Node ESM runtime tsx --test uses. UR-TODO-009 sub-PR 5 replaces the legacy repayment-only
// check with the documented Household Liquidity priority order without recalculating any liquidity values here.
export type TodayDecisionInput = {
  dataCompleteness: HouseholdLiquidityOutput['dataCompleteness'];
  safetyCashShortfall: HouseholdLiquidityOutput['safetyCashShortfall'];
  investableCash: HouseholdLiquidityOutput['investableCash'];
  thresholdReached: boolean;
  triggeredDipAlertCount: number;
  defensiveReminderStatus: DefensiveReminder['status'];
  totalBuyAmount: number;
};

export type TodayDecision = { conclusion: string; dipTriggered: boolean; lowCashSafety: boolean; dataInsufficient: boolean };

export function deriveTodayDecision(input: TodayDecisionInput): TodayDecision {
  const dipTriggered = input.triggeredDipAlertCount > 0;
  const dataInsufficient = input.dataCompleteness !== 'complete'
    || input.safetyCashShortfall === null
    || input.investableCash === null;
  const lowCashSafety = input.safetyCashShortfall !== null && input.safetyCashShortfall > 0;
  const defensiveUnder = input.defensiveReminderStatus === 'under';
  const conclusion = dataInsufficient ? '目前缺少必要生活費或負債資料，無法安全計算可投資現金。'
    : lowCashSafety ? '現金安全存量不足'
    : input.investableCash === 0 ? '目前沒有可投資現金，建議先保留現金。'
    : input.thresholdReached ? '已達再平衡門檻'
    : dipTriggered ? '建議分批加碼觀察'
    : defensiveUnder ? '防守資產不足'
    : input.totalBuyAmount > 0 ? '建議分批加碼'
    : '維持持有，暫不需要操作';
  return { conclusion, dipTriggered, lowCashSafety, dataInsufficient };
}
