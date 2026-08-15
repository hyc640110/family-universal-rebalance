import { deriveDipFundingStatus, type DipAlertLiquidityContext, type DipFundingStatus } from './dipAlertEngine';
import { DIP_LADDER_STEP_PCT } from './dipLadderEngine';

// UR-TODO-057 sub-PR 2: homepage presentation for the automatic drawdown ladder (dipLadderEngine.ts
// sub-PR 1), consumed by the "重點標的" card (homeFocusedAssetCard.ts / HomeFocusedAssetCard.tsx)
// as an independent second block. Pure selection/formatting only — no new financial computation.
// `currentPrice` here is intentionally NOT re-gated by the same quote-quality filter that guards
// the persisted highWaterMark/triggeredLevel write path: this is a display-only value (whatever
// price is already shown elsewhere for this holding), separate from "is this quote good enough to
// advance the ladder state". ADR-002 compliance: `triggeredLevel` itself is never touched here —
// it is read verbatim from AppState and only classified against liquidity via the existing,
// unmodified deriveDipFundingStatus() (013 §14.3: signal and funding eligibility stay visually and
// computationally separate).

export type HomeFocusedAssetLadderInput = {
  enabled: boolean;
  highWaterMark: number | null;
  triggeredLevel: number | null;
  currentPrice: number | null;
  liquidity: DipAlertLiquidityContext;
  executableBudget: number | null;
  externalFundingRequired: number | null;
};

export type HomeFocusedAssetLadderStatus = 'unavailable' | 'normal' | 'action-needed';

export type HomeFocusedAssetLadderData = {
  highWaterMark: number | null;
  currentPrice: number | null;
  drawdownPct: number | null;
  triggeredLevel: number | null;
  /** Only populated when not triggered and a high-water mark exists: percentage points still
   *  needed to reach the first ladder level (level 1, -10%). */
  nextLevelGapPct: number | null;
  status: HomeFocusedAssetLadderStatus;
  fundingStatus: DipFundingStatus | null;
  investableCash: number | null;
  executableBudget: number | null;
  externalFundingRequired: number | null;
  message: string;
};

export function deriveHomeFocusedAssetLadder(input: HomeFocusedAssetLadderInput): HomeFocusedAssetLadderData {
  const shared = {
    highWaterMark: input.highWaterMark,
    currentPrice: input.currentPrice,
    investableCash: input.liquidity.investableCash,
    executableBudget: input.executableBudget,
    externalFundingRequired: input.externalFundingRequired
  };
  if (!input.enabled) {
    return { ...shared, drawdownPct: null, triggeredLevel: null, nextLevelGapPct: null, status: 'unavailable', fundingStatus: null, message: '尚未啟用逢低加碼自動追蹤。' };
  }
  if (input.highWaterMark === null) {
    return { ...shared, drawdownPct: null, triggeredLevel: null, nextLevelGapPct: null, status: 'unavailable', fundingStatus: null, message: '尚無報價資料，等待下一次有效報價後開始追蹤高點。' };
  }
  if (input.currentPrice === null) {
    return { ...shared, drawdownPct: null, triggeredLevel: input.triggeredLevel, nextLevelGapPct: null, status: input.triggeredLevel !== null ? 'action-needed' : 'unavailable', fundingStatus: null, message: '目前無有效報價，暫不計算回撤。' };
  }
  const drawdownPct = Math.round((input.currentPrice / input.highWaterMark - 1) * 100 * 1e6) / 1e6;
  const triggered = input.triggeredLevel !== null;
  if (!triggered) {
    const gapPct = Math.max(0, DIP_LADDER_STEP_PCT - Math.max(0, -drawdownPct));
    return {
      ...shared, drawdownPct, triggeredLevel: null, nextLevelGapPct: gapPct,
      status: 'normal', fundingStatus: null,
      message: gapPct <= 0 ? '已達第一級門檻，等待下次報價更新。' : `距下一級門檻還差 ${gapPct.toFixed(1)}%。`
    };
  }
  const fundingStatus = deriveDipFundingStatus(true, input.liquidity);
  return {
    ...shared, drawdownPct, triggeredLevel: input.triggeredLevel, nextLevelGapPct: null,
    status: 'action-needed', fundingStatus,
    message: fundingStatus === 'executable' ? `已觸發第 ${input.triggeredLevel} 級。` : dipFundingMessage(fundingStatus)
  };
}

// Mirrors App.tsx's own local dipFundingMessage() (same three cases, same wording) — a small,
// deliberate text duplication rather than a new cross-file export for three short strings,
// matching this codebase's existing tolerance for such duplication (e.g. the backup-source regex
// already copied across rebalanceRecommendation.ts/App.tsx/dipLadderEngine.ts).
function dipFundingMessage(status: DipFundingStatus): string {
  switch (status) {
    case 'data-insufficient': return '家庭流動性資料不足，僅顯示逢低訊號，暫不產生買入建議。';
    case 'safety-cash-priority': return '安全存量不足，建議優先補足安全現金，暫不產生買入建議。';
    case 'observe-only': return '可投資現金為 0，僅列入觀察，不產生買單。';
    default: return '';
  }
}
