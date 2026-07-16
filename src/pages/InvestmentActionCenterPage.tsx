import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';
import type { InvestmentActionCenterModel } from '../lib/investmentActionCenter';
import type { InvestmentActionExplanation } from '../lib/investmentActionExplainability';

const statusText = (status: InvestmentActionCenterModel['actions'][number]['status']) => status === 'unavailable' ? '資料不足' : status === 'blocked' ? '暫時無法判斷' : '待查看';

export default function InvestmentActionCenterPage({ model, explanations }: { model: InvestmentActionCenterModel; explanations: InvestmentActionExplanation[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const explanationFor = (id: string) => explanations.find(explanation => explanation.actionId === id);
  return <PageFrame page="tools" title="投資行動中心" description="集中查看既有每日投資判斷與待查看事項；不產生買賣指令或新的投資結論。">
    <section className={`investment-action-summary ${model.summary.status}`} aria-labelledby="investment-action-summary-title">
      <p className="eyebrow">Investment Action Center</p><h2 id="investment-action-summary-title">{model.summary.title}</h2><p>{model.summary.description}</p>
      <p className="investment-action-normal">已完成檢查 {model.summary.completedStepCount} 項{model.summary.normalCategories.length ? `：${model.summary.normalCategories.join('、')}` : '。'}</p>
    </section>
    {model.primaryAction && <ActionItem action={model.primaryAction} explanation={explanationFor(model.primaryAction.id)} expanded={expandedId === model.primaryAction.id} onToggle={() => setExpandedId(expandedId === model.primaryAction!.id ? null : model.primaryAction!.id)} featured />}
    <section className="investment-action-list" aria-labelledby="investment-action-list-title"><div className="dashboard-section-heading"><div><p className="eyebrow">待查看事項</p><h2 id="investment-action-list-title">依既有優先順序查看</h2></div><span>{model.actions.length} 項</span></div>
      {model.actions.length ? <ol>{model.actions.map(action => <ActionItem key={action.id} action={action} explanation={explanationFor(action.id)} expanded={expandedId === action.id} onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)} />)}</ol> : <p className="investment-action-empty">目前沒有需要特別處理的投資機會；今日無需進行投資操作。</p>}
    </section>
    <ToolQuickNavigation current="investment-action-center" />
  </PageFrame>;
}
function ActionItem({ action, explanation, expanded, onToggle, featured = false }: { action: InvestmentActionCenterModel['actions'][number]; explanation?: InvestmentActionExplanation; expanded: boolean; onToggle: () => void; featured?: boolean }) {
  const controlsId = `action-explanation-${action.id}`;
  const content = <><div><small>{featured ? '主要下一步' : `${statusText(action.status)}｜優先順序 ${action.priority}`}</small><h3>{action.title}</h3><p>{action.description}</p></div><div className="investment-action-controls"><button type="button" aria-expanded={expanded} aria-controls={controlsId} onClick={onToggle}>{expanded ? '收合原因' : '為什麼出現？'}</button><Link to={action.route} aria-label={action.ariaLabel} title={action.titleAttribute}>{action.actionLabel}</Link></div>{expanded && explanation && <div className="investment-action-explanation" id={controlsId}><p><b>來源模組：</b>{explanation.sourceLabel}</p><p><b>優先原因：</b>{explanation.reasonSummary}</p><ul>{explanation.evidenceItems.map(item => <li key={item.id}><span>{item.label}</span><strong>{item.valueText}</strong></li>)}</ul></div>}</>;
  return featured ? <section className="investment-action-primary" aria-labelledby="investment-action-primary-title"><div><p className="eyebrow">主要下一步</p><h2 id="investment-action-primary-title">{action.title}</h2><p>{action.reason}</p></div>{content}</section> : <li className={action.status}>{content}</li>;
}
