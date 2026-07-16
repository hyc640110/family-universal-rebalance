import { Link } from 'react-router-dom';
import type { deriveInvestmentIntelligence } from '../lib/investmentIntelligence';

export default function InvestmentIntelligenceSummary({ intelligence }: { intelligence: ReturnType<typeof deriveInvestmentIntelligence> }) {
  return <section className={`investment-intelligence-card ${intelligence.overallTone}`} aria-labelledby="investment-intelligence-title">
    <header className="intelligence-heading"><div><p className="eyebrow">V5.9 Investment Intelligence</p><h2 id="investment-intelligence-title">今日投資狀態</h2><p><strong>{intelligence.overallStatus}</strong>｜{intelligence.title}</p></div><span className={`intelligence-status ${intelligence.overallTone}`}>{intelligence.overallStatus}</span></header>
    <p className="intelligence-summary">{intelligence.summary}</p>
    <div className="intelligence-grid">{intelligence.supportingItems.map(item => <article key={item.label} className={item.tone}><small>{item.label}</small><strong>{item.value}</strong><span>{item.detail}</span></article>)}</div>
    <div className="intelligence-next-action"><div><small>建議下一步</small><strong>{intelligence.nextAction.reason}</strong></div><Link className="intelligence-action-link" to={intelligence.nextAction.route}>{intelligence.nextAction.label}<span aria-hidden="true">→</span></Link></div>
    <p className="intelligence-limits">{intelligence.limitations.join(' ')}</p>
  </section>;
}
