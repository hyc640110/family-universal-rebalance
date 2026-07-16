import { Link } from 'react-router-dom';
import type { DailyDecisionWorkflow as Workflow } from '../lib/dailyDecisionWorkflow';
import { dailyDecisionStatusText } from '../lib/dailyDecisionWorkflow';

export default function DailyDecisionWorkflow({ workflow }: { workflow: Workflow }) {
  return <section className="daily-decision-workflow" aria-labelledby="daily-decision-workflow-title">
    <div className="daily-decision-conclusion">
      <div><p className="eyebrow">每日投資判斷流程</p><h3 id="daily-decision-workflow-title">{workflow.conclusion.title}</h3><p>{workflow.conclusion.description}</p></div>
      {workflow.primaryNextStep && <Link className="daily-decision-primary-link" to={workflow.primaryNextStep.route} aria-label={workflow.primaryNextStep.ariaLabel} title={workflow.primaryNextStep.ariaLabel}>{workflow.primaryNextStep.linkLabel}<span aria-hidden="true">→</span></Link>}
    </div>
    <ol className="daily-decision-steps">{workflow.steps.map(step => <li key={step.id} className={step.status}>
      <div><span className="daily-decision-step-status">{dailyDecisionStatusText[step.status]}</span><strong>{step.title}</strong><p>{step.description}</p></div>
      <Link to={step.route} aria-label={step.ariaLabel} title={step.ariaLabel}>{step.linkLabel}</Link>
    </li>)}</ol>
  </section>;
}
