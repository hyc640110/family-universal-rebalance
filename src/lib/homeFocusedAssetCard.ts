import type { RebalanceRecommendationRow } from './rebalanceRecommendation';

// UR-TODO-059 (scope-adjusted): the user has confirmed only one symbol is actually held/targeted
// (00631L), so the homepage's top block is a direct "how is this one asset doing" readout rather
// than a general "rank every asset by deviation" engine — that generic ranking was the original
// candidate design and is explicitly out of scope. This module adds no new financial computation;
// it only selects and formats the already-computed rebalanceRecommendation.ts row for this symbol,
// mirroring todayDecision.ts's existing "pure presentation selection over already-derived inputs"
// pattern.
export const HOME_FOCUSED_ASSET_SYMBOL = '00631L';

export type HomeFocusedAssetCardInput = {
  investableCash: number | null;
  canRecommend: boolean;
  thresholdReached: boolean;
  /** The rebalanceRecommendation.ts row for HOME_FOCUSED_ASSET_SYMBOL, or undefined if that
   *  symbol is no longer present in the user's holdings/target allocation. */
  row: RebalanceRecommendationRow | undefined;
};

export type HomeFocusedAssetCardStatus = 'unavailable' | 'normal' | 'action-needed';

export type HomeFocusedAssetCardData = {
  symbol: string;
  name: string | null;
  investableCash: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  deviation: number | null;
  status: HomeFocusedAssetCardStatus;
  action: 'buy' | 'sell' | null;
  recommendedAmount: number | null;
  message: string;
};

export function deriveHomeFocusedAssetCard(input: HomeFocusedAssetCardInput): HomeFocusedAssetCardData {
  const { row } = input;
  if (!row) {
    return {
      symbol: HOME_FOCUSED_ASSET_SYMBOL, name: null, investableCash: input.investableCash,
      currentWeight: null, targetWeight: null, deviation: null,
      status: 'unavailable', action: null, recommendedAmount: null,
      message: `${HOME_FOCUSED_ASSET_SYMBOL} 目前不在配置中，請先於資產配置頁面設定目標比例。`
    };
  }
  const deviation = row.currentWeight - row.targetWeight;
  if (!input.canRecommend) {
    return {
      symbol: row.symbol, name: row.name, investableCash: input.investableCash,
      currentWeight: row.currentWeight, targetWeight: row.targetWeight, deviation,
      status: 'unavailable', action: null, recommendedAmount: null,
      message: '資料品質尚未通過，暫停產生具體金額建議。'
    };
  }
  if (!input.thresholdReached) {
    return {
      symbol: row.symbol, name: row.name, investableCash: input.investableCash,
      currentWeight: row.currentWeight, targetWeight: row.targetWeight, deviation,
      status: 'normal', action: null, recommendedAmount: null,
      message: '目前配置正常，不需操作。'
    };
  }
  const action = row.action === 'buy' || row.action === 'sell' ? row.action : null;
  return {
    symbol: row.symbol, name: row.name, investableCash: input.investableCash,
    currentWeight: row.currentWeight, targetWeight: row.targetWeight, deviation,
    status: 'action-needed', action, recommendedAmount: action ? row.recommendedAmount : null,
    message: row.reason
  };
}
