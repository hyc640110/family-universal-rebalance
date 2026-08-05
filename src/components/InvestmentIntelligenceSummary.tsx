import type { deriveInvestmentIntelligence } from '../lib/investmentIntelligence';
import type { DailyDecisionWorkflow as Workflow } from '../lib/dailyDecisionWorkflow';
import type { InvestmentOpportunity } from '../lib/investmentOpportunities';
import DailyDecisionWorkflow from './DailyDecisionWorkflow';
import InvestmentOpportunityList from './InvestmentOpportunityList';
import { displayEmbeddedAmounts } from '../lib/amountVisibility';
import { useAmountsHidden } from './layout/AmountVisibilityContext';

export default function InvestmentIntelligenceSummary({ intelligence, workflow, opportunities, todayConclusion, syncReminder }: { intelligence: ReturnType<typeof deriveInvestmentIntelligence>; workflow: Workflow; opportunities: InvestmentOpportunity[]; todayConclusion: string; syncReminder: string | null }) {
  const hidden = useAmountsHidden();
  return <section className={`investment-intelligence-card ${intelligence.overallTone}`} aria-labelledby="investment-intelligence-title">
    <header className="intelligence-heading"><div><p className="eyebrow">V5.9 Investment Intelligence</p><h2 id="investment-intelligence-title">今日投資狀態</h2><p><strong>{intelligence.overallStatus}</strong>｜{displayEmbeddedAmounts(intelligence.title, hidden)}</p></div><span className={`intelligence-status ${intelligence.overallTone}`}>{intelligence.overallStatus}</span></header>
    <p className="intelligence-summary">{displayEmbeddedAmounts(intelligence.summary, hidden)}</p>
    <DailyDecisionWorkflow workflow={workflow} todayConclusion={todayConclusion} syncReminder={syncReminder} />
    <InvestmentOpportunityList opportunities={opportunities} />
    <div className="intelligence-grid">{intelligence.supportingItems.filter(item => ['資料品質', '今日投資狀態', '市場資料', '股息摘要'].includes(item.label)).map(item => <article key={item.label} className={item.tone}><small>{item.label}</small><strong>{displayEmbeddedAmounts(item.value, hidden)}</strong><span>{displayEmbeddedAmounts(item.detail, hidden)}</span></article>)}</div>
    <p className="intelligence-limits">{displayEmbeddedAmounts(intelligence.limitations.join(' '), hidden)}</p>
  </section>;
}
