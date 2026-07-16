import { Link } from 'react-router-dom';
import type { InvestmentOpportunity } from '../lib/investmentOpportunities';
import { INVESTMENT_DECISION_ROUTES } from '../lib/toolNavigation';
import InvestmentOpportunityCard from './InvestmentOpportunityCard';

export default function InvestmentOpportunityList({ opportunities }: { opportunities: InvestmentOpportunity[] }) {
  return <section className="investment-opportunity-list" aria-labelledby="investment-opportunity-title">
    <div className="investment-opportunity-heading"><h3 id="investment-opportunity-title">值得查看的機會</h3><Link to={INVESTMENT_DECISION_ROUTES.investmentActionCenter} aria-label="查看全部投資行動" title="查看全部投資行動">查看全部投資行動</Link></div>
    {opportunities.length ? <div className="investment-opportunity-grid">{opportunities.map(opportunity => <InvestmentOpportunityCard key={opportunity.id} opportunity={opportunity} />)}</div> : <p>目前沒有需要特別處理的投資機會。</p>}
  </section>;
}
