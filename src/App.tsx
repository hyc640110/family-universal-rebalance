import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type SymbolCode = string;
type TradeAction = 'BUY' | 'SELL' | 'DIVIDEND';
type Quote = { symbol: SymbolCode; name: string; price: number; previousClose: number; change: number; changePct: number; volume: number; source: string; updatedAt: string; error?: string };
type Holding = { symbol: SymbolCode; shares: number; avgCost: number; targetWeight?: number };
type CashItem = { id: string; name: string; amount: number; note: string };
type LoanItem = { id: string; name: string; principal: number; annualRate: number; monthlyPayment: number; startDate: string };
type Trade = { id: string; date: string; symbol: SymbolCode; action: TradeAction; shares: number; price: number; fee: number; tax: number; note: string };
type FirebaseConfig = { databaseURL: string; secretPath: string };
type AppState = { holdings: Holding[]; cash: CashItem[]; loans: LoanItem[]; trades: Trade[]; refreshSec: number; firebase: FirebaseConfig; workerUrl: string; autoSync: boolean; autoSyncSec: number };

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
const pct = (n: number) => `${num(n).toFixed(2)}%`;
const tw = (iso: string) => new Date(iso).toLocaleString('zh-TW');
const clampTarget = (value: number) => Math.min(MAX_GROWTH_TARGET, Math.max(MIN_GROWTH_TARGET, num(value) || DEFAULT_GROWTH_TARGET));
const growthTargetOf = (state: Pick<AppState, 'holdings'>) => clampTarget(state.holdings.find(h => h.symbol === '00631L')?.targetWeight ?? DEFAULT_GROWTH_TARGET);

const defaultQuotes: Record<SymbolCode, Quote> = {
  '00631L': { symbol: '00631L', name: '元大台灣50正2', price: 38.42, previousClose: 37.61, change: 0.81, changePct: 2.15, volume: 0, source: '內建備援', updatedAt: now() },
  '00865B': { symbol: '00865B', name: '國泰US短期公債', price: 48.52, previousClose: 48.41, change: 0.11, changePct: 0.23, volume: 0, source: '內建備援', updatedAt: now() }
};
function uniqueSymbols(state?: Partial<AppState>): SymbolCode[] {
  const fromState = state?.holdings?.map(h => h.symbol) || [];
  const fromTrades = state?.trades?.map(t => t.symbol) || [];
  return Array.from(new Set([...DEFAULT_SYMBOLS, ...fromState, ...fromTrades].filter(s => s && !REMOVED_SYMBOLS.has(s))));
}
function backupQuote(symbol: SymbolCode, holding?: Holding): Quote {
  const base = defaultQuotes[symbol];
  const price = num(holding?.avgCost || base?.price || 0);
  return { ...(base || { symbol, name: symbol, volume: 0 }), symbol, price, previousClose: price, change: 0, changePct: 0, volume: base?.volume || 0, source: holding?.avgCost ? '平均成本備援' : '無股價資料', updatedAt: now() };
}
const defaultState: AppState = {
  holdings: [
    { symbol: '00631L', shares: 0, avgCost: 0, targetWeight: DEFAULT_GROWTH_TARGET }
  ],
  cash: [{ id: uid(), name: '現金', amount: 0, note: '防守資產' }],
  loans: [{ id: uid(), name: '信貸', principal: 0, annualRate: 6.5, monthlyPayment: 10000, startDate: new Date().toISOString().slice(0, 10) }],
  trades: [], refreshSec: 60,
  firebase: { databaseURL: '', secretPath: '631128' }, workerUrl: DEFAULT_WORKER_URL, autoSync: false, autoSyncSec: 60
};
const LEGACY_KEYS = ['strategy', 'strategies', 'targetAllocation', 'assetAllocation', 'portfolioSummary', 'strategyTotal', 'defaultHoldings', 'defaultTrades', 'monthlyContribution', 'simCagr', 'simDividend', 'simYears'];
const removedSymbol = () => Array.from(REMOVED_SYMBOLS)[0];
function hasRemovedSymbol(value: unknown) { return String(value ?? '').includes(removedSymbol()); }
function sanitizeHolding(h: Holding): Holding | null {
  if (!h?.symbol || REMOVED_SYMBOLS.has(h.symbol)) return null;
  if (h.symbol === '00631L') return { ...h, targetWeight: clampTarget(Number(h.targetWeight ?? DEFAULT_GROWTH_TARGET)) };
  const { targetWeight: _targetWeight, ...actualHolding } = h;
  return actualHolding;
}
function sanitizeCashItem(c: CashItem): CashItem | null {
  if ([c?.id, c?.name, c?.note].some(hasRemovedSymbol)) return null;
  return c;
}
function normalizeState(raw: unknown): AppState {
  const r = raw && typeof raw === 'object' ? raw as Partial<AppState> : {};
  LEGACY_KEYS.forEach((key) => delete (r as Record<string, unknown>)[key]);
  const s = { ...defaultState, ...r };
  const holdings = (Array.isArray(s.holdings) ? s.holdings : defaultState.holdings).map(sanitizeHolding).filter(Boolean) as Holding[];
  const has00631L = holdings.some(h => h.symbol === '00631L');
  const trades = (Array.isArray(s.trades) ? s.trades : []).filter(t => t?.symbol && !REMOVED_SYMBOLS.has(t.symbol));
  const cash = (Array.isArray(s.cash) ? s.cash : defaultState.cash).map(sanitizeCashItem).filter(Boolean) as CashItem[];
  return { ...s, holdings: has00631L ? holdings : [...defaultState.holdings, ...holdings], cash, loans: Array.isArray(s.loans) ? s.loans : defaultState.loans, trades, firebase: { ...defaultState.firebase, ...(s.firebase || {}) }, workerUrl: DEFAULT_WORKER_URL, refreshSec: Math.max(15, num(Number(s.refreshSec || 60))), autoSync: Boolean(s.autoSync), autoSyncSec: Math.max(10, num(Number(s.autoSyncSec || 60))) };
}
function readState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || OLD_STORAGE_KEYS.map(key => localStorage.getItem(key)).find(Boolean) || '{}';
    const normalized = normalizeState(JSON.parse(raw));
    const json = JSON.stringify(normalized);
    if (raw !== json) {
      localStorage.setItem(STORAGE_KEY, json);
    }
    return normalized;
  } catch { return defaultState; }
}
function writeState(s: AppState) { const v = normalizeState(s); localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); }
function syncPath(config: FirebaseConfig) { return `portfolio/${encodeURIComponent(config.secretPath || '631128')}`; }
function syncUrl(config: FirebaseConfig) { const db = config.databaseURL.trim(); if (!db) throw new Error('請先輸入 Firebase URL'); return `${db.replace(/\/$/, '')}/${syncPath(config)}.json`; }
async function uploadFirebase(config: FirebaseConfig, state: AppState) { const res = await fetch(syncUrl(config), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(normalizeState(state)) }); if (!res.ok) throw new Error(`Firebase ${res.status}`); }
async function downloadFirebase(config: FirebaseConfig) { const res = await fetch(syncUrl(config), { cache: 'no-store' }); if (!res.ok) throw new Error(`Firebase ${res.status}`); const data = await res.json(); if (!data) throw new Error(`找不到雲端資料：${syncPath(config)}`); const normalized = normalizeState({ ...data, firebase: { ...config, ...(data.firebase || {}) } }); await uploadFirebase(config, normalized); return normalized; }
function parseWorkerQuote(symbol: SymbolCode, data: unknown): Quote | null { const d = data as { price?: number; previousClose?: number; prev?: number; volume?: number; source?: string }; if (typeof d?.price !== 'number') return null; const prev = Number(d.previousClose ?? d.prev ?? d.price); return { ...backupQuote(symbol), symbol, price: d.price, previousClose: prev, change: d.price - prev, changePct: prev ? (d.price - prev) / prev * 100 : 0, volume: Number(d.volume ?? 0), source: d.source || 'Yahoo Finance via Cloudflare Worker', updatedAt: now() }; }
async function fetchQuote(symbol: SymbolCode, holding?: Holding): Promise<Quote> { const url = `${DEFAULT_WORKER_URL}/?symbol=${encodeURIComponent(symbol)}`; try { const res = await fetch(url, { cache: 'no-store' }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error((data as { error?: string }).error || `Worker ${res.status}`); const q = parseWorkerQuote(symbol, data); if (!q) throw new Error(`Worker 回傳格式不正確：${JSON.stringify(data).slice(0, 80)}`); return q; } catch (error) { return { ...backupQuote(symbol, holding), source: holding?.avgCost ? '平均成本備援 / Worker 連線失敗' : '離線備援 / Worker 連線失敗', updatedAt: now(), error: error instanceof Error ? error.message : String(error) }; } }
function derivedHoldings(state: AppState): Holding[] {
  const map = Object.fromEntries(state.holdings.map(h => [h.symbol, { ...h, cost: num(h.shares) * num(h.avgCost) }])) as Record<SymbolCode, Holding & { cost: number }>;
  [...state.trades].reverse().forEach(t => {
    const h = map[t.symbol] ||= { symbol: t.symbol, shares: 0, avgCost: 0, cost: 0 };
    const shares = Math.max(0, num(t.shares)); const price = Math.max(0, num(t.price)); const fee = Math.max(0, num(t.fee));
    if (t.action === 'BUY') { h.cost += shares * price + fee; h.shares += shares; h.avgCost = h.shares ? h.cost / h.shares : 0; }
    if (t.action === 'SELL') { const sell = Math.min(shares, h.shares); const avg = h.shares ? h.cost / h.shares : 0; h.shares -= sell; h.cost = Math.max(0, h.cost - sell * avg); h.avgCost = h.shares ? h.cost / h.shares : 0; }
  });
  return uniqueSymbols(state).map(s => map[s] || { symbol: s, shares: 0, avgCost: 0, ...(s === '00631L' ? { targetWeight: growthTargetOf(state) } : {}) });
}
function calculateMetrics(state: AppState, quotes: Record<SymbolCode, Quote>) { const rows = derivedHoldings(state).map(h => { const q = quotes[h.symbol] || backupQuote(h.symbol, h); const hasLatestPrice = !q.error && !q.source.includes('備援') && num(q.price) > 0; const price = hasLatestPrice ? num(q.price) : num(h.avgCost) || num(q.price); const quote = hasLatestPrice ? q : { ...q, price, previousClose: price, change: 0, changePct: 0, source: h.avgCost ? '平均成本備援' : q.source }; const marketValue = h.shares * price; const cost = h.shares * h.avgCost; const pnl = marketValue - cost; const dayPnl = h.shares * quote.change; return { ...h, quote, marketValue, cost, pnl, dayPnl }; }); const stocks = rows.reduce((a, r) => a + r.marketValue, 0); const cash = state.cash.reduce((a, c) => a + num(c.amount), 0); const debt = state.loans.reduce((a, l) => a + num(l.principal), 0); const totalAssets = stocks + cash; const netWorth = totalAssets - debt; const dayPnl = rows.reduce((a, r) => a + r.dayPnl, 0); const growth = rows.find(r => r.symbol === '00631L')?.marketValue || 0; const defensiveHoldings = rows.filter(r => r.symbol !== '00631L'); const defensiveHoldingsValue = defensiveHoldings.reduce((a, r) => a + r.marketValue, 0); const defensive = cash + defensiveHoldingsValue; const growthTargetPct = growthTargetOf(state); const defensiveTargetPct = 100 - growthTargetPct; const beta = rows.reduce((a, r) => a + (r.symbol === '00631L' ? 2 : 0.05) * (totalAssets ? r.marketValue / totalAssets : 0), 0); const cashRatio = totalAssets ? cash / totalAssets * 100 : 0; const defensiveRatio = totalAssets ? defensive / totalAssets * 100 : 0; const leverage = netWorth > 0 ? totalAssets / netWorth : 0; return { rows, stocks, cash, debt, totalAssets, netWorth, dayPnl, growth, defensive, defensiveHoldings, defensiveHoldingsValue, growthTargetPct, defensiveTargetPct, beta, cashRatio, defensiveRatio, leverage }; }
function rebalance(state: AppState, quotes: Record<SymbolCode, Quote>) { const m = calculateMetrics(state, quotes); const stock = m.rows.find(r => r.symbol === '00631L') || { symbol: '00631L', quote: backupQuote('00631L'), marketValue: 0 }; const stockTarget = m.totalAssets * (m.growthTargetPct / 100); const defensiveTarget = m.totalAssets * (m.defensiveTargetPct / 100); const stockDiff = stockTarget - stock.marketValue; const defensiveDiff = defensiveTarget - m.defensive; const stockShares = Math.round(Math.abs(stockDiff) / Math.max(0.01, stock.quote.price)); const stockAction = Math.abs(stockDiff) < 1000 ? '維持持有' : `建議${stockDiff >= 0 ? '買入' : '賣出'} ${stockShares.toLocaleString('zh-TW')} 股，約 ${money(Math.abs(stockDiff))}`; const defensiveAction = Math.abs(defensiveDiff) < 1000 ? '維持防守資產' : defensiveDiff > 0 ? `需增加防守資產約 ${money(defensiveDiff)}` : `可使用現金約 ${money(Math.abs(defensiveDiff))}`; const bondRows = m.defensiveHoldings.map(r => ({ symbol: `其中 ${r.symbol}`, currentWeight: m.totalAssets ? r.marketValue / m.totalAssets * 100 : 0, targetText: '—', diffText: '—', action: '保留實際持股，不參與再平衡', tone: 'hold' })); const rows = [{ symbol: '00631L', currentWeight: m.totalAssets ? stock.marketValue / m.totalAssets * 100 : 0, targetText: pct(m.growthTargetPct), diffText: money(stockDiff), action: stockAction, tone: stockDiff >= 0 ? 'up' : 'down' }, { symbol: '防守資產', currentWeight: m.totalAssets ? m.defensive / m.totalAssets * 100 : 0, targetText: pct(m.defensiveTargetPct), diffText: money(defensiveDiff), action: defensiveAction, tone: 'hold' }, ...bondRows]; return { rows, stockAction, defensiveAction, defensiveCurrent: m.defensive, defensiveTarget, nonStrategy: m.defensiveHoldings.map(r => `${r.symbol}：保留實際持股，不參與再平衡`) }; }
function advice(m: ReturnType<typeof calculateMetrics>) { if (m.cashRatio < 8 || m.leverage > 1.6) return ['風險降溫', `現金水位偏低或槓桿偏高，先補防守資產；目前目標為 00631L ${pct(m.growthTargetPct)}、防守資產 ${pct(m.defensiveTargetPct)}。`, 'bad'] as const; if (m.dayPnl < -m.stocks * 0.05) return ['小跌加碼', `可分批補足低於自訂目標的部位，避免一次打滿；目前目標為 00631L ${pct(m.growthTargetPct)}。`, 'warn'] as const; return ['正常投入', `維持自訂目標配置；目前目標為 00631L ${pct(m.growthTargetPct)}、防守資產 ${pct(m.defensiveTargetPct)}。`, 'good'] as const; }
function Donut({ m }: { m: ReturnType<typeof calculateMetrics> }) { const parts = [{ label: '成長資產：00631L', value: m.growth }, { label: '防守資產', value: m.defensive }]; const sum = Math.max(1, m.totalAssets); let acc = 0; const colors = ['#60a5fa', '#34d399']; return <><svg viewBox="0 0 42 42" className="donut">{parts.map((p, i) => { const len = p.value / sum * 100; const off = 25 - acc; acc += len; return <circle key={p.label} cx="21" cy="21" r="15.9" fill="transparent" stroke={colors[i]} strokeWidth="6" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={off} />; })}<circle cx="21" cy="21" r="9" fill="#0b1729" /></svg><div className="allocation-detail"><div><h3>成長資產</h3><p>00631L：{pct(m.totalAssets ? m.growth / m.totalAssets * 100 : 0)}</p><small>目標：{pct(m.growthTargetPct)}</small></div><div><h3>防守資產</h3><p>現金：{pct(m.cashRatio)}</p>{m.defensiveHoldings.map(r => <p key={r.symbol}>{r.symbol}：{pct(m.totalAssets ? r.marketValue / m.totalAssets * 100 : 0)}</p>)}<p>合計：{pct(m.defensiveRatio)}</p><small>目標：{pct(m.defensiveTargetPct)}</small></div></div></>; }
function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className="stat"><small>{label}</small><b className={tone || ''}>{value}</b></div>; }
function Card({ title, children }: { title: string; children: ReactNode }) { return <section className="card"><h2>{title}</h2>{children}</section>; }
function EditableList<T extends { id: string } & Record<string, string | number>>({ items, setItems, fields }: { items: T[]; setItems: (v: T[]) => void; fields: [keyof T & string, string][] }) {
  const tenThousandKeys = ['amount', 'principal'];
  const emptyValue = (k: string) => k.toLowerCase().includes('date') ? new Date().toISOString().slice(0, 10) : ['amount', 'principal', 'annualRate', 'monthlyPayment'].includes(k) ? 0 : '';
  const columns = { gridTemplateColumns: `repeat(${fields.length}, minmax(120px, 1fr)) auto` };
  return <div className="list"><div className="list-row list-head" style={columns}>{fields.map(([k, l]) => <span key={k}>{tenThousandKeys.includes(k) ? `${l}（萬元）` : l}</span>)}<span>操作</span></div>{items.map(item => <div className="list-row" style={columns} key={item.id}>{fields.map(([k, l]) => {
    const raw = item[k];
    const isTenThousand = tenThousandKeys.includes(k);
    const displayLabel = isTenThousand ? `${l}（萬元）` : l;
    const displayValue = typeof raw === 'number' && isTenThousand ? raw / 10000 : raw;
    return <label key={k}><span>{displayLabel}</span><input type={typeof raw === 'number' ? 'number' : 'text'} value={displayValue} onChange={e => setItems(items.map(x => x.id === item.id ? { ...x, [k]: typeof raw === 'number' ? num(e.target.valueAsNumber) * (isTenThousand ? 10000 : 1) : e.target.value } : x))} /></label>;
  })}<button className="danger small" onClick={() => setItems(items.filter(x => x.id !== item.id))}>刪除</button></div>)}<button className="small" onClick={() => setItems([...items, { id: uid(), ...Object.fromEntries(fields.map(([k]) => [k, emptyValue(k)])) } as T])}>新增</button></div>;
}
function App() {
  const [tab, setTab] = useState<'dashboard' | 'trades' | 'sync'>('dashboard'); const [state, setState] = useState<AppState>(() => readState()); const [quotes, setQuotes] = useState<Record<SymbolCode, Quote>>(defaultQuotes); const [sync, setSync] = useState('尚未同步'); const [saveStatus, setSaveStatus] = useState('已載入'); const [lastSavedAt, setLastSavedAt] = useState(''); const didMount = useRef(false); const [quoteStatus, setQuoteStatus] = useState('尚未更新股價'); const [draft, setDraft] = useState<Trade>({ id: uid(), date: new Date().toISOString().slice(0, 10), symbol: '00631L', action: 'BUY', shares: 1, price: defaultQuotes['00631L'].price, fee: 20, tax: 0, note: '' });
  useEffect(() => { writeState(state); const savedAt = now(); setLastSavedAt(savedAt); setSaveStatus(didMount.current ? '已儲存' : '已載入'); if (didMount.current && !state.autoSync) setSync('尚未同步'); didMount.current = true; }, [state]);
  const symbols = useMemo(() => uniqueSymbols(state), [state.holdings, state.trades]);
  const refreshQuotes = async () => { setQuoteStatus('股價更新中…'); const normalized = normalizeState(state); if (normalized.workerUrl !== state.workerUrl) setState(normalized); const entries = await Promise.all(uniqueSymbols(normalized).map(async s => [s, await fetchQuote(s, normalized.holdings.find(h => h.symbol === s))] as const)); const next = { ...quotes, ...Object.fromEntries(entries) } as Record<SymbolCode, Quote>; setQuotes(next); const errors = entries.map(([, q]) => q).filter(q => q.error).map(q => `${q.symbol}: ${q.error}`); setQuoteStatus(errors.length ? `部分失敗：${errors.join(' / ')}` : `股價更新成功：${tw(now())}`); };
  const uploadCloud = async (label = 'Firebase 同步完成') => { setSync('上傳中…'); const normalized = normalizeState(state); setState(normalized); await uploadFirebase(normalized.firebase, normalized); setSync(`${label} ${tw(now())}｜${syncPath(normalized.firebase)}｜持股 ${normalized.holdings.length} 筆｜交易 ${normalized.trades.length} 筆`); };
  const downloadCloud = async () => { setSync('下載中…'); const remote = await downloadFirebase(state.firebase); setState(remote); setSync(`Firebase 同步完成 ${tw(now())}｜${syncPath(remote.firebase)}｜持股 ${remote.holdings.length} 筆｜交易 ${remote.trades.length} 筆`); };
  useEffect(() => { refreshQuotes(); const id = setInterval(refreshQuotes, Math.max(15, state.refreshSec) * 1000); return () => clearInterval(id); }, [state.refreshSec]);
  useEffect(() => { if (!state.autoSync || !state.firebase.databaseURL) { if (state.autoSync) setSync('尚未同步：請設定 Firebase URL'); return; } const id = setTimeout(() => uploadCloud('Firebase 同步完成').catch(e => setSync('同步失敗：' + e.message)), Math.max(10, state.autoSyncSec) * 1000); return () => clearTimeout(id); }, [state.holdings, state.cash, state.loans, state.trades, state.refreshSec, state.autoSync, state.autoSyncSec, state.firebase.databaseURL, state.firebase.secretPath]);
  const m = useMemo(() => calculateMetrics(state, quotes), [state, quotes]); const rb = useMemo(() => rebalance(state, quotes), [state, quotes]); const [mode, hint, tone] = advice(m);
  const updateHolding = (symbol: SymbolCode, key: keyof Holding, value: number) => setState(s => { const current = derivedHoldings(s).find(h => h.symbol === symbol); const base = s.holdings.find(h => h.symbol === symbol); const nextValue = key === 'targetWeight' ? clampTarget(value) : Math.max(0, num(value)); const adjustedValue = key === 'shares' ? Math.max(0, num(base?.shares ?? 0) + nextValue - num(current?.shares ?? 0)) : nextValue; const exists = s.holdings.some(h => h.symbol === symbol); const nextHolding: Holding = { symbol, shares: 0, avgCost: 0, ...(symbol === '00631L' ? { targetWeight: growthTargetOf(s) } : {}), [key]: adjustedValue }; return { ...s, holdings: exists ? s.holdings.map(h => h.symbol === symbol ? { ...h, [key]: adjustedValue } : h) : [...s.holdings, nextHolding] }; });
  const applyTrade = (t: Trade) => { setState(s => ({ ...s, trades: [t, ...s.trades] })); setDraft({ ...draft, id: uid() }); };
  const backup = () => { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `00631l-pro-version-1.0.0-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  const restore = async (f?: File) => { if (!f) return; setState(normalizeState(JSON.parse(await f.text()))); };
  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">{APP_VERSION}</p>
          <h1>00631L Pro</h1>
          <h3>台股槓桿投資管理</h3>
          <p>即時股價｜交易紀錄｜再平衡｜Firebase 雲端同步</p>
        </div>
        <button onClick={refreshQuotes}>更新股價</button>
      </header>

      <nav className="tabs">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>儀表板</button>
        <button className={tab === 'trades' ? 'active' : ''} onClick={() => setTab('trades')}>交易紀錄</button>
        <button className={tab === 'sync' ? 'active' : ''} onClick={() => setTab('sync')}>同步設定</button>
        <span>股價更新 {tw(Object.values(quotes)[0].updatedAt)}｜{saveStatus}{lastSavedAt ? ` ${tw(lastSavedAt)}` : ''}｜{sync}</span>
      </nav>

      {tab === 'dashboard' && <>
        <section className="grid stats">
          <Stat label="總資產" value={money(m.totalAssets)} />
          <Stat label="今日損益" value={money(m.dayPnl)} tone={m.dayPnl >= 0 ? 'up' : 'down'} />
          <Stat label="淨資產" value={money(m.netWorth)} />
          <Stat label="借款" value={money(m.debt)} tone="warn" />
          <Stat label="Beta" value={m.beta.toFixed(2)} />
          <Stat label="防守資產比例" value={pct(m.defensiveRatio)} />
          <Stat label="槓桿比例" value={m.leverage.toFixed(2) + 'x'} />
          <Stat label="策略模式" value={mode} tone={tone} />
        </section>

        <Card title="AI 分析與加碼建議">
          <h3>{mode}</h3>
          <p>{hint}</p>
          <p>Beta {m.beta.toFixed(2)}、防守資產 {pct(m.defensiveRatio)}、槓桿 {m.leverage.toFixed(2)}x。成本與股數會隨持股、交易、現金與自訂目標即時更新。</p>
          <small>資料來源：{m.rows.map(r => `${r.symbol}=${r.quote.source}`).join(' / ')}</small>
          <p className="note">{quoteStatus}</p>
        </Card>

        <Card title="持股配置">
          <div className="holdings">
            {m.rows.map(r => <article className="holding" key={r.symbol}>
              <h3>{r.symbol}</h3>
              <p>{r.quote.name}</p>
              <p>來源：{r.quote.source}｜更新：{tw(r.quote.updatedAt)}</p>
              {r.quote.error && <p className="note">錯誤：{r.quote.error}</p>}
              <div className="quote"><b>{r.quote.price.toFixed(2)}</b><span className={r.quote.change >= 0 ? 'up' : 'down'}>{r.quote.change.toFixed(2)} / {pct(r.quote.changePct)}</span></div>
              <label>目前股數<input type="number" min="0" value={r.shares} onChange={e => updateHolding(r.symbol, 'shares', num(e.target.valueAsNumber))} /></label>
              <label>平均成本<input type="number" min="0" step="0.01" value={r.avgCost} onChange={e => updateHolding(r.symbol, 'avgCost', num(e.target.valueAsNumber))} /></label>
              {r.symbol === '00631L' ? <label>目標比例 %<input type="number" min={MIN_GROWTH_TARGET} max={MAX_GROWTH_TARGET} value={m.growthTargetPct} onChange={e => updateHolding('00631L', 'targetWeight', num(e.target.valueAsNumber))} /><small>限制 {MIN_GROWTH_TARGET}%～{MAX_GROWTH_TARGET}%，防守資產自動為 {pct(m.defensiveTargetPct)}。</small></label> : <p className="note">列入防守資產，不參與主動再平衡買賣。</p>}
              <strong>市值 {money(r.marketValue)}</strong>
              <strong>損益 {money(r.pnl)} / {pct(r.cost ? r.pnl / r.cost * 100 : 0)}</strong>
            </article>)}
          </div>
        </Card>

        <Card title="資產配置"><Donut m={m} /></Card>

        <Card title="再平衡摘要">
          <div className="rebalance-summary">
            <div><small>00631L</small><b>{rb.stockAction}</b></div>
            <div><small>防守資產</small><b>目前 {money(rb.defensiveCurrent)}｜目標 {money(rb.defensiveTarget)}｜{rb.defensiveAction}</b></div>
            {rb.nonStrategy.map(item => <div key={item}><small>實際持股</small><b>{item}</b></div>)}
          </div>
          <div className="table rebalance-table">
            <div className="row head"><span>項目</span><span>目前比例</span><span>目標比例</span><span>差額</span><span>建議</span></div>
            {rb.rows.map(r => <div className="row" key={r.symbol}>
              <span>{r.symbol}</span>
              <span>{pct(r.currentWeight)}</span>
              <span>{r.targetText}</span>
              <span>{r.diffText}</span>
              <b className={r.tone}>{r.action}</b>
            </div>)}
          </div>
        </Card>

        <div className="two">
          <Card title="現金管理"><EditableList items={state.cash as (CashItem & Record<string, string | number>)[]} setItems={items => setState(s => ({ ...s, cash: items as CashItem[] }))} fields={[["name", "名稱"], ["amount", "金額"], ["note", "備註"]]} /></Card>
          <Card title="借款管理"><EditableList items={state.loans as (LoanItem & Record<string, string | number>)[]} setItems={items => setState(s => ({ ...s, loans: items as LoanItem[] }))} fields={[["name", "名稱"], ["principal", "本金"], ["annualRate", "利率%"], ["monthlyPayment", "月付金"], ["startDate", "起始日"]]} /></Card>
        </div>
      </>}

      {tab === 'trades' && <Card title="交易紀錄"><div className="trade-form"><input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /><select value={draft.symbol} onChange={e => setDraft({ ...draft, symbol: e.target.value as SymbolCode })}>{symbols.map(s => <option key={s}>{s}</option>)}</select><select value={draft.action} onChange={e => setDraft({ ...draft, action: e.target.value as TradeAction })}><option value="BUY">買進</option><option value="SELL">賣出</option><option value="DIVIDEND">配息</option></select><input type="number" value={draft.shares} onChange={e => setDraft({ ...draft, shares: num(e.target.valueAsNumber) })} /><input type="number" value={draft.price} onChange={e => setDraft({ ...draft, price: num(e.target.valueAsNumber) })} /><input placeholder="手續費" type="number" value={draft.fee} onChange={e => setDraft({ ...draft, fee: num(e.target.valueAsNumber) })} /><input placeholder="證交稅" type="number" value={draft.tax} onChange={e => setDraft({ ...draft, tax: num(e.target.valueAsNumber) })} /><input placeholder="備註" value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} /><button onClick={() => applyTrade(draft)}>新增交易</button></div><p className="note">買進會增加股數與平均成本；賣出會減少股數，平均成本用移動平均法自動延續。</p><div className="table">{state.trades.map(t => <div className="row" key={t.id}><span>{t.date}</span><span>{t.symbol}</span><span>{t.action}</span><span>{t.shares} 股 @ {t.price}</span><b>{money(t.price * t.shares + t.fee + t.tax)}</b><button onClick={() => setState(s => ({ ...s, trades: s.trades.filter(x => x.id !== t.id) }))}>刪除</button></div>)}</div></Card>}

      {tab === 'sync' && <Card title="Firebase / 備份 / 還原"><div className="params"><input placeholder="Firebase Realtime Database URL" value={state.firebase.databaseURL} onChange={e => setState(s => ({ ...s, firebase: { ...s.firebase, databaseURL: e.target.value } }))} /><input placeholder="自訂個人密鑰" value={state.firebase.secretPath} onChange={e => setState(s => ({ ...s, firebase: { ...s.firebase, secretPath: e.target.value } }))} /><input placeholder="Cloudflare Worker URL" value={DEFAULT_WORKER_URL} readOnly /><input type="number" value={state.refreshSec} onChange={e => setState(s => ({ ...s, refreshSec: num(e.target.valueAsNumber) }))} /><label><input type="checkbox" checked={state.autoSync} onChange={e => setState(s => ({ ...s, autoSync: e.target.checked }))} /> 啟用 Firebase 自動同步</label><label>自動同步秒數<input type="number" min="10" value={state.autoSyncSec} onChange={e => setState(s => ({ ...s, autoSyncSec: num(e.target.valueAsNumber) }))} /></label></div><div className="actions"><button onClick={() => uploadCloud().catch(e => setSync('上傳失敗：' + e.message))}>上傳雲端</button><button onClick={() => downloadCloud().catch(e => setSync('下載失敗：' + e.message))}>下載雲端</button><button onClick={backup}>備份 JSON</button><label className="file">還原 JSON<input type="file" accept="application/json" onChange={e => restore(e.target.files?.[0])} /></label><button onClick={() => setState(defaultState)}>重設</button></div><p><b>目前同步路徑：</b>{state.firebase.databaseURL ? syncPath(state.firebase) : '尚未設定 Firebase URL'}</p><p><b>目前 Worker：</b>{DEFAULT_WORKER_URL}</p><p>{sync}</p><p className="note">Worker URL 已固定使用正確網址 fancy-dew-4128。手機與電腦需使用相同 Firebase URL 與個人密鑰。</p></Card>}
    </main>
  );
}
export default App;
