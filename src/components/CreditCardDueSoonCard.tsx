import type { CreditCardDueSoonReminder } from '../lib/creditCardReminders';

type Props = Readonly<{ reminders: readonly CreditCardDueSoonReminder[] }>;

const money = (amount: number) => `${amount.toLocaleString('zh-TW')} 元`;

// UR-TODO-060: mirrors HouseholdLiquidityDiagnosticList.tsx's "no items → render nothing"
// pattern, not the homepage's own dashboard-reminders-card empty-state-text pattern — this
// block must not occupy any homepage space when there is nothing due within the threshold.
export default function CreditCardDueSoonCard({ reminders }: Props) {
  if (!reminders.length) return null;
  return <section className="dashboard-credit-card-due-card" aria-labelledby="credit-card-due-title">
    <div className="dashboard-section-heading"><div><p className="eyebrow">即將到期</p><h2 id="credit-card-due-title">信用卡繳費提醒</h2></div></div>
    <ul className="dashboard-credit-card-due-list">
      {reminders.map(reminder => <li key={reminder.id}>
        <strong>{reminder.name}</strong>
        <span>{reminder.dueDate} 到期</span>
        <span>{money(reminder.amount)}</span>
      </li>)}
    </ul>
  </section>;
}
