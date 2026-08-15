import { Link } from 'react-router-dom';
import { type DashboardReminder } from '../lib/investmentDashboard';
import PageFrame from './PageFrame';
import type { deriveInvestmentIntelligence } from '../lib/investmentIntelligence';
import type { InvestmentOpportunity } from '../lib/investmentOpportunities';
import { INVESTMENT_DECISION_ROUTES } from '../lib/toolNavigation';
import type { CreditCardDueSoonReminder } from '../lib/creditCardReminders';
import CreditCardDueSoonCard from '../components/CreditCardDueSoonCard';
import type { HomeFocusedAssetCardData } from '../lib/homeFocusedAssetCard';
import HomeFocusedAssetCard from '../components/HomeFocusedAssetCard';

type DashboardData = {
  total: number; net: number;
  dayPnl: number | null; dayPnlRate: number | null; lastQuoteAt: string | null;
  allocationDeviation: number | null; rebalanceThreshold: number; thresholdReached: boolean;
  riskLabel: string; reminders: DashboardReminder[];
  intelligence: ReturnType<typeof deriveInvestmentIntelligence>;
  opportunities: InvestmentOpportunity[];
  todayConclusion: string;
  creditCardDueSoonReminders: readonly CreditCardDueSoonReminder[];
  focusedAssetCard: HomeFocusedAssetCardData;
};

type DashboardDecisionPageProps = { data: DashboardData; onAcknowledgeCreditCardReminder: (id: string, dueDate: string) => void };

const finite = (value: number | null | undefined) => value !== null && value !== undefined && Number.isFinite(value) ? value : null;
const money = (value: number | null | undefined, signed = false) => {
  const amount = finite(value); if (amount === null) return '—';
  const abs = Math.abs(amount); const body = abs < 10000 ? `${abs.toLocaleString('zh-TW')} 元` : `${(abs / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬元`;
  return `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${body}`;
};
const pct = (value: number | null | undefined, signed = false) => { const amount = finite(value); return amount === null ? '—' : `${signed && amount > 0 ? '+' : ''}${amount.toFixed(1)}%`; };
const tone = (value: number | null | undefined) => { const amount = finite(value); return amount === null || amount === 0 ? 'hold' : amount > 0 ? 'up' : 'down'; };
const quoteTime = (value: string | null) => value ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'short', timeStyle: 'short', hour12: false }).format(new Date(value)) : '—';

export default function DashboardDecisionPage({ data, onAcknowledgeCreditCardReminder }: DashboardDecisionPageProps) {
  const intelligence = data.intelligence;
  return <PageFrame page="home" title="投資決策首頁" description="30 秒掌握今日投資表現、配置與下一步。">
    <HomeFocusedAssetCard data={data.focusedAssetCard} />

    <section className={`investment-intelligence-card ${intelligence.overallTone}`} aria-labelledby="investment-intelligence-title">
      <header className="intelligence-heading"><div><p className="eyebrow">今日投資狀態</p><h2 id="investment-intelligence-title">{intelligence.overallStatus}</h2><p>{intelligence.title}</p></div><span className={`intelligence-status ${intelligence.overallTone}`}>{intelligence.overallStatus}</span></header>
      <p className="intelligence-summary">{intelligence.summary}</p>
      <div className="daily-decision-conclusion"><div><p className="eyebrow">今日建議結論</p><h3>{data.todayConclusion}</h3></div></div>
    </section>

    <CreditCardDueSoonCard reminders={data.creditCardDueSoonReminders} onAcknowledge={onAcknowledgeCreditCardReminder} />

    <section className="investment-summary-card" aria-labelledby="investment-summary-title">
      <div className="dashboard-section-heading"><div><p className="eyebrow">今日投資摘要</p><h2 id="investment-summary-title">資產與今日表現</h2></div><Link className="dashboard-text-link" to="/net-worth-history">查看淨資產歷史</Link></div>
      <div className="investment-summary-grid investment-summary-grid-compact">
        <article><small>總資產</small><strong>{money(data.total)}</strong></article>
        <article><small>淨資產</small><strong>{money(data.net)}</strong></article>
        <article><small>今日損益</small><strong className={tone(data.dayPnl)}>{money(data.dayPnl, true)}</strong><span>僅計入當日有效報價</span></article>
        <article><small>今日損益率</small><strong className={tone(data.dayPnlRate)}>{pct(data.dayPnlRate, true)}</strong><span>資料不足時不估算</span></article>
      </div>
    </section>

    <section className="dashboard-health-card" aria-labelledby="investment-health-title">
      <div className="dashboard-section-heading"><div><p className="eyebrow">投資健康度</p><h2 id="investment-health-title">配置與現金水位</h2></div><Link className="dashboard-text-link" to="/tools/risk-center">查看風險中心</Link></div>
      <p className="dashboard-support-line">整體風險 <b>{data.riskLabel}</b>｜配置偏離 <b className={data.thresholdReached ? 'warn' : 'good'}>{pct(data.allocationDeviation, true)}</b>（門檻 {pct(data.rebalanceThreshold)}）｜{data.thresholdReached ? '已達再平衡門檻' : '在門檻內'}</p>
    </section>

    <section className="dashboard-reminders-card" aria-labelledby="dashboard-reminders-title">
      <div className="dashboard-section-heading"><div><p className="eyebrow">狀態確認</p><h2 id="dashboard-reminders-title">有什麼資料或狀態需要確認</h2></div><Link className="dashboard-text-link" to="/settings">設定與備份</Link></div>
      <p className="dashboard-support-line"><span>最後股價更新</span> <b>{quoteTime(data.lastQuoteAt)}</b></p>
      {data.reminders.length === 0 ? <p className="dashboard-empty-state">目前沒有需要確認的資料或狀態。</p> : <ul className="dashboard-reminder-list">{data.reminders.map(item => <li key={item.key} className={item.tone}><strong>{item.title}</strong><span>{item.detail}</span></li>)}</ul>}
      <p className="dashboard-support-line"><Link className="dashboard-text-link" to={INVESTMENT_DECISION_ROUTES.investmentActionCenter}>{data.opportunities.length ? `${data.opportunities.length} 項值得查看的投資機會` : '目前沒有需要特別處理的投資機會'} →</Link></p>
    </section>
  </PageFrame>;
}
