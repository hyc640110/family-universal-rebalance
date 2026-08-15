import { useState } from 'react';
import type { FxConversionPresentation } from '../../lib/fxConversionPresentation';

/**
 * UR-TODO-054-B: the sole UI surface for confirming, voiding, and reconfirming an FX conversion.
 * Always renders and operates on a whole `conversionId` — mirrors LoanConfirmationCard.tsx's
 * dialog/error-handling conventions, but there is no "atomic group of components" concept here:
 * an FX conversion is always exactly one FinancialEvent (see fxConversionPresentation.ts), so
 * unlike Loan there is no per-component vs whole-group distinction to explain to the user.
 */

export type FxConfirmOutcome = { rejected: false } | { rejected: true; reason: string };
export type FxVoidOutcome = { rejected: false } | { rejected: true; reason: string };

const CURRENCY_LABEL: Record<FxConversionPresentation['sourceCurrency'], string> = { TWD: '新台幣', USD: '美元' };

function money(amount: number, currency: FxConversionPresentation['sourceCurrency']): string {
  return `${amount.toLocaleString('zh-TW')} ${currency}`;
}

function conversionLabel(item: FxConversionPresentation): string {
  return `${money(item.sourceAmount, item.sourceCurrency)} → ${money(item.destinationAmount, item.destinationCurrency)}`;
}

const CONFIRM_DIALOG_TEXT = (label: string) =>
  `即將把「${label}」這筆換匯正式寫入記帳 Ledger。\n\n這是正式記帳動作：\n・重新整理頁面後不會消失\n・會被記入下次「淨值成長來源歸因」的計算\n・如需撤銷，可於下方按「撤銷」（會讓這筆換匯回到待確認狀態）\n\n確定要正式記帳嗎？`;

const VOID_DIALOG_TEXT = (label: string) =>
  `即將撤銷「${label}」這筆換匯的正式記帳。\n\n這是不可逆的動作：\n・原始記帳事件不會被刪除，但會被標記為已作廢\n・不會再計入下次「淨值成長來源歸因」的 Ledger 貢獻\n・如需恢復，須重新確認這筆換匯（會建立全新的確認紀錄）\n\n確定要撤銷嗎？`;

function ConversionRow({ item, onConfirm, onVoid }: {
  item: FxConversionPresentation;
  onConfirm: (conversionId: string) => FxConfirmOutcome;
  onVoid: (eventId: string) => FxVoidOutcome;
}) {
  const [error, setError] = useState<string | null>(null);
  const label = conversionLabel(item);

  const handleConfirm = () => {
    if (!window.confirm(CONFIRM_DIALOG_TEXT(label))) return;
    // Defense-in-depth: mirrors LoanConfirmationCard.tsx's GroupRow — a click here must never be
    // able to produce zero visible effect regardless of what onConfirm does internally now or in
    // the future, since an uncaught throw from a click handler is invisible to the user (no Error
    // Boundary covers event handlers).
    try {
      const outcome = onConfirm(item.conversionId);
      setError(outcome.rejected ? outcome.reason : null);
    } catch (thrown) {
      setError(`確認時發生未預期的錯誤，請重新整理頁面後再試一次。${thrown instanceof Error ? `（${thrown.message}）` : ''}`);
    }
  };

  const handleVoid = () => {
    if (!item.voidTargetEventId) { setError('目前找不到可撤銷的記帳事件，請重新整理後再試一次。'); return; }
    if (!window.confirm(VOID_DIALOG_TEXT(label))) return;
    // Defense-in-depth, symmetric with handleConfirm above.
    try {
      const outcome = onVoid(item.voidTargetEventId);
      setError(outcome.rejected ? outcome.reason : null);
    } catch (thrown) {
      setError(`撤銷時發生未預期的錯誤，請重新整理頁面後再試一次。${thrown instanceof Error ? `（${thrown.message}）` : ''}`);
    }
  };

  const statusLabel = item.status === 'matched' ? '已正式記帳' : item.everConfirmed ? '待重新確認' : '待確認';

  return <li className="fx-confirmation-item">
    <div className="fx-confirmation-item-header">
      <strong>換匯</strong>
      <span className={`fx-confirmation-status fx-confirmation-status-${item.status}`}>{statusLabel}</span>
    </div>
    <dl className="fx-confirmation-item-details">
      <div><dt>賣出</dt><dd>{CURRENCY_LABEL[item.sourceCurrency]}｜{money(item.sourceAmount, item.sourceCurrency)}</dd></div>
      <div><dt>買入</dt><dd>{CURRENCY_LABEL[item.destinationCurrency]}｜{money(item.destinationAmount, item.destinationCurrency)}</dd></div>
      <div><dt>日期</dt><dd>{item.effectiveDate}</dd></div>
    </dl>
    {error && <p className="warning-message" role="alert">{error}</p>}
    {item.status === 'candidate'
      ? <button type="button" className="small fx-confirmation-confirm-button" onClick={handleConfirm}>確認正式記帳</button>
      : <button type="button" className="small danger fx-confirmation-void-button" onClick={handleVoid}>撤銷</button>}
  </li>;
}

export default function FxConfirmationCard({ items, onConfirm, onVoid }: {
  items: readonly FxConversionPresentation[];
  onConfirm: (conversionId: string) => FxConfirmOutcome;
  onVoid: (eventId: string) => FxVoidOutcome;
}) {
  if (!items.length) return null;
  return <section className="fx-confirmation-card" aria-label="換匯確認">
    <strong>待確認／已確認換匯</strong>
    <ul className="fx-confirmation-item-list">
      {items.map(item => <ConversionRow key={item.conversionId} item={item} onConfirm={onConfirm} onVoid={onVoid} />)}
    </ul>
  </section>;
}
