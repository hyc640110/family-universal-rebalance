export type RiskLevel = 0 | 1 | 2 | 3;
export type RiskAsset = { symbol: string; name: string; assetClass: 'growth' | 'defensive'; marketValue: number };
export type RiskLoan = { id: string; name: string; principal: number; annualRate: number; monthlyPayment: number; remainingMonths?: number; paidMonths?: number; totalMonths?: number };
export type RiskInput = { assets: RiskAsset[]; loans: RiskLoan[]; cash: number; totalAssets: number; growthRatio: number; defensiveRatio: number; growthTargetPct: number; allocationDeviation: number; rebalanceThreshold: number; thresholdReached: boolean };
export type RiskItem = { key: string; level: RiskLevel; title: string; status: string; reason: string; suggestion: string };

const n = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const levelLabel = (level: RiskLevel) => ['低風險', '中等風險', '偏高風險', '高風險'][level];
const cashLevel = (months: number | null): RiskLevel => months === null ? 0 : months >= 12 ? 0 : months >= 6 ? 1 : months >= 3 ? 2 : 3;
const concentrationLevel = (ratio: number): RiskLevel => ratio > 70 ? 3 : ratio >= 50 ? 2 : ratio >= 30 ? 1 : 0;
export const isLeveragedAsset = (asset: Pick<RiskAsset, 'symbol' | 'name'>) => /正2|槓桿/i.test(`${asset.symbol} ${asset.name}`) || /\dL$/i.test(asset.symbol);

export function deriveRiskMetrics(input: RiskInput) {
  const totalAssets = Math.max(0, n(input.totalAssets));
  const cash = Math.max(0, n(input.cash));
  const loans = input.loans.map(loan => ({ ...loan, principal: Math.max(0, n(loan.principal)), monthlyPayment: Math.max(0, n(loan.monthlyPayment)) }));
  const monthlyPayment = loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  const debt = loans.reduce((sum, loan) => sum + loan.principal, 0);
  const cashSafetyMonths = monthlyPayment > 0 ? cash / monthlyPayment : null;
  const minimumCashTarget = monthlyPayment * 6;
  const stableCashTarget = monthlyPayment * 12;
  const sortedAssets = input.assets.map(asset => ({ ...asset, marketValue: Math.max(0, n(asset.marketValue)) })).sort((a, b) => b.marketValue - a.marketValue);
  const ratioOf = (value: number) => totalAssets > 0 ? value / totalAssets * 100 : 0;
  const largest = sortedAssets[0];
  const largestHoldingRatio = ratioOf(largest?.marketValue ?? 0);
  const topTwoRatio = ratioOf(sortedAssets.slice(0, 2).reduce((sum, asset) => sum + asset.marketValue, 0));
  const topThreeRatio = ratioOf(sortedAssets.slice(0, 3).reduce((sum, asset) => sum + asset.marketValue, 0));
  const leveragedAssets = sortedAssets.filter(isLeveragedAsset);
  const leveragedValue = leveragedAssets.reduce((sum, asset) => sum + asset.marketValue, 0);
  const leveragedRatio = ratioOf(leveragedValue);
  const growthValue = sortedAssets.filter(asset => asset.assetClass === 'growth').reduce((sum, asset) => sum + asset.marketValue, 0);
  const leveragedGrowthRatio = growthValue > 0 ? leveragedValue / growthValue * 100 : 0;
  const leverageLevel: RiskLevel = leveragedRatio >= 60 ? 3 : leveragedRatio >= 40 ? 2 : leveragedRatio >= 20 ? 1 : 0;
  const concentration = concentrationLevel(largestHoldingRatio);
  const allocationLevel: RiskLevel = input.thresholdReached ? Math.abs(input.allocationDeviation) >= 10 ? 2 : 1 : 0;
  const cashRisk = cashLevel(cashSafetyMonths);
  const loanRisk: RiskLevel = monthlyPayment === 0 ? 0 : cashRisk;
  const items: RiskItem[] = [
    { key: 'cash', level: cashRisk, title: '現金安全', status: monthlyPayment === 0 ? '目前無借款月付壓力' : levelLabel(cashRisk), reason: monthlyPayment === 0 ? '目前沒有借款月付，因此本指標只反映流動性。' : `目前現金可支應 ${cashSafetyMonths?.toFixed(1)} 個月借款還款。`, suggestion: monthlyPayment === 0 ? '持續依家庭需求檢視流動性。' : cashRisk >= 2 ? '優先補足至少 6 個月借款還款的安全現金。' : '維持目前安全現金水位。' },
    { key: 'loan', level: loanRisk, title: '借款壓力', status: monthlyPayment === 0 ? '無月付壓力' : levelLabel(loanRisk), reason: monthlyPayment === 0 ? '目前沒有借款資料。' : `借款餘額 ${debt.toLocaleString('zh-TW')} 元，每月還款 ${monthlyPayment.toLocaleString('zh-TW')} 元。`, suggestion: loanRisk >= 2 ? '先保留還款準備金，暫緩提高風險部位。' : '依還款期程持續追蹤。' },
    { key: 'leveraged', level: leverageLevel, title: '槓桿資產', status: leveragedAssets.length ? levelLabel(leverageLevel) : '未辨識到槓桿資產', reason: leveragedAssets.length ? `辨識到 ${leveragedAssets.length} 項槓桿資產，占總資產 ${leveragedRatio.toFixed(1)}%。` : '依目前代碼及名稱規則，未辨識到槓桿資產。', suggestion: leverageLevel >= 2 ? '暫緩增加槓桿部位，先檢查現金與集中度。' : '持續監看槓桿資產占比。' },
    { key: 'concentration', level: concentration, title: '資產集中度', status: levelLabel(concentration), reason: largest ? `最大單一資產為 ${largest.symbol}，占總資產 ${largestHoldingRatio.toFixed(1)}%。` : '目前沒有可計入市值的持股資料。', suggestion: concentration >= 2 ? '檢查單一資產占比，必要時以配置模擬器測試替代方案。' : '維持目前集中度並定期檢視。' },
    { key: 'allocation', level: allocationLevel, title: '成長／防守配置', status: input.thresholdReached ? levelLabel(allocationLevel) : '在再平衡門檻內', reason: `成長資產目前 ${n(input.growthRatio).toFixed(1)}%，目標 ${n(input.growthTargetPct).toFixed(1)}%，偏離 ${n(input.allocationDeviation).toFixed(1)}%。`, suggestion: input.thresholdReached ? '前往分析頁查看既有再平衡建議。' : '目前不需因配置偏離採取行動。' }
  ];
  const overallLevel = items.reduce<RiskLevel>((highest, item) => Math.max(highest, item.level) as RiskLevel, 0);
  const priorityActions = items.filter(item => item.level > 0).sort((a, b) => b.level - a.level);
  if (!priorityActions.length) priorityActions.push({ key: 'maintain', level: 0, title: '維持監測', status: '目前未出現核心高風險訊號', reason: '核心風險指標均在目前門檻內。', suggestion: '維持定期更新股價與檢視資產配置。' });
  return { totalAssets, cash, loans, debt, monthlyPayment, cashSafetyMonths, minimumCashTarget, stableCashTarget, largest, largestHoldingRatio, topTwoRatio, topThreeRatio, leveragedAssets, leveragedValue, leveragedRatio, leveragedGrowthRatio, growthRatio: n(input.growthRatio), defensiveRatio: n(input.defensiveRatio), cashRatio: ratioOf(cash), allocationDeviation: n(input.allocationDeviation), rebalanceThreshold: n(input.rebalanceThreshold), thresholdReached: input.thresholdReached, items, overallLevel, overallLabel: levelLabel(overallLevel), primaryRisk: priorityActions[0], priorityActions };
}
