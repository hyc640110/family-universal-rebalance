import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, SetStateAction } from 'react';

type SymbolCode = string;
type Quote = { symbol: SymbolCode; name: string; price: number; previousClose: number; change: number; changePct: number; volume: number; source: string; updatedAt: string; error?: string };
type Holding = { symbol: SymbolCode; shares: number; avgCost: number; targetWeight?: number };
type CashItem = { id: string; name: string; amount: number; note: string };
type LoanItem = { id: string; name: string; principal: number; annualRate: number; monthlyPayment: number; startDate: string; totalMonths?: number };
type FirebaseConfig = { databaseURL: string; secretPath: string };
type RebalanceMode = 'standard' | 'buy-only';
type AppState = { holdings: Holding[]; cash: CashItem[]; loans: LoanItem[]; refreshSec: number; firebase: FirebaseConfig; workerUrl: string; autoSync: boolean; autoSyncSec: number; rebalanceMode: RebalanceMode; rebalanceThreshold: number };
type SyncMeta = { dirty: boolean; lastUploadAt?: string; lastDownloadAt?: string; status: string };
type BackupPayload = { version: string; exportedAt: string; holdings: Holding[]; cashAccounts: CashItem[]; loans: LoanItem[]; targetRatio: number; rebalanceMode: string; rebalanceThreshold: number; syncSettings: { refreshSec: number; autoSync: boolean; autoSyncSec: number; workerUrl: string; firebaseConfigured: boolean } };

const APP_VERSION = 'Version 1.0.0';
const STORAGE_KEY = '00631l-pro-v100-state';
const SYNC_META_KEY = '00631l-pro-v100-sync-meta';
const OLD_STORAGE_KEYS = ['00631l-pro-v62-state', '00631l-pro-v61-state'];
const DEFAULT_WORKER_URL = 'https://fancy-dew-4128.hyc640110.workers.dev';
const REMOVED_SYMBOLS = new Set<SymbolCode>([['00', '50'].join('')]);
const DEFAULT_SYMBOLS: SymbolCode[] = ['00631L'];
const DEFAULT_GROWTH_TARGET = 70;
const MIN_GROWTH_TARGET = 30;
const MAX_GROWTH_TARGET = 90;
const DEFAULT_REBALANCE_MODE: RebalanceMode = 'buy-only';
const DEFAULT_REBALANCE_THRESHOLD = 5;
const MAX_REBALANCE_THRESHOLD = 20;
const flushFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();
const num = (n: number) => Number.isFinite(n) ? n : 0;
const money = (n: number) => n.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });
const signedMoney = (n: number) => `${n > 0 ? '+' : ''}${money(n)}`;
const pct = (n: number) => `${num(n).toFixed(2)}%`;
const signedPct = (n: number) => `${n > 0 ? '+' : ''}${pct(n)}`;
const tw = (iso: string) => new Date(iso).toLocaleString('zh-TW');
const backupStamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};
const clampTarget = (value: number) => Math.min(MAX_GROWTH_TARGET, Math.max(MIN_GROWTH_TARGET, num(value) || DEFAULT_GROWTH_TARGET));
const growthTargetOf = (state: Pick<AppState, 'holdings'>) => clampTarget(state.holdings.find(h => h.symbol === '00631L')?.targetWeight ?? DEFAULT_GROWTH_TARGET);
const tone = (value: number) => value > 0 ? 'up' : value < 0 ? 'down' : 'hold';
const normalizeRebalanceMode = (value: unknown): RebalanceMode => value === 'standard' ? 'standard' : DEFAULT_REBALANCE_MODE;
const clampRebalanceThreshold = (value: number) => Math.min(MAX_REBALANCE_THRESHOLD, Math.max(0, num(value) || 0));
const rebalanceModeLabel = (mode: RebalanceMode) => mode === 'standard' ? '標準再平衡' : '只買不賣';

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
  autoSyncSec: 60,
  rebalanceMode: DEFAULT_REBALANCE_MODE,
  rebalanceThreshold: DEFAULT_REBALANCE_THRESHOLD
};

const REMOVED_RECORD_KEY = ['tra', 'des'].join('');
const STALE_KEYS = ['strategy', 'strategies', 'targetAllocation', 'assetAllocation', 'portfolioSummary', 'strategyTotal', 'defaultHoldings', ['default', 'Tr', 'ades'].join(''), 'monthlyContribution', 'simCagr', 'simDividend', 'simYears', REMOVED_RECORD_KEY];
const removedSymbol = () => Array.from(REMOVED_SYMBOLS)[0];
function hasRemovedSymbol(value: unknown) { return String(value ?? '').includes(removedSymbol()); }
function removedSymbolMessage() { return `${removedSymbol()} 已從正式策略移除，請勿在現金項目中使用 ${removedSymbol()} 作為名稱或備註。`; }
function uniqueSymbols(state?: Partial<AppState>): SymbolCode[] {
  const fromState = state?.holdings?.map(h => h.symbol) || [];
  return Array.from(new Set([...DEFAULT_SYMBOLS, ...fromState].filter(s => s && !REMOVED_SYMBOLS.has(s))));
}
function backupQuote(symbol: SymbolCode, holding?: Holding): Quote {
  const base = defaultQuotes[symbol];
  const price = num(holding?.avgCost || base?.price || 0);
  return { ...(base || { symbol, name: symbol, volume: 0 }), symbol, price, previousClose: price, change: 0, changePct: 0, volume: base?.volume || 0, source: holding?.avgCost ? '成交均價備援' : '無股價資料', updatedAt: now() };
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
  return { holdings: has00631L ? holdings : [...defaultState.holdings, ...holdings], cash, loans, firebase: { ...defaultState.firebase, ...(s.firebase || {}) }, workerUrl: DEFAULT_WORKER_URL, refreshSec: Math.max(15, num(Number(s.refreshSec || 60))), autoSync: Boolean(s.autoSync), autoSyncSec: Math.max(10, num(Number(s.autoSyncSec || 60))), rebalanceMode: normalizeRebalanceMode(s.rebalanceMode), rebalanceThreshold: clampRebalanceThreshold(Number(s.rebalanceThreshold ?? DEFAULT_REBALANCE_THRESHOLD)) };
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
function backupPayload(state: AppState): BackupPayload {
  const normalized = normalizeState(state);
  return { version: APP_VERSION, exportedAt: now(), holdings: normalized.holdings, cashAccounts: normalized.cash, loans: normalized.loans, targetRatio: growthTargetOf(normalized), rebalanceMode: normalized.rebalanceMode, rebalanceThreshold: normalized.rebalanceThreshold, syncSettings: { refreshSec: normalized.refreshSec, autoSync: normalized.autoSync, autoSyncSec: normalized.autoSyncSec, workerUrl: DEFAULT_WORKER_URL, firebaseConfigured: Boolean(normalized.firebase.databaseURL) } };
}
function backupHasRemovedStrategy(raw: unknown) {
  const r = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const keys = ['holdings', 'assets', 'assetAllocation', 'rebalance', 'strategy', 'strategies', 'defaultHoldings', 'mock', 'fallback', 'demo', 'legacy', 'cashAccounts', 'cash'];
  return keys.some(key => hasRemovedSymbol(JSON.stringify(r[key] ?? '')));
}
function stateFromBackup(raw: unknown, current: AppState): AppState {
  if (!raw || typeof raw !== 'object') throw new Error('備份檔格式不正確。');
  if (backupHasRemovedStrategy(raw)) throw new Error(`${removedSymbol()} 已從正式策略移除，備份檔含有已移除的 ${removedSymbol()} 策略資料，請確認後再匯入。`);
  const r = raw as Partial<BackupPayload> & { cash?: CashItem[]; firebase?: FirebaseConfig };
  if (!Array.isArray(r.holdings) || !Array.isArray(r.loans) || !Array.isArray(r.cashAccounts || r.cash)) throw new Error('備份檔缺少 holdings / cashAccounts / loans。');
  const targetRatio = clampTarget(Number(r.targetRatio ?? r.holdings.find(h => h.symbol === '00631L')?.targetWeight ?? DEFAULT_GROWTH_TARGET));
  return normalizeState({ ...current, holdings: r.holdings.map(h => h.symbol === '00631L' ? { ...h, targetWeight: targetRatio } : h), cash: r.cashAccounts || r.cash, loans: r.loans, refreshSec: r.syncSettings?.refreshSec ?? current.refreshSec, autoSync: r.syncSettings?.autoSync ?? current.autoSync, autoSyncSec: r.syncSettings?.autoSyncSec ?? current.autoSyncSec, rebalanceMode: normalizeRebalanceMode(r.rebalanceMode ?? current.rebalanceMode), rebalanceThreshold: clampRebalanceThreshold(Number(r.rebalanceThreshold ?? current.rebalanceThreshold)), firebase: current.firebase });
}
function defaultSyncStatus(state: AppState) { return state.firebase.databaseURL ? '本機已儲存，尚未上傳雲端' : '尚未設定 Firebase，同步僅保存在本機'; }
function readSyncMeta(state: AppState): SyncMeta {
  try {
    const meta = JSON.parse(localStorage.getItem(SYNC_META_KEY) || '{}') as Partial<SyncMeta>;
    return { dirty: Boolean(meta.dirty), lastUploadAt: meta.lastUploadAt, lastDownloadAt: meta.lastDownloadAt, status: meta.status || defaultSyncStatus(state) };
  } catch { return { dirty: false, status: defaultSyncStatus(state) }; }
}
function writeSyncMeta(meta: SyncMeta) { localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta)); }
function localDirtyStatus(state: AppState) {
  return state.firebase.databaseURL ? '本機有新資料，請按「上傳雲端」同步到其他裝置' : '本機有新資料，尚未設定 Firebase，同步僅保存在本機';
}
function validateBeforeUpload(s: AppState) {
  if (s.holdings.some(h => REMOVED_SYMBOLS.has(h.symbol))) throw new Error(`${removedSymbol()} 已從正式策略移除，不能出現在持股資料。`);
  if (s.cash.some(c => [c.name, c.note].some(hasRemovedSymbol))) throw new Error(removedSymbolMessage());
}
function waitForDraftCommit() {
  return new Promise<void>(resolve => setTimeout(resolve, 0)).then(flushFrame).then(flushFrame);
}
function syncPath(config: FirebaseConfig) { return `portfolio/${encodeURIComponent(config.secretPath || '631128')}`; }
function syncUrl(config: FirebaseConfig) { const db = config.databaseURL.trim(); if (!db) throw new Error('請先輸入 Firebase URL'); return `${db.replace(/\/$/, '')}/${syncPath(config)}.json`; }
async function uploadFirebase(config: FirebaseConfig, state: AppState) { const res = await fetch(syncUrl(config), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(normalizeState(state)) }); if (!res.ok) throw new Error(`Firebase ${res.status}`); }
async function downloadFirebase(config: FirebaseConfig) { const res = await fetch(syncUrl(config), { cache: 'no-store' }); if (!res.ok) throw new Error(`Firebase ${res.status}`); const data = await res.json(); if (!data) throw new Error(`找不到雲端資料：${syncPath(config)}`); return normalizeState({ ...data, firebase: { ...config, ...(data.firebase || {}) } }); }
function parseWorkerQuote(symbol: SymbolCode, data: unknown): Quote | null { const d = data as { price?: number; previousClose?: number; prev?: number; volume?: number; source?: string }; if (typeof d?.price !== 'number') return null; const prev = Number(d.previousClose ?? d.prev ?? d.price); return { ...backupQuote(symbol), symbol, price: d.price, previousClose: prev, change: d.price - prev, changePct: prev ? (d.price - prev) / prev * 100 : 0, volume: Number(d.volume ?? 0), source: d.source || 'Yahoo Finance via Cloudflare Worker', updatedAt: now() }; }
async function fetchQuote(symbol: SymbolCode, holding?: Holding): Promise<Quote> { const url = `${DEFAULT_WORKER_URL}/?symbol=${encodeURIComponent(symbol)}`; try { const res = await fetch(url, { cache: 'no-store' }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error((data as { error?: string }).error || `Worker ${res.status}`); const q = parseWorkerQuote(symbol, data); if (!q) throw new Error(`Worker 回傳格式不正確：${JSON.stringify(data).slice(0, 80)}`); return q; } catch (error) { return { ...backupQuote(symbol, holding), source: holding?.avgCost ? '成交均價備援 / Worker 連線失敗' : '離線備援 / Worker 連線失敗', updatedAt: now(), error: error instanceof Error ? error.message : String(error) }; } }

function derivedHoldings(state: AppState): Holding[] {
  const map = Object.fromEntries(state.holdings.map(h => [h.symbol, h])) as Record<SymbolCode, Holding>;
  return uniqueSymbols(state).map(s => map[s] || { symbol: s, shares: 0, avgCost: 0, ...(s === '00631L' ? { targetWeight: growthTargetOf(state) } : {}) });
}
function calculateMetrics(state: AppState, quotes: Record<SymbolCode, Quote>) {
  const rows = derivedHoldings(state).map(h => { const q = quotes[h.symbol] || backupQuote(h.symbol, h); const hasLatestPrice = !q.error && !q.source.includes('備援') && num(q.price) > 0; const price = hasLatestPrice ? num(q.price) : num(h.avgCost) || num(q.price); const quote = hasLatestPrice ? q : { ...q, price, previousClose: price, change: 0, changePct: 0, source: h.avgCost ? '成交均價備援' : q.source }; const marketValue = h.shares * price; const cost = h.shares * h.avgCost; const pnl = marketValue - cost; const dayPnl = h.shares * quote.change; return { ...h, quote, marketValue, cost, pnl, dayPnl }; });
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
  const repaymentSafetyMonths = monthlyPayment > 0 ? num(cash / monthlyPayment) : Infinity;
  const repaymentSafetyDays = monthlyPayment > 0 ? Math.round(repaymentSafetyMonths * 30) : Infinity;
  return { rows, stocks, cash, debt, totalAssets, netWorth, dayPnl, growth, defensive, defensiveHoldings, defensiveHoldingsValue, growthTargetPct, defensiveTargetPct, beta, cashRatio, defensiveRatio, leverage, monthlyPayment, averageRemainingMonths, repaymentSafetyMonths, repaymentSafetyDays };
}
function rebalance(state: AppState, quotes: Record<SymbolCode, Quote>) {
  const m = calculateMetrics(state, quotes);
  const stock = m.rows.find(r => r.symbol === '00631L') || { symbol: '00631L', quote: backupQuote('00631L'), marketValue: 0 };
  const stockTarget = m.totalAssets * (m.growthTargetPct / 100);
  const defensiveTarget = m.totalAssets * (m.defensiveTargetPct / 100);
  const stockDiff = stockTarget - stock.marketValue;
  const defensiveDiff = defensiveTarget - m.defensive;
  const stockWeight = m.totalAssets ? stock.marketValue / m.totalAssets * 100 : 0;
  const defensiveWeight = m.totalAssets ? m.defensive / m.totalAssets * 100 : 0;
  const deviation = stockWeight - m.growthTargetPct;
  const defensiveDeviation = defensiveWeight - m.defensiveTargetPct;
  const threshold = clampRebalanceThreshold(state.rebalanceThreshold);
  const thresholdReached = Math.abs(deviation) >= threshold;
  const mode = normalizeRebalanceMode(state.rebalanceMode);
  const stockShares = Math.round(Math.abs(stockDiff) / Math.max(0.01, stock.quote.price));
  const belowAmountFloor = Math.abs(stockDiff) < 1000;
  let stockAction = belowAmountFloor ? '維持持有' : `建議${stockDiff >= 0 ? '買入' : '賣出'} ${stockShares.toLocaleString('zh-TW')} 股，約 ${money(Math.abs(stockDiff))}`;
  let defensiveAction = Math.abs(defensiveDiff) < 1000 ? '維持防守資產' : defensiveDiff > 0 ? `需增加防守資產約 ${money(defensiveDiff)}` : `可使用現金約 ${money(Math.abs(defensiveDiff))}`;
  let stockTone = stockDiff >= 0 ? 'up' : 'down';
  let defensiveTone = 'hold';
  if (!thresholdReached) {
    stockAction = '維持持有，尚未達再平衡門檻';
    defensiveAction = '維持防守資產，尚未達再平衡門檻';
    stockTone = defensiveTone = 'hold';
  } else if (mode === 'buy-only' && stockDiff < 0) {
    stockAction = '暫停加碼，維持持有';
    defensiveAction = `優先增加防守資產，距離目標約 ${money(Math.max(0, defensiveDiff))}`;
    stockTone = defensiveTone = 'hold';
  }
  const stockRow = { symbol: '00631L', currentWeight: stockWeight, targetText: pct(m.growthTargetPct), diffText: money(stockDiff), deviationText: signedPct(deviation), thresholdText: pct(threshold), action: stockAction, tone: stockTone };
  const defensiveRow = { symbol: '防守資產', currentWeight: defensiveWeight, targetText: pct(m.defensiveTargetPct), diffText: money(defensiveDiff), deviationText: signedPct(defensiveDeviation), thresholdText: pct(threshold), action: defensiveAction, tone: defensiveTone };
  const defensiveDetails = [{ symbol: '現金', currentWeight: m.totalAssets ? m.cash / m.totalAssets * 100 : 0, targetText: '—', diffText: '—', deviationText: '—', thresholdText: '—', action: '列入防守資產' }, ...m.defensiveHoldings.map(r => ({ symbol: r.symbol, currentWeight: m.totalAssets ? r.marketValue / m.totalAssets * 100 : 0, targetText: '—', diffText: '—', deviationText: '—', thresholdText: '—', action: '保留實際持股，不參與再平衡' }))];
  return { rows: [stockRow, defensiveRow], stockRow, defensiveRow, defensiveDetails, stockAction, defensiveAction, defensiveCurrent: m.defensive, defensiveTarget, nonStrategy: m.defensiveHoldings.map(r => `${r.symbol}：保留實際持股，不參與再平衡`), mode, modeLabel: rebalanceModeLabel(mode), deviation, threshold, thresholdReached, thresholdStatus: thresholdReached ? '已達提醒門檻' : '尚未達門檻，維持目前配置' };
}
function investmentHealth(m: ReturnType<typeof calculateMetrics>, rb: ReturnType<typeof rebalance>) {
  const absDeviation = Math.abs(rb.deviation);
  const overTarget = rb.deviation > 0;
  const underTarget = rb.deviation < 0;
  const stockDiff = m.totalAssets * (m.growthTargetPct / 100) - m.growth;
  const defensiveGap = Math.max(0, rb.defensiveTarget - rb.defensiveCurrent);
  
  let status = '正常';
  let tone: 'good' | 'warn' | 'bad' = 'good';
  let reason = '目前配置尚未達再平衡門檻。';
  let suggestion = '維持目前配置。';

  if (!rb.thresholdReached) {
    status = '正常';
    tone = 'good';
    reason = '目前配置尚未達再平衡門檻。';
    suggestion = '維持目前配置。';
  } else if (rb.deviation >= 10) {
    status = '槓桿風險提高';
    tone = 'bad';
    reason = `00631L 高於目標 ${pct(rb.deviation)}，已超過 10%。`;
    suggestion = '暫停加碼 00631L，優先累積現金或防守資產。';
  } else if (absDeviation >= 10) {
    status = '偏離過大';
    tone = 'bad';
    reason = `00631L ${underTarget ? '低於' : '高於'}目標 ${pct(absDeviation)}，偏離幅度已達 10%。`;
    suggestion = underTarget ? '依目前再平衡模式分批補足 00631L。' : '優先補強防守資產，降低配置偏離。';
  } else if (stockDiff > 0 && m.cash < stockDiff && rb.thresholdReached) {
    status = '現金不足';
    tone = 'warn';
    reason = `00631L 低於目標 ${pct(absDeviation)}，可用現金不足以補足目標差額。`;
    suggestion = '先累積現金，再分批買入 00631L。';
  } else if (overTarget && defensiveGap > 0) {
    status = '注意';
    tone = 'warn';
    reason = `00631L 高於目標 ${pct(absDeviation)}，已超過再平衡門檻 ${pct(rb.threshold)}。`;
    suggestion = rb.mode === 'buy-only' ? '暫停加碼 00631L，優先累積現金或防守資產。' : '可依標準再平衡增加防守資產。';
  } else {
    status = '注意';
    tone = 'warn';
    reason = `00631L 低於目標 ${pct(absDeviation)}，已超過再平衡門檻 ${pct(rb.threshold)}。`;
    suggestion = '可依目前再平衡模式分批補足 00631L。';
  }

  // 流動性風險覆蓋邏輯：可用現金可支應還款月數低於 3 個月且月付金 > 0
  if (m.monthlyPayment > 0 && m.repaymentSafetyMonths < 3) {
    if (tone !== 'bad') {
      status = '現金不足';
      tone = 'warn';
      reason = `目前防守現金僅夠支應未來 ${m.repaymentSafetyMonths.toFixed(1)} 個月的信貸還款，還款準備金偏低，請注意流動性風險。`;
      suggestion = '暫停任何投資性加碼，優先累積防守現金準備金。';
    }
  }

  return { status, tone, reason, suggestion };
}
function advice(m: ReturnType<typeof calculateMetrics>) { if (m.cashRatio < 8 || m.leverage > 1.6) return ['風險降溫', `現金水位偏低或槓桿偏高，先補防守資產；目前目標為 00631L ${pct(m.growthTargetPct)}、防守資產 ${pct(m.defensiveTargetPct)}。`, 'bad'] as const; if (m.dayPnl < -m.stocks * 0.05) return ['小跌加碼', `可分批補足低於自訂目標的部位，避免一次打滿；目前目標為 00631L ${pct(m.growthTargetPct)}。`, 'warn'] as const; return ['正常投入', `維持自訂目標配置；目前目標為 00631L ${pct(m.growthTargetPct)}、防守資產 ${pct(m.defensiveTargetPct)}。`, 'good'] as const; }

function pieLabelStyle(startDeg: number, endDeg: number): CSSProperties {
  const centerDeg = (startDeg + endDeg) / 2;
  const rad = centerDeg * Math.PI / 180;
  const x = 50 + Math.sin(rad) * 27;
  const y = 50 - Math.cos(rad) * 15;
  return { '--x': `${x.toFixed(1)}%`, '--y': `${y.toFixed(1)}%` } as CSSProperties;
}

function Pie3D({ m }: { m: ReturnType<typeof calculateMetrics> }) {
  const growthPct = m.totalAssets ? m.growth / m.totalAssets * 100 : 0;
  const defensivePct = m.totalAssets ? m.defensive / m.totalAssets * 100 : 0;
  const cashPct = m.totalAssets ? m.cash / m.totalAssets * 100 : 0;
  const holdingPct = (symbol: SymbolCode) => pct(m.totalAssets ? (m.defensiveHoldings.find(r => r.symbol === symbol)?.marketValue || 0) / m.totalAssets * 100 : 0);
  const pieStart = -35;
  const growthEnd = pieStart + growthPct / 100 * 360;
  const growthLabelStyle = pieLabelStyle(pieStart, growthEnd);
  const defensiveLabelStyle = pieLabelStyle(growthEnd, pieStart + 360);
  return <div className="pie-layout">
    <div className="pie-figure">
      <div className="pie-3d" style={{ '--growth': `${growthPct}%` } as CSSProperties} />
      {growthPct >= 8 && <span className="pie-slice-label growth-slice-label" style={growthLabelStyle}>{pct(growthPct)}</span>}
      {defensivePct >= 8 && <span className="pie-slice-label defensive-slice-label" style={defensiveLabelStyle}>{pct(defensivePct)}</span>}
    </div>
    <div className="allocation-detail">
      <div><h3>成長資產</h3><p><span><i className="legend growth-dot" />00631L</span><strong>{pct(growthPct)}</strong></p><p><span>目標</span><strong>{pct(m.growthTargetPct)}</strong></p></div>
      <div><h3>防守資產</h3><p><span><i className="legend cash-dot" />現金</span><strong>{pct(cashPct)}</strong></p>{m.defensiveHoldings.map(r => <p key={r.symbol}><span><i className="legend bond-dot" />{r.symbol}</span><strong>{r.symbol === '00865B' ? holdingPct('00865B') : pct(m.totalAssets ? r.marketValue / m.totalAssets * 100 : 0)}</strong></p>)}<p><span><i className="legend defensive-dot" />合計</span><strong>{pct(defensivePct)}</strong></p><p><span>目標</span><strong>{pct(m.defensiveTargetPct)}</strong></p></div>
    </div>
  </div>;
}
function Stat({ label, value, tone: toneClass }: { label: string; value: string; tone?: string }) { return <div className="stat"><small>{label}</small><b className={toneClass || ''}>{value}</b></div>; }
function Card({ title, children }: { title: string; children: ReactNode }) { return <section className="card"><h2>{title}</h2>{children}</section>; }
function DraftInput({ value, type = 'text', min, step, inputMode, onCommit }: { value: string | number; type?: string; min?: string; step?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(String(value ?? ''));
  const [editing, setEditing] = useState(false);
  const draftRef = useRef(String(value ?? ''));
  const valueRef = useRef(String(value ?? ''));
  const editingRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  useEffect(() => { onCommitRef.current = onCommit; });
  useEffect(() => { const next = String(value ?? ''); valueRef.current = next; if (!editing) { draftRef.current = next; setDraft(next); } }, [value, editing]);
  useEffect(() => () => { if (editingRef.current || draftRef.current !== valueRef.current) onCommitRef.current(draftRef.current); }, []);
  const updateDraft = (next: string) => { editingRef.current = true; setEditing(true); draftRef.current = next; setDraft(next); };
  const commit = (next = draftRef.current) => { editingRef.current = false; setEditing(false); draftRef.current = next; setDraft(next); onCommitRef.current(next); };
  return <input type={type} min={min} step={step} inputMode={inputMode} value={draft} onFocus={() => { editingRef.current = true; setEditing(true); }} onInput={e => updateDraft(e.currentTarget.value)} onChange={e => updateDraft(e.currentTarget.value)} onBlur={e => commit(e.currentTarget.value)} onKeyDown={e => { if (e.key === 'Enter') commit(e.currentTarget.value); }} />;
}
const parsePositive = (value: string, fallback = 0) => value.trim() === '' ? fallback : Math.max(0, num(Number(value)));

function CashList({ items, setItems, onInvalid }: { items: CashItem[]; setItems: (items: SetStateAction<CashItem[]>) => void; onInvalid: (message: string) => void }) {
  const update = (id: string, patch: Partial<CashItem>) => setItems(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  const commitText = (id: string, key: 'name' | 'note', value: string) => {
    if (hasRemovedSymbol(value)) { onInvalid(removedSymbolMessage()); return; }
    update(id, { [key]: value });
  };
  return <div className="list cash-list"><div className="list-row list-head"><span>名稱</span><span>金額（萬元）</span><span>備註</span><span>操作</span></div>{items.map(item => <div className="list-row" key={item.id}><label><span>名稱</span><DraftInput value={item.name} onCommit={value => commitText(item.id, 'name', value)} /></label><label><span>金額（萬元）</span><DraftInput type="number" value={item.amount / 10000} onCommit={value => update(item.id, { amount: parsePositive(value) * 10000 })} /></label><label><span>備註</span><DraftInput value={item.note} onCommit={value => commitText(item.id, 'note', value)} /></label><button className="danger small" onClick={() => setItems(items => items.filter(x => x.id !== item.id))}>刪除</button></div>)}<button className="small" onClick={() => setItems(items => [...items, { id: uid(), name: '現金', amount: 0, note: '' }])}>新增</button></div>;
}
function LoanList({ items, setItems }: { items: LoanItem[]; setItems: (items: SetStateAction<LoanItem[]>) => void }) {
  const update = (id: string, patch: Partial<LoanItem>) => setItems(items => items.map(item => sanitizeLoanItem(item.id === id ? { ...item, ...patch } : item)));
  return <div className="list loan-list"><p className="note">已繳期數依起始日與今天日期自動計算，已繳與剩餘為只讀欄位。</p><div className="list-row list-head"><span>名稱</span><span>本金（萬元）</span><span>利率%</span><span>月付金</span><span>起始日</span><span>總期數</span><span>已繳期數</span><span>剩餘期數</span><span>操作</span></div>{items.map(item => { const period = loanPeriodSummary(item); return <div className="list-row" key={item.id}><label><span>名稱</span><DraftInput value={item.name} onCommit={value => update(item.id, { name: value })} /></label><label><span>本金（萬元）</span><DraftInput type="number" value={item.principal / 10000} onCommit={value => update(item.id, { principal: parsePositive(value) * 10000 })} /></label><label><span>利率%</span><DraftInput type="number" value={item.annualRate} onCommit={value => update(item.id, { annualRate: parsePositive(value) })} /></label><label><span>月付金</span><DraftInput type="number" value={item.monthlyPayment} onCommit={value => update(item.id, { monthlyPayment: parsePositive(value) })} /></label><label><span>起始日</span><DraftInput type="date" value={item.startDate} onCommit={value => update(item.id, { startDate: value })} /></label><label><span>總期數</span><DraftInput type="number" value={item.totalMonths ?? ''} onCommit={value => update(item.id, { totalMonths: value.trim() === '' ? undefined : parsePositive(value) })} /></label><span className="remaining" title="依起始日與今天日期自動計算">{period.paid === undefined ? '—' : `${period.paid.toLocaleString('zh-TW')} 期`}</span><span className="remaining" title="總期數減已繳期數">{period.remaining === undefined ? '—' : `${period.remaining.toLocaleString('zh-TW')} 期`}</span><button className="danger small" onClick={() => setItems(items => items.filter(x => x.id !== item.id))}>刪除</button></div>; })}<button className="small" onClick={() => setItems(items => [...items, { id: uid(), name: '借款', principal: 0, annualRate: 0, monthlyPayment: 0, startDate: new Date().toISOString().slice(0, 10), totalMonths: undefined }])}>新增</button></div>;
}

function App() {
  const [tab, setTab] = useState<'dashboard' | 'sync'>('dashboard');
  const [state, setStateValue] = useState<AppState>(() => readState());
  const stateRef = useRef(state);
  const setState = (updater: SetStateAction<AppState>) => {
    const next = typeof updater === 'function' ? (updater as (value: AppState) => AppState)(stateRef.current) : updater;
    stateRef.current = next;
    setStateValue(next);
  };
  const [quotes, setQuotes] = useState<Record<SymbolCode, Quote>>(defaultQuotes);
  const [syncMeta, setSyncMeta] = useState<SyncMeta>(() => readSyncMeta(state));
  const [remoteMeta, setRemoteMeta] = useState<{ holdingsCount: number; cashCount: number; loansCount: number; updatedAt?: string } | null>(() => {
    try {
      const raw = localStorage.getItem('00631l-pro-v100-remote-meta');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const updateRemoteMeta = (value: { holdingsCount: number; cashCount: number; loansCount: number; updatedAt?: string } | null) => {
    setRemoteMeta(value);
    if (value) {
      localStorage.setItem('00631l-pro-v100-remote-meta', JSON.stringify(value));
    } else {
      localStorage.removeItem('00631l-pro-v100-remote-meta');
    }
  };
  const [cashWarning, setCashWarning] = useState('');
  const [loadedAt] = useState(now());
  const [lastSavedAt, setLastSavedAt] = useState(now());
  const isApplyingRemoteRef = useRef(false);
  const [targetDraft, setTargetDraft] = useState(String(growthTargetOf(state)));
  const didMount = useRef(false);
  const [quoteStatus, setQuoteStatus] = useState('尚未更新股價');
  const updateSyncMeta = (updater: SyncMeta | ((value: SyncMeta) => SyncMeta)) => setSyncMeta(current => { const next = typeof updater === 'function' ? (updater as (value: SyncMeta) => SyncMeta)(current) : updater; writeSyncMeta(next); return next; });
  useEffect(() => { stateRef.current = state; writeState(state); if (didMount.current && !isApplyingRemoteRef.current) { const savedAt = now(); setLastSavedAt(savedAt); updateSyncMeta(current => ({ ...current, dirty: true, status: localDirtyStatus(state) })); } didMount.current = true; isApplyingRemoteRef.current = false; }, [state]);
  useEffect(() => setTargetDraft(String(growthTargetOf(state))), [state.holdings]);
  const refreshQuotes = async () => { setQuoteStatus('股價更新中…'); const currentState = state; const entries = await Promise.all(uniqueSymbols(currentState).map(async s => [s, await fetchQuote(s, currentState.holdings.find(h => h.symbol === s))] as const)); const next = { ...quotes, ...Object.fromEntries(entries) } as Record<SymbolCode, Quote>; setQuotes(next); const errors = entries.map(([, q]) => q).filter(q => q.error).map(q => `${q.symbol}: ${q.error}`); setQuoteStatus(errors.length ? `部分失敗：${errors.join(' / ')}` : `股價更新成功：${tw(now())}`); };
  const flushDrafts = async () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    await waitForDraftCommit();
    validateBeforeUpload(stateRef.current);
    const normalized = normalizeState(stateRef.current);
    stateRef.current = normalized;
    writeState(normalized);
    setLastSavedAt(now());
    return normalized;
  };
  const uploadCloud = async () => { 
    updateSyncMeta(current => ({ ...current, status: '⏳ 雲端上傳中，正在寫入 Firebase...' })); 
    const normalized = await flushDrafts(); 
    await uploadFirebase(normalized.firebase, normalized); 
    const syncedAt = now(); 
    setLastSavedAt(syncedAt); 
    updateSyncMeta(current => ({ 
      ...current, 
      dirty: false, 
      lastUploadAt: syncedAt, 
      status: `🎉 上傳成功！已同步本地持股至雲端｜持股 ${normalized.holdings.length} 筆｜現金 ${normalized.cash.length} 筆｜借款 ${normalized.loans.length} 筆` 
    })); 
    updateRemoteMeta({
      holdingsCount: normalized.holdings.length,
      cashCount: normalized.cash.length,
      loansCount: normalized.loans.length,
      updatedAt: syncedAt
    });
  };
  const downloadCloud = async () => { 
    updateSyncMeta(current => ({ ...current, status: '⏳ 雲端下載中，正在讀取 Firebase...' })); 
    const remote = await downloadFirebase(state.firebase); 
    const downloadedAt = now(); 
    isApplyingRemoteRef.current = true; 
    setState(remote); 
    writeState(remote); 
    setLastSavedAt(downloadedAt); 
    updateSyncMeta(current => ({ 
      ...current, 
      dirty: false, 
      lastDownloadAt: downloadedAt, 
      status: `🎉 下載成功！已套用雲端資料至本機｜持股 ${remote.holdings.length} 筆｜現金 ${remote.cash.length} 筆｜借款 ${remote.loans.length} 筆` 
    })); 
    updateRemoteMeta({
      holdingsCount: remote.holdings.length,
      cashCount: remote.cash.length,
      loansCount: remote.loans.length,
      updatedAt: downloadedAt
    });
  };
  useEffect(() => { refreshQuotes(); }, []);
  const m = useMemo(() => calculateMetrics(state, quotes), [state, quotes]);
  const rb = useMemo(() => rebalance(state, quotes), [state, quotes]);
  const health = useMemo(() => investmentHealth(m, rb), [m, rb]);

  const syncDiagnostics = useMemo(() => {
    if (!state.firebase.databaseURL.trim()) {
      return { status: '未啟用雲端同步', tone: 'hold', reason: '尚未設定 Firebase Database URL。', suggestion: '請至上方輸入 Firebase URL 與金鑰以啟用同步功能。' };
    }
    if (!remoteMeta) {
      return { status: '未進行資料比對', tone: 'hold', reason: '本機尚未與雲端資料進行上傳或下載。', suggestion: '請點選「下載雲端」或「上傳雲端」進行第一次比對。' };
    }
    const isCountMatch = 
      state.holdings.length === remoteMeta.holdingsCount &&
      state.cash.length === remoteMeta.cashCount &&
      state.loans.length === remoteMeta.loansCount;

    if (syncMeta.dirty) {
      return { 
        status: '本機有未上傳的修改', 
        tone: 'warn', 
        reason: '本機資料有變動，與上次同步的狀態不一致。', 
        suggestion: '如果您希望將此變更同步到雲端，請點選「上傳雲端」。' 
      };
    }

    if (!isCountMatch) {
      return { 
        status: '資料與雲端不一致', 
        tone: 'warn', 
        reason: '本機與雲端的持股、現金或借款筆數不相同。', 
        suggestion: '請確認需要以本機為準（點選「上傳雲端」）或以雲端為準（點選「下載雲端」）。' 
      };
    }

    return { 
      status: '兩端資料完全一致', 
      tone: 'good', 
      reason: '本機資料與最近一次同步的雲端數據相符。', 
      suggestion: '目前已是最新狀態，無需任何操作。' 
    };
  }, [state.firebase.databaseURL, state.holdings.length, state.cash.length, state.loans.length, remoteMeta, syncMeta.dirty]);
  const [mode, hint, modeTone] = advice(m);
  const updateHolding = (symbol: SymbolCode, key: keyof Holding, value: number) => setState(s => { const exists = s.holdings.some(h => h.symbol === symbol); const nextValue = key === 'targetWeight' ? value : Math.max(0, num(value)); const nextHolding: Holding = { symbol, shares: 0, avgCost: 0, ...(symbol === '00631L' ? { targetWeight: growthTargetOf(s) } : {}), [key]: nextValue }; return { ...s, holdings: exists ? s.holdings.map(h => h.symbol === symbol ? sanitizeHolding({ ...h, [key]: nextValue }) || h : h) : [...s.holdings, nextHolding] }; });
  const commitTarget = () => { const next = clampTarget(Number(targetDraft)); setTargetDraft(String(next)); updateHolding('00631L', 'targetWeight', next); };
  const exportBackup = () => { const blob = new Blob([JSON.stringify(backupPayload(state), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `00631L-Pro-backup-${backupStamp()}.json`; a.click(); URL.revokeObjectURL(url); updateSyncMeta(current => ({ ...current, status: '備份已匯出' })); };
  const importBackup = async (f?: File) => {
    if (!f) return;
    try {
      const raw = JSON.parse(await f.text());
      const next = stateFromBackup(raw, stateRef.current);
      if (!window.confirm('匯入備份會覆蓋目前本機資料，是否繼續？')) return;
      isApplyingRemoteRef.current = true;
      setState(next);
      writeState(next);
      const importedAt = now();
      setLastSavedAt(importedAt);
      updateSyncMeta(current => ({ ...current, dirty: true, status: '已匯入備份，本機有新資料，尚未上傳雲端' }));
    } catch (error) {
      updateSyncMeta(current => ({ ...current, status: error instanceof Error ? error.message : '匯入備份失敗，請確認 JSON 格式。' }));
    }
  };
  return (
    <main>
      <header className="hero">
        <div><p className="eyebrow">{APP_VERSION}</p><h1>00631L Pro</h1><h3>台股槓桿投資管理</h3><p>即時股價｜再平衡｜Firebase 雲端同步</p></div>
        <button onClick={refreshQuotes}>更新股價</button>
      </header>
      <nav className="tabs">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>儀表板</button>
        <button className={tab === 'sync' ? 'active' : ''} onClick={() => setTab('sync')}>同步設定</button>
        <span className="sync-bar"><b>股價更新：</b>{tw(Object.values(quotes)[0].updatedAt)}<br /><b>本機儲存：</b>{tw(lastSavedAt)}<br /><b>雲端上傳：</b>{syncMeta.lastUploadAt ? tw(syncMeta.lastUploadAt) : '—'}<br /><b>雲端下載：</b>{syncMeta.lastDownloadAt ? tw(syncMeta.lastDownloadAt) : '—'}<br /><b>狀態：</b>{syncMeta.status}</span>
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
              <label>總股數<DraftInput type="number" min="0" value={r.shares} onCommit={value => updateHolding(r.symbol, 'shares', parsePositive(value))} /></label>
              <label>成交均價<DraftInput type="number" min="0" step="0.01" value={r.avgCost} onCommit={value => updateHolding(r.symbol, 'avgCost', parsePositive(value))} /></label>
              {r.symbol === '00631L' ? <label>目標比例 %<DraftInput inputMode="decimal" value={targetDraft} onCommit={value => { const next = clampTarget(Number(value)); setTargetDraft(String(next)); updateHolding('00631L', 'targetWeight', next); }} /><small>限制 {MIN_GROWTH_TARGET}%～{MAX_GROWTH_TARGET}%，防守資產自動為 {pct(m.defensiveTargetPct)}。</small></label> : <p className="note">列入防守資產，不參與主動再平衡買賣。</p>}
              <strong>市值：{money(r.marketValue)}</strong>
              <strong className={tone(r.pnl)}>損益：{signedMoney(r.pnl)} / {signedPct(pnlPct)}</strong>
            </article>; })}
          </div>
        </Card>
        <Card title="資產配置"><Pie3D m={m} /></Card>
        <Card title="再平衡摘要">
          <div className={`health-status ${health.tone}`}>
            <div className="health-light" />
            <div>
              <small>投資健康狀態</small>
              <h3>目前狀態：{health.status}</h3>
              <p>原因：{health.reason}</p>
              <p>建議：{health.suggestion}</p>
            </div>
          </div>
          <div className="rebalance-settings">
            <label>再平衡模式
              <select value={state.rebalanceMode} onChange={e => setState(s => ({ ...s, rebalanceMode: normalizeRebalanceMode(e.target.value) }))}>
                <option value="buy-only">只買不賣</option>
                <option value="standard">標準再平衡</option>
              </select>
            </label>
            <label>再平衡提醒門檻 %
              <DraftInput inputMode="decimal" value={state.rebalanceThreshold} onCommit={value => setState(s => ({ ...s, rebalanceThreshold: clampRebalanceThreshold(Number(value)) }))} />
              <small>限制 0%～{MAX_REBALANCE_THRESHOLD}%，可輸入小數。</small>
            </label>

          </div>
          <div className="rebalance-alert">
            <p><span>再平衡模式</span><strong>{rb.modeLabel}</strong></p>
            <p><span>目前偏離目標</span><strong className={tone(rb.deviation)}>{signedPct(rb.deviation)}</strong></p>
            <p><span>再平衡門檻</span><strong>{pct(rb.threshold)}</strong></p>
            <p><span>狀態</span><strong>{rb.thresholdStatus}</strong></p>
          </div>
          <div className="rebalance-summary">
            <div><small>00631L</small><b>{rb.stockAction}</b></div>
            <div><small>防守資產</small><b>目前 {money(rb.defensiveCurrent)}｜目標 {money(rb.defensiveTarget)}｜{rb.defensiveAction}</b></div>
            {rb.nonStrategy.map(item => <div key={item}><small>實際持股</small><b>{item}</b></div>)}
          </div>
          <div className="table rebalance-table">
            <div className="row head"><span>項目</span><span>目前比例</span><span>目標比例</span><span>偏離幅度</span><span>門檻</span><span>建議</span></div>
            <div className="row"><span>{rb.stockRow.symbol}</span><span>{pct(rb.stockRow.currentWeight)}</span><span>{rb.stockRow.targetText}</span><span>{rb.stockRow.deviationText}</span><span>{rb.stockRow.thresholdText}</span><b className={rb.stockRow.tone}>{rb.stockRow.action}</b></div>
            <div className="rebalance-group">
              <div className="row group-main"><span>{rb.defensiveRow.symbol}</span><span>{pct(rb.defensiveRow.currentWeight)}</span><span>{rb.defensiveRow.targetText}</span><span>{rb.defensiveRow.deviationText}</span><span>{rb.defensiveRow.thresholdText}</span><b className={rb.defensiveRow.tone}>{rb.defensiveRow.action}</b></div>
              {rb.defensiveDetails.map(r => <div className="row sub-row" key={r.symbol}><span>{r.symbol}</span><span>{pct(r.currentWeight)}</span><span>{r.targetText}</span><span>{r.deviationText}</span><span>{r.thresholdText}</span><b className="hold">{r.action}</b></div>)}
            </div>
          </div>
        </Card>

        <div className="two">
          <Card title="現金管理">{cashWarning && <p className="warning-message">{cashWarning}</p>}<p className="note cash-policy-note">{removedSymbolMessage()}</p><CashList items={state.cash} setItems={items => { setCashWarning(''); setState(s => ({ ...s, cash: typeof items === 'function' ? items(s.cash) : items })); }} onInvalid={message => setCashWarning(message)} /></Card>
          <Card title="借款管理">
            <div className="loan-summary">
              <Stat label="總借款" value={money(m.debt)} />
              <Stat label="每月還款" value={money(m.monthlyPayment)} />
              <Stat label="平均剩餘期數" value={m.averageRemainingMonths === undefined ? '—' : `${m.averageRemainingMonths.toFixed(1)} 期`} />
              <Stat 
                label="還款安全存量" 
                value={m.monthlyPayment > 0 ? `可支應未來 ${m.repaymentSafetyMonths.toFixed(1)} 個月還款 (約 ${m.repaymentSafetyDays} 天)` : '無限大'} 
                tone={m.monthlyPayment > 0 ? (m.repaymentSafetyMonths > 6 ? 'good' : m.repaymentSafetyMonths < 3 ? 'warn' : '') : 'good'} 
              />
            </div>
            <LoanList items={state.loans} setItems={items => setState(s => ({ ...s, loans: typeof items === 'function' ? items(s.loans) : items }))} />
          </Card>
        </div>
      </>}
      {tab === 'sync' && <>
        <Card title="Firebase / 備份 / 還原">
          <p className="note">目前同步方式為手動同步：修改資料後會先儲存在本機。要同步到其他裝置，請按「上傳雲端」。另一台裝置要取得最新資料，請按「下載雲端」。系統不會自動下載雲端資料，以避免覆蓋正在編輯的內容。</p>
          <div className="params">
            <DraftInput value={state.firebase.databaseURL} onCommit={value => setState(s => ({ ...s, firebase: { ...s.firebase, databaseURL: value } }))} />
            <DraftInput value={state.firebase.secretPath} onCommit={value => setState(s => ({ ...s, firebase: { ...s.firebase, secretPath: value } }))} />
            <input placeholder="Cloudflare Worker URL" value={DEFAULT_WORKER_URL} readOnly />
            <DraftInput type="number" value={state.refreshSec} onCommit={value => setState(s => ({ ...s, refreshSec: Math.max(60, parsePositive(value, 60)) }))} />
            <label><input type="checkbox" checked={state.autoSync} onChange={e => setState(s => ({ ...s, autoSync: e.target.checked }))} /> 啟用 Firebase 手動同步設定</label>
            <label>同步延遲秒數<DraftInput type="number" min="10" value={state.autoSyncSec} onCommit={value => setState(s => ({ ...s, autoSyncSec: Math.max(10, parsePositive(value, 60)) }))} /></label>
          </div>
          <div className="actions">
            <button onClick={() => uploadCloud().catch(e => updateSyncMeta(current => ({ ...current, status: '❌ Firebase 同步失敗：' + e.message })))}>上傳雲端</button>
            <button onClick={() => downloadCloud().catch(e => updateSyncMeta(current => ({ ...current, status: '❌ 下載失敗：' + e.message })))}>下載雲端</button>
            <button onClick={exportBackup}>匯出備份 JSON</button>
            <label className="file">匯入備份 JSON<input type="file" accept="application/json" onChange={e => importBackup(e.target.files?.[0])} /></label>
            <button onClick={() => setState(defaultState)}>重設</button>
          </div>
          <p><b>目前同步路徑：</b>{state.firebase.databaseURL ? syncPath(state.firebase) : '尚未設定 Firebase URL'}</p>
          <p><b>目前 Worker：</b>{DEFAULT_WORKER_URL}</p>
          <p>
            <b>同步狀態：</b>
            <span className={syncMeta.status.startsWith('❌') ? 'bad' : syncMeta.status.startsWith('🎉') ? 'good' : ''}>
              {syncMeta.status}
            </span>
          </p>
          <p className="note">Firebase 上傳與下載都只會在手動按鈕觸發時執行，不會自動下載覆蓋本機資料；匯入備份也只會覆蓋本機資料，不會自動上傳。</p>
        </Card>
        <Card title="雲端同步狀態診斷與比對">
          <div className={`health-status ${syncDiagnostics.tone}`}>
            <div className="health-light" />
            <div>
              <small>雲端同步診斷結果</small>
              <h3>狀態：{syncDiagnostics.status}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}><b>原因：</b>{syncDiagnostics.reason}</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}><b>建議：</b>{syncDiagnostics.suggestion}</p>
            </div>
          </div>
          <div className="table rebalance-table" style={{ marginTop: '16px' }}>
            <div className="row head">
              <span>資料項目</span>
              <span>本機數據 (Local)</span>
              <span>雲端數據 (Remote)</span>
              <span>狀態比對</span>
            </div>
            <div className="row">
              <span>持股項目</span>
              <span>{state.holdings.length} 筆</span>
              <span>{remoteMeta ? `${remoteMeta.holdingsCount} 筆` : '—'}</span>
              <span>{remoteMeta ? (state.holdings.length === remoteMeta.holdingsCount ? <b className="good">✅ 一致</b> : <b className="bad">⚠️ 不一致</b>) : '—'}</span>
            </div>
            <div className="row">
              <span>現金帳戶</span>
              <span>{state.cash.length} 筆</span>
              <span>{remoteMeta ? `${remoteMeta.cashCount} 筆` : '—'}</span>
              <span>{remoteMeta ? (state.cash.length === remoteMeta.cashCount ? <b className="good">✅ 一致</b> : <b className="bad">⚠️ 不一致</b>) : '—'}</span>
            </div>
            <div className="row">
              <span>借款項目</span>
              <span>{state.loans.length} 筆</span>
              <span>{remoteMeta ? `${remoteMeta.loansCount} 筆` : '—'}</span>
              <span>{remoteMeta ? (state.loans.length === remoteMeta.loansCount ? <b className="good">✅ 一致</b> : <b className="bad">⚠️ 不一致</b>) : '—'}</span>
            </div>
            <div className="row">
              <span>最後更新時間</span>
              <span>{tw(lastSavedAt)}</span>
              <span>{remoteMeta && remoteMeta.updatedAt ? tw(remoteMeta.updatedAt) : '—'}</span>
              <span>時戳對照</span>
            </div>
          </div>
        </Card>
      </>}
    </main>
  );
}
export default App;
