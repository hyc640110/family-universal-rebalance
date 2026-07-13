export type CompactQuoteMovement = {
  text: string;
  tone: 'up' | 'down' | 'hold';
};

/**
 * Presentation-only formatter. The ratio keeps the existing holding-card
 * definition: holding market value divided by total assets.
 */
export function formatCompactHoldingWeight(marketValue: number, totalAssets: number): string {
  if (!Number.isFinite(marketValue) || !Number.isFinite(totalAssets) || marketValue < 0 || totalAssets <= 0) return '—';
  const value = marketValue / totalAssets * 100;
  if (value > 0 && value < 1) return '<1%';
  return `${value.toFixed(1)}%`;
}

export function formatCompactQuoteMovement(changePct: number, isCurrentQuote: boolean): CompactQuoteMovement {
  if (!isCurrentQuote || !Number.isFinite(changePct)) return { text: '— 非今日報價', tone: 'hold' };
  if (changePct > 0) return { text: `↑ +${changePct.toFixed(2)}%`, tone: 'up' };
  if (changePct < 0) return { text: `↓ ${changePct.toFixed(2)}%`, tone: 'down' };
  return { text: '— 0.00%', tone: 'hold' };
}
