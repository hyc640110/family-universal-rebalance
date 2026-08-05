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
export default function RuntimeAttributionProvenanceCard({ presentation }: { presentation: RuntimeAttributionPresentation }) {
  const { period, quality, reconciled, netWorthChange, ledgerContribution, derivedContribution, unexplainedResidual, derivedEvidenceItems, zeroContributionItems, fxExcludedItems } = presentation;
  const [markedIds, setMarkedIds] = useState<ReadonlySet<string>>(new Set());
  const toggleMarked = (id: string) => setMarkedIds(current => toggleRuntimeAttributionMark(current, id));

  return <section className="runtime-attribution-card" aria-label="淨值成長來源歸因">
    <header className="runtime-attribution-heading">
      <div>
        <p className="eyebrow">唯讀｜UR-TODO-046-C3C-A／B</p>
        <h2>淨值成長來源歸因</h2>
        <p>比較最新兩筆淨資產快照，拆解 Ledger 已確認證據、衍生證據與未解釋殘差；本卡片不提供任何記帳、編輯或刪除操作。</p>
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
        </li>;
      })}</ul>
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
