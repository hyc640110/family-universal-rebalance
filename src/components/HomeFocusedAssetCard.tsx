import { Link } from 'react-router-dom';
import { INVESTMENT_DECISION_ROUTES } from '../lib/toolNavigation';
import type { HomeFocusedAssetCardData } from '../lib/homeFocusedAssetCard';
import type { HomeFocusedAssetLadderData } from '../lib/homeFocusedAssetLadderCard';

type Props = Readonly<{ data: HomeFocusedAssetCardData; ladder: HomeFocusedAssetLadderData }>;

const finite = (value: number | null) => value !== null && Number.isFinite(value) ? value : null;
const money = (value: number | null) => {
  const amount = finite(value); if (amount === null) return '—';
  const abs = Math.abs(amount); return abs < 10000 ? `${abs.toLocaleString('zh-TW')} 元` : `${(abs / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬元`;
};
const pct = (value: number | null, signed = false) => { const amount = finite(value); return amount === null ? '—' : `${signed && amount > 0 ? '+' : ''}${amount.toFixed(1)}%`; };
const price = (value: number | null) => { const amount = finite(value); return amount === null ? '—' : `${amount.toFixed(2)} 元`; };

export default function HomeFocusedAssetCard({ data, ladder }: Props) {
  return <section className={`dashboard-focused-asset-card dashboard-focused-asset-card-${data.status}`} aria-labelledby="dashboard-focused-asset-title">
    <div className="dashboard-section-heading">
      <div><p className="eyebrow">重點標的</p><h2 id="dashboard-focused-asset-title">{data.name ? `${data.name}（${data.symbol}）` : data.symbol}</h2></div>
      <Link className="dashboard-text-link" to={INVESTMENT_DECISION_ROUTES.rebalanceRecommendation}>查看再平衡建議</Link>
    </div>
    <p className="dashboard-support-line"><span>可投入現金</span> <b>{money(data.investableCash)}</b></p>
    {data.currentWeight !== null && data.targetWeight !== null && <p className="dashboard-support-line">
      目前配置 <b>{pct(data.currentWeight)}</b>｜目標配置 <b>{pct(data.targetWeight)}</b>｜偏離 <b className={data.status === 'action-needed' ? 'warn' : 'good'}>{pct(data.deviation, true)}</b>
    </p>}
    {data.status === 'action-needed' && data.action && data.recommendedAmount !== null
      ? <p className="dashboard-focused-asset-action"><strong>{data.action === 'buy' ? '建議投入' : '建議賣出'}</strong><b>{money(data.recommendedAmount)}</b></p>
      : <p className="dashboard-support-line">{data.message}</p>}

    <div className={`dashboard-focused-asset-ladder dashboard-focused-asset-ladder-${ladder.status}`} aria-label="逢低加碼自動追蹤">
      <p className="dashboard-focused-asset-ladder-heading">逢低加碼自動追蹤</p>
      <p className="dashboard-support-line">目前高點 <b>{price(ladder.highWaterMark)}</b>｜現價 <b>{price(ladder.currentPrice)}</b>｜回撤 <b className={ladder.status === 'action-needed' ? 'warn' : 'good'}>{pct(ladder.drawdownPct, true)}</b></p>
      {ladder.status === 'action-needed' && ladder.triggeredLevel !== null
        ? <>
          <p className="dashboard-focused-asset-action"><strong>已觸發第 {ladder.triggeredLevel} 級</strong>{ladder.fundingStatus === 'executable' && ladder.executableBudget !== null && <b>{money(ladder.executableBudget)}</b>}</p>
          {ladder.fundingStatus !== 'executable' && <p className="dashboard-support-line">{ladder.message}</p>}
        </>
        : <p className="dashboard-support-line">{ladder.message}</p>}
    </div>
  </section>;
}
