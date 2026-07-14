import { Link } from 'react-router-dom';
import { type DashboardReminder } from '../lib/investmentDashboard';
import PageFrame from './PageFrame';
import MarketSummaryCard from '../components/MarketSummaryCard';
import type { MarketSnapshot } from '../lib/marketData';
import type { deriveInvestmentIntelligence } from '../lib/investmentIntelligence';

type DecisionItem = { title: string; reason: string; to: string };
type DashboardData = {
  total: number; net: number; cash: number; debt: number;
  dayPnl: number | null; dayPnlRate: number | null; monthChange: number | null; yearChange: number | null; lastQuoteAt: string | null;
  decision: DecisionItem; growthRatio: number | null; defensiveRatio: number | null; cashRatio: number | null;
  allocationDeviation: number | null; rebalanceThreshold: number; thresholdReached: boolean;
  riskLabel: string; cashStatus: string; cashSafety: string; reminders: DashboardReminder[];
  market: MarketSnapshot;
  intelligence: ReturnType<typeof deriveInvestmentIntelligence>;
};

const finite = (value: number | null | undefined) => value !== null && value !== undefined && Number.isFinite(value) ? value : null;
const money = (value: number | null | undefined, signed = false) => {
  const amount = finite(value); if (amount === null) return '—';
  const abs = Math.abs(amount); const body = abs < 10000 ? `${abs.toLocaleString('zh-TW')} 元` : `${(abs / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬元`;
  return `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${body}`;
};
const pct = (value: number | null | undefined, signed = false) => { const amount = finite(value); return amount === null ? '—' : `${signed && amount > 0 ? '+' : ''}${amount.toFixed(1)}%`; };
const tone = (value: number | null | undefined) => { const amount = finite(value); return amount === null || amount === 0 ? 'hold' : amount > 0 ? 'up' : 'down'; };
const quoteTime = (value: string | null) => value ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'short', timeStyle: 'short', hour12: false }).format(new Date(value)) : '—';

export default function DashboardDecisionPage({ data }: { data: DashboardData }) {
  const allocationTotal = Math.max(0, (data.growthRatio ?? 0) + (data.defensiveRatio ?? 0));
  const growthWidth = allocationTotal > 0 ? Math.min(100, Math.max(0, (data.growthRatio ?? 0) / allocationTotal * 100)) : 0;
  const complementaryReminders = data.reminders.filter(item => !['quotes', 'sync', 'rebalance'].includes(item.key));
  return <PageFrame page="home" title="投資決策首頁" description="30 秒掌握今日投資表現、配置與下一步。">
    <section className="investment-summary-card" aria-labelledby="investment-summary-title">
      <div className="dashboard-section-heading"><div><p className="eyebrow">今日投資摘要</p><h2 id="investment-summary-title">資產與今日表現</h2></div><Link className="dashboard-text-link" to="/net-worth-history">查看淨資產歷史</Link></div>
      <div className="investment-summary-grid">
        <article className="dashboard-primary-metric"><small>總資產</small><strong>{money(data.total)}</strong><span>淨資產 {money(data.net)}</span></article>
        <article><small>今日損益</small><strong className={tone(data.dayPnl)}>{money(data.dayPnl, true)}</strong><span>僅計入當日有效報價</span></article>
        <article><small>今日損益率</small><strong className={tone(data.dayPnlRate)}>{pct(data.dayPnlRate, true)}</strong><span>資料不足時不估算</span></article>
        <article><small>本月資產變動</small><strong className={tone(data.monthChange)}>{money(data.monthChange, true)}</strong><span>依淨資產歷史</span></article>
        <article><small>年度資產變動</small><strong className={tone(data.yearChange)}>{money(data.yearChange, true)}</strong><span>依淨資產歷史</span></article>
        <article><small>最後股價更新</small><strong>{quoteTime(data.lastQuoteAt)}</strong><span>無當日有效報價時顯示 —</span></article>
      </div>
    </section>

    <section className={`investment-intelligence-card ${data.intelligence.overallTone}`} aria-labelledby="investment-intelligence-title">
      <header className="intelligence-heading"><div><p className="eyebrow">V5.9 Investment Intelligence</p><h2 id="investment-intelligence-title">今日投資狀態</h2><p><strong>{data.intelligence.overallStatus}</strong>｜{data.intelligence.title}</p></div><span className={`intelligence-status ${data.intelligence.overallTone}`}>{data.intelligence.overallStatus}</span></header>
      <p className="intelligence-summary">{data.intelligence.summary}</p>
      <div className="intelligence-grid">
        {data.intelligence.supportingItems.map(item => <article key={item.label} className={item.tone}><small>{item.label}</small><strong>{item.value}</strong><span>{item.detail}</span></article>)}
      </div>
      <div className="intelligence-next-action"><div><small>建議下一步</small><strong>{data.intelligence.nextAction.reason}</strong></div><Link className="intelligence-action-link" to={data.intelligence.nextAction.route}>{data.intelligence.nextAction.label}<span aria-hidden="true">→</span></Link></div>
      <p className="intelligence-limits">{data.intelligence.limitations.join(' ')}</p>
    </section>

    <MarketSummaryCard snapshot={data.market} />

    <section className="dashboard-decision-card" aria-labelledby="today-decision-title">
      <div className="dashboard-section-heading"><div><p className="eyebrow">既有規則式決策摘要</p><h2 id="today-decision-title">{data.decision.title}</h2><p>{data.decision.reason}</p></div></div>
      <p className="dashboard-decision-note">依目前再平衡、現金安全、逢低加碼與資料完整性規則整理；不構成投資保證。</p>
    </section>

    <section className="dashboard-health-card" aria-labelledby="investment-health-title">
      <div className="dashboard-section-heading"><div><p className="eyebrow">投資健康度</p><h2 id="investment-health-title">配置與現金水位</h2></div><div className="dashboard-heading-links"><Link className="dashboard-text-link" to="/tools/rebalance-recommendation">再平衡建議中心</Link><Link className="dashboard-text-link" to="/tools/risk-center">查看風險中心</Link></div></div>
      <div className="dashboard-allocation-bar" aria-label="成長與防守資產配置"><i style={{ width: `${growthWidth}%` }} /><b style={{ width: `${100 - growthWidth}%` }} /></div>
      <div className="investment-health-grid">
        <article><small>成長資產</small><strong>{pct(data.growthRatio)}</strong></article>
        <article><small>防守資產</small><strong>{pct(data.defensiveRatio)}</strong></article>
        <article><small>現金比例</small><strong>{pct(data.cashRatio)}</strong></article>
        <article><small>配置偏離</small><strong className={data.thresholdReached ? 'warn' : 'good'}>{pct(data.allocationDeviation, true)}</strong></article>
        <article><small>再平衡狀態</small><strong className={data.thresholdReached ? 'warn' : 'good'}>{data.thresholdReached ? '已達門檻' : '在門檻內'}</strong><span>門檻 {pct(data.rebalanceThreshold)}</span></article>
        <article><small>現金安全</small><strong>{data.cashStatus}</strong><span>{data.cashSafety}</span></article>
        <article><small>整體風險</small><strong>{data.riskLabel}</strong><span>沿用既有風險計算</span></article>
        <article><small>負債</small><strong>{money(data.debt)}</strong><span>不併入投資配置</span></article>
      </div>
    </section>

    <section className="dashboard-reminders-card" aria-labelledby="dashboard-reminders-title">
      <div className="dashboard-section-heading"><div><p className="eyebrow">重要提醒</p><h2 id="dashboard-reminders-title">需要確認的資料與狀態</h2></div><Link className="dashboard-text-link" to="/settings">同步與設定</Link></div>
      {complementaryReminders.length === 0 ? <p className="dashboard-empty-state">報價、同步與配置狀態已整合於「今日投資狀態」。</p> : <ul className="dashboard-reminder-list">{complementaryReminders.map(item => <li key={item.key} className={item.tone}><strong>{item.title}</strong><span>{item.detail}</span></li>)}</ul>}
    </section>
  </PageFrame>;
}
