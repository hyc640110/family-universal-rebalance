import type { DefensiveConfigurationPresentation, DefensiveConfigurationPresentationValue } from '../lib/defensiveConfigurationPresentation';
import type { HouseholdLiquidityDiagnosticPresentation } from '../lib/householdLiquidityDiagnosticPresentation';
import HouseholdLiquidityDiagnosticList from './HouseholdLiquidityDiagnosticList';

type Props = {
  presentation: DefensiveConfigurationPresentation;
  diagnostics: HouseholdLiquidityDiagnosticPresentation;
};

const money = (value: DefensiveConfigurationPresentationValue) => value.status === 'known' && value.value !== null
  ? new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(value.value)
  : '資料不足';

const percent = (value: DefensiveConfigurationPresentationValue) => value.status === 'known' && value.value !== null
  ? `${value.value.toFixed(1)}%`
  : '資料不足';

const methodLabel = (method: DefensiveConfigurationPresentation['execution']['method']) => {
  if (method === 'buy-only') return '只買不賣';
  if (method === 'standard') return '標準再平衡';
  return '資料不足';
};

export default function DefensiveConfigurationStatusCard({ presentation, diagnostics }: Props) {
  const { execution, theory } = presentation;

  return <section className="defensive-configuration-card" aria-label="防守配置狀態">
    <header className="defensive-configuration-heading">
      <div>
        <p className="eyebrow">資產配置與流動性摘要</p>
        <h2>防守配置狀態</h2>
        <p>防守總比例包含現金與防守型持股；安全現金與可投資現金依既有 Household Liquidity 結果顯示。</p>
      </div>
      <strong className={`defensive-configuration-execution ${execution.status}`}>{execution.status === 'available' ? '可執行' : execution.status === 'blocked' ? '暫不建議執行' : '資料不足'}</strong>
    </header>

    <div className="defensive-configuration-grid">
      <article><small>防守總比例（含現金與防守型持股）</small><strong>{percent(presentation.defensiveTotalRatio)}</strong></article>
      <article><small>受保護安全現金</small><strong>{money(presentation.protectedSafetyCash)}</strong></article>
      <article><small>防守型持股比例</small><strong>{percent(presentation.defensiveHoldingsRatio)}</strong></article>
      <article><small>可投資現金</small><strong>{money(presentation.investableCash)}</strong></article>
      <article><small>理論缺口</small><strong>{money(theory.defensiveConfigurationShortfall)}</strong>{theory.defensiveConfigurationShortfall.status === 'unavailable' && <span>尚無既有權威來源，暫不推算</span>}</article>
      <article><small>安全現金缺口</small><strong>{money(theory.safetyCashShortfall)}</strong></article>
    </div>

    <div className="defensive-configuration-execution-detail">
      <p><span>可執行方式</span><strong>{methodLabel(execution.method)}</strong></p>
      <p><span>執行狀態</span><strong>{execution.status === 'available' ? '可依既有條件執行' : execution.status === 'blocked' ? '受阻擋原因限制' : '資料不足，暫不提供可執行結論'}</strong></p>
    </div>

    {execution.blockingReasons.length > 0 && <aside className="defensive-configuration-blocking" role="alert">
      <strong>阻擋原因</strong>
      <ul>{execution.blockingReasons.map(reason => <li key={reason.code}><b>{reason.code}</b><span>{reason.message}</span></li>)}</ul>
    </aside>}
    <HouseholdLiquidityDiagnosticList title="待補齊的家庭流動性資料" presentation={diagnostics} />
  </section>;
}
