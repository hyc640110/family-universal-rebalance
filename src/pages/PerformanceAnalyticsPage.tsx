import { useMemo, useState } from 'react';
import type { PerformanceAssetInput } from '../lib/performanceMetrics';
import { calculatePnlContribution, calculatePortfolioConcentration, calculatePortfolioPerformance, performanceSummary } from '../lib/performanceMetrics';
import { historyForRange, type NetWorthSnapshot } from '../lib/netWorthHistory';

type View = 'performance' | 'risk';
type Sort = 'contribution' | 'return-rate' | 'loss' | 'market-value';
type Props = { assets: PerformanceAssetInput[]; history: NetWorthSnapshot[]; view: View; onViewChange: (view: View) => void };

const money = (value: number) => {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  return absolute >= 10000 ? `${sign}${(absolute / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 萬元` : `${sign}${Math.round(absolute).toLocaleString('zh-TW')} 元`;
};
const percent = (value: number | null) => value === null || !Number.isFinite(value) ? '—' : `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
const tone = (value: number) => value > 0 ? 'up' : value < 0 ? 'down' : 'hold';
const ratio = (value: number | null) => value === null ? '—' : `${(value * 100).toFixed(1)}%`;

export default function PerformanceAnalyticsPage({ assets, history, view, onViewChange }: Props) {
  const [sort, setSort] = useState<Sort>('contribution');
  const [showAllContributions, setShowAllContributions] = useState(false);
  const performance = useMemo(() => calculatePortfolioPerformance(assets), [assets]);
  const concentration = useMemo(() => calculatePortfolioConcentration(performance), [performance]);
  const sortedAssets = useMemo(() => {
    const rows = [...performance.assets];
    if (sort === 'return-rate') return rows.sort((a, b) => (b.returnRate ?? -Infinity) - (a.returnRate ?? -Infinity));
    if (sort === 'loss') return rows.sort((a, b) => a.unrealizedPnl - b.unrealizedPnl);
    if (sort === 'market-value') return rows.sort((a, b) => b.marketValue - a.marketValue);
    return calculatePnlContribution(rows);
  }, [performance.assets, sort]);
  const contributionRows = showAllContributions ? calculatePnlContribution(performance.assets) : calculatePnlContribution(performance.assets).slice(0, 5);
  const maxContribution = Math.max(...contributionRows.map(row => Math.abs(row.contributionAmount)), 1);
  const [historyRange, setHistoryRange] = useState<'30d'|'90d'|'1y'|'all'>('30d');
  const historyRows = useMemo(() => historyRange === '1y' ? historyForRange(history, '1y') : historyRange === 'all' ? history : historyForRange(history, historyRange), [history, historyRange]);
  const highestValue = historyRows.length ? Math.max(...historyRows.map(row => row.investmentValue)) : null;
  const peak = historyRows.reduce((result, row) => Math.max(result, row.investmentValue), 0);
  const maxDrawdown = peak > 0 ? Math.min(...historyRows.map(row => (row.investmentValue - Math.max(...historyRows.filter(x => x.date <= row.date).map(x => x.investmentValue))) / Math.max(...historyRows.filter(x => x.date <= row.date).map(x => x.investmentValue)))) : null;

  return <section className="performance-analytics for-analytics" aria-label="報酬分析中心">
    <div className="analytics-tabs" role="tablist" aria-label="分析分類">
      <button type="button" role="tab" aria-selected={view === 'performance'} className={view === 'performance' ? 'active' : ''} onClick={() => onViewChange('performance')}>報酬</button>
      <button type="button" role="tab" aria-selected={view === 'risk'} className={view === 'risk' ? 'active' : ''} onClick={() => onViewChange('risk')}>風險</button>
    </div>
    {view === 'performance' && <>
      <article className="performance-card performance-overview">
        <div className="performance-heading"><div><p className="eyebrow">V3.8 即時持股績效</p><h2>績效總覽</h2></div><span>僅依目前持股、成本與報價計算</span></div>
        <div className="performance-overview-grid">
          <Metric label="總投入成本" value={money(performance.totalCost)} />
          <Metric label="目前持股市值" value={money(performance.totalMarketValue)} />
          <Metric label="未實現損益" value={money(performance.unrealizedPnl)} className={tone(performance.unrealizedPnl)} />
          <Metric label="總報酬率" value={percent(performance.returnRate)} className={performance.returnRate === null ? 'hold' : tone(performance.returnRate)} />
          <Metric label="今日損益" value={performance.todayReturnRate === null ? '—' : money(performance.todayPnl)} className={performance.todayReturnRate === null ? 'hold' : tone(performance.todayPnl)} />
          <Metric label="今日報酬率" value={percent(performance.todayReturnRate)} className={performance.todayReturnRate === null ? 'hold' : tone(performance.todayReturnRate)} />
          <Metric label="歷史最高投資市值" value={money(highestValue ?? NaN)} />
          <Metric label="最大回撤" value={maxDrawdown === null ? '資料不足' : percent(maxDrawdown)} className={maxDrawdown === null ? 'hold' : tone(maxDrawdown)} />
        </div>
        {performance.todayReturnRate === null && <p className="note">缺少可可靠取得的前一交易日市值，今日報酬率暫以「—」呈現。</p>}
      </article>

      <article className="performance-card"><div className="performance-heading"><div><h2>績效趨勢</h2><span>快照直接取得的投資市值；未記錄投入／提領，期間市場損益不提供精確值。</span></div></div><div className="performance-sort">{([['30d','30 天'],['90d','90 天'],['1y','1 年'],['all','全部']] as const).map(([value,label])=><button type="button" key={value} className={historyRange===value?'active':''} onClick={()=>setHistoryRange(value)}>{label}</button>)}</div>{historyRows.length<2?<div className="analytics-empty"><p>歷史資料不足</p><span>至少需要兩筆每日快照才能呈現趨勢。</span></div>:<><div className="contribution-list">{historyRows.map(row=><div className="contribution-row" key={row.date}><div><strong>{row.date}</strong><span>{money(row.investmentValue)}</span></div><div className="contribution-track"><i style={{width:`${Math.max(3,(row.investmentValue/(highestValue||1))*100)}%`}} /></div></div>)}</div><p className="note">月度／年度排除新增投入後的市場損益：資料不足（尚無完整投入與提領流水）。</p></>}</article>

      <article className="performance-card"><h2>資產報酬排名</h2><div className="performance-sort" aria-label="排名排序">{([['contribution', '貢獻最高'], ['return-rate', '報酬率最高'], ['loss', '虧損最多'], ['market-value', '市值最高']] as const).map(([value, label]) => <button key={value} type="button" className={sort === value ? 'active' : ''} onClick={() => setSort(value)}>{label}</button>)}</div>
        {!sortedAssets.length ? <Empty /> : <div className="performance-ranking">{sortedAssets.map(asset => <details className="performance-row" key={asset.symbol}><summary><span className="performance-asset-name"><b>{asset.symbol}</b><small>{asset.name}</small></span><strong className={tone(asset.unrealizedPnl)}>{money(asset.unrealizedPnl)}</strong><em className={asset.returnRate === null ? 'hold' : tone(asset.returnRate)}>{percent(asset.returnRate)}</em></summary><div className="performance-details"><Metric label="目前市值" value={money(asset.marketValue)} /><Metric label="投入成本" value={money(asset.cost)} /><Metric label="對總損益貢獻" value={money(asset.contributionAmount)} className={tone(asset.contributionAmount)} /><Metric label="貢獻比例" value={ratio(asset.contributionRatio)} /></div></details>)}</div>}
      </article>

      <article className="performance-card"><div className="performance-heading"><h2>報酬貢獻</h2>{performance.assets.length > 5 && <button type="button" className="small contribution-toggle" onClick={() => setShowAllContributions(current => !current)}>{showAllContributions ? '收合清單' : '查看完整清單'}</button>}</div>
        {!contributionRows.length ? <Empty /> : <div className="contribution-list">{contributionRows.map(asset => <div className="contribution-row" key={asset.symbol}><div><strong>{asset.symbol}</strong><span>{money(asset.contributionAmount)}</span></div><div className="contribution-track" aria-label={`${asset.symbol} 對總未實現損益貢獻`}><i className={tone(asset.contributionAmount)} style={{ width: `${Math.max(4, Math.abs(asset.contributionAmount) / maxContribution * 100)}%` }} /></div></div>)}</div>}
      </article>

      <article className="performance-card"><h2>報酬集中度</h2><div className="performance-concentration-grid"><Metric label="最大單一資產占總市值" value={ratio(concentration.largestMarketValueRatio)} /><Metric label="前 3 大資產占總市值" value={ratio(concentration.topThreeMarketValueRatio)} /><Metric label="最大單一資產占總獲利" value={ratio(concentration.largestProfitRatio)} /><Metric label="前 3 大獲利來源占總正報酬" value={ratio(concentration.topThreeProfitRatio)} /></div>
        <p className="note">{concentration.largestMarketValueRatio === null ? '尚無有效市值資料。' : concentration.largestMarketValueRatio < 0.4 ? '最大單一資產低於 40%，目前屬分散。' : concentration.largestMarketValueRatio <= 0.6 ? '最大單一資產介於 40%～60%，目前屬集中。' : '最大單一資產高於 60%，目前屬高度集中。'}</p>
        {performance.totalPositivePnl <= 0 && <p className="note">目前無正報酬集中度資料。</p>}
      </article>

      <article className="performance-card performance-summary"><h2>績效摘要</h2>{performanceSummary(performance, concentration).map(line => <p key={line}>{line}</p>)}</article>
      <p className="performance-footnote">歷史績效曲線與年度報酬將於後續版本提供。</p>
    </>}
  </section>;
}

function Metric({ label, value, className = '' }: { label: string; value: string; className?: string }) { return <p><span>{label}</span><strong className={className}>{value}</strong></p>; }
function Empty() { return <div className="analytics-empty"><p>尚無可分析的有效持股</p><span>股數為 0 的資產不會列入未實現報酬。</span></div>; }
