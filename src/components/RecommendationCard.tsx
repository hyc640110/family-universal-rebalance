import type { RecommendationModel } from '../lib/recommendations';

export default function RecommendationCard({ recommendation }: { recommendation: RecommendationModel }) {
  return <article className={`recommendation-shared-card ${recommendation.tone}`}>
    <header><h3>{recommendation.title}</h3><span>{recommendation.status}</span></header>
    <p className="recommendation-shared-summary">{recommendation.summary}</p>
    <p className="recommendation-shared-detail">{recommendation.detail}</p>
  </article>;
}
