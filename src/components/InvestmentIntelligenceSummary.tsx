import { Link } from 'react-router-dom';
import type { deriveInvestmentIntelligence } from '../lib/investmentIntelligence';
import type { DailyDecisionWorkflow as Workflow } from '../lib/dailyDecisionWorkflow';
import DailyDecisionWorkflow from './DailyDecisionWorkflow';

export default function InvestmentIntelligenceSummary({ intelligence, workflow }: { intelligence: ReturnType<typeof deriveInvestmentIntelligence>; workflow: Workflow }) {
  return <section className={`investment-intelligence-card ${intelligence.overallTone}`} aria-labelledby="investment-intelligence-title">
    <header className="intelligence-heading"><div><p className="eyebrow">V5.9 Investment Intelligence</p><h2 id="investment-intelligence-title">今日投資狀態</h2><p><strong>{intelligence.overallStatus}</strong>｜{intelligence.title}</p></div><span className={`intelligence-status ${intelligence.overallTone}`}>{intelligence.overallStatus}</span></header>
    <p className="intelligence-summary">{intelligence.summary}</p>
    <DailyDecisionWorkflow workflow={workflow} />
    <section className="intelligence-attention" aria-labelledby="intelligence-attention-title"><h3 id="intelligence-attention-title">需要注意</h3>{intelligence.attentionItems.length ? <div className="intelligence-attention-grid">{intelligence.attentionItems.map(item => <Link key={item.id} to={item.route} aria-label={`${item.title}：${item.reason}`} title={item.title}><strong>{item.title}</strong><span>{item.reason}</span></Link>)}</div> : <p>目前無優先警示；資料狀態與既有規則未出現需要立即處理的項目。</p>}</section>
    <div className="intelligence-grid">{intelligence.supportingItems.filter(item => ['資料品質', '今日投資狀態', '市場資料', '股息摘要'].includes(item.label)).map(item => <article key={item.label} className={item.tone}><small>{item.label}</small><strong>{item.value}</strong><span>{item.detail}</span></article>)}</div>
    <p className="intelligence-limits">{intelligence.limitations.join(' ')}</p>
  </section>;
}
