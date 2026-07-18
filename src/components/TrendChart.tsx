import { useMemo, useState } from 'react';

export type TrendPoint = { date: string; value: number };
type Props = { title: string; unit: string; data: TrendPoint[]; formatValue: (value: number) => string; className?: string };

const tickLabel = (date: string) => date.slice(5).replace('-', '/');

export default function TrendChart({ title, unit, data, formatValue, className = '' }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const valid = useMemo(() => data.filter(point => Number.isFinite(point.value)), [data]);
  if (!valid.length) return <div className="analytics-empty"><p>尚無趨勢資料</p><span>{title}需要至少一筆有效快照。</span></div>;
  const values = valid.map(point => point.value), rawMin = Math.min(...values), rawMax = Math.max(...values);
  const padding = Math.max(Math.abs(rawMax - rawMin) * .12, Math.max(Math.abs(rawMax) * .02, 1));
  const min = rawMin - padding, max = rawMax + padding, span = max - min || 1;
  const width = 320, height = 180, left = 48, right = 12, top = 16, bottom = 30;
  const x = (index: number) => valid.length < 2 ? (left + width - right) / 2 : left + index / (valid.length - 1) * (width - left - right);
  const y = (value: number) => top + (max - value) / span * (height - top - bottom);
  const points = valid.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  const xTicks = [...new Set([0, Math.floor((valid.length - 1) / 2), valid.length - 1])];
  const yTicks = [0, .5, 1].map(ratio => max - span * ratio);
  const current = active === null ? valid.at(-1)! : valid[active];
  const summary = `${title}，期間 ${valid[0].date} 至 ${valid.at(-1)!.date}，由 ${formatValue(valid[0].value)} 變為 ${formatValue(valid.at(-1)!.value)}。`;
  return <div className={`trend-chart ${className}`}><div className="trend-chart-heading"><span>{unit}</span><span aria-live="polite">{current.date}｜{formatValue(current.value)}</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary} onMouseLeave={() => setActive(null)} onTouchEnd={() => setActive(null)}>{yTicks.map(value => <g key={value}><line x1={left} x2={width-right} y1={y(value)} y2={y(value)} className="trend-grid"/><text x={left-6} y={y(value)+4} textAnchor="end" className="trend-axis-label">{formatValue(value)}</text></g>)}{xTicks.map(index => <text key={index} x={x(index)} y={height-8} textAnchor="middle" className="trend-axis-label">{tickLabel(valid[index].date)}</text>)}{valid.length > 1 && <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>}{valid.map((point,index)=><circle key={point.date} cx={x(index)} cy={y(point.value)} r={active===index||valid.length===1?4:2.5} className="trend-point" onMouseEnter={()=>setActive(index)} onTouchStart={()=>setActive(index)}><title>{`${point.date}\n${title}：${formatValue(point.value)}`}</title></circle>)}</svg><p className="sr-only">{summary}</p></div>;
}
