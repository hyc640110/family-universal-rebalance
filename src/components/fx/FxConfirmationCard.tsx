import { useState } from 'react';
import type { FxConfirmationGroupPresentation } from '../../lib/fxConfirmationPresentation';

/**
 * UR-TODO-054-B: the sole UI surface for confirming, voiding, and reconfirming an FX conversion.
 * Always renders and operates on a whole `conversionId` — there is deliberately no per-leg
 * (source/destination) button anywhere in this file. Structurally simpler than Loan's atomic
 * group (there is only ever one confirmation FinancialEvent per conversionId, never a component
 * group), so void/reconfirm both operate on that single event directly.
 */

export type FxConfirmOutcome = { rejected: false } | { rejected: true; reason: string };
export type FxVoidOutcome = { rejected: false } | { rejected: true; reason: string };

const ATOMIC_SAFETY_NOTE = '此換匯由換出、換入兩筆交易組成一次完整換匯，確認或撤銷時會以整筆換匯為單位處理，不會分別對兩筆交易操作。';

const FEE_LABEL: Record<string, string> = {
  none: '無額外費用',
  included: '費用已包含於換匯條件',
  unknown: '費用狀態尚未確認',
  'explicit-resolved': '已連結明確費用交易',
  'explicit-unresolved': '已連結費用交易，但找不到該筆交易'
};

function money(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('zh-TW')}`;
}

const CONFIRM_DIALOG_TEXT = (source: string, destination: string) =>
  `即將把這筆換匯（${source} → ${destination}）正式寫入記帳 Ledger。\n\n這是正式記帳動作：\n・換出、換入視為一組，會一次全部確認\n・重新整理頁面後不會消失\n・如需撤銷，可於下方按「撤銷整筆換匯」（會使這筆換匯一起回到待確認狀態）\n\n確定要正式記帳嗎？`;

const VOID_DIALOG_TEXT = (source: string, destination: string) =>
  `即將撤銷這筆換匯（${source} → ${destination}）的正式記帳。\n\n這是不可逆的動作：\n・撤銷會讓「整筆換匯」一起失去正式確認狀態\n・原始記帳事件不會被刪除，但會被標記為已作廢\n・如需恢復，須重新確認這筆換匯（會建立全新的確認紀錄）\n\n確定要撤銷嗎？`;

function accountLabel(accountId: string, accounts: readonly { id: string; name: string }[]): string {
  return accounts.find(account => account.id === accountId)?.name || '未知帳戶';
}

function FeeRow({ group }: { group: FxConfirmationGroupPresentation }) {
  const label = FEE_LABEL[group.feeResolution.status] || group.feeResolution.status;
  const amountText = group.feeResolution.status === 'explicit-resolved' && group.feeTransactionAmount !== undefined
    ? `（${money(group.feeTransactionAmount, group.feeTransactionCurrency || '')}）`
    : '';
  return <div><dt>費用</dt><dd>{label}{amountText}</dd></div>;
}

function GroupRow({ group, accounts, onConfirm, onVoid }: {
  group: FxConfirmationGroupPresentation;
  accounts: readonly { id: string; name: string }[];
  onConfirm: (conversionId: string) => FxConfirmOutcome;
  onVoid: (eventId: string) => FxVoidOutcome;
}) {
  const [error, setError] = useState<string | null>(null);
  const sourceLabel = `${accountLabel(group.sourceAccountId, accounts)}（${money(group.sourceAmount, group.sourceCurrency)}）`;
  const destinationLabel = `${accountLabel(group.destinationAccountId, accounts)}（${money(group.destinationAmount, group.destinationCurrency)}）`;

  const handleConfirm = () => {
    if (!window.confirm(CONFIRM_DIALOG_TEXT(sourceLabel, destinationLabel))) return;
    // Defense-in-depth, same rationale as LoanConfirmationCard: a click must never be able to
    // produce zero visible effect regardless of what onConfirm does internally.
    try {
      const outcome = onConfirm(group.conversionId);
      setError(outcome.rejected ? outcome.reason : null);
    } catch (thrown) {
      setError(`確認時發生未預期的錯誤，請重新整理頁面後再試一次。${thrown instanceof Error ? `（${thrown.message}）` : ''}`);
    }
  };

  const handleVoid = () => {
    if (!group.voidTargetEventId) { setError('目前找不到可撤銷的記帳事件，請重新整理後再試一次。'); return; }
    if (!window.confirm(VOID_DIALOG_TEXT(sourceLabel, destinationLabel))) return;
    try {
      const outcome = onVoid(group.voidTargetEventId);
      setError(outcome.rejected ? outcome.reason : null);
    } catch (thrown) {
      setError(`撤銷時發生未預期的錯誤，請重新整理頁面後再試一次。${thrown instanceof Error ? `（${thrown.message}）` : ''}`);
    }
  };

  const statusLabel = group.status === 'matched' ? '已正式記帳' : group.everConfirmed ? '待重新確認' : '待確認';

  return <li className="fx-confirmation-group">
    <div className="fx-confirmation-group-header">
      <strong>本次換匯</strong>
      <span className={`fx-confirmation-status fx-confirmation-status-${group.status}`}>{statusLabel}</span>
    </div>
    <dl className="fx-confirmation-group-details">
      <div><dt>換出</dt><dd>{sourceLabel}</dd></div>
      <div><dt>換入</dt><dd>{destinationLabel}</dd></div>
      <div><dt>日期</dt><dd>{group.effectiveDate}</dd></div>
      <div><dt>匯率</dt><dd>{group.executedRate !== undefined ? `1 USD ≈ ${group.executedRate.toFixed(4)} TWD` : '無法取得'}</dd></div>
      <FeeRow group={group} />
    </dl>
    <p className="note fx-confirmation-atomic-note">{ATOMIC_SAFETY_NOTE}</p>
    {error && <p className="warning-message" role="alert">{error}</p>}
    {group.status === 'candidate'
      ? <button type="button" className="small fx-confirmation-confirm-button" onClick={handleConfirm}>確認正式記帳</button>
      : <button type="button" className="small danger fx-confirmation-void-button" onClick={handleVoid}>撤銷整筆換匯</button>}
  </li>;
}

export default function FxConfirmationCard({ groups, accounts, onConfirm, onVoid }: {
  groups: readonly FxConfirmationGroupPresentation[];
  accounts: readonly { id: string; name: string }[];
  onConfirm: (conversionId: string) => FxConfirmOutcome;
  onVoid: (eventId: string) => FxVoidOutcome;
}) {
  if (!groups.length) return null;
  return <section className="fx-confirmation-card" aria-label="換匯確認">
    <strong>待確認／已確認換匯</strong>
    <ul className="fx-confirmation-group-list">
      {groups.map(group => <GroupRow key={group.conversionId} group={group} accounts={accounts} onConfirm={onConfirm} onVoid={onVoid} />)}
    </ul>
  </section>;
}
