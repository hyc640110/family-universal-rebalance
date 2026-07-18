export type CompactQuoteMovement = {
  text: string;
  tone: 'up' | 'down' | 'hold';
  ariaLabel: string;
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

export function formatCompactQuoteMovement(change: number | undefined, changePct: number | undefined, previousClose: number | undefined): CompactQuoteMovement {
  const amount = Number(change);
  const percent = Number(changePct);
  const priorClose = Number(previousClose);
  if (!Number.isFinite(amount) || !Number.isFinite(percent) || !Number.isFinite(priorClose) || priorClose <= 0) return { text: '—', tone: 'hold', ariaLabel: '最近交易日漲跌資料不足' };
  if (amount > 0) return { text: `+${amount.toFixed(2)}（+${Math.abs(percent).toFixed(2)}%）`, tone: 'up', ariaLabel: `最近交易日上漲 ${amount.toFixed(2)} 元，漲幅 ${Math.abs(percent).toFixed(2)}%` };
  if (amount < 0) return { text: `-${Math.abs(amount).toFixed(2)}（-${Math.abs(percent).toFixed(2)}%）`, tone: 'down', ariaLabel: `最近交易日下跌 ${Math.abs(amount).toFixed(2)} 元，跌幅 ${Math.abs(percent).toFixed(2)}%` };
  return { text: '0.00（0.00%）', tone: 'hold', ariaLabel: '最近交易日平盤' };
}
