import { useMemo, useState } from 'react';
import PageFrame from './PageFrame';
import { deriveHistoryStats, historyForRange, type HistoryRange, type NetWorthSnapshot } from '../lib/netWorthHistory';
import { changeTone, formatChangeMoney, formatChangePercent } from '../lib/changePresentation';
import ToolQuickNavigation from '../components/ToolQuickNavigation';
import TrendChart from '../components/TrendChart';
import { createNetWorthSnapshotConsumerRows, createNetWorthSnapshotReadTimeView, toCompleteNetWorthSnapshots, type NetWorthSnapshotReadTimeView } from '../lib/netWorthSnapshotReadBoundary';

const money = (value: number | null) => value === null || !Number.isFinite(value) ? '—' : `${(Math.abs(value) / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬元`;
const HISTORY_GRID_COLLAPSED_COUNT = 7;

export default function NetWorthHistoryPage({ history, snapshotView }: { history?: NetWorthSnapshot[]; snapshotView?: NetWorthSnapshotReadTimeView }) {
  const [range, setRange] = useState<HistoryRange>('30d');
  const [showAllHistoryGrid, setShowAllHistoryGrid] = useState(false);
  const readView = useMemo(() => snapshotView ?? createNetWorthSnapshotReadTimeView(history), [history, snapshotView]);
  const consumerRows = useMemo(() => createNetWorthSnapshotConsumerRows(readView), [readView]);
  const all = useMemo(() => toCompleteNetWorthSnapshots(consumerRows), [consumerRows]);
  const rows = useMemo(() => historyForRange(all, range), [all, range]);
  const stats = useMemo(() => deriveHistoryStats(all), [all]);
  const reversedRows = useMemo(() => consumerRows.slice().reverse(), [consumerRows]);
  const visibleHistoryRows = showAllHistoryGrid ? reversedRows : reversedRows.slice(0, HISTORY_GRID_COLLAPSED_COUNT);
  const hasSnapshot = readView.status === 'has-snapshot';
  const cards = [
    ['今日增加', stats.todayChange, 'money', true],
    ['本月增加', stats.monthChange, 'money', true],
    ['今年增加', stats.yearChange, 'money', true],
    ['歷史最高淨資產', stats.highestNetWorth, 'money', false],
    ['最大回撤', stats.maxDrawdown, 'percent', true]
  ] as const;

  return <PageFrame page="tools" title="淨資產歷史中心" description="每日快照自動統計資產、現金、負債與淨資產變化；不記錄交易流水。">
    <section className="history-hero"><div><p className="eyebrow">V4.1 每日快照</p><h2>淨資產趨勢</h2><p>每天最多保留一筆快照；同一天再次更新時覆蓋當天資料。</p></div><strong>{stats.latest?.date ?? (hasSnapshot ? '資料不足' : '尚無資料')}</strong></section>
    <section className="history-stats">{cards.map(([label, value, format, isChange]) => <article key={label}><small>{label}</small><strong className={isChange ? changeTone(value) : 'hold'}>{format === 'percent' ? formatChangePercent(value) : isChange ? formatChangeMoney(value) : money(value)}</strong></article>)}</section>
    <section className="card net-worth-history-chart-card"><div className="history-range">{([['7d', '7 天'], ['30d', '30 天'], ['90d', '90 天'], ['1y', '1 年'], ['all', '全部']] as const).map(([value, label]) => <button type="button" key={value} className={range === value ? 'active' : ''} onClick={() => setRange(value)}>{label}</button>)}</div>{rows.length === 0 ? <div className="analytics-empty"><p>{hasSnapshot ? '資料不足' : '尚無資料'}</p><span>{hasSnapshot ? '至少需要可用的淨資產快照才能呈現趨勢。' : '尚無淨資產歷史資料；開啟 App 後會在有資料時建立快照。'}</span></div> : <><TrendChart title="淨資產" unit="單位：萬元" data={rows.map(row=>({date:row.date,value:row.netWorth}))} formatValue={value=>money(value)} axisScale={10000}/><div className="history-legend"><span>淨資產趨勢</span><b>{money(rows.at(-1)?.netWorth ?? null)}</b></div></>}</section>
    <section className="history-grid">{visibleHistoryRows.map(row => <article key={row.date}><header><strong>{row.date}</strong><b>{money(row.netWorth)}</b></header><div><p><span>總資產</span><b>{money(row.totalAssets)}</b></p><p><span>投資市值</span><b>{money(row.investmentValue)}</b></p><p><span>現金</span><b>{money(row.cash)}</b></p><p><span>負債</span><b>{money(row.debt)}</b></p></div></article>)}</section>
    {reversedRows.length > HISTORY_GRID_COLLAPSED_COUNT && <div className="history-grid-toggle-row"><button type="button" className="small history-grid-toggle" aria-expanded={showAllHistoryGrid} onClick={() => setShowAllHistoryGrid(current => !current)}>{showAllHistoryGrid ? '收合' : '顯示更多'}</button></div>}
    <ToolQuickNavigation current="net-worth-history" />
  </PageFrame>;
}
