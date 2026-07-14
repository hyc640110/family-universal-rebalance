import type { FinancialTransaction } from './transactions';

export type DividendFilter = { year?: number | 'current'; assetSymbol?: string; today?: string };
export type DividendSource = { assetSymbol?: string; assetName: string; amount: number; ratio: number; count: number };
export type DividendSummary = { yearAmount: number; monthAmount: number; totalAmount: number; yearCount: number; latest: FinancialTransaction | null };

export const taipeiDate = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};
export const isValidDividendDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
export const dividendDate = (transaction: FinancialTransaction) => transaction.occurredAt.slice(0, 10);
export const isDividendTransaction = (transaction: FinancialTransaction) => transaction.type === 'income' && transaction.categoryId === 'income-dividend';
export const isValidDividendTransaction = (transaction: FinancialTransaction, today = taipeiDate()) => isDividendTransaction(transaction) && transaction.status === 'posted' && !transaction.excluded && isValidDividendDate(dividendDate(transaction)) && dividendDate(transaction) <= today && Number.isFinite(transaction.amount) && transaction.amount > 0;
export const validDividends = (transactions: FinancialTransaction[], today = taipeiDate()) => transactions.filter(transaction => isValidDividendTransaction(transaction, today)).slice().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
export const dividendAssetName = (transaction: FinancialTransaction) => transaction.assetName || '未指定資產';
export const filterDividends = (transactions: FinancialTransaction[], filter: DividendFilter = {}) => {
  const today = filter.today ?? taipeiDate();
  const currentYear = Number(today.slice(0, 4));
  return validDividends(transactions, today).filter(transaction => {
    const year = Number(dividendDate(transaction).slice(0, 4));
    const matchesYear = filter.year === undefined ? true : filter.year === 'current' ? year === currentYear : year === filter.year;
    return matchesYear && (!filter.assetSymbol || transaction.assetSymbol === filter.assetSymbol);
  });
};
export const dividendSummary = (transactions: FinancialTransaction[], today = taipeiDate()): DividendSummary => {
  const rows = validDividends(transactions, today); const year = today.slice(0, 4); const month = today.slice(0, 7);
  return { yearAmount: rows.filter(row => dividendDate(row).startsWith(year)).reduce((total, row) => total + row.amount, 0), monthAmount: rows.filter(row => dividendDate(row).startsWith(month)).reduce((total, row) => total + row.amount, 0), totalAmount: rows.reduce((total, row) => total + row.amount, 0), yearCount: rows.filter(row => dividendDate(row).startsWith(year)).length, latest: rows[0] ?? null };
};
export const dividendYears = (transactions: FinancialTransaction[], today = taipeiDate()) => [...new Set(validDividends(transactions, today).map(row => Number(dividendDate(row).slice(0, 4))))].sort((a, b) => b - a);
export const annualDividendTotals = (transactions: FinancialTransaction[], today = taipeiDate()) => dividendYears(transactions, today).map(year => ({ year, amount: filterDividends(transactions, { year, today }).reduce((total, row) => total + row.amount, 0) }));
export const monthlyDividendTotals = (transactions: FinancialTransaction[], year: number, today = taipeiDate()) => Array.from({ length: 12 }, (_, index) => ({ month: index + 1, amount: filterDividends(transactions, { year, today }).filter(row => Number(dividendDate(row).slice(5, 7)) === index + 1).reduce((total, row) => total + row.amount, 0) }));
export const dividendSources = (transactions: FinancialTransaction[], filter: DividendFilter = {}) => {
  const rows = filterDividends(transactions, filter); const total = rows.reduce((sum, row) => sum + row.amount, 0); const groups = new Map<string, Omit<DividendSource, 'ratio'>>();
  for (const row of rows) { const key = row.assetSymbol || `name:${dividendAssetName(row)}`; const current = groups.get(key) ?? { assetSymbol: row.assetSymbol, assetName: dividendAssetName(row), amount: 0, count: 0 }; groups.set(key, { ...current, amount: current.amount + row.amount, count: current.count + 1 }); }
  return [...groups.values()].map(row => ({ ...row, ratio: total > 0 ? row.amount / total : 0 })).sort((a, b) => b.amount - a.amount);
};
