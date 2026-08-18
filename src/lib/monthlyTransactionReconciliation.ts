import type { ImportPreviewRow } from './importCenter';
import type { FinancialTransaction } from './transactions';

export type MonthlyReconciliationStatus = 'matched' | 'possible' | 'statement-only' | 'app-only' | 'invalid';
export type MonthlyReconciliationPeriod = { minDate: string; maxDate: string };
export type MonthlyStatementReconciliationRow = {
  statementRow: ImportPreviewRow;
  status: Exclude<MonthlyReconciliationStatus, 'app-only'>;
  matchedTransactionId?: string;
  candidateTransactionIds: string[];
};
export type MonthlyTransactionReconciliation = {
  period: MonthlyReconciliationPeriod;
  rows: MonthlyStatementReconciliationRow[];
  appOnly: FinancialTransaction[];
  summary: { matched: number; possible: number; statementOnly: number; appOnly: number; invalid: number };
};

const day = (value: string) => value.slice(0, 10);
const normalizedIdentity = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
const rowIdentity = (row: ImportPreviewRow) => normalizedIdentity(row.description || row.merchant);
const externalIdMatch = (row: ImportPreviewRow, transaction: FinancialTransaction) => Boolean(row.externalId && transaction.source === 'import' && transaction.note.includes(`[external:${row.externalId}]`));
const possibleIdentityMatch = (row: ImportPreviewRow, transaction: FinancialTransaction) => Boolean(row.occurredAt && row.amount && day(transaction.occurredAt) === day(row.occurredAt) && transaction.amount === row.amount && normalizedIdentity(transaction.description || transaction.merchant) === rowIdentity(row));

/**
 * Read-only Statement ↔ App comparison.  It deliberately does not reuse the import duplicate
 * status: the output communicates reconciliation evidence and consumes only unique high-confidence
 * pairs.  Possible relations never consume a transaction and never become app-only noise.
 */
export function reconcileMonthlyTransactions(statementRows: ImportPreviewRow[], transactions: FinancialTransaction[], accountId: string): MonthlyTransactionReconciliation {
  const validRows = statementRows.filter(row => !row.error && row.occurredAt && row.amount && row.fingerprint);
  if (!validRows.length) throw new Error('沒有有效 Statement 列可推導對帳期間');
  const dates = validRows.map(row => day(row.occurredAt!)).sort();
  const period = { minDate: dates[0], maxDate: dates[dates.length - 1] };
  const eligible = transactions.filter(transaction => transaction.accountId === accountId && transaction.status === 'posted' && !transaction.excluded && day(transaction.occurredAt) >= period.minDate && day(transaction.occurredAt) <= period.maxDate);
  const consumed = new Set<string>();
  const possibleRelated = new Set<string>();
  const rows: MonthlyStatementReconciliationRow[] = [];

  for (const row of statementRows) {
    if (row.error || !row.occurredAt || !row.amount || !row.fingerprint) {
      rows.push({ statementRow: row, status: 'invalid', candidateTransactionIds: [] });
      continue;
    }
    const externalCandidates = eligible.filter(transaction => externalIdMatch(row, transaction));
    const fingerprintCandidates = externalCandidates.length ? [] : eligible.filter(transaction => transaction.fingerprint === row.fingerprint);
    const highCandidates = externalCandidates.length ? externalCandidates : fingerprintCandidates;
    const availableHigh = highCandidates.filter(transaction => !consumed.has(transaction.id));
    if (availableHigh.length === 1 && highCandidates.length === 1) {
      consumed.add(availableHigh[0].id);
      rows.push({ statementRow: row, status: 'matched', matchedTransactionId: availableHigh[0].id, candidateTransactionIds: [availableHigh[0].id] });
      continue;
    }
    if (highCandidates.length) {
      highCandidates.forEach(transaction => possibleRelated.add(transaction.id));
      rows.push({ statementRow: row, status: 'possible', candidateTransactionIds: highCandidates.map(transaction => transaction.id) });
      continue;
    }
    const possibleCandidates = eligible.filter(transaction => possibleIdentityMatch(row, transaction));
    if (possibleCandidates.length) {
      possibleCandidates.forEach(transaction => possibleRelated.add(transaction.id));
      rows.push({ statementRow: row, status: 'possible', candidateTransactionIds: possibleCandidates.map(transaction => transaction.id) });
      continue;
    }
    rows.push({ statementRow: row, status: 'statement-only', candidateTransactionIds: [] });
  }

  const appOnly = eligible.filter(transaction => !consumed.has(transaction.id) && !possibleRelated.has(transaction.id));
  const summary = {
    matched: rows.filter(row => row.status === 'matched').length,
    possible: rows.filter(row => row.status === 'possible').length,
    statementOnly: rows.filter(row => row.status === 'statement-only').length,
    appOnly: appOnly.length,
    invalid: rows.filter(row => row.status === 'invalid').length
  };
  return { period, rows, appOnly, summary };
}
