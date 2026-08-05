import type { RecommendationModel } from '../lib/recommendations';
import { displayEmbeddedAmounts } from '../lib/amountVisibility';
import { useAmountsHidden } from './layout/AmountVisibilityContext';

export default function RecommendationCard({ recommendation }: { recommendation: RecommendationModel }) {
  const hidden = useAmountsHidden();
  return <article className={`recommendation-shared-card ${recommendation.tone}`}>
    <header><h3>{recommendation.title}</h3><span>{recommendation.status}</span></header>
    <p className="recommendation-shared-summary">{displayEmbeddedAmounts(recommendation.summary, hidden)}</p>
    <p className="recommendation-shared-detail">{displayEmbeddedAmounts(recommendation.detail, hidden)}</p>
  </article>;
}
