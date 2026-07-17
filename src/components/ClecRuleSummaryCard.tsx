import { Link } from 'react-router-dom';
import type { ClecRuleOutput } from '../lib/clecStrategyRules';
import { presentClecRuleSummary } from '../lib/clecRuleSummaryPresentation';

export default function ClecRuleSummaryCard({ rule }: { rule: ClecRuleOutput | null | undefined }) {
  const summary = presentClecRuleSummary(rule);
  return <section className={`clec-rule-summary-bridge is-${summary.statusTone}`} aria-labelledby="clec-rule-summary-bridge-title">
    <header><div><p className="eyebrow">CLEC Strategy Rule Foundation</p><h2 id="clec-rule-summary-bridge-title">CLEC 策略規則摘要</h2></div><span className="clec-rule-summary-badge">{summary.statusLabel}</span></header>
    <p className="note">沿用既有 CLEC 策略規則結果；僅供決策輔助，非自動交易。</p><p className="clec-rule-summary-bridge-copy">{summary.summary}</p>
    {summary.actionLabel && <p className="clec-rule-summary-direction"><b>既有建議方向：</b>{summary.actionLabel}</p>}
    {summary.reasons.length > 0 && <div><h3>主要判定理由</h3><ul>{summary.reasons.map(item => <li key={`${item.code}-${item.detail}`}><b>{item.title}</b>：{item.detail}{item.assets.length ? `（${item.assets.join('、')}）` : ''}</li>)}</ul></div>}
    {summary.warnings.length > 0 && <div className="clec-rule-summary-warnings"><h3>重要警示</h3><ul>{summary.warnings.map(item => <li key={item}>{item}</li>)}</ul></div>}
    {summary.affectedAssets.length > 0 && <p className="clec-rule-summary-assets"><b>相關資產：</b>{summary.affectedAssets.join('、')}</p>}
    <Link className="clec-rule-summary-link" to={summary.route}>前往 CLEC 策略中心查看完整說明</Link>
  </section>;
}
