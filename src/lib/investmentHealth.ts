import { num, type RebalanceMode } from './rebalanceOrderHelper';

const pct = (n: number) => `${num(n).toFixed(1)}%`;

// UR-TODO-009 sub-PR 2 (Sprint 4 safety prep, 013 §21/§30): pure relocation of the Analytics "風險提醒"
// (investmentHealth) logic out of src/App.tsx into its own file, mirroring the sub-PR 1 relocation of
// todayDecision and the V7.0B sub-PR 4a/5a pattern, so tests/investmentHealth.test.ts can import and exercise
// the real production function — App.tsx cannot be imported by tests/*.test.ts, since it references
// import.meta.env at module scope, a Vite-only global that throws under the plain Node ESM runtime tsx --test
// uses. This sub-PR is a pure relocation: no logic, formula, or output change, including the liquidity-risk
// override block (`monthlyPayment > 0 && repaymentSafetyMonths < 3`), which is the same pre-Household-Liquidity
// formula flagged in the UR-TODO-009 read-only inventory. Replacing it with `safetyCashShortfall` from
// HouseholdLiquidityOutput (013 §22) is out of scope for this sub-PR and requires a separate architecture
// decision.
export type InvestmentHealthInput = {
  totalAssets: number;
  growthTargetPct: number;
  growth: number;
  cash: number;
  monthlyPayment: number;
  repaymentSafetyMonths: number;
  deviation: number;
  defensiveTarget: number;
  defensiveCurrent: number;
  thresholdReached: boolean;
  threshold: number;
  mode: RebalanceMode;
};

export type InvestmentHealth = { status: string; tone: 'good' | 'warn' | 'bad'; reason: string; suggestion: string };

export function deriveInvestmentHealth(input: InvestmentHealthInput): InvestmentHealth {
  const absDeviation = Math.abs(input.deviation);
  const overTarget = input.deviation > 0;
  const underTarget = input.deviation < 0;
  const stockDiff = input.totalAssets * (input.growthTargetPct / 100) - input.growth;
  const defensiveGap = Math.max(0, input.defensiveTarget - input.defensiveCurrent);

  let status = '正常';
  let tone: 'good' | 'warn' | 'bad' = 'good';
  let reason = '目前配置尚未達再平衡門檻。';
  let suggestion = '維持目前配置。';

  if (!input.thresholdReached) {
    status = '正常';
    tone = 'good';
    reason = '目前配置尚未達再平衡門檻。';
    suggestion = '維持目前配置。';
  } else if (input.deviation >= 10) {
    status = '槓桿風險提高';
    tone = 'bad';
    reason = `成長資產高於目標 ${pct(input.deviation)}，已超過 10%。`;
    suggestion = '暫停加碼成長資產，優先累積現金或防守標的。';
  } else if (absDeviation >= 10) {
    status = '偏離過大';
    tone = 'bad';
    reason = `成長資產${underTarget ? '低於' : '高於'}目標 ${pct(absDeviation)}，偏離幅度已達 10%。`;
    suggestion = underTarget ? '依目前再平衡模式分批補足成長資產。' : '優先補強現金或防守標的，降低配置偏離。';
  } else if (stockDiff > 0 && input.cash < stockDiff && input.thresholdReached) {
    status = '現金不足';
    tone = 'warn';
    reason = `成長資產低於目標 ${pct(absDeviation)}，可用現金不足以補足目標差額。`;
    suggestion = '先累積現金，再分批買入成長資產。';
  } else if (overTarget && defensiveGap > 0) {
    status = '注意';
    tone = 'warn';
    reason = `成長資產高於目標 ${pct(absDeviation)}，已超過再平衡門檻 ${pct(input.threshold)}。`;
    suggestion = input.mode === 'buy-only' ? '暫停加碼成長資產，優先累積現金或防守標的。' : '可依標準再平衡增加現金或防守標的。';
  } else {
    status = '注意';
    tone = 'warn';
    reason = `成長資產低於目標 ${pct(absDeviation)}，已超過再平衡門檻 ${pct(input.threshold)}。`;
    suggestion = '可依目前再平衡模式分批補足成長資產。';
  }

  // 流動性風險覆蓋邏輯：可用現金可支應還款月數低於 3 個月且月付金 > 0
  if (input.monthlyPayment > 0 && input.repaymentSafetyMonths < 3) {
    if (tone !== 'bad') {
      status = '現金不足';
      tone = 'warn';
      reason = `目前防守現金僅夠支應未來 ${input.repaymentSafetyMonths.toFixed(1)} 個月的信貸還款，還款準備金偏低，請注意流動性風險。`;
      suggestion = '暫停任何投資性加碼，優先累積防守現金準備金。';
    }
  }

  return { status, tone, reason, suggestion };
}
