import { Link } from 'react-router-dom';
import { LineChart, Star } from 'lucide-react';
import { INVESTMENT_DECISION_ROUTES } from '../lib/toolNavigation';
import type { HomeFocusedAssetCardData } from '../lib/homeFocusedAssetCard';
import type { HomeFocusedAssetLadderData } from '../lib/homeFocusedAssetLadderCard';

type Props = Readonly<{ data: HomeFocusedAssetCardData | null; ladder: HomeFocusedAssetLadderData | null }>;

const finite = (value: number | null) => value !== null && Number.isFinite(value) ? value : null;
const money = (value: number | null) => {
  const amount = finite(value); if (amount === null) return '—';
  const abs = Math.abs(amount); return abs < 10000 ? `${abs.toLocaleString('zh-TW')} 元` : `${(abs / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬元`;
};
const pct = (value: number | null, signed = false) => { const amount = finite(value); return amount === null ? '—' : `${signed && amount > 0 ? '+' : ''}${amount.toFixed(1)}%`; };
const price = (value: number | null) => { const amount = finite(value); return amount === null ? '—' : `${amount.toFixed(2)} 元`; };

// UR-TODO-061: mirrors CreditCardDueSoonCard.tsx's "no items → render nothing" convention —
// when the user has no focused symbol selected, this block occupies no homepage space at all
// rather than showing an empty-state shell.
export default function HomeFocusedAssetCard({ data, ladder }: Props) {
  if (!data || !ladder) return null;
  // UR-TODO-077: "追蹤中" is derived purely from the already-exposed `ladder.status` — no new
  // persisted field. `status !== 'unavailable'` covers exactly the cases where the ladder actually
  // has a usable high-water-mark and is being evaluated ('normal' or 'action-needed'); it is
  // 'unavailable' whenever tracking is disabled or has no data yet, so the badge never claims an
  // active state the underlying engine hasn't actually reached.
  const isLadderTracking = ladder.status !== 'unavailable';
  return <section className={`dashboard-focused-asset-card dashboard-focused-asset-card-${data.status}`} aria-labelledby="dashboard-focused-asset-title">
    <div className="dashboard-focused-asset-header-row">
      <span className="dashboard-icon-circle dashboard-icon-circle-blue" aria-hidden="true"><Star size={16} /></span>
      <p className="eyebrow">重點標的</p>
      <Link className="dashboard-text-link dashboard-focused-asset-cta" to={INVESTMENT_DECISION_ROUTES.rebalanceRecommendation}>查看再平衡建議</Link>
    </div>
    <div className="dashboard-focused-asset-body">
      <div className="dashboard-focused-asset-name-block">
        <h2 id="dashboard-focused-asset-title">{data.name ? `${data.name}（${data.symbol}）` : data.symbol}</h2>
        <p className="dashboard-support-line"><span>可投入現金</span> <b>{money(data.investableCash)}</b></p>
      </div>
      {data.currentWeight !== null && data.targetWeight !== null && <div className="dashboard-metric-columns">
        <div><span>目前配置</span><strong>{pct(data.currentWeight)}</strong></div>
        <div><span>目標配置</span><strong>{pct(data.targetWeight)}</strong></div>
        <div><span>偏離</span><strong className={data.status === 'action-needed' ? 'warn' : 'good'}>{pct(data.deviation, true)}</strong></div>
      </div>}
    </div>
    {data.status === 'action-needed' && data.action && data.recommendedAmount !== null
      ? <p className="dashboard-focused-asset-action"><strong>{data.action === 'buy' ? '建議投入' : '建議賣出'}</strong><b>{money(data.recommendedAmount)}</b></p>
      : <p className="dashboard-support-line">{data.message}</p>}

    <div className={`dashboard-focused-asset-ladder dashboard-focused-asset-ladder-${ladder.status}`} aria-label="逢低加碼自動追蹤">
      <p className="dashboard-focused-asset-ladder-heading"><LineChart size={15} aria-hidden="true" className="dashboard-focused-asset-ladder-icon" />逢低加碼自動追蹤{isLadderTracking && <span className="dashboard-focused-asset-ladder-badge">追蹤中</span>}</p>
      <div className="dashboard-metric-columns dashboard-focused-asset-ladder-columns">
        <div><span>目前高點</span><strong>{price(ladder.highWaterMark)}</strong></div>
        <div><span>現價</span><strong>{price(ladder.currentPrice)}</strong></div>
        <div><span>回撤</span><strong className={ladder.status === 'action-needed' ? 'warn' : 'good'}>{pct(ladder.drawdownPct, true)}</strong></div>
        {ladder.status === 'normal' && ladder.nextLevelGapPct !== null && <div><span>下一級門檻</span><strong>{pct(ladder.nextLevelGapPct)}</strong></div>}
      </div>
      {ladder.status === 'action-needed' && ladder.triggeredLevel !== null
        ? <>
          <p className="dashboard-focused-asset-action"><strong>已觸發第 {ladder.triggeredLevel} 級</strong>{ladder.fundingStatus === 'executable' && ladder.executableBudget !== null && <b>{money(ladder.executableBudget)}</b>}</p>
          {ladder.fundingStatus !== 'executable' && <p className="dashboard-support-line">{ladder.message}</p>}
        </>
        : <p className="dashboard-support-line">{ladder.message}</p>}
    </div>
  </section>;
}
