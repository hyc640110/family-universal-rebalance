import { allocationPresetLabel, deriveAllocationPresetPreview, type AllocationPreset, type AllocationRole } from './allocationPresets';

export type ClecStrategyId = 'current-target-gap' | 'standard' | 'buy-only' | 'annual-ratio-reset' | 'clec-smart-rebalance' | 'clec-dynamic-contribution' | 'one-time-target-reset';
export type ClecStrategySpecificationStatus = 'implemented' | 'verified-partial' | 'unverified';
export type ClecStrategySourceType = 'existing-app-engine' | 'public-partial-reference' | 'unverified-name';
export type ClecStrategyDefinition = {
  id: ClecStrategyId;
  name: string;
  specificationStatus: ClecStrategySpecificationStatus;
  executable: boolean;
  summary: string;
  verifiedRules: string[];
  missingRules: string[];
  requiredInputs: string[];
  effects: string[];
  limitations: string[];
  sourceType: ClecStrategySourceType;
};

export type ClecStrategyHolding = { symbol: string; name: string; targetWeight: number; role?: AllocationRole };
export type ClecStrategyCenterInput = {
  allocation: { preset: AllocationPreset; holdings: ClecStrategyHolding[]; roleBySymbol: Record<string, AllocationRole> };
  rebalanceMode: 'standard' | 'buy-only';
  dataQuality: { passed: boolean; blockingReasons: string[]; warnings?: string[] };
  trigger: { thresholdReached: boolean | null; allocationDeviation: number | null; rebalanceThreshold: number | null };
};
export type ClecStrategyCenterResult = {
  allocationSource: { preset: AllocationPreset; label: string; rolesValid: boolean; blockingReasons: string[]; targetWeightTotal: number | null; targetWeights: Array<{ symbol: string; name: string; role: AllocationRole; targetWeight: number }> };
  currentStrategy: { id: 'current-target-gap'; rebalanceMode: 'standard' | 'buy-only'; executable: boolean };
  dataQuality: { passed: boolean; blockingReasons: string[]; warnings: string[] };
  trigger: ClecStrategyCenterInput['trigger'];
  availableCalculation: { canCalculateCurrentGap: boolean; recommendationRoute: string };
  strategies: ClecStrategyDefinition[];
};

const strategy = (definition: ClecStrategyDefinition) => definition;

export const CLEC_STRATEGIES: readonly ClecStrategyDefinition[] = [
  strategy({ id: 'current-target-gap', name: '目前目標缺口', specificationStatus: 'implemented', executable: true, sourceType: 'existing-app-engine', summary: '依正式 targetWeight 比較目前市值與目標市值差額；CLEC 433／442 只可能是目標權重來源。', verifiedRules: ['targetValue = totalAssets × targetWeight ÷ 100', 'difference = targetValue − currentValue', '不代表 CLEC 特有交易規則。'], missingRules: [], requiredInputs: ['總資產', '各持股市值', '正式 targetWeight', '有效報價'], effects: ['可導向既有理論金額建議', '不自動下單'], limitations: ['由既有資料品質 gate 決定是否可計算。'] }),
  strategy({ id: 'standard', name: 'Standard', specificationStatus: 'implemented', executable: true, sourceType: 'existing-app-engine', summary: '既有標準再平衡交易限制。', verifiedRules: ['低配產生理論買入金額', '高配產生理論賣出金額', '賣出所得與目前流動現金分開呈現，不假設同輪立即投入。'], missingRules: [], requiredInputs: ['目前目標缺口的全部輸入', '流動現金'], effects: ['輸出既有理論買入／賣出金額', '不含手續費、交易稅與滑價'], limitations: ['不預測價格或市場時機。'] }),
  strategy({ id: 'buy-only', name: 'Buy-only', specificationStatus: 'implemented', executable: true, sourceType: 'existing-app-engine', summary: '既有只買不賣交易限制。', verifiedRules: ['只使用 min(buyOnlyBudget, liquidCash)', '依低配缺口由大到小配置', '超配標的不賣出也不加碼', '預算用完即停止。'], missingRules: [], requiredInputs: ['目前目標缺口的全部輸入', '流動現金', 'buyOnlyBudget'], effects: ['輸出既有理論買入金額', '不產生賣出指令'], limitations: ['預算不足時會保留未滿足缺口。'] }),
  strategy({ id: 'annual-ratio-reset', name: '每年比例重置', specificationStatus: 'verified-partial', executable: false, sourceType: 'public-partial-reference', summary: '公開資料可確認核心為每年將投資組合調回設定目標比例；核心數學與目前 target-gap 相同。', verifiedRules: ['每年調整回設定目標比例', '核心使用目前 target-gap 數學。'], missingRules: ['年底或隔年 1 月執行尚未核實', '賣出所得是否同輪買入尚未核實', '實際交易日與假日規則尚未核實', '稅、費用與滑價尚未核實。'], requiredInputs: ['目標權重', '年度執行時間規則', '市值與有效報價', '現金及賣出所得規則'], effects: ['本頁不輸出金額、股數或交易清單。'], limitations: ['公式規格僅部分核對，不可執行。'] }),
  strategy({ id: 'clec-smart-rebalance', name: 'CLEC 聰明再平衡', specificationStatus: 'verified-partial', executable: false, sourceType: 'public-partial-reference', summary: '公開說明提及正年度可能賣出部分盈利留現金、負年度可能用現金買入一定比例槓桿資產，並曾提及 12 月止盈。', verifiedRules: ['公開說明提及正年度部分盈利處理', '公開說明提及負年度以現金買入槓桿資產', '公開說明曾提及 12 月止盈。'], missingRules: ['盈利的精確計算基準', '1/3 的完整公式', '2% 的分母', '牛熊判定與年度切換順序', '現金不足與多標的角色映射', '交易日、費用、稅與滑價。'], requiredInputs: ['經核實的年度基準', '現金', '角色映射', '有效價格與交易日規則'], effects: ['不產生金額、股數或交易清單。'], limitations: ['不得從現有 App 資料推測缺少的年度基準。'] }),
  strategy({ id: 'clec-dynamic-contribution', name: 'CLEC 動態投入', specificationStatus: 'unverified', executable: false, sourceType: 'unverified-name', summary: '尚無可核驗正式公式。', verifiedRules: [], missingRules: ['投入頻率', '資金在角色之間的分配方式', '是否依偏離、行情或固定比例分配', '是否保留現金。'], requiredInputs: ['正式公式與範例'], effects: ['不試算。'], limitations: ['不自行假設等比例、缺口優先或定期定額。'] }),
  strategy({ id: 'one-time-target-reset', name: '一次性目標比率重設', specificationStatus: 'unverified', executable: false, sourceType: 'unverified-name', summary: '目前只是待確認概念，不宣稱為已核實的 CLEC 正式策略。', verifiedRules: ['在本 App 的資料語義中，較接近一次性修改 targetWeight', '修改目標比例與執行交易必須是兩個不同動作', '既有 CLEC 433／442 preset 已負責部分目標比例設定。'], missingRules: ['正式名稱', '是否為 CLEC 正式策略', '完整公式、觸發與交易規則。'], requiredInputs: ['正式來源與數值範例'], effects: ['不修改 targetWeight', '不產生交易結果。'], limitations: ['本頁不提供設定按鈕。'] })
];

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const weight = (value: unknown) => finite(value) ? Math.max(0, value) : 0;

/** Pure selector: it only summarizes supplied data and never reads storage, fetches, or mutates input. */
export function deriveClecStrategyCenter(input: ClecStrategyCenterInput): ClecStrategyCenterResult {
  const holdings = input.allocation.holdings.map(holding => ({ ...holding, symbol: String(holding.symbol || '').trim().toUpperCase(), name: holding.name || String(holding.symbol || '').trim().toUpperCase(), targetWeight: weight(holding.targetWeight) }));
  const preview = deriveAllocationPresetPreview({ preset: input.allocation.preset, holdings, roleBySymbol: input.allocation.roleBySymbol });
  const isCustom = input.allocation.preset === 'custom';
  const targetWeightTotal = holdings.length ? holdings.reduce((total, holding) => total + holding.targetWeight, 0) : null;
  const targetWeights = holdings.map(holding => ({ symbol: holding.symbol, name: holding.name, role: input.allocation.roleBySymbol[holding.symbol] || 'none', targetWeight: holding.targetWeight }));
  const rolesValid = isCustom || preview.canApply;
  const allocationBlockingReasons = isCustom ? [] : preview.blockingReasons;
  return {
    allocationSource: { preset: input.allocation.preset, label: allocationPresetLabel(input.allocation.preset), rolesValid, blockingReasons: allocationBlockingReasons, targetWeightTotal, targetWeights },
    currentStrategy: { id: 'current-target-gap', rebalanceMode: input.rebalanceMode, executable: input.dataQuality.passed },
    dataQuality: { passed: input.dataQuality.passed, blockingReasons: [...input.dataQuality.blockingReasons], warnings: [...(input.dataQuality.warnings || [])] },
    trigger: { ...input.trigger },
    availableCalculation: { canCalculateCurrentGap: input.dataQuality.passed, recommendationRoute: '/tools/rebalance-recommendation' },
    strategies: CLEC_STRATEGIES.map(item => ({ ...item, verifiedRules: [...item.verifiedRules], missingRules: [...item.missingRules], requiredInputs: [...item.requiredInputs], effects: [...item.effects], limitations: [...item.limitations] }))
  };
}
