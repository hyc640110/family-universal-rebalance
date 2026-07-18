import { useMemo, useState } from 'react';
import type { PerformanceAssetInput } from '../lib/performanceMetrics';
import { calculatePnlContribution, calculatePortfolioConcentration, calculatePortfolioPerformance, performanceSummary } from '../lib/performanceMetrics';
import { deriveInvestmentPerformanceQuality, deriveInvestmentPerformanceStats, filterInvestmentPerformanceRange, type InvestmentPerformanceRange, type PeriodChange, type SeriesStats } from '../lib/investmentPerformanceHistory';
import type { NetWorthSnapshot } from '../lib/netWorthHistory';
import DailyAssetChangeCalendar from '../components/DailyAssetChangeCalendar';
import TrendChart from '../components/TrendChart';

type View = 'performance' | 'risk';
type Sort = 'contribution' | 'return-rate' | 'loss' | 'market-value';
type Props = { assets: PerformanceAssetInput[]; history: NetWorthSnapshot[]; view: View; onViewChange: (view: View) => void };

const money = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  return absolute >= 10000 ? `${sign}${(absolute / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 萬元` : `${sign}${Math.round(absolute).toLocaleString('zh-TW')} 元`;
};
const percent = (value: number | null) => value === null || !Number.isFinite(value) ? '—' : `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
const tone = (value: number | null) => value === null ? 'hold' : value > 0 ? 'up' : value < 0 ? 'down' : 'hold';
const ratio = (value: number | null) => value === null ? '—' : `${(value * 100).toFixed(1)}%`;

export default function PerformanceAnalyticsPage({ assets, history, view, onViewChange }: Props) {
  const [sort, setSort] = useState<Sort>('contribution');
  const [showAllContributions, setShowAllContributions] = useState(false);
  const [historyRange, setHistoryRange] = useState<InvestmentPerformanceRange>('30d');
  const performance = useMemo(() => calculatePortfolioPerformance(assets), [assets]);
  const concentration = useMemo(() => calculatePortfolioConcentration(performance), [performance]);
  const investmentStats = useMemo(() => deriveInvestmentPerformanceStats(history, 'investmentValue'), [history]);
  const netWorthStats = useMemo(() => deriveInvestmentPerformanceStats(history, 'netWorth'), [history]);
  const quality = useMemo(() => deriveInvestmentPerformanceQuality(history), [history]);
  const historyRows = useMemo(() => filterInvestmentPerformanceRange(history, historyRange), [history, historyRange]);
  const sortedAssets = useMemo(() => {
    const rows = [...performance.assets];
    if (sort === 'return-rate') return rows.sort((a, b) => (b.returnRate ?? -Infinity) - (a.returnRate ?? -Infinity));
    if (sort === 'loss') return rows.sort((a, b) => a.unrealizedPnl - b.unrealizedPnl);
    if (sort === 'market-value') return rows.sort((a, b) => b.marketValue - a.marketValue);
    return calculatePnlContribution(rows);
  }, [performance.assets, sort]);
  const contributionRows = showAllContributions ? calculatePnlContribution(performance.assets) : calculatePnlContribution(performance.assets).slice(0, 5);
  const maxContribution = Math.max(...contributionRows.map(row => Math.abs(row.contributionAmount)), 1);

  return <section className="performance-analytics for-analytics" aria-label="投資績效中心">
    <div className="analytics-tabs" role="tablist" aria-label="分析分類">
      <button type="button" role="tab" aria-selected={view === 'performance'} className={view === 'performance' ? 'active' : ''} onClick={() => onViewChange('performance')}>績效</button>
      <button type="button" role="tab" aria-selected={view === 'risk'} className={view === 'risk' ? 'active' : ''} onClick={() => onViewChange('risk')}>風險</button>
    </div>
    {view === 'performance' && <>
      <article className="performance-card performance-overview">
        <div className="performance-heading"><div><p className="eyebrow">V5.1 投資績效基礎</p><h2>目前持股績效</h2></div><span>只依目前持股、成本與報價；不把入金或提領當成投資報酬。</span></div>
        <div className="performance-overview-grid">
          <Metric label="目前投資資產" value={money(performance.totalMarketValue)} />
          <Metric label="總投入成本" value={money(performance.totalCost)} />
          <Metric label="目前持股未實現損益" value={money(performance.unrealizedPnl)} className={tone(performance.unrealizedPnl)} />
          <Metric label="目前持股報酬率" value={percent(performance.returnRate)} className={tone(performance.returnRate)} />
          <Metric label="今日損益" value={performance.todayReturnRate === null ? '—' : money(performance.todayPnl)} className={tone(performance.todayReturnRate === null ? null : performance.todayPnl)} />
          <Metric label="今日報酬率" value={percent(performance.todayReturnRate)} className={tone(performance.todayReturnRate)} />
        </div>
        {performance.todayReturnRate === null && <p className="note">缺少可可靠取得的前一交易日市值，今日報酬率以「—」呈現。</p>}
      </article>

      <article className="performance-card performance-history-card">
        <div className="performance-heading"><div><p className="eyebrow">歷史快照</p><h2>資產變化與回撤</h2></div><span>依每日快照，不補日期、不插值；這是資產變化，不是已排除現金流的投資報酬。</span></div>
        <div className="performance-sort" aria-label="歷史期間">{([['30d', '30 天'], ['90d', '90 天'], ['1y', '1 年'], ['all', '全部']] as const).map(([value, label]) => <button type="button" key={value} className={historyRange === value ? 'active' : ''} onClick={() => setHistoryRange(value)}>{label}</button>)}</div>
        {historyRows.length < 2 ? <div className="analytics-empty"><p>歷史資料不足</p><span>至少需要兩筆有效快照才能呈現趨勢與資產變化。</span></div> : <div className="performance-history-grid">
          <HistorySeries title="投資資產趨勢" description="快照中的投資市值；不等同期間投資報酬。" rows={historyRows} stats={investmentStats} field="investmentValue" />
          <HistorySeries title="淨資產趨勢" description="投資、現金與負債共同影響的淨資產變化。" rows={historyRows} stats={netWorthStats} field="netWorth" />
        </div>}
      </article>

      <DailyAssetChangeCalendar history={history} />

      <article className="performance-card">
        <div className="performance-heading"><div><h2>月度／年度資產變化</h2><span>期末有效快照減期初有效快照；不足兩筆時不計算。</span></div></div>
        <div className="performance-period-grid">
          <PeriodSummary title="投資資產月度變化" rows={investmentStats.monthlyChanges} />
          <PeriodSummary title="投資資產年度變化" rows={investmentStats.yearlyChanges} />
          <PeriodSummary title="淨資產月度變化" rows={netWorthStats.monthlyChanges} />
          <PeriodSummary title="淨資產年度變化" rows={netWorthStats.yearlyChanges} />
        </div>
      </article>

      <article className="performance-card performance-quality">
        <div className="performance-heading"><div><h2>資料品質與可計算範圍</h2><span>透明呈現目前資料能與不能支持的指標。</span></div></div>
        <div className="performance-overview-grid">
          <Metric label="有效快照筆數" value={String(quality.snapshotCount)} />
          <Metric label="最早快照" value={quality.earliestDate || '—'} />
          <Metric label="最新快照" value={quality.latestDate || '—'} />
          <Metric label="最大回撤" value={quality.canCalculateMaxDrawdown ? '可計算' : '資料不足'} />
          <Metric label="CAGR" value="延期" />
          <Metric label="XIRR" value="延期" />
        </div>
        <p className="note">{quality.cagrReason}</p><p className="note">{quality.xirrReason}</p>
      </article>

      <article className="performance-card"><h2>資產報酬排名</h2><div className="performance-sort" aria-label="排名排序">{([['contribution', '貢獻最高'], ['return-rate', '報酬率最高'], ['loss', '虧損最多'], ['market-value', '市值最高']] as const).map(([value, label]) => <button key={value} type="button" className={sort === value ? 'active' : ''} onClick={() => setSort(value)}>{label}</button>)}</div>
        {!sortedAssets.length ? <Empty /> : <div className="performance-ranking">{sortedAssets.map(asset => <details className="performance-row" key={asset.symbol}><summary><span className="performance-asset-name"><b>{asset.symbol}</b><small>{asset.name}</small></span><strong className={tone(asset.unrealizedPnl)}>{money(asset.unrealizedPnl)}</strong><em className={tone(asset.returnRate)}>{percent(asset.returnRate)}</em></summary><div className="performance-details"><Metric label="目前市值" value={money(asset.marketValue)} /><Metric label="投入成本" value={money(asset.cost)} /><Metric label="對總損益貢獻" value={money(asset.contributionAmount)} className={tone(asset.contributionAmount)} /><Metric label="貢獻比例" value={ratio(asset.contributionRatio)} /></div></details>)}</div>}
      </article>

      <article className="performance-card"><div className="performance-heading"><h2>報酬貢獻</h2>{performance.assets.length > 5 && <button type="button" className="small contribution-toggle" onClick={() => setShowAllContributions(current => !current)}>{showAllContributions ? '收合清單' : '查看完整清單'}</button>}</div>
        {!contributionRows.length ? <Empty /> : <div className="contribution-list">{contributionRows.map(asset => <div className="contribution-row" key={asset.symbol}><div><strong>{asset.symbol}</strong><span>{money(asset.contributionAmount)}</span></div><div className="contribution-track" aria-label={`${asset.symbol} 對總未實現損益貢獻`}><i className={tone(asset.contributionAmount)} style={{ width: `${Math.max(4, Math.abs(asset.contributionAmount) / maxContribution * 100)}%` }} /></div></div>)}</div>}
      </article>

      <article className="performance-card"><h2>報酬集中度</h2><div className="performance-concentration-grid"><Metric label="最大單一資產占總市值" value={ratio(concentration.largestMarketValueRatio)} /><Metric label="前 3 大資產占總市值" value={ratio(concentration.topThreeMarketValueRatio)} /><Metric label="最大單一資產占總獲利" value={ratio(concentration.largestProfitRatio)} /><Metric label="前 3 大獲利來源占總正報酬" value={ratio(concentration.topThreeProfitRatio)} /></div>
        <p className="note">{concentration.largestMarketValueRatio === null ? '尚無有效市值資料。' : concentration.largestMarketValueRatio < 0.4 ? '最大單一資產低於 40%，目前屬分散。' : concentration.largestMarketValueRatio <= 0.6 ? '最大單一資產介於 40%～60%，目前屬集中。' : '最大單一資產高於 60%，目前屬高度集中。'}</p>
        {performance.totalPositivePnl <= 0 && <p className="note">目前無正報酬集中度資料。</p>}
      </article>
      <article className="performance-card performance-summary"><h2>績效摘要</h2>{performanceSummary(performance, concentration).map(line => <p key={line}>{line}</p>)}</article>
    </>}
  </section>;
}

function HistorySeries({ title, description, rows, stats, field }: { title: string; description: string; rows: NetWorthSnapshot[]; stats: SeriesStats; field: 'investmentValue' | 'netWorth' }) {
  return <section className="performance-chart"><div><h3>{title}</h3><p>{description}</p></div><TrendChart title={title.replace('趨勢','')} unit="單位：萬元" data={rows.map(row=>({date:row.date,value:row[field]}))} formatValue={value=>money(value)}/><div className="performance-chart-metrics"><Metric label="歷史最高值" value={money(stats.highest)} /><Metric label="距離高點" value={money(stats.distanceFromHigh)} className={tone(stats.distanceFromHigh)} /><Metric label="距高點幅度" value={percent(stats.distanceFromHighRate)} className={tone(stats.distanceFromHighRate)} /><Metric label="最大回撤" value={percent(stats.maxDrawdown)} className={tone(stats.maxDrawdown)} /></div></section>;
}

function PeriodSummary({ title, rows }: { title: string; rows: PeriodChange[] }) { const latest = rows[0]; return <section><h3>{title}</h3>{latest ? <><strong className={tone(latest.change)}>{money(latest.change)}</strong><p>{latest.key}｜{latest.startDate} → {latest.endDate}</p><small>期初 {money(latest.startValue)}｜期末 {money(latest.endValue)}</small></> : <p className="note">資料不足（期間內至少需要兩筆有效快照）。</p>}</section>; }
function Metric({ label, value, className = '' }: { label: string; value: string; className?: string }) { return <p><span>{label}</span><strong className={className}>{value}</strong></p>; }
function Empty() { return <div className="analytics-empty"><p>尚無可分析的有效持股</p><span>股數為 0 的資產不會列入未實現報酬。</span></div>; }
