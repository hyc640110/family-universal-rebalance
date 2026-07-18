import type { FinancialTransaction } from './transactions';

export type DividendAssetReferenceStatus = 'active' | 'archived' | 'historical';
export type DividendAssetReferenceSource = 'holding' | 'archived-holding' | 'transaction-history';
export type DividendAssetReferenceHolding = { symbol: string; name?: string; isArchived?: boolean };
export type DividendAssetReferenceOption = { symbol: string; name?: string; status: DividendAssetReferenceStatus; source: DividendAssetReferenceSource; label: string };

type HistoricalName = { name: string; updatedAt?: string; occurredAt?: string; id?: string };
type HoldingEntry = { status: Exclude<DividendAssetReferenceStatus, 'historical'>; names: string[] };

const normalizeSymbol = (value: unknown) => String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
const optionalText = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
const compareText = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const dateValue = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? Date.parse(value) : Number.NEGATIVE_INFINITY;
const statusRank: Record<DividendAssetReferenceStatus, number> = { active: 0, archived: 1, historical: 2 };

function preferredHistoricalName(candidates: HistoricalName[]) {
  return candidates.slice().sort((left, right) => {
    const updated = dateValue(right.updatedAt) - dateValue(left.updatedAt);
    if (updated) return updated;
    const occurred = dateValue(right.occurredAt) - dateValue(left.occurredAt);
    if (occurred) return occurred;
    const id = compareText(left.id || '', right.id || '');
    return id || compareText(left.name, right.name);
  })[0]?.name;
}

/**
 * Builds read-only references for dividend forms. It deliberately never creates
 * holdings, resolves market metadata, or infers an unknown asset name.
 */
export function dividendAssetReferenceOptions(holdings: readonly DividendAssetReferenceHolding[], transactions: readonly FinancialTransaction[]): DividendAssetReferenceOption[] {
  const holdingBySymbol = new Map<string, HoldingEntry>();
  const historicalNames = new Map<string, HistoricalName[]>();

  for (const holding of holdings) {
    const symbol = normalizeSymbol(holding?.symbol);
    if (!symbol) continue;
    const status = holding.isArchived ? 'archived' : 'active';
    const entry = holdingBySymbol.get(symbol) || { status, names: [] };
    if (statusRank[status] < statusRank[entry.status]) entry.status = status;
    const name = optionalText(holding.name);
    if (name) entry.names.push(name);
    holdingBySymbol.set(symbol, entry);
  }

  for (const transaction of transactions) {
    const symbol = normalizeSymbol(transaction?.assetSymbol);
    if (!symbol) continue;
    const name = optionalText(transaction.assetName);
    if (name) historicalNames.set(symbol, [...(historicalNames.get(symbol) || []), { name, updatedAt: transaction.updatedAt, occurredAt: transaction.occurredAt, id: transaction.id }]);
    else if (!historicalNames.has(symbol)) historicalNames.set(symbol, []);
  }

  const symbols = Array.from(new Set([...holdingBySymbol.keys(), ...historicalNames.keys()]));
  return symbols.map(symbol => {
    const holding = holdingBySymbol.get(symbol);
    const status: DividendAssetReferenceStatus = holding?.status || 'historical';
    const holdingName = holding?.names.slice().sort(compareText)[0];
    const name = holdingName || preferredHistoricalName(historicalNames.get(symbol) || []);
    const source: DividendAssetReferenceSource = status === 'active' ? 'holding' : status === 'archived' ? 'archived-holding' : 'transaction-history';
    const suffix = status === 'archived' ? '（已清倉）' : status === 'historical' ? '（歷史紀錄）' : '';
    return { symbol, ...(name ? { name } : {}), status, source, label: `${symbol}${name ? ` ${name}` : ''}${suffix}` };
  }).sort((left, right) => statusRank[left.status] - statusRank[right.status] || compareText(left.symbol, right.symbol));
}
