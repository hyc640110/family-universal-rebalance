import type { HouseholdLiquidityOutput } from './householdLiquidity';

type HomeDecisionItem = { title: string; reason: string; to: string; level: number };

export type HomeDecisionInput = {
  riskLevel: number;
  rebalance: boolean;
  dip: boolean;
  wealthBehind: boolean;
  quotesMissing: boolean;
  targetInvalid: boolean;
  dataCompleteness: HouseholdLiquidityOutput['dataCompleteness'];
  safetyCashShortfall: HouseholdLiquidityOutput['safetyCashShortfall'];
  investableCash: HouseholdLiquidityOutput['investableCash'];
};

const single = (primary: HomeDecisionItem) => ({ primary, items: [primary] });

export function deriveHomeDecision(input: HomeDecisionInput) {
  if (
    input.dataCompleteness !== 'complete'
    || input.safetyCashShortfall === null
    || input.investableCash === null
  ) {
    return single({ title: '資料不足', reason: '目前缺少必要生活費或負債資料，無法安全計算可投資現金。', to: '/tools/risk-center', level: 1 });
  }
  if (input.safetyCashShortfall > 0) {
    return single({ title: '現金安全存量不足', reason: '現金安全存量不足，暫不產生可執行投資建議。', to: '/tools/risk-center', level: 1 });
  }
  if (input.investableCash === 0) {
    return single({ title: '保留現金', reason: '目前沒有可投資現金，建議先保留現金。', to: '/tools/risk-center', level: 1 });
  }

  const items: HomeDecisionItem[] = [];
  if (input.riskLevel >= 2) items.push({ title: '需要優先處理風險', reason: '核心風險需要優先處理。', to: '/tools/risk-center', level: 1 });
  if (input.rebalance) items.push({ title: '建議再平衡', reason: '目前配置已超過既有再平衡門檻。', to: '/analytics', level: 2 });
  if (input.dip) items.push({ title: '建議加碼', reason: '至少一檔持股已觸發逢低加碼觀察。', to: '/analytics', level: 3 });
  if (input.wealthBehind) items.push({ title: '建議留意', reason: '依目前假設，目標年份可能無法達成。', to: '/tools/wealth-goal', level: 4 });
  if (input.quotesMissing || input.targetInvalid) items.push({ title: '建議留意', reason: input.quotesMissing ? '部分股價資料缺失。' : '目標比例總和需要調整。', to: '/assets', level: 5 });
  const primary = items[0] ?? { title: '不需操作', reason: '目前配置仍在容許範圍內，現金與風險狀態正常。', to: '/analytics', level: 6 };
  return { primary, items: items.slice(0, 5) };
}
