import type { InvestmentOpportunity } from '../lib/investmentOpportunities';
import InvestmentOpportunityCard from './InvestmentOpportunityCard';

export default function InvestmentOpportunityList({ opportunities }: { opportunities: InvestmentOpportunity[] }) {
  return <section className="investment-opportunity-list" aria-labelledby="investment-opportunity-title">
    <h3 id="investment-opportunity-title">值得查看的機會</h3>
    {opportunities.length ? <div className="investment-opportunity-grid">{opportunities.map(opportunity => <InvestmentOpportunityCard key={opportunity.id} opportunity={opportunity} />)}</div> : <p>目前沒有需要特別處理的投資機會。</p>}
  </section>;
}
