import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';

type SimulatorRow = {
  symbol: string;
  name: string;
  assetClass: 'growth' | 'defensive';
  marketValue: number;
  targetWeight?: number;
  quote: { price: number; error?: string; source: string };
};

type Props = { rows: SimulatorRow[]; totalAssets: number; cash: number };
type Action = '買進' | '賣出' | '不操作';

const MONEY_FLOOR = 1000; // Keep the existing rebalance action floor: differences below NT$1,000 are informational only.
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

function Donut({ title, items, total }: { title: string; items: { symbol: string; name: string; value: number }[]; total: number }) {
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
        <div className="allocation-donut-center"><small>總資產</small><strong>{money(total)}</strong></div>
      </div>
      <div className="allocation-legend">{segments.map(item => <div className="allocation-legend-item" key={item.symbol}><i style={{ backgroundColor: colorFor(item.symbol) }} /><span><b>{item.symbol === 'CASH' ? '台幣現金' : item.symbol}</b><small>{item.symbol === 'CASH' ? '未配置現金' : item.name}</small></span><strong>{pct(item.percent)}</strong></div>)}</div>
    </div>}
  </section>;
}

export default function AllocationSimulatorPage({ rows, totalAssets, cash }: Props) {
  const [contribution, setContribution] = useState('0');
  const [targets, setTargets] = useState<Record<string, string>>(() => Object.fromEntries(rows.map(row => [row.symbol, String(officialTarget(row))])));
  const resetTargets = () => setTargets(Object.fromEntries(rows.map(row => [row.symbol, String(officialTarget(row))])));
  const result = useMemo(() => {
    const simulatedContribution = Math.max(0, safeNumber(contribution)) * 10000;
    const simulatedTotal = Math.max(0, safeNumber(totalAssets) + simulatedContribution);
    const entries = rows.map(row => {
      const targetPercent = Math.max(0, safeNumber(targets[row.symbol]));
      const targetValue = simulatedTotal * targetPercent / 100;
      const diff = targetValue - Math.max(0, safeNumber(row.marketValue));
      const hasValidPrice = !row.quote.error && !row.quote.source.includes('備援') && safeNumber(row.quote.price) > 0;
      const action: Action = Math.abs(diff) < MONEY_FLOOR ? '不操作' : diff > 0 ? '買進' : '賣出';
      return { ...row, targetPercent, targetValue, diff, action, hasValidPrice, estimatedShares: hasValidPrice ? Math.floor(Math.abs(diff) / row.quote.price) : null };
    });
    const targetTotal = entries.reduce((sum, row) => sum + row.targetPercent, 0);
    const isExact = Math.abs(targetTotal - 100) < 0.0001;
    const buyTotal = isExact && simulatedTotal > 0 ? entries.filter(row => row.action === '買進').reduce((sum, row) => sum + row.diff, 0) : 0;
    const sellTotal = isExact && simulatedTotal > 0 ? entries.filter(row => row.action === '賣出').reduce((sum, row) => sum + Math.abs(row.diff), 0) : 0;
    return { entries, targetTotal, simulatedContribution, simulatedTotal, isExact, buyTotal, sellTotal };
  }, [contribution, rows, targets, totalAssets]);
  const targetStatus = result.isExact ? '合計正好 100%' : result.targetTotal < 100 ? `尚差 ${(100 - result.targetTotal).toFixed(2)} 個百分點` : `超出 ${(result.targetTotal - 100).toFixed(2)} 個百分點`;
  const currentChart = [...rows.map(row => ({ symbol: row.symbol, name: row.name || row.symbol, value: Math.max(0, row.marketValue) })), { symbol: 'CASH', name: '台幣現金', value: Math.max(0, cash) }];
  const targetChart = [...result.entries.map(row => ({ symbol: row.symbol, name: row.name || row.symbol, value: row.targetValue })), { symbol: 'CASH', name: '未配置現金', value: Math.max(0, result.simulatedTotal * Math.max(0, 100 - result.targetTotal) / 100) }];

  return <PageFrame page="tools" title="資產配置模擬器" description="調整目標配置與模擬投入金額，在不修改正式持股的情況下，預覽配置結果與再平衡方向。">
    <section className="card simulator-notice"><strong>唯讀模擬</strong><span>以下結果不會修改正式持股、現金、借款、localStorage、Firebase 或同步資料。</span></section>
    <section className="sim-summary-grid" aria-label="模擬摘要">
      <article><small>目前正式總資產</small><strong>{money(totalAssets)}</strong></article><article><small>模擬投入／抽回</small><strong>{signedMoney(result.simulatedContribution)}</strong></article><article><small>模擬後總資產</small><strong>{money(result.simulatedTotal)}</strong></article><article><small>模擬目標比例合計</small><strong className={result.isExact ? 'good' : 'bad'}>{pct(result.targetTotal)}</strong></article><article><small>預估需調整總金額</small><strong>{result.isExact && result.simulatedTotal > 0 ? money(result.buyTotal + result.sellTotal) : '等待比例符合 100%'}</strong></article><article><small>預估買進／賣出</small><strong>{result.isExact && result.simulatedTotal > 0 ? `${money(result.buyTotal)}／${money(result.sellTotal)}` : '—'}</strong></article>
    </section>
    <section className="card simulator-controls"><div><h2>模擬條件</h2><p className="note">輸入金額以萬元計；只影響目前頁面的唯讀模擬結果。</p></div><label>模擬投入金額（萬元）<input type="number" inputMode="decimal" min="0" step="0.1" value={contribution} onChange={event => { const value = event.currentTarget.value; if (value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0)) setContribution(value); }} /></label><div className="actions"><button type="button" className="small" onClick={() => setContribution('0')}>清除投入金額</button><button type="button" className="small" onClick={() => { setContribution('0'); resetTargets(); }}><RotateCcw size={16} /> 全部重設</button></div></section>
    <section className="card"><div className="sim-section-heading"><div><h2>資產目標比例調整</h2><p className="note">可調整模擬目標比例；正式資料僅供參考且不會被修改。</p></div><div className={`sim-target-status ${result.isExact ? 'good' : 'bad'}`}><small>比例驗證</small><strong>{targetStatus}</strong></div></div><div className="sim-editor-list">{result.entries.map(row => <article key={row.symbol} className="sim-editor-row"><div><strong>{row.symbol}</strong><span>{row.name || row.symbol}｜{row.assetClass === 'defensive' ? '防守資產' : '成長資產'}</span></div><p><small>目前市值</small><b>{money(row.marketValue)}</b></p><p><small>目前比例</small><b>{totalAssets > 0 ? pct(row.marketValue / totalAssets * 100) : '—'}</b></p><p><small>正式目標</small><b>{pct(officialTarget(row))}</b></p><label>模擬目標比例<input aria-label={`${row.symbol} 模擬目標比例`} type="number" min="0" max="1000" step="0.01" inputMode="decimal" value={targets[row.symbol] ?? '0'} onChange={event => { const value = event.currentTarget.value; setTargets(current => ({ ...current, [row.symbol]: value })); }} /></label><p><small>模擬目標金額</small><b>{money(row.targetValue)}</b></p><p><small>模擬差額</small><b className={row.diff > 0 ? 'good' : row.diff < 0 ? 'bad' : ''}>{signedMoney(row.diff)}</b></p></article>)}</div><div className="actions"><button type="button" className="small" onClick={resetTargets}>恢復正式目標比例</button></div></section>
    {!result.isExact && <p className="warning-message">比例尚未符合 100%。系統保留你的輸入，但不顯示完整交易模擬，也不會自動調整比例。</p>}
    <section className="sim-chart-grid card"><Donut title="目前配置" items={currentChart} total={Math.max(0, totalAssets)} /><Donut title="模擬目標配置" items={targetChart} total={Math.max(0, result.simulatedTotal)} /></section>
    <section className="card"><h2>模擬差額摘要</h2><p className="note">金額差額低於 {money(MONEY_FLOOR)} 時標示為不操作；股數以目前有效最新股價估算。</p><div className="sim-result-list">{result.entries.map(row => <article key={row.symbol} className="sim-result-card"><header><div><strong>{row.symbol}</strong><span>{row.name || row.symbol}</span></div><b className={row.action === '買進' ? 'good' : row.action === '賣出' ? 'bad' : ''}>{result.isExact && result.simulatedTotal > 0 ? row.action : '等待比例符合 100%'}</b></header><div><p><small>目前／目標金額</small><strong>{money(row.marketValue)}／{money(row.targetValue)}</strong></p><p><small>差額</small><strong>{signedMoney(row.diff)}</strong></p><p><small>預估股數</small><strong>{row.hasValidPrice ? `${row.estimatedShares?.toLocaleString('zh-TW')} 股` : '缺少有效股價'}</strong></p><p><small>模擬後／目標比例</small><strong>{result.simulatedTotal > 0 ? `${pct(row.targetValue / result.simulatedTotal * 100)}／${pct(row.targetPercent)}` : '—'}</strong></p></div></article>)}</div></section>
    {result.isExact && result.simulatedTotal > 0 && <section className="card"><h2>模擬交易方向</h2><p className="note">以下僅為模擬結果，不會修改正式持股或同步資料。</p><ol className="sim-trade-list">{result.entries.filter(row => row.action !== '不操作').sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).map((row, index) => <li key={row.symbol}><b>{index + 1}</b><div><strong>{row.action} {row.symbol}｜{row.name || row.symbol}</strong><span>模擬金額 {money(Math.abs(row.diff))}｜預估 {row.hasValidPrice ? `${row.estimatedShares?.toLocaleString('zh-TW')} 股` : '缺少有效股價'}｜目前 {totalAssets > 0 ? pct(row.marketValue / totalAssets * 100) : '—'} → 目標 {pct(row.targetPercent)}</span></div></li>)}{result.entries.every(row => row.action === '不操作') && <li className="sim-empty">目前各資產皆在最小調整門檻內，不需要操作。</li>}</ol></section>}
    <ToolQuickNavigation current="allocation-simulator" />
  </PageFrame>;
}
