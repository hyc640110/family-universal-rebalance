export type ChangeTone = 'up' | 'down' | 'hold';

export function changeTone(value: number | null | undefined): ChangeTone {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) return 'hold';
  return value > 0 ? 'up' : 'down';
}

export function formatChangeMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${(Math.abs(value) / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬元`;
}

export function formatChangePercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${(Math.abs(value) * 100).toFixed(1)}%`;
}
