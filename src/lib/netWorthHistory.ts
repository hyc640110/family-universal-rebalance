import { canonicalCalendarDay, selectLastOccurrenceByDate, shiftCanonicalCalendarDay } from './calendarDay';
import { normalizePinnedForeignCashValuations, type PinnedForeignCashValuation } from './fxValuation';

export type NetWorthSnapshot = { date: string; totalAssets: number; netWorth: number; investmentValue: number; cash: number; debt: number; cashAvailable?: boolean; totalAssetsAvailable?: boolean; netWorthAvailable?: boolean; fxValuations?: PinnedForeignCashValuation[] };
export type NetWorthSnapshotTotals = Omit<NetWorthSnapshot, 'date' | 'fxValuations'>;
export type HistoryRange = '7d' | '30d' | '90d' | '1y' | 'all';
const n = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : Number.isFinite(Number(value)) ? Number(value) : 0;
const bool = (value: unknown): boolean | undefined => typeof value === 'boolean' ? value : undefined;
/** Compatibility name for the snapshot producer; canonical day is always Asia/Taipei. */
export function localSnapshotDate(date = new Date()): string { return canonicalCalendarDay(date); }
/**
 * `cashAvailable`/`totalAssetsAvailable`/`netWorthAvailable` are additive and optional (UR-TODO-046
 * FX-A3): absent means legacy/unknown and must be treated as available, never inferred otherwise.
 * When present and false, the paired numeric total intentionally excludes an un-valuable foreign
 * balance rather than naked-summing it — it is not a complete total and must not be presented as one.
 */
export function netWorthSnapshotFromTotals(totals: NetWorthSnapshotTotals, date = localSnapshotDate(), fxValuations?: unknown): NetWorthSnapshot {
  const normalized = normalizePinnedForeignCashValuations(fxValuations);
  const cashAvailable = bool(totals.cashAvailable);
  const totalAssetsAvailable = bool(totals.totalAssetsAvailable);
  const netWorthAvailable = bool(totals.netWorthAvailable);
  return {
    date, totalAssets: n(totals.totalAssets), netWorth: n(totals.netWorth), investmentValue: n(totals.investmentValue), cash: n(totals.cash), debt: n(totals.debt),
    ...(cashAvailable !== undefined ? { cashAvailable } : {}),
    ...(totalAssetsAvailable !== undefined ? { totalAssetsAvailable } : {}),
    ...(netWorthAvailable !== undefined ? { netWorthAvailable } : {}),
    ...(normalized ? { fxValuations: normalized } : {})
  };
}
export function normalizeNetWorthHistory(raw: unknown): NetWorthSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const rows = raw.flatMap(value => {
    const row = value && typeof value === 'object' ? value as Partial<NetWorthSnapshot> : {};
    const date = typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : '';
    const fxValuations = normalizePinnedForeignCashValuations(row.fxValuations);
    const cashAvailable = bool(row.cashAvailable);
    const totalAssetsAvailable = bool(row.totalAssetsAvailable);
    const netWorthAvailable = bool(row.netWorthAvailable);
    return date ? [{
      date, totalAssets: n(row.totalAssets), netWorth: n(row.netWorth), investmentValue: n(row.investmentValue), cash: n(row.cash), debt: n(row.debt),
      ...(cashAvailable !== undefined ? { cashAvailable } : {}),
      ...(totalAssetsAvailable !== undefined ? { totalAssetsAvailable } : {}),
      ...(netWorthAvailable !== undefined ? { netWorthAvailable } : {}),
      ...(fxValuations ? { fxValuations } : {})
    }] : [];
  });
  return selectLastOccurrenceByDate(rows);
}
export function upsertNetWorthSnapshot(history: NetWorthSnapshot[] | undefined, snapshot: NetWorthSnapshot): NetWorthSnapshot[] { const rows = normalizeNetWorthHistory(history); const index = rows.findIndex(item=>item.date===snapshot.date); if(index >= 0) rows[index] = snapshot; else rows.push(snapshot); return rows.sort((a,b)=>a.date.localeCompare(b.date)); }
export function historyForRange(history: NetWorthSnapshot[], range: HistoryRange, now = new Date()): NetWorthSnapshot[] { if(range==='all')return history; const days = range==='7d'?7:range==='30d'?30:range==='90d'?90:365; const date=shiftCanonicalCalendarDay(canonicalCalendarDay(now), -days+1); return history.filter(item=>item.date>=date); }
export function deriveHistoryStats(history: NetWorthSnapshot[]) { const rows=normalizeNetWorthHistory(history); const latest=rows.at(-1); const netValues=rows.map(item=>item.netWorth); const high=netValues.length?Math.max(...netValues):null; const periodChange=(prefix:string)=>{const period=latest?rows.filter(item=>item.date.startsWith(prefix)):[];return period.length>1?period.at(-1)!.netWorth-period[0].netWorth:null;}; let peak=-Infinity,maxDrawdown:number|null=null; for(const value of netValues){if(value>peak)peak=value;else if(peak>0){const drawdown=(value-peak)/peak;maxDrawdown=maxDrawdown===null?drawdown:Math.min(maxDrawdown,drawdown);}} return {latest, todayChange:rows.length>1?latest!.netWorth-rows.at(-2)!.netWorth:null, monthChange:latest?periodChange(latest.date.slice(0,7)):null, yearChange:latest?periodChange(latest.date.slice(0,4)):null, allChange:rows.length>1?latest!.netWorth-rows[0].netWorth:null, highestNetWorth:high, maxDrawdown}; }
