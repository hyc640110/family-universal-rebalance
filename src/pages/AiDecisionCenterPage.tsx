import { Link } from 'react-router-dom';
import type { DecisionItem } from '../lib/aiDecision';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';

const labels: Record<DecisionItem['severity'], string> = { critical: '需優先留意', warning: '需要留意', info: '資訊', normal: '正常', unavailable: '資料不足' };
export default function AiDecisionCenterPage({ items, asOf }: { items: DecisionItem[]; asOf: string }) {
  const today = items.find(item => item.id === 'today'); const attention = items.filter(item => item.severity === 'critical' || item.severity === 'warning');
  return <PageFrame page="tools" title="AI 決策中心" description="本地規則分析，不使用生成式 AI；每項結論均附判定依據。">
    <section className="ai-decision-intro"><div><p className="eyebrow">V5.6 Foundation</p><h2>資料摘要與規則判定</h2><p>資料日期：{asOf}。不預測股價、不提供買賣建議或報酬保證。</p></div><Link to="/tools">返回工具中心</Link></section>
    {today && <DecisionCard item={today} featured />}
    <section className="ai-decision-attention"><h2>需要留意</h2>{attention.length ? <div className="ai-decision-list">{attention.map(item => <DecisionCard item={item} key={item.id} />)}</div> : <p className="note">目前沒有 critical 或 warning 的規則判定。</p>}</section>
    <section className="ai-decision-grid">{items.filter(item => item.id !== 'today' && !attention.includes(item)).map(item => <DecisionCard item={item} key={item.id} />)}</section>
    <ToolQuickNavigation current="ai-decision" />
  </PageFrame>;
}
function DecisionCard({ item, featured = false }: { item: DecisionItem; featured?: boolean }) { return <article className={`ai-decision-card ${featured ? 'featured' : ''}`}><header><span className={`ai-severity ${item.severity}`}>{labels[item.severity]}</span><h2>{item.title}</h2></header><p className="ai-conclusion">{item.conclusion}</p><p>{item.reason}</p><details><summary>判定依據</summary><dl>{item.evidence.map(row => <div key={`${row.label}-${row.value}`}><dt>{row.label}</dt><dd>{row.value}<small>{row.source}{row.asOf ? `｜${row.asOf}` : ''}</small></dd></div>)}</dl></details>{item.action && <Link className="ai-decision-link" to={item.action.to}>{item.action.label}</Link>}</article>; }
