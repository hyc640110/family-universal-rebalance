import { useState } from 'react';
import {
  formatRuntimeAttributionItemContribution,
  formatRuntimeAttributionMoney,
  RUNTIME_ATTRIBUTION_RECONCILED_DISCLAIMER,
  type RuntimeAttributionEvidenceItem,
  type RuntimeAttributionPresentation
} from '../lib/runtimeAttributionPresentation';
import type { NetWorthAttributionQuality } from '../lib/netWorthAttribution';
import { toggleRuntimeAttributionMark } from '../lib/runtimeAttributionSessionMarks';

/** UR-TODO-046-C3C-C: the confirm callback either succeeds (row is appended to state.financialEvents by the caller) or explicitly rejects with a human-readable reason — there is no silent failure. */
export type RuntimeAttributionConfirmOutcome = { rejected: false; eventId: string } | { rejected: true; reason: string };
/** UR-TODO-046 void: same shape as the confirm outcome, kept as a distinct named type for call-site clarity. */
export type RuntimeAttributionVoidOutcome = { rejected: false } | { rejected: true; reason: string };

type ConfirmedReceipt = { id: string; eventId: string; note: string; contribution: number | null };

/**
 * DRAFT WORDING — pending user review (see UR-TODO-046-C3C-C dev instructions:
 * "不得自行決定「確認並正式記帳」按鈕的最終文案，需提出草案供使用者審查後才能定案").
 * Do not treat these strings as final; they exist so the feature is reviewable
 * end-to-end in this Draft PR.
 */
const CONFIRM_BUTTON_LABEL = '確認並正式記帳';
const CONFIRM_DIALOG_TEXT = (note: string) =>
  `即將把「${note}」正式寫入記帳 Ledger。\n\n這是正式記帳動作，且與上方「標示為合理」的隨手標記不同：\n・重新整理頁面後不會消失\n・會被記入下次「淨值成長來源歸因」的計算\n・如需撤銷，可於下方「本次已正式記帳」清單按「撤銷」（僅限本次瀏覽期間可操作，重新整理頁面後即無法再由此撤銷）\n\n確定要正式記帳嗎？`;
const CONFIRMED_RECEIPT_LABEL = '已記帳';
/**
 * DRAFT WORDING — pending user review, same convention as CONFIRM_DIALOG_TEXT above.
 */
const VOID_BUTTON_LABEL = '撤銷';
const VOID_DIALOG_TEXT = (note: string) =>
  `即將撤銷「${note}」這筆記帳。\n\n這是不可逆的動作：\n・原始記帳事件不會被刪除，但會被標記為已作廢\n・不會再計入下次「淨值成長來源歸因」的 Ledger 貢獻\n・本次撤銷動作本身不提供復原\n\n確定要撤銷嗎？`;

const qualityLabel: Record<NetWorthAttributionQuality, string> = {
  unavailable: '資料不足',
  'snapshot-only': '僅有快照差額，尚無可歸因事件',
  partial: '部分歸因',
  reconciled: '已對齊（在容許誤差內）'
};

const provenanceLabel = { ledger: '「Ledger」已確認證據', 'derived-transaction': '「衍生」證據（尚未經 Ledger 確認）' } as const;

function EvidenceItemRow({ item }: { item: RuntimeAttributionEvidenceItem }) {
  return <li>
    <span className={`runtime-attribution-tag ${item.provenance === 'ledger' ? 'ledger' : 'derived'}`}>{provenanceLabel[item.provenance]}</span>
    <span>{item.note}</span>
  </li>;
}

/**
 * C3C-B: component-local, session-only "mark as reasonable" toggle per derived
 * evidence row. It never leaves this component's React state — no App.tsx
 * state, no localStorage/Firebase/JSON Backup, no network call, and it never
 * changes reconciliation/attribution inputs or output. A page reload always
 * resets it, by construction (there is nowhere it could be read back from).
 */
export default function RuntimeAttributionProvenanceCard({ presentation, onConfirmEvidence, onVoidEvent }: {
  presentation: RuntimeAttributionPresentation;
  /** Absent in read-only contexts (e.g. characterization tests) — the confirm button only renders when this is provided. */
  onConfirmEvidence?: (item: RuntimeAttributionEvidenceItem) => RuntimeAttributionConfirmOutcome;
  /** Absent in read-only contexts — the void button on a "本次已正式記帳" receipt only renders when this is provided. */
  onVoidEvent?: (eventId: string) => RuntimeAttributionVoidOutcome;
}) {
  const { period, quality, reconciled, netWorthChange, ledgerContribution, derivedContribution, unexplainedResidual, derivedEvidenceItems, zeroContributionItems, fxExcludedItems } = presentation;
  const [markedIds, setMarkedIds] = useState<ReadonlySet<string>>(new Set());
  const toggleMarked = (id: string) => setMarkedIds(current => toggleRuntimeAttributionMark(current, id));
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [voidError, setVoidError] = useState<string | null>(null);
  /**
   * Session-local "receipt" list, captured at confirm time. Once a row is
   * confirmed, the next recompute reclassifies its transaction as matched by
   * the C1 Ledger and it naturally drops out of derivedEvidenceItems — this
   * list is what lets the card still show an explicit "已記帳" acknowledgement
   * for it instead of the row silently vanishing. It is not persisted and
   * resets on reload, same as everything else in this component. This is also
   * the only place a "撤銷" button can appear — voiding an event confirmed in
   * an earlier session requires no UI surface anywhere in the app today.
   */
  const [confirmedReceipts, setConfirmedReceipts] = useState<ConfirmedReceipt[]>([]);

  const handleConfirm = (item: RuntimeAttributionEvidenceItem) => {
    if (!onConfirmEvidence || !item.type) return;
    if (!window.confirm(CONFIRM_DIALOG_TEXT(item.note))) return;
    const outcome = onConfirmEvidence(item);
    if (outcome.rejected) { setConfirmError(outcome.reason); return; }
    setConfirmError(null);
    setConfirmedReceipts(current => [...current, { id: item.id, eventId: outcome.eventId, note: item.note, contribution: item.contribution }]);
  };

  /**
   * UR-TODO-046 void: voiding a receipt just removes it from this session-local
   * list — the underlying transaction naturally becomes a candidate again on
   * the next recompute and reappears in derivedEvidenceItems if still
   * eligible, exactly mirroring how confirming makes a row leave that list.
   */
  const handleVoid = (receipt: ConfirmedReceipt) => {
    if (!onVoidEvent) return;
    if (!window.confirm(VOID_DIALOG_TEXT(receipt.note))) return;
    const outcome = onVoidEvent(receipt.eventId);
    if (outcome.rejected) { setVoidError(outcome.reason); return; }
    setVoidError(null);
    setConfirmedReceipts(current => current.filter(item => item.eventId !== receipt.eventId));
  };

  return <section className="runtime-attribution-card" aria-label="淨值成長來源歸因">
    <header className="runtime-attribution-heading">
      <div>
        <p className="eyebrow">UR-TODO-046-C3C-A／B／C</p>
        <h2>淨值成長來源歸因</h2>
        <p>比較最新兩筆淨資產快照，拆解 Ledger 已確認證據、衍生證據與未解釋殘差；本卡片可對衍生證據逐筆「確認並正式記帳」，並可對本次確認過的記帳按「撤銷」（僅限本次瀏覽期間可操作）；不提供編輯或刪除操作。</p>
      </div>
      <strong className={`runtime-attribution-quality ${quality}`}>{qualityLabel[quality]}</strong>
    </header>

    {period.isZeroLengthPeriod
      ? <p className="runtime-attribution-period-note" role="status">當日無比較區間（{period.openingDate}）</p>
      : !period.hasComparablePeriod
        ? <p className="runtime-attribution-period-note" role="status">資料不足，尚無兩筆可比較的淨資產快照</p>
        : <p className="runtime-attribution-period-note">比較區間：{period.openingDate} → {period.closingDate}</p>}

    <div className="runtime-attribution-grid">
      <article>
        <small>淨值變動</small>
        <strong>{formatRuntimeAttributionMoney(netWorthChange)}</strong>
      </article>
      <article>
        <span className="runtime-attribution-tag ledger">{provenanceLabel.ledger}</span>
        <small>Ledger 貢獻</small>
        <strong>{formatRuntimeAttributionMoney(ledgerContribution)}</strong>
      </article>
      <article>
        <span className="runtime-attribution-tag derived">{provenanceLabel['derived-transaction']}</span>
        <small>衍生貢獻</small>
        <strong>{formatRuntimeAttributionMoney(derivedContribution)}</strong>
      </article>
      <article>
        <span className="runtime-attribution-tag residual">未解釋殘差</span>
        <small>未解釋殘差</small>
        <strong>{formatRuntimeAttributionMoney(unexplainedResidual)}</strong>
      </article>
    </div>

    {reconciled && <p className="runtime-attribution-reconciled-note" role="alert">{RUNTIME_ATTRIBUTION_RECONCILED_DISCLAIMER}</p>}

    {derivedEvidenceItems.length > 0 && <aside className="runtime-attribution-derived-evidence">
      <strong>衍生證據逐筆清單</strong>
      <p className="runtime-attribution-derived-evidence-note">以下為系統依現有交易記錄推測的衍生貢獻，尚未經正式記帳確認。標示僅供您本次瀏覽時參考，重新整理頁面後會清除，不會寫入任何記帳紀錄，也不會影響下一次計算。</p>
      <ul>{derivedEvidenceItems.map(item => {
        const marked = markedIds.has(item.id);
        return <li key={`${item.provenance}-${item.id}`} className="runtime-attribution-derived-evidence-item">
          <span className={`runtime-attribution-tag ${item.provenance === 'ledger' ? 'ledger' : 'derived'}`}>{provenanceLabel[item.provenance]}</span>
          <span>{item.note}</span>
          <strong>{formatRuntimeAttributionItemContribution(item)}</strong>
          <button
            type="button"
            role="switch"
            aria-checked={marked}
            className={`runtime-attribution-mark-toggle${marked ? ' active' : ''}`}
            onClick={() => toggleMarked(item.id)}
          >{marked ? '已標示｜我目前認為合理' : '標示為合理'}</button>
          {onConfirmEvidence && <button
            type="button"
            className="runtime-attribution-confirm-button"
            onClick={() => handleConfirm(item)}
          >{CONFIRM_BUTTON_LABEL}</button>}
        </li>;
      })}</ul>
    </aside>}

    {confirmError && <p className="runtime-attribution-confirm-error" role="alert">{confirmError}</p>}

    {confirmedReceipts.length > 0 && <aside className="runtime-attribution-derived-evidence">
      <strong>本次已正式記帳</strong>
      <p className="runtime-attribution-derived-evidence-note">以下項目已於本次操作正式寫入記帳 Ledger，會被下一次「淨值成長來源歸因」計算為 Ledger 貢獻（因此已不再出現在上方「衍生證據」清單中）；此區塊本身仍只是本次瀏覽的畫面提示，重新整理後會清空，但記帳本身不會消失。如需撤銷，請按下方「撤銷」按鈕（僅限本次瀏覽期間可操作）。</p>
      {voidError && <p className="runtime-attribution-confirm-error" role="alert">{voidError}</p>}
      <ul>{confirmedReceipts.map(receipt => <li key={receipt.id} className="runtime-attribution-derived-evidence-item">
        <span className="runtime-attribution-tag ledger">{CONFIRMED_RECEIPT_LABEL}</span>
        <span>{receipt.note}</span>
        <strong>{formatRuntimeAttributionItemContribution({ id: receipt.id, provenance: 'ledger', contribution: receipt.contribution, note: receipt.note })}</strong>
        <button type="button" className="runtime-attribution-confirm-button confirmed" disabled>{CONFIRMED_RECEIPT_LABEL}</button>
        {onVoidEvent && <button type="button" className="runtime-attribution-void-button" onClick={() => handleVoid(receipt)}>{VOID_BUTTON_LABEL}</button>}
      </li>)}</ul>
    </aside>}

    {zeroContributionItems.length > 0 && <aside className="runtime-attribution-zero-contribution">
      <strong>0 貢獻項目（僅供參考，不影響歸因）</strong>
      <ul>{zeroContributionItems.map(item => <EvidenceItemRow key={`${item.provenance}-${item.id}`} item={item} />)}</ul>
    </aside>}

    {fxExcludedItems.length > 0 && <aside className="runtime-attribution-fx-excluded">
      <strong>非 TWD 排除項目</strong>
      <ul>{fxExcludedItems.map(item => <EvidenceItemRow key={`${item.provenance}-${item.id}`} item={item} />)}</ul>
    </aside>}
  </section>;
}
