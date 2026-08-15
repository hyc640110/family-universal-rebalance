import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';
import { SYMBOL_NAMES } from '../lib/rebalanceOrderHelper';
import { yuanToWan } from '../lib/cashFlow';
import {
  deriveSmartRebalance, deriveDumbRebalance, deriveRatioRebalance, deriveBetaExposure,
  validateStrategyComparisonInput, VALIDATION_ERROR_MESSAGES, DEFAULT_UP_BALANCE_PCT, DEFAULT_DOWN_BALANCE_AMOUNT,
  STRATEGY_ASSET_SYMBOLS, type StrategyComparisonAssets, type SmartRebalanceInput, type StrategyAdjustment, type StrategyAssetSymbol
} from '../lib/rebalanceStrategyComparison';

// UR-TODO-058: standalone what-if simulator (source: user-supplied Excel
// EP04-02-大道至簡投資法-資產配置與再平衡). Every number on this page is a session-only, user-typed
// hypothetical — it never reads AppState/Holding/quotes and never writes anywhere. Deliberately
// visually and terminologically distinct from /tools/rebalance-recommendation (a real decision
// tool): no eligibility badges, no ClecRuleSummaryCard-style formal language, and the three
// strategies are never ranked or color-coded as "best" — this is a comparison, not a recommendation.

const safeNumber = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; };
// UR-TODO-058 follow-up: reuses cashFlow.ts's ×10000 convention (same as wanToYuan) for the
// input-side conversion, but — unlike wanToYuan, which coerces a negative typed value straight to
// null — lets a negative number survive the parse so this page's own validateStrategyComparisonInput()
// can flag it with its specific message, instead of the value silently vanishing to null/blank.
// The display side reuses cashFlow.ts's yuanToWan() directly, unmodified.
const wanInputToYuan = (value: string) => safeNumber(value) * 10000;
const money = (value: number) => `${(Math.abs(value) / 10000).toLocaleString('zh-TW', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 萬元`;
const signedMoney = (value: number) => `${value > 0 ? '+' : value < 0 ? '-' : ''}${money(value)}`;
const actionLabel = (action: StrategyAdjustment['action']) => action === 'buy' ? '理論買進' : action === 'sell' ? '理論賣出' : '不需操作';

const DEFAULT_ASSETS: StrategyComparisonAssets = {
  '0050': { currentValue: 400_000, targetWeightPct: 40, leverageMultiplier: 1 },
  '00631L': { currentValue: 380_000, targetWeightPct: 38, leverageMultiplier: 2 },
  '00865B': { currentValue: 220_000, targetWeightPct: 22, leverageMultiplier: 0 }
};

const DEFAULT_SMART: SmartRebalanceInput = {
  initialValue00631L: 300_000, periodContribution00631L: 0,
  upBalancePct: DEFAULT_UP_BALANCE_PCT, downBalanceAmount: DEFAULT_DOWN_BALANCE_AMOUNT
};

function StrategyResultCard({ title, note, adjustments, extra }: { title: string; note: string; adjustments: StrategyAdjustment[]; extra?: React.ReactNode }) {
  return <article className="strategy-comparison-card">
    <header><h3>{title}</h3><span className="strategy-comparison-badge">比較用，非系統推薦</span></header>
    <p className="note">{note}</p>
    {extra}
    <div className="strategy-comparison-rows">{adjustments.map(row => <div key={row.symbol} className="strategy-comparison-row">
      <span className="strategy-comparison-symbol">{row.symbol}<small>{SYMBOL_NAMES[row.symbol] || row.symbol}</small></span>
      <span className={`strategy-comparison-action strategy-comparison-action-${row.action}`}>{actionLabel(row.action)}</span>
      <span className="strategy-comparison-amount">{row.action === 'hold' ? '—' : signedMoney(row.amount)}</span>
    </div>)}</div>
  </article>;
}

export default function RebalanceStrategyComparisonPage() {
  const [assets, setAssets] = useState<StrategyComparisonAssets>(DEFAULT_ASSETS);
  const [smart, setSmart] = useState<SmartRebalanceInput>(DEFAULT_SMART);
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [periodEndDate, setPeriodEndDate] = useState('');

  const updateAsset = (symbol: StrategyAssetSymbol, key: keyof StrategyComparisonAssets[StrategyAssetSymbol], value: string) => {
    setAssets(current => ({ ...current, [symbol]: { ...current[symbol], [key]: safeNumber(value) } }));
  };
  const updateAssetMoney = (symbol: StrategyAssetSymbol, value: string) => {
    setAssets(current => ({ ...current, [symbol]: { ...current[symbol], currentValue: wanInputToYuan(value) } }));
  };
  const updateSmart = (key: keyof SmartRebalanceInput, value: string) => setSmart(current => ({ ...current, [key]: safeNumber(value) }));
  const updateSmartMoney = (key: 'initialValue00631L' | 'periodContribution00631L' | 'downBalanceAmount', value: string) =>
    setSmart(current => ({ ...current, [key]: wanInputToYuan(value) }));

  const errors = validateStrategyComparisonInput({ assets, smart, periodStartDate: periodStartDate || undefined, periodEndDate: periodEndDate || undefined });
  const canShowResults = errors.length === 0;
  const smartResult = canShowResults ? deriveSmartRebalance(assets, smart) : null;
  const dumbResult = canShowResults ? deriveDumbRebalance(assets) : null;
  const ratioResult = canShowResults ? deriveRatioRebalance(assets) : null;
  const beta = canShowResults ? deriveBetaExposure(assets) : null;

  return <PageFrame page="tools" title="三策略再平衡模擬比較" description="純比較工具，不是投資建議。依使用者提供的假設情境，並列比較三種再平衡策略的理論計算結果，供自行比對參考。">
    <section className="card simulator-notice"><strong>純模擬比較</strong><span>以下所有數字皆為你手動輸入的假設值，不讀取正式持股或帳戶資料；結果不會自動套用，不會修改正式持股、目標配置，也不會影響「再平衡建議中心」的任何輸出。想看真實再平衡建議，請至<Link to="/tools/rebalance-recommendation">再平衡建議中心</Link>。</span></section>

    <section className="card">
      <h2>假設情境：目前市值與目標權重</h2>
      <p className="note">請輸入每檔資產的假設市值、目標權重（%）與 Beta 曝險用槓桿倍數假設值（例如 0050→1、00631L→2、00865B→0）。</p>
      <div className="sim-editor-list">{STRATEGY_ASSET_SYMBOLS.map(symbol => <article key={symbol} className="sim-editor-row strategy-comparison-input-row">
        <div><strong>{symbol}</strong><span>{SYMBOL_NAMES[symbol] || symbol}</span></div>
        <label>目前市值（萬元）<input type="number" min="0" step="0.1" inputMode="decimal" aria-label={`${symbol} 目前市值（萬元）`} value={yuanToWan(assets[symbol].currentValue)} onChange={event => updateAssetMoney(symbol, event.currentTarget.value)} /></label>
        <label>目標權重 %<input type="number" min="0" step="0.1" inputMode="decimal" aria-label={`${symbol} 目標權重`} value={assets[symbol].targetWeightPct} onChange={event => updateAsset(symbol, 'targetWeightPct', event.currentTarget.value)} /></label>
        <label>槓桿倍數（Beta 用）<input type="number" step="0.1" inputMode="decimal" aria-label={`${symbol} 槓桿倍數`} value={assets[symbol].leverageMultiplier} onChange={event => updateAsset(symbol, 'leverageMultiplier', event.currentTarget.value)} /></label>
      </article>)}</div>
    </section>

    <section className="card">
      <h2>假設情境：聰明再平衡專用輸入（僅影響 00631L／00865B）</h2>
      <p className="note">期間漲跌 = 目前市值(00631L) − 期初市值 − 期間買進金額；期間開始／結束日期僅供你自己標記情境，不參與計算。</p>
      <div className="strategy-comparison-smart-inputs">
        <label>00631L 期初市值（萬元）<input type="number" min="0" step="0.1" inputMode="decimal" value={yuanToWan(smart.initialValue00631L)} onChange={event => updateSmartMoney('initialValue00631L', event.currentTarget.value)} /></label>
        <label>00631L 期間買進金額（萬元）<input type="number" min="0" step="0.1" inputMode="decimal" value={yuanToWan(smart.periodContribution00631L)} onChange={event => updateSmartMoney('periodContribution00631L', event.currentTarget.value)} /></label>
        <label>上漲平衡 %<input type="number" min="0" max="100" step="1" inputMode="decimal" value={smart.upBalancePct} onChange={event => updateSmart('upBalancePct', event.currentTarget.value)} /></label>
        <label>下跌平衡金（萬元）<input type="number" min="0" step="0.1" inputMode="decimal" value={yuanToWan(smart.downBalanceAmount)} onChange={event => updateSmartMoney('downBalanceAmount', event.currentTarget.value)} /><small>示意值，非正式建議金額，請依你的情境調整。</small></label>
        <label>期間開始日期（選填）<input type="date" value={periodStartDate} onChange={event => setPeriodStartDate(event.currentTarget.value)} /></label>
        <label>期間結束日期（選填）<input type="date" value={periodEndDate} onChange={event => setPeriodEndDate(event.currentTarget.value)} /></label>
      </div>
    </section>

    {errors.length > 0 && <div className="warning-message" role="alert"><strong>請先修正以下假設值：</strong><ul>{errors.map(error => <li key={error}>{VALIDATION_ERROR_MESSAGES[error]}</li>)}</ul></div>}

    {canShowResults && smartResult && dumbResult && ratioResult && <>
      <section className="strategy-comparison-grid">
        <StrategyResultCard
          title="聰明再平衡" note="依期間漲跌動態決定調整金額；0050 不受影響。並列比較用，非系統推薦。"
          adjustments={smartResult.adjustments}
          extra={<p className="strategy-comparison-detail">期間漲跌：<b className={smartResult.periodChange > 0 ? 'good' : smartResult.periodChange < 0 ? 'bad' : ''}>{signedMoney(smartResult.periodChange)}</b>（{smartResult.branch === 'up' ? '賺錢，賣出 00631L 轉入 00865B' : '賠錢或持平，用固定下跌平衡金從 00865B 轉入 00631L'}）</p>}
        />
        <StrategyResultCard title="無腦再平衡" note="只在 00631L／00865B 之間，依兩者目標權重互相調整；0050 不受影響。並列比較用，非系統推薦。" adjustments={dumbResult.adjustments} />
        <StrategyResultCard title="比率再平衡" note="三檔資產全部依目標權重收斂。並列比較用，非系統推薦。" adjustments={ratioResult.adjustments} />
      </section>
      {beta && <section className="card">
        <h2>Beta 曝險（模擬）</h2>
        <p className="note">依上方槓桿倍數假設值計算；純顯示，不影響任何正式指標或建議。</p>
        <div className="sim-summary-grid">
          <article><small>目前 Beta（依目前市值）</small><strong>{beta.currentBeta.toFixed(2)}</strong></article>
          <article><small>目標 Beta（依目標權重）</small><strong>{beta.targetBeta.toFixed(2)}</strong></article>
          <article><small>假設總市值</small><strong>{money(beta.totalValue)}</strong></article>
        </div>
      </section>}
    </>}

    <ToolQuickNavigation current="investment-backtest" />
  </PageFrame>;
}
