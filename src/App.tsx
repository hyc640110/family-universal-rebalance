import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type SymbolCode = string;
type Quote = { symbol: SymbolCode; name: string; price: number; previousClose: number; change: number; changePct: number; volume: number; source: string; updatedAt: string; error?: string };
type Holding = { symbol: SymbolCode; shares: number; avgCost: number; targetWeight?: number };
type CashItem = { id: string; name: string; amount: number; note: string };
type LoanItem = { id: string; name: string; principal: number; annualRate: number; monthlyPayment: number; startDate: string; totalMonths?: number };
type FirebaseConfig = { databaseURL: string; secretPath: string };
type AppState = { holdings: Holding[]; cash: CashItem[]; loans: LoanItem[]; refreshSec: number; firebase: FirebaseConfig; workerUrl: string; autoSync: boolean; autoSyncSec: number };

const APP_VERSION = 'Version 1.0.0';
const STORAGE_KEY = '00631l-pro-v100-state';
const OLD_STORAGE_KEYS = ['00631l-pro-v62-state', '00631l-pro-v61-state'];
const DEFAULT_WORKER_URL = 'https://fancy-dew-4128.hyc640110.workers.dev';
const REMOVED_SYMBOLS = new Set<SymbolCode>([['00', '50'].join('')]);
const DEFAULT_SYMBOLS: SymbolCode[] = ['00631L'];
const DEFAULT_GROWTH_TARGET = 70;
const MIN_GROWTH_TARGET = 30;
const MAX_GROWTH_TARGET = 90;
const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();
const num = (n: number) => Number.isFinite(n) ? n : 0;
const money = (n: number) => n.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });
const signedMoney = (n: number) => `${n > 0 ? '+' : ''}${money(n)}`;
const pct = (n: number) => `${num(n).toFixed(2)}%`;
const signedPct = (n: number) => `${n > 0 ? '+' : ''}${pct(n)}`;
const tw = (iso: string) => new Date(iso).toLocaleString('zh-TW');
const clampTarget = (value: number) => Math.min(MAX_GROWTH_TARGET, Math.max(MIN_GROWTH_TARGET, num(value) || DEFAULT_GROWTH_TARGET));
const growthTargetOf = (state: Pick<AppState, 'holdings'>) => clampTarget(state.holdings.find(h => h.symbol === '00631L')?.targetWeight ?? DEFAULT_GROWTH_TARGET);
const tone = (value: number) => value > 0 ? 'up' : value < 0 ? 'down' : 'hold';

const defaultQuotes: Record<SymbolCode, Quote> = {
  '00631L': { symbol: '00631L', name: '元大台灣50正2', price: 38.42, previousClose: 37.61, change: 0.81, changePct: 2.15, volume: 0, source: '內建備援', updatedAt: now() },
  '00865B': { symbol: '00865B', name: '國泰US短期公債', price: 48.52, previousClose: 48.41, change: 0.11, changePct: 0.23, volume: 0, source: '內建備援', updatedAt: now() }
};

const defaultState: AppState = {
  holdings: [{ symbol: '00631L', shares: 0, avgCost: 0, targetWeight: DEFAULT_GROWTH_TARGET }],
  cash: [{ id: uid(), name: '現金', amount: 0, note: '防守資產' }],
  loans: [{ id: uid(), name: '信貸', principal: 0, annualRate: 6.5, monthlyPayment: 10000, startDate: new Date().toISOString().slice(0, 10), totalMonths: 84 }],
  refreshSec: 60,
  firebase: { databaseURL: '', secretPath: '631128' },
  workerUrl: DEFAULT_WORKER_URL,
  autoSync: false,
  autoSyncSec: 60
};

const REMOVED_RECORD_KEY = ['tra', 'des'].join('');
const STALE_KEYS = ['strategy', 'strategies', 'targetAllocation', 'assetAllocation', 'portfolioSummary', 'strategyTotal', 'defaultHoldings', ['default', 'Tr', 'ades'].join(''), 'monthlyContribution', 'simCagr', 'simDividend', 'simYears', REMOVED_RECORD_KEY];
const removedSymbol = () => Array.from(REMOVED_SYMBOLS)[0];
function hasRemovedSymbol(value: unknown) { return String(value ?? '').includes(removedSymbol()); }
function uniqueSymbols(state?: Partial<AppState>): SymbolCode[] {
  const fromState = state?.holdings?.map(h => h.symbol) || [];
  return Array.from(new Set([...DEFAULT_SYMBOLS, ...fromState].filter(s => s && !REMOVED_SYMBOLS.has(s))));
}
function backupQuote(symbol: SymbolCode, holding?: Holding): Quote {
  const base = defaultQuotes[symbol];
  const price = num(holding?.avgCost || base?.price || 0);
  return { ...(base || { symbol, name: symbol, volume: 0 }), symbol, price, previousClose: price, change: 0, changePct: 0, volume: base?.volume || 0, source: holding?.avgCost ? '平均成本備援' : '無股價資料', updatedAt: now() };
}
function sanitizeHolding(h: Holding): Holding | null {
  if (!h?.symbol || REMOVED_SYMBOLS.has(h.symbol)) return null;
  const shares = Math.max(0, num(Number(h.shares)));
  const avgCost = Math.max(0, num(Number(h.avgCost)));
  if (h.symbol === '00631L') return { symbol: h.symbol, shares, avgCost, targetWeight: clampTarget(Number(h.targetWeight ?? DEFAULT_GROWTH_TARGET)) };
  return { symbol: h.symbol, shares, avgCost };
}
function sanitizeCashItem(c: CashItem): CashItem | null {
  if ([c?.id, c?.name, c?.note].some(hasRemovedSymbol)) return null;
  return { id: c.id || uid(), name: c.name || '現金', amount: Math.max(0, num(Number(c.amount))), note: c.note || '' };
}
function sanitizeLoanItem(l: LoanItem): LoanItem {
  const totalMonths = l.totalMonths === undefined || l.totalMonths === null ? undefined : Math.max(0, num(Number(l.totalMonths)));
  return { id: l.id || uid(), name: l.name || '借款', principal: Math.max(0, num(Number(l.principal))), annualRate: Math.max(0, num(Number(l.annualRate))), monthlyPayment: Math.max(0, num(Number(l.monthlyPayment))), startDate: l.startDate || new Date().toISOString().slice(0, 10), totalMonths };
}
function calculatedPaidMonths(startDate: string, totalMonths?: number, today = new Date()) {
  if (!startDate || totalMonths === undefined) return undefined;
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return undefined;
  const total = Math.max(0, Math.floor(totalMonths));
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (start > current) return 0;
  const monthDelta = (current.getFullYear() - start.getFullYear()) * 12 + current.getMonth() - start.getMonth();
  const paid = monthDelta + (current.getDate() >= start.getDate() ? 1 : 0);
  return Math.min(total, Math.max(0, paid));
}
function calculatedRemainingMonths(loan: LoanItem) {
  const paid = calculatedPaidMonths(loan.startDate, loan.totalMonths);
  return paid === undefined || loan.totalMonths === undefined ? undefined : Math.max(0, loan.totalMonths - paid);
}
function loanPeriodSummary(loan: LoanItem) {
  const paid = calculatedPaidMonths(loan.startDate, loan.totalMonths);
  const remaining = paid === undefined || loan.totalMonths === undefined ? undefined : Math.max(0, Math.floor(loan.totalMonths) - paid);
  return { paid, remaining };
}
function normalizeState(raw: unknown): AppState {
  const r = raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {};
  STALE_KEYS.forEach((key) => delete r[key]);
  const s = { ...defaultState, ...r } as Partial<AppState>;
  const holdings = (Array.isArray(s.holdings) ? s.holdings : defaultState.holdings).map(h => sanitizeHolding(h as Holding)).filter(Boolean) as Holding[];
  const has00631L = holdings.some(h => h.symbol === '00631L');
  const cash = (Array.isArray(s.cash) ? s.cash : defaultState.cash).map(c => sanitizeCashItem(c as CashItem)).filter(Boolean) as CashItem[];
  const loans = (Array.isArray(s.loans) ? s.loans : defaultState.loans).map(l => sanitizeLoanItem(l as LoanItem));
  return { holdings: has00631L ? holdings : [...defaultState.holdings, ...holdings], cash, loans, firebase: { ...defaultState.firebase, ...(s.firebase || {}) }, workerUrl: DEFAULT_WORKER_URL, refreshSec: Math.max(15, num(Number(s.refreshSec || 60))), autoSync: Boolean(s.autoSync), autoSyncSec: Math.max(10, num(Number(s.autoSyncSec || 60))) };
}
function readState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || OLD_STORAGE_KEYS.map(key => localStorage.getItem(key)).find(Boolean) || '{}';
    const normalized = normalizeState(JSON.parse(raw));
    const json = JSON.stringify(normalized);
    if (raw !== json) localStorage.setItem(STORAGE_KEY, json);
    return normalized;
  } catch { return defaultState; }
}
function writeState(s: AppState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(s))); }
function syncPath(config: FirebaseConfig) { return `portfolio/${encodeURIComponent(config.secretPath || '631128')}`; }
function syncUrl(config: FirebaseConfig) { const db = config.databaseURL.trim(); if (!db) throw new Error('請先輸入 Firebase URL'); return `${db.replace(/\/$/, '')}/${syncPath(config)}.json`; }
async function uploadFirebase(config: FirebaseConfig, state: AppState) { const res = await fetch(syncUrl(config), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(normalizeState(state)) }); if (!res.ok) throw new Error(`Firebase ${res.status}`); }
async function downloadFirebase(config: FirebaseConfig) { const res = await fetch(syncUrl(config), { cache: 'no-store' }); if (!res.ok) throw new Error(`Firebase ${res.status}`); const data = await res.json(); if (!data) throw new Error(`找不到雲端資料：${syncPath(config)}`); return normalizeState({ ...data, firebase: { ...config, ...(data.firebase || {}) } }); }
function parseWorkerQuote(symbol: SymbolCode, data: unknown): Quote | null { const d = data as { price?: number; previousClose?: number; prev?: number; volume?: number; source?: string }; if (typeof d?.price !== 'number') return null; const prev = Number(d.previousClose ?? d.prev ?? d.price); return { ...backupQuote(symbol), symbol, price: d.price, previousClose: prev, change: d.price - prev, changePct: prev ? (d.price - prev) / prev * 100 : 0, volume: Number(d.volume ?? 0), source: d.source || 'Yahoo Finance via Cloudflare Worker', updatedAt: now() }; }
async function fetchQuote(symbol: SymbolCode, holding?: Holding): Promise<Quote> { const url = `${DEFAULT_WORKER_URL}/?symbol=${encodeURIComponent(symbol)}`; try { const res = await fetch(url, { cache: 'no-store' }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error((data as { error?: string }).error || `Worker ${res.status}`); const q = parseWorkerQuote(symbol, data); if (!q) throw new Error(`Worker 回傳格式不正確：${JSON.stringify(data).slice(0, 80)}`); return q; } catch (error) { return { ...backupQuote(symbol, holding), source: holding?.avgCost ? '平均成本備援 / Worker 連線失敗' : '離線備援 / Worker 連線失敗', updatedAt: now(), error: error instanceof Error ? error.message : String(error) }; } }

function derivedHoldings(state: AppState): Holding[] {
  const map = Object.fromEntries(state.holdings.map(h => [h.symbol, h])) as Record<SymbolCode, Holding>;
  return uniqueSymbols(state).map(s => map[s] || { symbol: s, shares: 0, avgCost: 0, ...(s === '00631L' ? { targetWeight: growthTargetOf(state) } : {}) });
}
function calculateMetrics(state: AppState, quotes: Record<SymbolCode, Quote>) {
  const rows = derivedHoldings(state).map(h => { const q = quotes[h.symbol] || backupQuote(h.symbol, h); const hasLatestPrice = !q.error && !q.source.includes('備援') && num(q.price) > 0; const price = hasLatestPrice ? num(q.price) : num(h.avgCost) || num(q.price); const quote = hasLatestPrice ? q : { ...q, price, previousClose: price, change: 0, changePct: 0, source: h.avgCost ? '平均成本備援' : q.source }; const marketValue = h.shares * price; const cost = h.shares * h.avgCost; const pnl = marketValue - cost; const dayPnl = h.shares * quote.change; return { ...h, quote, marketValue, cost, pnl, dayPnl }; });
  const stocks = rows.reduce((a, r) => a + r.marketValue, 0);
  const cash = state.cash.reduce((a, c) => a + num(c.amount), 0);
  const debt = state.loans.reduce((a, l) => a + num(l.principal), 0);
  const totalAssets = stocks + cash;
  const netWorth = totalAssets - debt;
  const dayPnl = rows.reduce((a, r) => a + r.dayPnl, 0);
  const growth = rows.find(r => r.symbol === '00631L')?.marketValue || 0;
  const defensiveHoldings = rows.filter(r => r.symbol !== '00631L');
  const defensiveHoldingsValue = defensiveHoldings.reduce((a, r) => a + r.marketValue, 0);
  const defensive = cash + defensiveHoldingsValue;
  const growthTargetPct = growthTargetOf(state);
  const defensiveTargetPct = 100 - growthTargetPct;
  const beta = rows.reduce((a, r) => a + (r.symbol === '00631L' ? 2 : 0.05) * (totalAssets ? r.marketValue / totalAssets : 0), 0);
  const cashRatio = totalAssets ? cash / totalAssets * 100 : 0;
  const defensiveRatio = totalAssets ? defensive / totalAssets * 100 : 0;
  const leverage = netWorth > 0 ? totalAssets / netWorth : 0;
  const monthlyPayment = state.loans.reduce((a, l) => a + num(l.monthlyPayment), 0);
  const remainingMonths = state.loans.map(calculatedRemainingMonths).filter((v): v is number => v !== undefined);
  const averageRemainingMonths = remainingMonths.length ? remainingMonths.reduce((a, v) => a + v, 0) / remainingMonths.length : undefined;
  return { rows, stocks, cash, debt, totalAssets, netWorth, dayPnl, growth, defensive, defensiveHoldings, defensiveHoldingsValue, growthTargetPct, defensiveTargetPct, beta, cashRatio, defensiveRatio, leverage, monthlyPayment, averageRemainingMonths };
}
function rebalance(state: AppState, quotes: Record<SymbolCode, Quote>) {
  const m = calculateMetrics(state, quotes);
  const stock = m.rows.find(r => r.symbol === '00631L') || { symbol: '00631L', quote: backupQuote('00631L'), marketValue: 0 };
  const stockTarget = m.totalAssets * (m.growthTargetPct / 100);
  const defensiveTarget = m.totalAssets * (m.defensiveTargetPct / 100);
  const stockDiff = stockTarget - stock.marketValue;
  const defensiveDiff = defensiveTarget - m.defensive;
  const stockShares = Math.round(Math.abs(stockDiff) / Math.max(0.01, stock.quote.price));
  const stockAction = Math.abs(stockDiff) < 1000 ? '維持持有' : `建議${stockDiff >= 0 ? '買入' : '賣出'} ${stockShares.toLocaleString('zh-TW')} 股，約 ${money(Math.abs(stockDiff))}`;
  const defensiveAction = Math.abs(defensiveDiff) < 1000 ? '維持防守資產' : defensiveDiff > 0 ? `需增加防守資產約 ${money(defensiveDiff)}` : `可使用現金約 ${money(Math.abs(defensiveDiff))}`;
  const detailRows = m.defensiveHoldings.map(r => ({ symbol: `其中 ${r.symbol}`, currentWeight: m.totalAssets ? r.marketValue / m.totalAssets * 100 : 0, targetText: '—', diffText: '—', action: '保留實際持股，不參與再平衡', tone: 'hold' }));
  const rows = [{ symbol: '00631L', currentWeight: m.totalAssets ? stock.marketValue / m.totalAssets * 100 : 0, targetText: pct(m.growthTargetPct), diffText: money(stockDiff), action: stockAction, tone: stockDiff >= 0 ? 'up' : 'down' }, { symbol: '防守資產', currentWeight: m.totalAssets ? m.defensive / m.totalAssets * 100 : 0, targetText: pct(m.defensiveTargetPct), diffText: money(defensiveDiff), action: defensiveAction, tone: 'hold' }, ...detailRows];
  return { rows, stockAction, defensiveAction, defensiveCurrent: m.defensive, defensiveTarget, nonStrategy: m.defensiveHoldings.map(r => `${r.symbol}：保留實際持股，不參與再平衡`) };
}
function advice(m: ReturnType<typeof calculateMetrics>) { if (m.cashRatio < 8 || m.leverage > 1.6) return ['風險降溫', `現金水位偏低或槓桿偏高，先補防守資產；目前目標為 00631L ${pct(m.growthTargetPct)}、防守資產 ${pct(m.defensiveTargetPct)}。`, 'bad'] as const; if (m.dayPnl < -m.stocks * 0.05) return ['小跌加碼', `可分批補足低於自訂目標的部位，避免一次打滿；目前目標為 00631L ${pct(m.growthTargetPct)}。`, 'warn'] as const; return ['正常投入', `維持自訂目標配置；目前目標為 00631L ${pct(m.growthTargetPct)}、防守資產 ${pct(m.defensiveTargetPct)}。`, 'good'] as const; }

function Pie3D({ m }: { m: ReturnType<typeof calculateMetrics> }) {
  const growthPct = m.totalAssets ? m.growth / m.totalAssets * 100 : 0;
  const defensivePct = m.totalAssets ? m.defensive / m.totalAssets * 100 : 0;
  const cashPct = m.totalAssets ? m.cash / m.totalAssets * 100 : 0;
  const holdingPct = (symbol: SymbolCode) => pct(m.totalAssets ? (m.defensiveHoldings.find(r => r.symbol === symbol)?.marketValue || 0) / m.totalAssets * 100 : 0);
  return <div className="pie-layout">
    <div className="pie-figure">
      <div className="pie-3d" style={{ '--growth': `${growthPct}%` } as CSSProperties} />
      <span className="pie-callout growth-label"><b>00631L</b><strong>{pct(growthPct)}</strong></span>
      <span className="pie-callout defensive-label"><b>防守資產</b><strong>{pct(defensivePct)}</strong></span>
    </div>
    <div className="allocation-detail">
      <div><h3>成長資產</h3><p><i className="legend growth-dot" />00631L：{pct(growthPct)}</p><small>目標：{pct(m.growthTargetPct)}</small></div>
      <div><h3>防守資產</h3><p><i className="legend cash-dot" />現金：{pct(cashPct)}</p>{m.defensiveHoldings.map(r => <p key={r.symbol}><i className="legend bond-dot" />{r.symbol}：{r.symbol === '00865B' ? holdingPct('00865B') : pct(m.totalAssets ? r.marketValue / m.totalAssets * 100 : 0)}</p>)}<p><i className="legend defensive-dot" />合計：{pct(defensivePct)}</p><small>目標：{pct(m.defensiveTargetPct)}</small></div>
    </div>
  </div>;
}
function Stat({ label, value, tone: toneClass }: { label: string; value: string; tone?: string }) { return <div className="stat"><small>{label}</small><b className={toneClass || ''}>{value}</b></div>; }
function Card({ title, children }: { title: string; children: ReactNode }) { return <section className="card"><h2>{title}</h2>{children}</section>; }
function DraftInput({ value, type = 'text', min, step, inputMode, onCommit }: { value: string | number; type?: string; min?: string; step?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(String(value ?? ''));
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!editing) setDraft(String(value ?? '')); }, [value, editing]);
  const commit = () => { setEditing(false); onCommit(draft); };
  return <input type={type} min={min} step={step} inputMode={inputMode} value={draft} onFocus={() => setEditing(true)} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}
const parsePositive = (value: string, fallback = 0) => value.trim() === '' ? fallback : Math.max(0, num(Number(value)));

function CashList({ items, setItems }: { items: CashItem[]; setItems: (items: CashItem[]) => void }) {
  const update = (id: string, patch: Partial<CashItem>) => setItems(items.map(item => item.id === id ? { ...item, ...patch } : item));
  return <div className="list cash-list"><div className="list-row list-head"><span>名稱</span><span>金額（萬元）</span><span>備註</span><span>操作</span></div>{items.map(item => <div className="list-row" key={item.id}><label><span>名稱</span><DraftInput value={item.name} onCommit={value => update(item.id, { name: value })} /></label><label><span>金額（萬元）</span><DraftInput type="number" value={item.amount / 10000} onCommit={value => update(item.id, { amount: parsePositive(value) * 10000 })} /></label><label><span>備註</span><DraftInput value={item.note} onCommit={value => update(item.id, { note: value })} /></label><button className="danger small" onClick={() => setItems(items.filter(x => x.id !== item.id))}>刪除</button></div>)}<button className="small" onClick={() => setItems([...items, { id: uid(), name: '現金', amount: 0, note: '' }])}>新增</button></div>;
}
function LoanList({ items, setItems }: { items: LoanItem[]; setItems: (items: LoanItem[]) => void }) {
  const update = (id: string, patch: Partial<LoanItem>) => setItems(items.map(item => sanitizeLoanItem(item.id === id ? { ...item, ...patch } : item)));
  return <div className="list loan-list"><p className="note">已繳期數依起始日與今天日期自動計算，已繳與剩餘為只讀欄位。</p><div className="list-row list-head"><span>名稱</span><span>本金（萬元）</span><span>利率%</span><span>月付金</span><span>起始日</span><span>總期數</span><span>已繳期數</span><span>剩餘期數</span><span>操作</span></div>{items.map(item => { const period = loanPeriodSummary(item); return <div className="list-row" key={item.id}><label><span>名稱</span><DraftInput value={item.name} onCommit={value => update(item.id, { name: value })} /></label><label><span>本金（萬元）</span><DraftInput type="number" value={item.principal / 10000} onCommit={value => update(item.id, { principal: parsePositive(value) * 10000 })} /></label><label><span>利率%</span><DraftInput type="number" value={item.annualRate} onCommit={value => update(item.id, { annualRate: parsePositive(value) })} /></label><label><span>月付金</span><DraftInput type="number" value={item.monthlyPayment} onCommit={value => update(item.id, { monthlyPayment: parsePositive(value) })} /></label><label><span>起始日</span><DraftInput type="date" value={item.startDate} onCommit={value => update(item.id, { startDate: value })} /></label><label><span>總期數</span><DraftInput type="number" value={item.totalMonths ?? ''} onCommit={value => update(item.id, { totalMonths: value.trim() === '' ? undefined : parsePositive(value) })} /></label><span className="remaining" title="依起始日與今天日期自動計算">{period.paid === undefined ? '—' : `${period.paid.toLocaleString('zh-TW')} 期`}</span><span className="remaining" title="總期數減已繳期數">{period.remaining === undefined ? '—' : `${period.remaining.toLocaleString('zh-TW')} 期`}</span><button className="danger small" onClick={() => setItems(items.filter(x => x.id !== item.id))}>刪除</button></div>; })}<button className="small" onClick={() => setItems([...items, { id: uid(), name: '借款', principal: 0, annualRate: 0, monthlyPayment: 0, startDate: new Date().toISOString().slice(0, 10), totalMonths: undefined }])}>新增</button></div>;
}

function App() {
  const [tab, setTab] = useState<'dashboard' | 'sync'>('dashboard');
  const [state, setState] = useState<AppState>(() => readState());
  const [quotes, setQuotes] = useState<Record<SymbolCode, Quote>>(defaultQuotes);
  const [sync, setSync] = useState('尚未同步');
  const [loadedAt] = useState(now());
  const [lastSavedAt, setLastSavedAt] = useState(now());
  const isApplyingRemoteRef = useRef(false);
  const [targetDraft, setTargetDraft] = useState(String(growthTargetOf(state)));
  const didMount = useRef(false);
  const [quoteStatus, setQuoteStatus] = useState('尚未更新股價');
  useEffect(() => { writeState(state); if (didMount.current && !isApplyingRemoteRef.current) { setLastSavedAt(now()); if (!state.autoSync) setSync('本機已儲存'); } didMount.current = true; isApplyingRemoteRef.current = false; }, [state]);
  useEffect(() => setTargetDraft(String(growthTargetOf(state))), [state.holdings]);
  const refreshQuotes = async () => { setQuoteStatus('股價更新中…'); const currentState = state; const entries = await Promise.all(uniqueSymbols(currentState).map(async s => [s, await fetchQuote(s, currentState.holdings.find(h => h.symbol === s))] as const)); const next = { ...quotes, ...Object.fromEntries(entries) } as Record<SymbolCode, Quote>; setQuotes(next); const errors = entries.map(([, q]) => q).filter(q => q.error).map(q => `${q.symbol}: ${q.error}`); setQuoteStatus(errors.length ? `部分失敗：${errors.join(' / ')}` : `股價更新成功：${tw(now())}`); };
  const uploadCloud = async (label = 'Firebase 同步完成') => { setSync('Firebase 同步中…'); const normalized = normalizeState(state); await uploadFirebase(normalized.firebase, normalized); setSync(`${label} ${tw(now())}｜${syncPath(normalized.firebase)}｜持股 ${normalized.holdings.length} 筆`); };
  const downloadCloud = async () => { setSync('下載中…'); const remote = await downloadFirebase(state.firebase); isApplyingRemoteRef.current = true; setState(remote); setSync(`Firebase 同步完成 ${tw(now())}｜${syncPath(remote.firebase)}｜持股 ${remote.holdings.length} 筆`); };
  useEffect(() => { refreshQuotes(); }, []);
  const m = useMemo(() => calculateMetrics(state, quotes), [state, quotes]);
  const rb = useMemo(() => rebalance(state, quotes), [state, quotes]);
  const [mode, hint, modeTone] = advice(m);
  const updateHolding = (symbol: SymbolCode, key: keyof Holding, value: number) => setState(s => { const exists = s.holdings.some(h => h.symbol === symbol); const nextValue = key === 'targetWeight' ? value : Math.max(0, num(value)); const nextHolding: Holding = { symbol, shares: 0, avgCost: 0, ...(symbol === '00631L' ? { targetWeight: growthTargetOf(s) } : {}), [key]: nextValue }; return { ...s, holdings: exists ? s.holdings.map(h => h.symbol === symbol ? sanitizeHolding({ ...h, [key]: nextValue }) || h : h) : [...s.holdings, nextHolding] }; });
  const commitTarget = () => { const next = clampTarget(Number(targetDraft)); setTargetDraft(String(next)); updateHolding('00631L', 'targetWeight', next); };
  const backup = () => { const blob = new Blob([JSON.stringify(normalizeState(state), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `00631l-pro-version-1.0.0-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  const restore = async (f?: File) => { if (!f) return; setState(normalizeState(JSON.parse(await f.text()))); };
  return (
    <main>
      <header className="hero">
        <div><p className="eyebrow">{APP_VERSION}</p><h1>00631L Pro</h1><h3>台股槓桿投資管理</h3><p>即時股價｜再平衡｜Firebase 雲端同步</p></div>
        <button onClick={refreshQuotes}>更新股價</button>
      </header>
      <nav className="tabs">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>儀表板</button>
        <button className={tab === 'sync' ? 'active' : ''} onClick={() => setTab('sync')}>同步設定</button>
        <span>股價更新 {tw(Object.values(quotes)[0].updatedAt)}｜已載入 {tw(loadedAt)}｜儲存 {tw(lastSavedAt)}｜{sync}</span>
      </nav>
      {tab === 'dashboard' && <>
        <section className="grid stats">
          <Stat label="總資產" value={money(m.totalAssets)} />
          <Stat label="今日損益" value={signedMoney(m.dayPnl)} tone={tone(m.dayPnl)} />
          <Stat label="淨資產" value={money(m.netWorth)} />
          <Stat label="借款" value={money(m.debt)} tone="warn" />
          <Stat label="Beta" value={m.beta.toFixed(2)} />
          <Stat label="防守資產比例" value={pct(m.defensiveRatio)} />
          <Stat label="槓桿比例" value={m.leverage.toFixed(2) + 'x'} />
          <Stat label="策略模式" value={mode} tone={modeTone} />
        </section>
        <Card title="AI 分析與加碼建議">
          <h3>{mode}</h3><p>{hint}</p>
          <p>Beta {m.beta.toFixed(2)}、防守資產 {pct(m.defensiveRatio)}、槓桿 {m.leverage.toFixed(2)}x。成本與股數會隨持股、現金與自訂目標即時更新。</p>
          <small>資料來源：{m.rows.map(r => `${r.symbol}=${r.quote.source}`).join(' / ')}</small>
          <p className="note">{quoteStatus}</p>
        </Card>
        <Card title="持股配置">
          <div className="holdings">
            {m.rows.map(r => { const pnlPct = r.cost ? r.pnl / r.cost * 100 : 0; return <article className="holding" key={r.symbol}>
              <h3>{r.symbol}</h3><p>{r.quote.name}</p><p>來源：{r.quote.source}｜更新：{tw(r.quote.updatedAt)}</p>{r.quote.error && <p className="note">錯誤：{r.quote.error}</p>}
              <div className="quote"><b>{r.quote.price.toFixed(2)}</b><span className={tone(r.quote.change)}>今日漲跌：{r.quote.change > 0 ? '+' : ''}{r.quote.change.toFixed(2)} / {signedPct(r.quote.changePct)}</span></div>
              <label>目前股數<DraftInput type="number" min="0" value={r.shares} onCommit={value => updateHolding(r.symbol, 'shares', parsePositive(value))} /></label>
              <label>平均成本<DraftInput type="number" min="0" step="0.01" value={r.avgCost} onCommit={value => updateHolding(r.symbol, 'avgCost', parsePositive(value))} /></label>
              {r.symbol === '00631L' ? <label>目標比例 %<DraftInput inputMode="decimal" value={targetDraft} onCommit={value => { const next = clampTarget(Number(value)); setTargetDraft(String(next)); updateHolding('00631L', 'targetWeight', next); }} /><small>限制 {MIN_GROWTH_TARGET}%～{MAX_GROWTH_TARGET}%，防守資產自動為 {pct(m.defensiveTargetPct)}。</small></label> : <p className="note">列入防守資產，不參與主動再平衡買賣。</p>}
              <strong>市值：{money(r.marketValue)}</strong>
              <strong className={tone(r.pnl)}>損益：{signedMoney(r.pnl)} / {signedPct(pnlPct)}</strong>
            </article>; })}
          </div>
        </Card>
        <Card title="資產配置"><Pie3D m={m} /></Card>
        <Card title="再平衡摘要">
          <div className="rebalance-summary">
            <div><small>00631L</small><b>{rb.stockAction}</b></div>
            <div><small>防守資產</small><b>目前 {money(rb.defensiveCurrent)}｜目標 {money(rb.defensiveTarget)}｜{rb.defensiveAction}</b></div>
            {rb.nonStrategy.map(item => <div key={item}><small>實際持股</small><b>{item}</b></div>)}
          </div>
          <div className="table rebalance-table">
            <div className="row head"><span>項目</span><span>目前比例</span><span>目標比例</span><span>差額</span><span>建議</span></div>
            {rb.rows.map(r => <div className="row" key={r.symbol}><span>{r.symbol}</span><span>{pct(r.currentWeight)}</span><span>{r.targetText}</span><span>{r.diffText}</span><b className={r.tone}>{r.action}</b></div>)}
          </div>
        </Card>
        <div className="two">
          <Card title="現金管理"><CashList items={state.cash} setItems={items => setState(s => ({ ...s, cash: items }))} /></Card>
          <Card title="借款管理">
            <div className="loan-summary"><Stat label="總借款" value={money(m.debt)} /><Stat label="每月還款" value={money(m.monthlyPayment)} /><Stat label="平均剩餘期數" value={m.averageRemainingMonths === undefined ? '—' : `${m.averageRemainingMonths.toFixed(1)} 期`} /></div>
            <LoanList items={state.loans} setItems={items => setState(s => ({ ...s, loans: items }))} />
          </Card>
        </div>
      </>}
      {tab === 'sync' && <Card title="Firebase / 備份 / 還原"><div className="params"><DraftInput value={state.firebase.databaseURL} onCommit={value => setState(s => ({ ...s, firebase: { ...s.firebase, databaseURL: value } }))} /><DraftInput value={state.firebase.secretPath} onCommit={value => setState(s => ({ ...s, firebase: { ...s.firebase, secretPath: value } }))} /><input placeholder="Cloudflare Worker URL" value={DEFAULT_WORKER_URL} readOnly /><DraftInput type="number" value={state.refreshSec} onCommit={value => setState(s => ({ ...s, refreshSec: Math.max(60, parsePositive(value, 60)) }))} /><label><input type="checkbox" checked={state.autoSync} onChange={e => setState(s => ({ ...s, autoSync: e.target.checked }))} /> 啟用 Firebase 手動同步設定</label><label>同步延遲秒數<DraftInput type="number" min="10" value={state.autoSyncSec} onCommit={value => setState(s => ({ ...s, autoSyncSec: Math.max(10, parsePositive(value, 60)) }))} /></label></div><div className="actions"><button onClick={() => uploadCloud().catch(e => setSync('上傳失敗：' + e.message))}>上傳雲端</button><button onClick={() => downloadCloud().catch(e => setSync('下載失敗：' + e.message))}>下載雲端</button><button onClick={backup}>備份 JSON</button><label className="file">還原 JSON<input type="file" accept="application/json" onChange={e => restore(e.target.files?.[0])} /></label><button onClick={() => setState(defaultState)}>重設</button></div><p><b>目前同步路徑：</b>{state.firebase.databaseURL ? syncPath(state.firebase) : '尚未設定 Firebase URL'}</p><p><b>目前 Worker：</b>{DEFAULT_WORKER_URL}</p><p>{sync}</p><p className="note">Firebase 不會自動下載覆蓋本機資料；只有手動按「下載雲端」才會套用雲端資料。</p></Card>}
    </main>
  );
}
export default App;
