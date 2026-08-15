import type { QuoteDateStatus } from './quoteMath';

// UR-TODO-057 sub-PR 1 (Strangler Pattern 抽出階段，比照 ADR-001): pure calculation core for
// automatic high-water-mark tracking and a 10%-drawdown-step ladder. This module has zero
// dependency on AppState, React, or App.tsx and is not wired into the app yet — no
// normalizeDipAlertSetting() change, no quote-refresh bridge, no UI. That is sub-PR 2's scope.
//
// ADR-002 compliance: every field this module produces is derived purely from price/quote-quality
// inputs. No household-liquidity/funding data may ever enter this file — funding eligibility
// (the existing DipFundingStatus/deriveDipFundingStatus in dipAlertEngine.ts) stays a separate
// layer the caller applies on top of this signal, unchanged.

export const DIP_LADDER_STEP_PCT = 10;

export type DipLadderState = {
  /** Automatically-tracked high-water mark. null = tracking not yet initialized — per the
   *  finalized decision, initialization uses "whatever price is current when tracking starts",
   *  never a pre-existing manually-entered reference price. */
  highWaterMark: number | null;
  /** How many 10%-drawdown levels have been triggered since the last new high. null = none. */
  triggeredLevel: number | null;
};

export const initialDipLadderState: DipLadderState = { highWaterMark: null, triggeredLevel: null };

export type DipLadderQuoteInput = {
  price: number;
  quoteStatus: QuoteDateStatus;
  quoteSource: string;
};

export type DipLadderUpdateResult = {
  state: DipLadderState;
  /** Non-null only when the quote was acceptable and a high-water mark already existed before
   *  this update. Always <= 0 (a positive delta is a new high, not a "drawdown"). */
  drawdownPct: number | null;
  /** The level number if this update crossed a level not already triggered this cycle; null if
   *  no new level was crossed — including "still within an already-triggered level" and "partial
   *  recovery without a new high" (the ladder only ever resets via a genuine new high, it never
   *  regresses on its own). */
  newlyTriggeredLevel: number | null;
  /** Whether the high-water mark changed as a result of this update (first initialization or a
   *  genuine new high). */
  didUpdateHighWaterMark: boolean;
  /** True when the quote failed the quality gate (stale/unknown/unavailable/backup source, or a
   *  non-finite/non-positive price) — `state` is the input `current` unchanged, byte-for-byte. */
  ignored: boolean;
};

const ACCEPTABLE_QUOTE_STATUSES: ReadonlySet<QuoteDateStatus> = new Set(['today', 'recent-trading-day']);

// Mirrors the existing backup-source predicate already duplicated across
// rebalanceRecommendation.ts (`backup()`) and App.tsx (`isBackupQuoteSource`) — same regex, no
// shared exported helper exists yet to reuse instead. See this sub-PR's own report for why a
// third copy lives here rather than introducing a new shared module for one predicate.
const isBackupQuoteSource = (source: unknown) => /備援|成交均價|離線/.test(String(source ?? ''));

function isAcceptableQuote(quote: DipLadderQuoteInput): boolean {
  return Number.isFinite(quote.price) && quote.price > 0
    && ACCEPTABLE_QUOTE_STATUSES.has(quote.quoteStatus)
    && !isBackupQuoteSource(quote.quoteSource);
}

export function deriveDipLadderUpdate(current: DipLadderState, quote: DipLadderQuoteInput): DipLadderUpdateResult {
  if (!isAcceptableQuote(quote)) {
    return { state: current, drawdownPct: null, newlyTriggeredLevel: null, didUpdateHighWaterMark: false, ignored: true };
  }
  if (current.highWaterMark === null || quote.price > current.highWaterMark) {
    return {
      state: { highWaterMark: quote.price, triggeredLevel: null },
      drawdownPct: 0, newlyTriggeredLevel: null, didUpdateHighWaterMark: true, ignored: false
    };
  }
  // Rounded to 6 decimal places before use: raw floating-point division (e.g. 90/100-1) can land
  // a hair off an exact boundary (-9.999999999999998 instead of -10), which would silently miss a
  // level at exactly-round drawdowns. Six decimals is far finer than any realistic price tick.
  const drawdownPct = Math.round((quote.price / current.highWaterMark - 1) * 100 * 1e6) / 1e6;
  const computedLevel = Math.floor(-drawdownPct / DIP_LADDER_STEP_PCT);
  const previousLevel = current.triggeredLevel ?? 0;
  const nextLevel = Math.max(previousLevel, computedLevel);
  return {
    state: { highWaterMark: current.highWaterMark, triggeredLevel: nextLevel === 0 ? null : nextLevel },
    drawdownPct,
    newlyTriggeredLevel: nextLevel > previousLevel ? nextLevel : null,
    didUpdateHighWaterMark: false,
    ignored: false
  };
}
