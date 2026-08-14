import { useState } from 'react';
import type { LoanRepaymentGroupPresentation } from '../../lib/loanConfirmationPresentation';

/**
 * UR-TODO-054-A: the sole UI surface for confirming, voiding, and reconfirming a Loan repayment
 * component group. Always renders and operates on a whole `paymentId` group — there is
 * deliberately no per-component (principal/interest/fee/penalty) button anywhere in this file,
 * mirroring the atomic economic-group contract in loanAttributionContract.ts /
 * resolveActiveLoanComponentGroups().
 */

export type LoanConfirmOutcome = { rejected: false } | { rejected: true; reason: string };
export type LoanVoidOutcome = { rejected: false } | { rejected: true; reason: string };

const COMPONENT_LABEL: Record<LoanRepaymentGroupPresentation['components'][number]['type'], string> = {
  principal: '本金', interest: '利息', fee: '手續費', penalty: '違約金'
};

const ATOMIC_SAFETY_NOTE = '此還款由本金、利息及其他費用組成，確認或撤銷時會以整筆還款為單位處理，不會逐項分別確認或撤銷。';

const CONFIRM_DIALOG_TEXT = (loanLabel: string, total: number) =>
  `即將把「${loanLabel}」這筆還款（總額 NT$${total.toLocaleString('zh-TW')}）正式寫入記帳 Ledger。\n\n這是正式記帳動作：\n・本金、利息、手續費、違約金視為一組，會一次全部確認，不會逐項分別確認\n・重新整理頁面後不會消失\n・如需撤銷，可於下方按「撤銷整組」（會使整筆還款一起回到待確認狀態）\n\n確定要正式記帳嗎？`;

const VOID_DIALOG_TEXT = (loanLabel: string, total: number) =>
  `即將撤銷「${loanLabel}」這筆還款（總額 NT$${total.toLocaleString('zh-TW')}）的正式記帳。\n\n這是不可逆的動作：\n・撤銷會讓「整筆還款」（本金、利息、手續費、違約金）一起失去正式確認狀態，不是只撤銷其中一項\n・原始記帳事件不會被刪除，但會被標記為已作廢\n・如需恢復，須重新確認整筆還款（會建立全新的確認紀錄）\n\n確定要撤銷整組嗎？`;

function money(amount: number): string {
  return `NT$${amount.toLocaleString('zh-TW')}`;
}

function GroupRow({ group, loanLabel, onConfirm, onVoid }: {
  group: LoanRepaymentGroupPresentation;
  loanLabel: string;
  onConfirm: (paymentId: string) => LoanConfirmOutcome;
  onVoid: (eventId: string) => LoanVoidOutcome;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!window.confirm(CONFIRM_DIALOG_TEXT(loanLabel, group.settlementAmount))) return;
    const outcome = onConfirm(group.paymentId);
    setError(outcome.rejected ? outcome.reason : null);
  };

  const handleVoid = () => {
    if (!group.voidTargetEventId) { setError('目前找不到可撤銷的記帳事件，請重新整理後再試一次。'); return; }
    if (!window.confirm(VOID_DIALOG_TEXT(loanLabel, group.settlementAmount))) return;
    const outcome = onVoid(group.voidTargetEventId);
    setError(outcome.rejected ? outcome.reason : null);
  };

  const statusLabel = group.status === 'matched' ? '已正式記帳' : group.everConfirmed ? '待重新確認' : '待確認';

  return <li className="loan-confirmation-group">
    <div className="loan-confirmation-group-header">
      <strong>本次還款</strong>
      <span className={`loan-confirmation-status loan-confirmation-status-${group.status}`}>{statusLabel}</span>
    </div>
    <dl className="loan-confirmation-group-details">
      <div><dt>貸款</dt><dd>{loanLabel}</dd></div>
      <div><dt>日期</dt><dd>{group.effectiveDate.slice(0, 10)}</dd></div>
      <div><dt>總額</dt><dd>{money(group.settlementAmount)}</dd></div>
      {group.components.map(component => <div key={component.componentId}><dt>{COMPONENT_LABEL[component.type]}</dt><dd>{money(component.amount)}</dd></div>)}
    </dl>
    <p className="note loan-confirmation-atomic-note">{ATOMIC_SAFETY_NOTE}</p>
    {error && <p className="warning-message" role="alert">{error}</p>}
    {group.status === 'candidate'
      ? <button type="button" className="small loan-confirmation-confirm-button" onClick={handleConfirm}>確認正式記帳</button>
      : <button type="button" className="small danger loan-confirmation-void-button" onClick={handleVoid}>撤銷整組</button>}
  </li>;
}

export default function LoanConfirmationCard({ groups, loans, onConfirm, onVoid }: {
  groups: readonly LoanRepaymentGroupPresentation[];
  loans: readonly { id: string; name: string }[];
  onConfirm: (paymentId: string) => LoanConfirmOutcome;
  onVoid: (eventId: string) => LoanVoidOutcome;
}) {
  if (!groups.length) return null;
  const loanNameById = new Map(loans.map(loan => [loan.id, loan.name || '未命名借款']));
  return <section className="loan-confirmation-card" aria-label="貸款還款確認">
    <strong>待確認／已確認還款</strong>
    <ul className="loan-confirmation-group-list">
      {groups.map(group => <GroupRow
        key={group.paymentId}
        group={group}
        loanLabel={loanNameById.get(group.loanId) || '未命名借款'}
        onConfirm={onConfirm}
        onVoid={onVoid}
      />)}
    </ul>
  </section>;
}
