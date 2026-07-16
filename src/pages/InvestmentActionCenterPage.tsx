import { Link } from 'react-router-dom';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';
import type { InvestmentActionCenterModel } from '../lib/investmentActionCenter';

const statusText = (status: InvestmentActionCenterModel['actions'][number]['status']) => status === 'unavailable' ? '資料不足' : status === 'blocked' ? '暫時無法判斷' : '待查看';

export default function InvestmentActionCenterPage({ model }: { model: InvestmentActionCenterModel }) {
  return <PageFrame page="tools" title="投資行動中心" description="集中查看既有每日投資判斷與待查看事項；不產生買賣指令或新的投資結論。">
    <section className={`investment-action-summary ${model.summary.status}`} aria-labelledby="investment-action-summary-title">
      <p className="eyebrow">Investment Action Center</p><h2 id="investment-action-summary-title">{model.summary.title}</h2><p>{model.summary.description}</p>
      <p className="investment-action-normal">已完成檢查 {model.summary.completedStepCount} 項{model.summary.normalCategories.length ? `：${model.summary.normalCategories.join('、')}` : '。'}</p>
    </section>
    {model.primaryAction && <section className="investment-action-primary" aria-labelledby="investment-action-primary-title"><div><p className="eyebrow">主要下一步</p><h2 id="investment-action-primary-title">{model.primaryAction.title}</h2><p>{model.primaryAction.reason}</p></div><Link to={model.primaryAction.route} aria-label={model.primaryAction.ariaLabel} title={model.primaryAction.titleAttribute}>{model.primaryAction.actionLabel}<span aria-hidden="true">→</span></Link></section>}
    <section className="investment-action-list" aria-labelledby="investment-action-list-title"><div className="dashboard-section-heading"><div><p className="eyebrow">待查看事項</p><h2 id="investment-action-list-title">依既有優先順序查看</h2></div><span>{model.actions.length} 項</span></div>
      {model.actions.length ? <ol>{model.actions.map(action => <li key={action.id} className={action.status}><div><small>{statusText(action.status)}｜優先順序 {action.priority}</small><h3>{action.title}</h3><p>{action.description}</p></div><Link to={action.route} aria-label={action.ariaLabel} title={action.titleAttribute}>{action.actionLabel}</Link></li>)}</ol> : <p className="investment-action-empty">目前沒有需要特別處理的投資機會；今日無需進行投資操作。</p>}
    </section>
    <ToolQuickNavigation current="investment-action-center" />
  </PageFrame>;
}
