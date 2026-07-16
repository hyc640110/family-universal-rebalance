import type { deriveInvestmentIntelligence } from '../lib/investmentIntelligence';
import type { DailyDecisionWorkflow as Workflow } from '../lib/dailyDecisionWorkflow';
import type { InvestmentOpportunity } from '../lib/investmentOpportunities';
import DailyDecisionWorkflow from './DailyDecisionWorkflow';
import InvestmentOpportunityList from './InvestmentOpportunityList';

export default function InvestmentIntelligenceSummary({ intelligence, workflow, opportunities }: { intelligence: ReturnType<typeof deriveInvestmentIntelligence>; workflow: Workflow; opportunities: InvestmentOpportunity[] }) {
  return <section className={`investment-intelligence-card ${intelligence.overallTone}`} aria-labelledby="investment-intelligence-title">
    <header className="intelligence-heading"><div><p className="eyebrow">V5.9 Investment Intelligence</p><h2 id="investment-intelligence-title">今日投資狀態</h2><p><strong>{intelligence.overallStatus}</strong>｜{intelligence.title}</p></div><span className={`intelligence-status ${intelligence.overallTone}`}>{intelligence.overallStatus}</span></header>
    <p className="intelligence-summary">{intelligence.summary}</p>
    <DailyDecisionWorkflow workflow={workflow} />
    <InvestmentOpportunityList opportunities={opportunities} />
    <div className="intelligence-grid">{intelligence.supportingItems.filter(item => ['資料品質', '今日投資狀態', '市場資料', '股息摘要'].includes(item.label)).map(item => <article key={item.label} className={item.tone}><small>{item.label}</small><strong>{item.value}</strong><span>{item.detail}</span></article>)}</div>
    <p className="intelligence-limits">{intelligence.limitations.join(' ')}</p>
  </section>;
}
