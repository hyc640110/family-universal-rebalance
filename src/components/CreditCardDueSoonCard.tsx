import type { CreditCardDueSoonReminder } from '../lib/creditCardReminders';

type Props = Readonly<{
  reminders: readonly CreditCardDueSoonReminder[];
  onAcknowledge: (id: string, dueDate: string) => void;
}>;

// UR-TODO-060: mirrors HouseholdLiquidityDiagnosticList.tsx's "no items → render nothing"
// pattern, not the homepage's own dashboard-reminders-card empty-state-text pattern — this
// block must not occupy any homepage space when there is nothing due or overdue.
export default function CreditCardDueSoonCard({ reminders, onAcknowledge }: Props) {
  if (!reminders.length) return null;
  return <section className="dashboard-credit-card-due-card" aria-labelledby="credit-card-due-title">
    <div className="dashboard-section-heading"><div><p className="eyebrow">即將到期</p><h2 id="credit-card-due-title">信用卡繳費提醒</h2></div></div>
    <ul className="dashboard-credit-card-due-list">
      {reminders.map(reminder => <li key={reminder.id} className={`dashboard-credit-card-due-item dashboard-credit-card-due-item-${reminder.status}`}>
        <strong>{reminder.name}</strong>
        <span className={reminder.status === 'overdue' ? 'warn' : undefined}>{reminder.status === 'overdue' ? `已逾期（原定 ${reminder.dueDate}，尚未確認）` : `${reminder.dueDate} 到期`}</span>
        <button type="button" className="small" onClick={() => onAcknowledge(reminder.id, reminder.dueDate)}>完成</button>
      </li>)}
    </ul>
  </section>;
}
