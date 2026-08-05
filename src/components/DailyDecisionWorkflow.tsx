import { Link } from 'react-router-dom';
import type { DailyDecisionWorkflow as Workflow } from '../lib/dailyDecisionWorkflow';
import { dailyDecisionStatusText } from '../lib/dailyDecisionWorkflow';
import { displayEmbeddedAmounts } from '../lib/amountVisibility';
import { useAmountsHidden } from './layout/AmountVisibilityContext';

export default function DailyDecisionWorkflow({ workflow, todayConclusion, syncReminder }: { workflow: Workflow; todayConclusion: string; syncReminder: string | null }) {
  const hidden = useAmountsHidden();
  return <section className="daily-decision-workflow" aria-labelledby="daily-decision-workflow-title">
    <div className="daily-decision-conclusion">
      <div><p className="eyebrow">今日建議結論</p><h3 id="daily-decision-workflow-title">{displayEmbeddedAmounts(todayConclusion, hidden)}</h3></div>
    </div>
    {syncReminder && <p className="daily-decision-sync-reminder"><strong>資料同步提醒</strong>{displayEmbeddedAmounts(syncReminder, hidden)}</p>}
    <div className="daily-decision-workflow-status"><p><strong>每日投資判斷流程</strong>{workflow.conclusion.title}：{displayEmbeddedAmounts(workflow.conclusion.description, hidden)}</p>{workflow.primaryNextStep && <Link className="daily-decision-primary-link" to={workflow.primaryNextStep.route} aria-label={workflow.primaryNextStep.ariaLabel} title={workflow.primaryNextStep.ariaLabel}>{workflow.primaryNextStep.linkLabel}<span aria-hidden="true">→</span></Link>}</div>
    <ol className="daily-decision-steps">{workflow.steps.map(step => <li key={step.id} className={step.status}>
      <div><span className="daily-decision-step-status">{dailyDecisionStatusText[step.status]}</span><strong>{step.title}</strong><p>{displayEmbeddedAmounts(step.description, hidden)}</p></div>
      <Link to={step.route} aria-label={step.ariaLabel} title={step.ariaLabel}>{step.linkLabel}</Link>
    </li>)}</ol>
  </section>;
}
