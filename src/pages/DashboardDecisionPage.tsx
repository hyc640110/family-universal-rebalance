import { Link } from 'react-router-dom';
import PageFrame from './PageFrame';

type DecisionItem = { title: string; reason: string; to: string };
type DashboardData = {
  decision: { primary: DecisionItem; items: DecisionItem[] };
  total: number | null; net: number | null; day: number | null; cash: number | null; debt: number | null;
  cashRatio: number | null; deviation: number | null; rebalance: boolean; dip: boolean;
  riskLabel: string; cashSafety: string; debtStatus: string; cashStatus: string;
  growth: number | null; defensive: number | null;
  target: number | null; progress: number | null; remaining: number | null; wealthText: string; wealthConfigured: boolean;
  cashFlowStatus: string; historyTrend: string;
};

const finite = (value: number | null | undefined) => value !== null && value !== undefined && Number.isFinite(value) ? value : null;
const money = (value: number | null | undefined, signed = false) => {
  const amount = finite(value); if (amount === null) return '—';
  const abs = Math.abs(amount); const body = abs < 10000 ? `${abs.toLocaleString('zh-TW')} 元` : `${(abs / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬元`;
  return `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${body}`;
};
const pct = (value: number | null | undefined) => finite(value) === null ? '—' : `${finite(value)!.toFixed(1)}%`;
const tone = (value: number | null | undefined) => { const amount = finite(value); return amount === null || amount === 0 ? 'hold' : amount > 0 ? 'up' : 'down'; };
const Action = ({ to, children }: { to: string; children: string }) => <Link className="home-action-link" to={to}>{children}<span aria-hidden="true">→</span></Link>;

export default function DashboardDecisionPage({ data }: { data: DashboardData }) {
  const details = data.decision.items.slice(0, 3);
  const allocationTotal = Math.max(0, (finite(data.growth) ?? 0) + (finite(data.defensive) ?? 0));
  const growthWidth = allocationTotal > 0 ? Math.min(100, Math.max(0, (data.growth ?? 0) / allocationTotal * 100)) : 0;
  return <PageFrame page="home" title="首頁" description="30 秒掌握資產、今天行動與風險狀態。">
    <section className="dashboard-wealth-card">
      <div className="dashboard-section-heading"><div><p className="eyebrow">核心財富摘要</p><h2>目前淨資產</h2></div><strong>{money(data.net)}</strong></div>
      <div className="dashboard-wealth-grid">
        <article className="dashboard-primary-metric"><small>淨資產</small><strong>{money(data.net)}</strong></article>
        <article><small>總資產</small><strong>{money(data.total)}</strong></article>
        <article><small>今日損益</small><strong className={tone(data.day)}>{money(data.day, true)}</strong></article>
        <article><small>現金</small><strong>{money(data.cash)}</strong></article>
        <article><small>總負債</small><strong>{finite(data.debt) === null ? '—' : money(data.debt)}</strong></article>
      </div>
    </section>

    <section className="dashboard-decision-card">
      <div className="dashboard-section-heading"><div><p className="eyebrow">今日決策</p><h2>{data.decision.primary.title}</h2><p>{data.decision.primary.reason}</p></div><Action to={data.decision.primary.to}>前往處理</Action></div>
      {details.length > 0 ? <ol className="dash-tasks">{details.map((item, index) => <li key={`${item.title}-${item.to}`}><b>{index + 1}</b><div><strong>{item.title}</strong><span>{item.reason}</span><Link to={item.to}>查看詳情</Link></div></li>)}</ol> : <p className="note">目前配置、現金與風險狀態沒有需要立即處理的事項。</p>}
    </section>

    <section className="dashboard-summary-grid" aria-label="風險與現金摘要">
      <Link to="/tools/risk-center"><small>現金安全</small><strong>{data.cashStatus}</strong><span>{data.cashSafety}</span></Link>
      <Link to="/analytics"><small>配置偏離</small><strong className={data.rebalance ? 'warn' : 'good'}>{data.rebalance ? '警告' : '正常'}</strong><span>{pct(data.deviation)}</span></Link>
      <Link to="/assets#loan-section"><small>負債狀態</small><strong>{data.debtStatus}</strong><span>{money(data.debt)}</span></Link>
      <Link to="/tools/risk-center"><small>整體風險</small><strong>{data.riskLabel}</strong><span>查看風險與現金</span></Link>
    </section>

    <section className="dashboard-two-column">
      <article className="card dashboard-allocation-card"><div className="dashboard-section-heading"><div><p className="eyebrow">資產配置</p><h2>目前主要分類</h2></div></div><div className="dashboard-allocation-bar" aria-label="目前資產配置"><i style={{ width: `${growthWidth}%` }} /><b style={{ width: `${100 - growthWidth}%` }} /></div><div className="dashboard-allocation-legend"><span>成長資產 <strong>{pct(data.growth)}</strong></span><span>防守資產 <strong>{pct(data.defensive)}</strong></span></div><Action to="/assets">前往資產中心</Action></article>
      <article className="card dashboard-wealth-progress"><p className="eyebrow">財富進度</p><h2>{data.wealthConfigured ? `目標達成 ${pct(data.progress)}` : '尚未設定財富目標'}</h2>{data.wealthConfigured ? <><p>距離目標 {money(data.remaining)}</p><div className="wealth-progress"><i style={{ width: `${Math.min(100, Math.max(0, data.progress ?? 0))}%` }} /></div><p className="note">{data.wealthText}</p></> : <p className="note">設定目標後即可追蹤達成進度與差距。</p>}<p className="dashboard-support-line">每月收支：<b>{data.cashFlowStatus}</b>｜近期淨資產：<b>{data.historyTrend}</b></p><Action to="/tools/wealth-goal">查看財富目標</Action></article>
    </section>
  </PageFrame>;
}
