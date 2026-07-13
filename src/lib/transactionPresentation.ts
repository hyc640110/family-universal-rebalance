/** Transaction list values stay readable in yuan below ten thousand. */
export function formatTransactionAmount(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  const absolute = Math.abs(amount);
  if (absolute < 10000) return `${absolute.toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 元`;
  return `${(absolute / 10000).toLocaleString('zh-TW', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 萬元`;
}
