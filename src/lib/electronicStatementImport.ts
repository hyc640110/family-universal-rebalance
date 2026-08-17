import { parseImportDate, type ImportMapping, type ImportRecord } from './importCenter';

export const PDF_STATEMENT_HEADERS = ['交易日期', '單一金額', '描述'] as const;
export const PDF_STATEMENT_MAPPING: ImportMapping = { occurredAt: '交易日期', amount: '單一金額', description: '描述' };

export type PdfTextPage = { pageNumber: number; lines: string[] };
export type PdfStatementParseResult =
  | { status: 'success'; records: ImportRecord[]; headers: string[]; mapping: ImportMapping }
  | { status: 'unsupported'; message: string };

const dateStart = /^(?<date>(?:\d{4}|\d{2,3})[/-]\d{1,2}[/-]\d{1,2})(?:\s+(?<body>.+))?$/;
const amountDigits = '(?:\\d{1,3}(?:,\\d{3})+|\\d+)';
const explicitAmountAtEnd = new RegExp(`(?<amount>(?:[+-]\\s*(?:(?:NT\\$|TWD)\\s*)?${amountDigits}(?:\\.\\d+)?|\\(\\s*(?:(?:NT\\$|TWD)\\s*)?${amountDigits}(?:\\.\\d+)?\\s*\\)))\\s*$`, 'i');
const pageFooter = /^(?:page\s+\d+(?:\s+of\s+\d+)?|\d+\s*\/\s*\d+|第\s*\d+\s*頁)$/i;

/**
 * Generic foundation only: accepts one-column text-PDF rows whose sign is explicit.
 * A bare positive amount has no universal debit/credit meaning, so it is intentionally rejected.
 */
export const parseTextPdfStatement = (pages: PdfTextPage[]): PdfStatementParseResult => {
  const candidates: Array<{ pageNumber: number; lineNumber: number; text: string }> = [];
  for (const page of pages) {
    let current: { pageNumber: number; lineNumber: number; text: string } | undefined;
    page.lines.forEach((line, index) => {
      const normalized = line.replace(/\s+/g, ' ').trim();
      if (!normalized) return;
      if (dateStart.test(normalized)) {
        if (current) candidates.push(current);
        current = { pageNumber: page.pageNumber, lineNumber: index + 1, text: normalized };
      } else if (current && !pageFooter.test(normalized)) current.text = `${current.text} ${normalized}`;
    });
    if (current) candidates.push(current);
  }
  if (!candidates.length) return { status: 'unsupported', message: '找不到可辨識的交易日期列；掃描型、圖片型或此文字帳單格式目前不支援。' };

  const records: ImportRecord[] = [];
  for (const candidate of candidates) {
    const dateMatch = candidate.text.match(dateStart);
    const amountMatch = candidate.text.match(explicitAmountAtEnd);
    const description = dateMatch?.groups?.body?.replace(explicitAmountAtEnd, '').trim() || '';
    if (!dateMatch?.groups?.date || !parseImportDate(dateMatch.groups.date) || !amountMatch?.groups?.amount || !description) {
      return { status: 'unsupported', message: `第 ${candidate.pageNumber} 頁第 ${candidate.lineNumber} 行的日期、描述、金額或收支方向無法可靠辨識；尚未匯入任何交易。` };
    }
    records.push({ rowNumber: records.length + 2, raw: { 交易日期: dateMatch.groups.date, 單一金額: amountMatch.groups.amount.replace(/\s+/g, ''), 描述: description } });
  }
  return { status: 'success', records, headers: [...PDF_STATEMENT_HEADERS], mapping: { ...PDF_STATEMENT_MAPPING } };
};
