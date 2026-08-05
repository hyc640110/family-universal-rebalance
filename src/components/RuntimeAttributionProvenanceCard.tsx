import {
  formatRuntimeAttributionMoney,
  RUNTIME_ATTRIBUTION_RECONCILED_DISCLAIMER,
  type RuntimeAttributionPresentation
} from '../lib/runtimeAttributionPresentation';
import type { NetWorthAttributionQuality } from '../lib/netWorthAttribution';

const qualityLabel: Record<NetWorthAttributionQuality, string> = {
  unavailable: '資料不足',
  'snapshot-only': '僅有快照差額，尚無可歸因事件',
  partial: '部分歸因',
  reconciled: '已對齊（在容許誤差內）'
};

const provenanceLabel = { ledger: '「Ledger」已確認證據', 'derived-transaction': '「衍生」證據（尚未經 Ledger 確認）' } as const;

export default function RuntimeAttributionProvenanceCard({ presentation }: { presentation: RuntimeAttributionPresentation }) {
  const { period, quality, reconciled, netWorthChange, ledgerContribution, derivedContribution, unexplainedResidual, zeroContributionItems, fxExcludedItems } = presentation;

  return <section className="runtime-attribution-card" aria-label="淨值成長來源歸因">
    <header className="runtime-attribution-heading">
      <div>
        <p className="eyebrow">唯讀｜UR-TODO-046-C3C-A</p>
        <h2>淨值成長來源歸因</h2>
        <p>比較最新兩筆淨資產快照，拆解 Ledger 已確認證據、衍生證據與未解釋殘差；本卡片不提供任何確認或編輯操作。</p>
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

    {zeroContributionItems.length > 0 && <aside className="runtime-attribution-zero-contribution">
      <strong>0 貢獻項目（僅供參考，不影響歸因）</strong>
      <ul>{zeroContributionItems.map(item => <li key={`${item.provenance}-${item.id}`}><span className={`runtime-attribution-tag ${item.provenance === 'ledger' ? 'ledger' : 'derived'}`}>{provenanceLabel[item.provenance]}</span><span>{item.label}</span></li>)}</ul>
    </aside>}

    {fxExcludedItems.length > 0 && <aside className="runtime-attribution-fx-excluded">
      <strong>非 TWD 排除項目</strong>
      <ul>{fxExcludedItems.map(item => <li key={`${item.provenance}-${item.id}`}><span className={`runtime-attribution-tag ${item.provenance === 'ledger' ? 'ledger' : 'derived'}`}>{provenanceLabel[item.provenance]}</span><span>{item.reason}</span></li>)}</ul>
    </aside>}
  </section>;
}
