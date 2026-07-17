import { validDividends, dividendDate } from './dividends';
import type { FinancialTransaction } from './transactions';

type Holding = { symbol: string; name?: string; assetClass?: 'growth' | 'defensive' };
const yearOf = (row: FinancialTransaction) => Number(dividendDate(row).slice(0, 4));
export const dividendIntelligence = (transactions: FinancialTransaction[], holdings: Holding[], today: string) => {
  const year = Number(today.slice(0, 4)); const rows = validDividends(transactions, today); const current = rows.filter(row => yearOf(row) === year); const previous = rows.filter(row => yearOf(row) === year - 1);
  const byAsset = (source: FinancialTransaction[]) => Object.values(source.reduce<Record<string, { symbol: string; name: string; amount: number; count: number }>>((map, row) => { const symbol = row.assetSymbol || '未指定資產'; const item = map[symbol] ||= { symbol, name: row.assetName || holdings.find(h => h.symbol === symbol)?.name || symbol, amount: 0, count: 0 }; item.amount += row.amount; item.count += 1; return map; }, {})).sort((a, b) => b.amount - a.amount);
  const monthly = Array.from({ length: 12 }, (_, index) => { const month = index + 1; const items = current.filter(row => Number(dividendDate(row).slice(5, 7)) === month); return { month, amount: items.reduce((sum, row) => sum + row.amount, 0), count: items.length, items: byAsset(items) }; });
  const ranking = byAsset(rows).map(item => ({ ...item, yearAmount: byAsset(current).find(row => row.symbol === item.symbol)?.amount || 0 }));
  const composition = (['growth', 'defensive', 'other'] as const).map(kind => { const amount = rows.filter(row => { const asset = holdings.find(h => h.symbol === row.assetSymbol); return kind === 'other' ? !asset : asset?.assetClass === kind; }).reduce((sum, row) => sum + row.amount, 0); return { kind, amount, ratio: rows.reduce((sum, row) => sum + row.amount, 0) ? amount / rows.reduce((sum, row) => sum + row.amount, 0) : 0 }; });
  const currentAmount = current.reduce((sum, row) => sum + row.amount, 0), previousAmount = previous.reduce((sum, row) => sum + row.amount, 0), currentMonth = Number(today.slice(5, 7));
  const insights = [previousAmount ? `今年股息較去年${currentAmount >= previousAmount ? '增加' : '減少'} ${Math.abs((currentAmount / previousAmount - 1) * 100).toFixed(1)}%` : '', ranking[0] ? `最大股息來源：${ranking[0].symbol}` : '', !monthly[currentMonth - 1]?.count ? '本月尚無股息收入' : ''].filter(Boolean);
  return { currentAmount, currentCount: current.length, assetCount: new Set(current.map(row => row.assetSymbol).filter(Boolean)).size, monthly, ranking, composition, insights };
};
