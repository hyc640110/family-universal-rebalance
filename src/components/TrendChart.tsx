import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type TrendPoint = { date: string; value: number };
export type TrendDomain = { min: number; max: number; ticks: number[] };
type Props = { title: string; unit: string; data: TrendPoint[]; formatValue: (value: number) => string; axisScale?: number; domain?: TrendDomain; className?: string };

const tickLabel = (date: string) => date.slice(5).replace('-', '/');
export const selectTrendTickIndexes = (data: TrendPoint[], mobile = false) => {
  const count = data.length;
  if (!count) return [];
  const spanDays = Math.max(0, (Date.parse(`${data.at(-1)!.date}T00:00:00`) - Date.parse(`${data[0].date}T00:00:00`)) / 86_400_000);
  const limit = mobile ? (count <= 7 ? 5 : 4) : count <= 7 ? count : spanDays <= 30 ? 7 : 6;
  if (count <= limit) return data.map((_, index) => index);
  return [...new Set(Array.from({ length: limit }, (_, index) => Math.round(index * (count - 1) / (limit - 1))))];
};
const longLabel = (date: string, spanDays: number) => spanDays >= 365 ? date.slice(0, 7).replace('-', '/') : tickLabel(date);
const niceIntegerStep = (value: number) => {
  const base = 10 ** Math.floor(Math.log10(Math.max(1, value)));
  return ([1, 2, 5, 10].map(multiplier => multiplier * base).find(step => step >= value) ?? base * 10);
};
export const deriveTrendDomain = (values: readonly number[], axisScale = 1): TrendDomain => {
  const scale = Number.isFinite(axisScale) && axisScale > 0 ? axisScale : 1;
  const valid = values.filter(value => Number.isFinite(value)).map(value => value / scale);
  if (!valid.length) return { min: -2 * scale, max: 2 * scale, ticks: [-2, -1, 0, 1, 2].map(value => value * scale) };
  const rawMin = Math.min(...valid), rawMax = Math.max(...valid);
  const padding = Math.max(Math.abs(rawMax - rawMin) * .12, Math.max(Math.abs(rawMax) * .02, 2));
  const paddedMin = rawMin - padding, paddedMax = rawMax + padding;
  let step = niceIntegerStep((paddedMax - paddedMin) / 5);
  let min = Math.floor(paddedMin / step) * step, max = Math.ceil(paddedMax / step) * step;
  while ((max - min) / step + 1 > 7) { step = niceIntegerStep(step + 1); min = Math.floor(paddedMin / step) * step; max = Math.ceil(paddedMax / step) * step; }
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => (min + index * step) * scale);
  return { min: min * scale, max: max * scale, ticks };
};
export const deriveSharedTrendDomain = (series: ReadonlyArray<ReadonlyArray<number>>, axisScale = 1) => deriveTrendDomain(series.flat(), axisScale);
export const trendChartPlotMargins = (width: number) => width >= 720 ? { labelX: 6, left: 56, right: 34, top: 16, bottom: 34 } : { labelX: 6, left: 54, right: 28, top: 16, bottom: 34 };
export const formatTrendAxisTick = (value: number, axisScale = 1) => String(Math.round(value / axisScale));
// Shared tangent/curve math: monotonePath (the visible stroke) and monotoneSegments
// (per-segment area fills) must draw the exact same curve, so segments derive from
// the same slopes/tangents rather than a parallel re-implementation.
const monotoneSegments = (points: Array<{ x: number; y: number }>) => {
  if (points.length < 2) return [];
  const slopes = points.slice(1).map((point, index) => (point.y - points[index].y) / (point.x - points[index].x));
  const tangents = points.map((point, index) => index === 0 ? slopes[0] : index === points.length - 1 ? slopes.at(-1)! : slopes[index - 1] * slopes[index] <= 0 ? 0 : 2 / (1 / slopes[index - 1] + 1 / slopes[index]));
  return points.slice(1).map((point, index) => {
    const prev = points[index], dx = (point.x - prev.x) / 3;
    return { from: prev, to: point, curve: `C ${prev.x + dx} ${prev.y + dx * tangents[index]}, ${point.x - dx} ${point.y - dx * tangents[index + 1]}, ${point.x} ${point.y}` };
  });
};
const monotonePath = (points: Array<{ x: number; y: number }>) => {
  const segments = monotoneSegments(points);
  return segments.length ? segments.reduce((path, segment) => `${path} ${segment.curve}`, `M ${points[0].x} ${points[0].y}`) : '';
};

export default function TrendChart({ title, unit, data, formatValue, axisScale = 1, domain, className = '' }: Props) {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 320, height: 180 });
  const valid = useMemo(() => data.filter(point => Number.isFinite(point.value)), [data]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (width > 0 && height > 0) setCanvasSize({ width: Math.round(width), height: Math.round(height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  if (!valid.length) return <div className="analytics-empty"><p>尚無趨勢資料</p><span>{title}需要至少一筆有效快照。</span></div>;
  const axis = domain ?? deriveTrendDomain(valid.map(point => point.value), axisScale);
  const min = axis.min, max = axis.max, span = max - min || 1;
  const { width, height } = canvasSize, { labelX, left, right, top, bottom } = trendChartPlotMargins(width);
  const x = (index: number) => valid.length < 2 ? (left + width - right) / 2 : left + index / (valid.length - 1) * (width - left - right);
  const y = (value: number) => top + (max - value) / span * (height - top - bottom);
  const plotted = valid.map((point, index) => ({ x: x(index), y: y(point.value) }));
  const segments = monotoneSegments(plotted);
  const path = monotonePath(plotted);
  // UR-TODO-baseline-fill: today's value (the last point of whatever range is currently
  // shown) is the fixed reference — it never shifts when the user switches 7/30/90-day
  // ranges, since every range filter keeps the same latest point and only varies how far
  // back it starts. Above this line fills red, below fills green; this fully replaces the
  // old per-segment rise/fall coloring (UR-TODO-027), not an addition to it.
  const todayValue = valid.at(-1)!.value;
  const refY = y(todayValue);
  const sideOf = (value: number) => value > todayValue ? 'above' as const : value < todayValue ? 'below' as const : 'on' as const;
  // Monotone cubic interpolation never overshoots past its two endpoint values, so a
  // segment whose endpoints straddle todayValue crosses it exactly once — safe to locate
  // via linear interpolation on value (equivalent to pixel Y, since y() is an affine map).
  const areaSegments = segments.flatMap((segment, index) => {
    const fromValue = valid[index].value, toValue = valid[index + 1].value;
    const fromSide = sideOf(fromValue), toSide = sideOf(toValue);
    if (fromSide === 'on' && toSide === 'on') return [];
    if ((fromSide === 'above' && toSide === 'below') || (fromSide === 'below' && toSide === 'above')) {
      const t = (todayValue - fromValue) / (toValue - fromValue);
      const xCross = segment.from.x + t * (segment.to.x - segment.from.x);
      const abovePoint = fromSide === 'above' ? segment.from : segment.to;
      const belowPoint = fromSide === 'above' ? segment.to : segment.from;
      return [
        { direction: 'up' as const, d: `M ${abovePoint.x} ${abovePoint.y} L ${xCross} ${refY} L ${abovePoint.x} ${refY} Z` },
        { direction: 'down' as const, d: `M ${xCross} ${refY} L ${belowPoint.x} ${belowPoint.y} L ${belowPoint.x} ${refY} Z` }
      ];
    }
    const side = fromSide !== 'on' ? fromSide : toSide;
    const direction = side === 'above' ? 'up' as const : 'down' as const;
    return [{ direction, d: `M ${segment.from.x} ${segment.from.y} ${segment.curve} L ${segment.to.x} ${refY} L ${segment.from.x} ${refY} Z` }];
  });
  const usedDirections = [...new Set(areaSegments.map(segment => segment.direction))];
  const spanDays = Math.max(0, (Date.parse(`${valid.at(-1)!.date}T00:00:00`) - Date.parse(`${valid[0].date}T00:00:00`)) / 86_400_000);
  const xTicks = selectTrendTickIndexes(valid);
  const mobileTicks = new Set(selectTrendTickIndexes(valid, true));
  const yTicks = axis.ticks;
  const current = active === null ? valid.at(-1)! : valid[active];
  const summary = `${title}，期間 ${valid[0].date} 至 ${valid.at(-1)!.date}，由 ${formatValue(valid[0].value)} 變為 ${formatValue(valid.at(-1)!.value)}。`;
  const baselineNote = `以今日${title}為基準：折線高於今日為紅色，低於今日為綠色，用以快速判斷目前是否處於相對低點。`;
  return <div className={`trend-chart ${className}`}><div className="trend-chart-heading"><span>{unit}</span><span aria-live="polite">{current.date}｜{formatValue(current.value)}</span></div><div className="trend-chart-canvas" ref={canvasRef}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary} onMouseLeave={() => setActive(null)} onTouchEnd={() => setActive(null)}>{usedDirections.length > 0 && <defs>{usedDirections.map(direction => <linearGradient key={direction} id={`${gradientId}-${direction}`} x1="0" y1={direction === 'up' ? top : height - bottom} x2="0" y2={refY} gradientUnits="userSpaceOnUse"><stop offset="0%" className={`trend-area-stop trend-area-stop-start trend-area-${direction}`}/><stop offset="100%" className={`trend-area-stop trend-area-stop-end trend-area-${direction}`}/></linearGradient>)}</defs>}{areaSegments.map((segment, index) => <path key={`area-${index}`} d={segment.d} className={`trend-area trend-area-${segment.direction}`} fill={`url(#${gradientId}-${segment.direction})`} stroke="none"/>)}{yTicks.map(value => <g key={value}><line x1={left} x2={width-right} y1={y(value)} y2={y(value)} className="trend-grid"/><text x={labelX} y={y(value)+4} textAnchor="start" className="trend-axis-label">{formatTrendAxisTick(value, axisScale)}</text></g>)}<line x1={left} x2={width-right} y1={refY} y2={refY} className="trend-baseline-line"/><text x={width-right} y={refY-4} textAnchor="end" className="trend-baseline-label">今日</text>{xTicks.map(index => <text key={index} x={x(index)} y={height-8} textAnchor="middle" className={`trend-axis-label${mobileTicks.has(index) ? '' : ' trend-tick-mobile-hidden'}`}>{longLabel(valid[index].date, spanDays)}</text>)}{valid.length > 1 && <path d={path} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke"/>}{valid.map((point,index)=><circle key={point.date} cx={x(index)} cy={y(point.value)} r={active===index||valid.length===1?4:2.5} className="trend-point" onMouseEnter={()=>setActive(index)} onTouchStart={()=>setActive(index)}><title>{`${point.date}\n${title}：${formatValue(point.value)}`}</title></circle>)}</svg></div><p className="trend-chart-summary">{summary}</p><p className="trend-chart-baseline-note">{baselineNote}</p></div>;
}
