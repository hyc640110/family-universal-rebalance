import { Link } from 'react-router-dom';
import type { InvestmentOpportunity } from '../lib/investmentOpportunities';
import { displayEmbeddedAmounts } from '../lib/amountVisibility';
import { useAmountsHidden } from './layout/AmountVisibilityContext';

export default function InvestmentOpportunityCard({ opportunity }: { opportunity: InvestmentOpportunity }) {
  const hidden = useAmountsHidden();
  return <article className={`investment-opportunity ${opportunity.status}`}>
    <div><small>{opportunity.status === 'unavailable' ? '資料不足' : opportunity.status === 'blocked' ? '暫時無法判斷' : '值得查看'}</small><strong>{displayEmbeddedAmounts(opportunity.title, hidden)}</strong><span>{displayEmbeddedAmounts(opportunity.description, hidden)}</span></div>
    <Link to={opportunity.route} aria-label={opportunity.ariaLabel} title={opportunity.ariaLabel}>{opportunity.actionLabel}</Link>
  </article>;
}
