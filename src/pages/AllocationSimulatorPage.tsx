import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';
import AllocationContextNotice from '../components/AllocationContextNotice';
import { getAllocationContext } from '../lib/allocationContext';
import { deriveAllocationSimulatorFunding, type AllocationSimulatorFundingInput } from '../lib/allocationSimulatorFunding';
import { allocationPresetLabel, deriveAllocationPresetPreview, normalizeAllocationPreset, roleLabel, type AllocationPreset, type AllocationRole } from '../lib/allocationPresets';

type SimulatorRow = {
  symbol: string;
  name: string;
  assetClass: 'growth' | 'defensive';
  marketValue: number;
  targetWeight?: number;
  quote: { price: number; error?: string; source: string };
};

type FundingInput = Omit<AllocationSimulatorFundingInput, 'allowSafetyCashUsage'>;
type Props = { rows: SimulatorRow[]; totalAssets: number; cash: number; fundingInput: FundingInput };
type Action = '買進' | '賣出' | '不操作';

const MONEY_FLOOR = 1000;
const money = (value: number) => `${(Math.abs(Number.isFinite(value) ? value : 0) / 10000).toLocaleString('zh-TW', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 萬元`;
const signedMoney = (value: number) => `${value > 0 ? '+' : value < 0 ? '-' : ''}${money(value)}`;
const pct = (value: number) => `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;
const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const officialTarget = (row: SimulatorRow) => Math.max(0, safeNumber(row.targetWeight));
const colorFor = (symbol: string) => {
  const colors = ['#5b8def', '#58c7a5', '#f3b75f', '#d783c7', '#7ec8e3', '#a9c46c', '#e77c75'];
  if (symbol === 'CASH') return '#78a6f7';
  const hash = Array.from(symbol).reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7);
  return colors[hash % colors.length];
};

const fundingMessage = (reason: string) => ({
  TOTAL_LIQUID_CASH_UNAVAILABLE: '正式流動現金資料不足。',
  PROTECTED_SAFETY_CASH_UNAVAILABLE: '受保護安全現金資料不足。',
  EXTERNAL_CONTRIBUTION_UNAVAILABLE: '額外投入資金資料不足。',
  PLANNED_WITHDRAWAL_UNAVAILABLE: '預計提領資金資料不足。',
  CALCULATION_OVERFLOW: '模擬資金計算超出可安全處理範圍。',
  PLANNED_WITHDRAWAL_EXCEEDS_ALL_KNOWN_SOURCES: '預計提領超過所有已知可用來源，已阻擋交易呈現。',
  SAFETY_CASH_USAGE_ASSUMPTION: '此為模擬假設，不代表建議實際動用安全現金。',
  SIMULATION_FUNDING_DEPLETED_BY_WITHDRAWAL: '預計提領已耗盡可用模擬資金。'
}[reason] ?? reason);

function Donut({ title, items, total, centerLabel = '總資產', centerValue = money(total) }: { title: string; items: { symbol: string; name: string; value: number }[]; total: number; centerLabel?: string; centerValue?: string }) {
  const visibleItems = items.filter(item => item.value > 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = visibleItems.map(item => {
    const percent = total > 0 ? item.value / total * 100 : 0;
    const length = percent / 100 * circumference;
    const segment = { ...item, percent, dash: Math.max(0, length - 1.6), offset };
    offset += length;
    return segment;
  });
  return <section className="sim-chart" aria-label={title}>
    <h3>{title}</h3>
    {segments.length === 0 ? <p className="allocation-empty">尚無可顯示的配置資料。</p> : <div className="allocation-donut-layout">
      <div className="allocation-donut-wrap">
        <svg className="allocation-donut" viewBox="0 0 120 120" role="img" aria-label={`${title}甜甜圈圖`}>
          <circle className="allocation-track" cx="60" cy="60" r={radius} />
          <g transform="rotate(-90 60 60)">{segments.map(item => <circle key={item.symbol} className="allocation-segment" cx="60" cy="60" r={radius} stroke={colorFor(item.symbol)} strokeDasharray={`${item.dash} ${circumference - item.dash}`} strokeDashoffset={-item.offset}><title>{`${item.name} ${pct(item.percent)}`}</title></circle>)}</g>
        </svg>
        <div className="allocation-donut-center"><small>{centerLabel}</small><strong>{centerValue}</strong></div>
      </div>
      <div className="allocation-legend">{segments.map(item => <div className="allocation-legend-item" key={item.symbol}><i style={{ backgroundColor: colorFor(item.symbol) }} /><span><b>{item.symbol === 'CASH' ? '台幣現金' : item.symbol}</b><small>{item.symbol === 'CASH' ? '未配置現金' : item.name}</small></span><strong>{pct(item.percent)}</strong></div>)}</div>
    </div>}
  </section>;
}

export default function AllocationSimulatorPage({ rows, totalAssets, cash, fundingInput }: Props) {
  const [targets, setTargets] = useState<Record<string, string>>(() => Object.fromEntries(rows.map(row => [row.symbol, String(officialTarget(row))])));
  const [allowSafetyCashUsage, setAllowSafetyCashUsage] = useState(false);
  const resetTargets = () => setTargets(Object.fromEntries(rows.map(row => [row.symbol, String(officialTarget(row))])));
  // UR-TODO-048 phase C: template-only, session-local role picker. Never reads or writes the app's
  // formal allocation preset/role fields - it only feeds the pure deriveAllocationPresetPreview() selector below.
  const [templatePreset, setTemplatePreset] = useState<AllocationPreset>('clec-442');
  const [templateRoles, setTemplateRoles] = useState<Record<string, AllocationRole>>({});
  const templateHoldings = useMemo(() => rows.map(row => ({ symbol: row.symbol, name: row.name, targetWeight: officialTarget(row) })), [rows]);
  const templatePreview = useMemo(() => deriveAllocationPresetPreview({ preset: templatePreset, holdings: templateHoldings, roleBySymbol: templateRoles }), [templatePreset, templateHoldings, templateRoles]);
  const applyTemplatePreview = () => {
    if (!templatePreview.canApply) return;
    setTargets(current => ({ ...current, ...Object.fromEntries(templatePreview.rows.map(row => [row.symbol, String(row.nextWeight ?? 0)])) }));
  };
  const funding = useMemo(() => deriveAllocationSimulatorFunding({ ...fundingInput, allowSafetyCashUsage }), [fundingInput, allowSafetyCashUsage]);
  const canUseSafetyCashAssumption = !funding.isUnavailable && funding.usableProtectedSafetyCash !== null && funding.usableProtectedSafetyCash > 0;
  useEffect(() => {
    if (!canUseSafetyCashAssumption && allowSafetyCashUsage) setAllowSafetyCashUsage(false);
  }, [allowSafetyCashUsage, canUseSafetyCashAssumption]);
  const canShowSimulationAmounts = !funding.isUnavailable && funding.blockingReasons.length === 0;
  const simulatedTotal = !funding.isUnavailable && funding.externalContribution !== null && funding.plannedWithdrawal !== null
    ? Math.max(0, totalAssets + funding.externalContribution - funding.plannedWithdrawal)
    : null;
  const calculationTotal = simulatedTotal ?? 0;
  const result = useMemo(() => {
    const entries = rows.map(row => {
      const targetPercent = Math.max(0, safeNumber(targets[row.symbol]));
      const targetValue = calculationTotal * targetPercent / 100;
      const diff = targetValue - Math.max(0, safeNumber(row.marketValue));
      const hasValidPrice = !row.quote.error && !row.quote.source.includes('備援') && safeNumber(row.quote.price) > 0;
      const action: Action = Math.abs(diff) < MONEY_FLOOR ? '不操作' : diff > 0 ? '買進' : '賣出';
      return { ...row, targetPercent, targetValue, diff, action, hasValidPrice, estimatedShares: hasValidPrice ? Math.floor(Math.abs(diff) / row.quote.price) : null };
    });
    const targetTotal = entries.reduce((sum, row) => sum + row.targetPercent, 0);
    const isExact = Math.abs(targetTotal - 100) < 0.0001;
    const buyTotal = isExact && calculationTotal > 0 ? entries.filter(row => row.action === '買進').reduce((sum, row) => sum + row.diff, 0) : 0;
    const sellTotal = isExact && calculationTotal > 0 ? entries.filter(row => row.action === '賣出').reduce((sum, row) => sum + Math.abs(row.diff), 0) : 0;
    return { entries, targetTotal, isExact, buyTotal, sellTotal };
  }, [calculationTotal, rows, targets]);
  const targetStatus = result.isExact ? '合計正好 100%' : result.targetTotal < 100 ? `尚差 ${(100 - result.targetTotal).toFixed(2)} 個百分點` : `超出 ${(result.targetTotal - 100).toFixed(2)} 個百分點`;
  const currentChart = [...rows.map(row => ({ symbol: row.symbol, name: row.name || row.symbol, value: Math.max(0, row.marketValue) })), { symbol: 'CASH', name: '台幣現金', value: Math.max(0, cash) }];
  const targetChart = [...result.entries.map(row => ({ symbol: row.symbol, name: row.name || row.symbol, value: canShowSimulationAmounts ? row.targetValue : row.targetPercent })), { symbol: 'CASH', name: '未配置現金', value: canShowSimulationAmounts ? Math.max(0, calculationTotal * Math.max(0, 100 - result.targetTotal) / 100) : Math.max(0, 100 - result.targetTotal) }];
  const fundingValue = (value: number | null) => funding.isUnavailable || value === null ? '資料不足' : money(value);
  const fundingMessages = [...funding.blockingReasons, ...funding.warnings]
    .filter(reason => reason !== 'SAFETY_CASH_USAGE_ASSUMPTION')
    .map(fundingMessage);
  const blockedAmountMessage = funding.isUnavailable ? '資料不足' : funding.blockingReasons.length > 0 ? '已阻擋交易呈現' : '等待比例符合 100%';

  const context = getAllocationContext('simulation');
  return <PageFrame page="tools" title={context.name} description={context.description}>
    <AllocationContextNotice context="simulation" showCta />
    <section className="card simulator-notice"><strong>不會自動套用</strong><span>以下結果不會修改正式持股、現金、借款、localStorage、Firebase 或同步資料。</span></section>
    <section className="card">
      <h2>模擬資金來源</h2>
      <p className="note">使用正式 Household Liquidity 與 Cash Flow 資料；受保護安全現金預設不納入模擬。</p>
      <label className="simulator-safety-cash-control">
        <input type="checkbox" checked={allowSafetyCashUsage} disabled={!canUseSafetyCashAssumption} aria-describedby="safety-cash-assumption-description" onChange={event => setAllowSafetyCashUsage(event.currentTarget.checked)} />
        <span>假設動用安全現金</span>
      </label>
      <p id="safety-cash-assumption-description" className="note">{funding.isUnavailable ? '資金資料不足，無法模擬動用安全現金。' : funding.usableProtectedSafetyCash === 0 ? '目前可納入的受保護安全現金為 0。' : '僅使用 selector 已計算、且不超過實際流動現金的可用安全現金。'}</p>
      {allowSafetyCashUsage && canUseSafetyCashAssumption && <div className="simulator-safety-cash-warning" role="alert" aria-atomic="true"><strong>高風險模擬假設</strong><p>此為模擬假設，不代表建議實際動用安全現金。</p></div>}
      <div className="sim-summary-grid" aria-label="模擬資金來源"><article><small>現有可投資現金</small><strong>{fundingValue(funding.existingInvestableCash)}</strong></article><article><small>額外投入資金</small><strong>{fundingValue(funding.externalContribution)}</strong></article><article><small>受保護安全現金</small><strong>{fundingValue(funding.protectedSafetyCash)}</strong><span className="note">預設不納入模擬</span></article><article><small>預計提領資金</small><strong>{fundingValue(funding.plannedWithdrawal)}</strong></article><article><small>可用模擬資金</small><strong>{fundingValue(funding.simulationAvailableFunding)}</strong></article></div>{fundingMessages.length > 0 && <div className="warning-message" role="status"><strong>{funding.isUnavailable ? '資料不足：' : '注意：'}</strong><ul>{fundingMessages.map(message => <li key={message}>{message}</li>)}</ul></div>}
    </section>
    <section className="sim-summary-grid" aria-label="模擬摘要">
      <article><small>目前正式總資產</small><strong>{money(totalAssets)}</strong></article><article><small>模擬後總資產</small><strong>{simulatedTotal === null ? '資料不足' : money(simulatedTotal)}</strong></article><article><small>模擬目標比例合計</small><strong className={result.isExact ? 'good' : 'bad'}>{pct(result.targetTotal)}</strong></article><article><small>預估需調整總金額</small><strong>{canShowSimulationAmounts && result.isExact && calculationTotal > 0 ? money(result.buyTotal + result.sellTotal) : blockedAmountMessage}</strong></article><article><small>預估買進／賣出</small><strong>{canShowSimulationAmounts && result.isExact && calculationTotal > 0 ? `${money(result.buyTotal)}／${money(result.sellTotal)}` : '—'}</strong></article>
    </section>
    <section className="card simulator-controls"><div><h2>模擬條件</h2><p className="note">可調整目標比例；資金來源為唯讀正式資料，不會回寫任何設定。</p></div><div className="actions"><button type="button" className="small" onClick={resetTargets}><RotateCcw size={16} /> 恢復正式目標比例</button></div></section>
    <section className="card sim-clec-template">
      <h2>套用 CLEC 442／433 權重樣板（試算）</h2>
      <p className="note">角色指派僅供本次模擬使用，暫存於本頁，不會寫入正式配置、localStorage 或 Firebase；套用後只覆寫下方模擬目標比例，不會產生交易或修改正式 targetWeight。</p>
      <div className="allocation-preset-controls">
        <label>樣板<select value={templatePreset} onChange={event => setTemplatePreset(normalizeAllocationPreset(event.currentTarget.value))}><option value="clec-442">CLEC 442</option><option value="clec-433">CLEC 433</option><option value="clec-703">CLEC 703</option><option value="clec-5050">CLEC 5050</option></select></label>
      </div>
      <div className="allocation-preset-roles">{rows.map(row => {
        const currentRole = templateRoles[row.symbol] || 'none';
        const occupiedRoles = new Set(Object.entries(templateRoles).filter(([symbol, role]) => symbol !== row.symbol && role !== 'none').map(([, role]) => role));
        return <label key={row.symbol}><span><b>{row.symbol}</b><small>{row.name || row.symbol}｜正式目標 {pct(officialTarget(row))}</small></span><select value={currentRole} onChange={event => { const role = event.currentTarget.value as AllocationRole; setTemplateRoles(current => ({ ...current, [row.symbol]: role })); }}><option value="none">未指派</option><option value="prototype" disabled={currentRole !== 'prototype' && occupiedRoles.has('prototype')}>原型資產</option><option value="leveraged" disabled={currentRole !== 'leveraged' && occupiedRoles.has('leveraged')}>槓桿資產</option><option value="cash-like" disabled={currentRole !== 'cash-like' && occupiedRoles.has('cash-like')}>類現金持股</option></select></label>;
      })}</div>
      <div className={`allocation-preset-preview ${templatePreview.canApply ? 'good' : 'bad'}`}>
        <p><b>{allocationPresetLabel(templatePreset)}</b>｜持股目標合計 {templatePreview.targetTotal === null ? '無法計算' : pct(templatePreview.targetTotal)}｜銀行現金目標 {templatePreview.cashTargetPct === null ? '無法計算' : pct(templatePreview.cashTargetPct)}</p>
        {templatePreview.rows.map(row => <p key={row.symbol}><span>{row.symbol}｜{row.issue === 'duplicate-role' ? '角色重複，尚未分配' : roleLabel(row.role)}</span><strong>{pct(row.currentWeight)} → {row.nextWeight === null ? '無法計算' : pct(row.nextWeight)}</strong></p>)}
        {templatePreview.warnings.map(item => <p className="warning-message" key={item}>{item}</p>)}
        {templatePreview.blockingReasons.map(item => <p className="warning-message" key={item}>{item}</p>)}
      </div>
      <div className="actions"><button type="button" disabled={!templatePreview.canApply} onClick={applyTemplatePreview}>套用至下方模擬目標比例</button></div>
    </section>
    <section className="card"><div className="sim-section-heading"><div><h2>資產目標比例調整</h2><p className="note">可調整模擬目標比例；正式資料僅供參考且不會被修改。</p></div><div className={`sim-target-status ${result.isExact ? 'good' : 'bad'}`}><small>比例驗證</small><strong>{targetStatus}</strong></div></div><div className="sim-editor-list">{result.entries.map(row => <article key={row.symbol} className="sim-editor-row"><div><strong>{row.symbol}</strong><span>{row.name || row.symbol}｜{row.assetClass === 'defensive' ? '防守資產' : '成長資產'}</span></div><p><small>目前市值</small><b>{money(row.marketValue)}</b></p><p><small>目前比例</small><b>{totalAssets > 0 ? pct(row.marketValue / totalAssets * 100) : '—'}</b></p><p><small>正式目標</small><b>{pct(officialTarget(row))}</b></p><label>模擬目標比例<input aria-label={`${row.symbol} 模擬目標比例`} type="number" min="0" max="1000" step="0.01" inputMode="decimal" value={targets[row.symbol] ?? '0'} onChange={event => { const value = event.currentTarget.value; setTargets(current => ({ ...current, [row.symbol]: value })); }} /></label><p><small>模擬目標金額</small><b>{canShowSimulationAmounts ? money(row.targetValue) : '資料不足'}</b></p><p><small>模擬差額</small><b className={canShowSimulationAmounts ? row.diff > 0 ? 'good' : row.diff < 0 ? 'bad' : '' : ''}>{canShowSimulationAmounts ? signedMoney(row.diff) : '資料不足'}</b></p></article>)}</div></section>
    {!result.isExact && <p className="warning-message">比例尚未符合 100%。系統保留你的輸入，但不顯示完整交易模擬，也不會自動調整比例。</p>}
    {!canShowSimulationAmounts && <p className="warning-message">資金資料不足或計畫提領已觸發阻擋；仍可比較目標比例，但不顯示金額與交易方向。</p>}
    <section className="sim-chart-grid card"><Donut title="目前配置" items={currentChart} total={Math.max(0, totalAssets)} /><Donut title="模擬目標配置" items={targetChart} total={canShowSimulationAmounts ? calculationTotal : 100} centerLabel={canShowSimulationAmounts ? '模擬後總資產' : '比例視覺'} centerValue={canShowSimulationAmounts ? money(calculationTotal) : pct(result.targetTotal)} /></section>
    <section className="card"><h2>模擬差額摘要</h2><p className="note">金額差額低於 {money(MONEY_FLOOR)} 時標示為不操作；股數以目前有效最新股價估算。</p><div className="sim-result-list">{result.entries.map(row => <article key={row.symbol} className="sim-result-card"><header><div><strong>{row.symbol}</strong><span>{row.name || row.symbol}</span></div><b className={canShowSimulationAmounts ? row.action === '買進' ? 'good' : row.action === '賣出' ? 'bad' : '' : ''}>{canShowSimulationAmounts && result.isExact ? row.action : canShowSimulationAmounts ? '等待比例符合 100%' : '資料不足'}</b></header><div><p><small>目前／目標金額</small><strong>{money(row.marketValue)}／{canShowSimulationAmounts ? money(row.targetValue) : '資料不足'}</strong></p><p><small>差額</small><strong>{canShowSimulationAmounts ? signedMoney(row.diff) : '資料不足'}</strong></p><p><small>預估股數</small><strong>{canShowSimulationAmounts ? row.hasValidPrice ? `${row.estimatedShares?.toLocaleString('zh-TW')} 股` : '缺少有效股價' : '資料不足'}</strong></p><p><small>模擬後／目標比例</small><strong>{canShowSimulationAmounts && calculationTotal > 0 ? `${pct(row.targetValue / calculationTotal * 100)}／${pct(row.targetPercent)}` : `—／${pct(row.targetPercent)}`}</strong></p></div></article>)}</div></section>
    {canShowSimulationAmounts && result.isExact && calculationTotal > 0 && <section className="card"><h2>模擬交易方向</h2><p className="note">以下僅為理論模擬結果，不會修改正式持股或同步資料。</p><ol className="sim-trade-list">{result.entries.filter(row => row.action !== '不操作').sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).map((row, index) => <li key={row.symbol}><b>{index + 1}</b><div><strong>{row.action} {row.symbol}｜{row.name || row.symbol}</strong><span>模擬金額 {money(Math.abs(row.diff))}｜預估 {row.hasValidPrice ? `${row.estimatedShares?.toLocaleString('zh-TW')} 股` : '缺少有效股價'}｜目前 {totalAssets > 0 ? pct(row.marketValue / totalAssets * 100) : '—'} → 目標 {pct(row.targetPercent)}</span></div></li>)}{result.entries.every(row => row.action === '不操作') && <li className="sim-empty">目前各資產皆在最小調整門檻內，不需要操作。</li>}</ol></section>}
    <ToolQuickNavigation current="allocation-simulator" />
  </PageFrame>;
}
