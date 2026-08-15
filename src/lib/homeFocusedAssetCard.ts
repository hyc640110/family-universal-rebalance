import type { RebalanceRecommendationRow } from './rebalanceRecommendation';

// UR-TODO-059 (scope-adjusted): the homepage's top block is a direct "how is this one asset
// doing" readout rather than a general "rank every asset by deviation" engine — that generic
// ranking was the original candidate design and is explicitly out of scope. This module adds no
// new financial computation; it only selects and formats the already-computed
// rebalanceRecommendation.ts row for the caller-supplied symbol, mirroring todayDecision.ts's
// existing "pure presentation selection over already-derived inputs" pattern.
//
// UR-TODO-061: the symbol itself is no longer hardcoded — it's whichever single symbol the user
// has chosen via AppState.focusedSymbols (see App.tsx). The caller is responsible for not calling
// this at all when no symbol is selected (the homepage card renders nothing in that case, mirroring
// CreditCardDueSoonCard's "no items → render nothing" convention) — this module has no opinion on
// that decision, it only ever formats a single given symbol's data.
export type HomeFocusedAssetCardInput = {
  symbol: string;
  investableCash: number | null;
  canRecommend: boolean;
  thresholdReached: boolean;
  /** The rebalanceRecommendation.ts row for `symbol`, or undefined if that symbol is no longer
   *  present in the user's holdings/target allocation. */
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
      symbol: input.symbol, name: null, investableCash: input.investableCash,
      currentWeight: null, targetWeight: null, deviation: null,
      status: 'unavailable', action: null, recommendedAmount: null,
      message: `${input.symbol} 目前不在配置中，請先於資產配置頁面設定目標比例。`
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
