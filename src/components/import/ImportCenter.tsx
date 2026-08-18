import { useState } from 'react';
import readXlsxFile from 'read-excel-file/browser';
import { parseTextPdfStatement } from '../../lib/electronicStatementImport';
import { extractTextPdfPages } from '../../lib/pdfTextExtraction';
import type { FinancialAccount } from '../../lib/financialAccounts';
import { categoriesForTransactionType, transactionCategoryLabel, transactionTypeLabel, type FinancialTransaction } from '../../lib/transactions';
import { importCategorySuggestionReasonLabel } from '../../lib/importCategorySuggestion';
import {
  IMPORT_SCHEMA_VERSION,
  IMPORT_FILE_ACCEPT,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_ROWS,
  applyMappingPreset,
  buildImportPreview,
  createImportSessionId,
  createImportTransactions,
  csvParse,
  detectImportFileType,
  decodeXlsxRows,
  guessImportMapping,
  reconcileImportPreviewDuplicates,
  rowsToRecords,
  updateImportPreviewRowCategory,
  type ImportMapping,
  type ImportRecord,
  type ImportPreset,
  type ImportPreviewRow,
  type ImportSession,
  type RollbackOutcome
} from '../../lib/importCenter';

type Sheet = { sheet: string; data: Array<Array<unknown>> };

type ImportCenterProps = {
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  sessions: ImportSession[];
  presets: ImportPreset[];
  onCommit: (session: ImportSession, imported: FinancialTransaction[]) => void;
  onRollback: (sessionId: string) => RollbackOutcome;
  onPresets: (presets: ImportPreset[]) => void;
};

type Feedback = { tone: 'success' | 'error' | 'cancelled'; text: string } | null;

const formatTimestamp = (iso: string) => new Date(iso).toLocaleString('zh-TW');
/** Same success/error/cancelled feedback pattern as the JSON 備份 fix (independent per-zone state,
 * rendered right next to the buttons that triggered it, role="status"/"alert" per tone). */
const FeedbackLine = ({ feedback }: { feedback: Feedback }) => feedback ? <p className={`import-feedback ${feedback.tone}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>{feedback.text}</p> : null;

export default function ImportCenter({ accounts, transactions, sessions, presets, onCommit, onRollback, onPresets }: ImportCenterProps) {
  const [accountId, setAccountId] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheetName, setSheetName] = useState('');
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [dateFormat, setDateFormat] = useState<'ymd' | 'mdy' | 'dmy'>('ymd');
  const [preview, setPreview] = useState<ImportPreviewRow[]>([]);
  const [presetName, setPresetName] = useState('');
  // Covers 選擇檔案／切換工作表 (physically adjacent triggers, same file-loading flow).
  const [fileFeedback, setFileFeedback] = useState<Feedback>(null);
  // Covers 產生匯入預覽.
  const [previewFeedback, setPreviewFeedback] = useState<Feedback>(null);
  // Covers 儲存 preset／套用 preset (physically adjacent, same preset-management block).
  const [presetFeedback, setPresetFeedback] = useState<Feedback>(null);
  // Covers 正式批次匯入已選列.
  const [commitFeedback, setCommitFeedback] = useState<Feedback>(null);
  // Covers 撤銷 (shared across all sessions in the 匯入紀錄 list, same as commitFeedback being
  // shared across the single 正式批次匯入已選列 button — only one rollback action happens at a time).
  const [rollbackFeedback, setRollbackFeedback] = useState<Feedback>(null);
  const targets = accounts.filter(account => account.isActive && ['cash', 'bank', 'creditCard', 'eWallet', 'securities'].includes(account.type));
  const account = targets.find(item => item.id === accountId);
  const selectedRowCount = preview.filter(row => row.selected && !row.error).length;

  const selectSheet = (sheet: Sheet, keep = false) => {
    try {
      const next = rowsToRecords(sheet.data);
      if (next.length > MAX_IMPORT_ROWS) throw new Error('工作表超過 2,000 列限制');
      const names = Object.keys(next[0]?.raw || {});
      const compatible = keep && Object.values(mapping).filter(value => typeof value === 'string').every(value => !value || names.includes(value));
      setSheetName(sheet.sheet); setRecords(next); setHeaders(names); setMapping(compatible ? mapping : guessImportMapping(names)); setPreview([]);
      setFileFeedback({ tone: 'success', text: `${sheet.sheet}：${next.length} 筆資料列${compatible ? '，保留相容 mapping。' : '，請確認欄位對應。'}` });
    } catch (error) {
      setSheetName(sheet.sheet); setRecords([]); setHeaders([]); setPreview([]);
      setFileFeedback({ tone: 'error', text: `${sheet.sheet} 無可匯入資料：${error instanceof Error ? error.message : '解析失敗'}` });
    }
  };

  const parseFile = async (file: File) => {
    try {
      if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error('檔案超過 5 MB 限制');
      const kind = detectImportFileType(file.name);
      if (!kind) throw new Error('僅支援 UTF-8 CSV、.xlsx 或文字型 PDF；.xls 請先另存為 .xlsx');
      if (kind === 'pdf') {
        const parsed = parseTextPdfStatement(await extractTextPdfPages(file));
        if (parsed.status !== 'success') throw new Error(parsed.message);
        if (parsed.records.length > MAX_IMPORT_ROWS) throw new Error('帳單超過 2,000 列限制');
        setFileName(file.name); setFileType(kind); setSheets([]); setSheetName(''); setRecords(parsed.records); setHeaders(parsed.headers); setMapping(parsed.mapping); setPreview([]);
        setFileFeedback({ tone: 'success', text: `文字型 PDF：${parsed.records.length} 筆資料列，已套用安全的日期／金額／描述對應；請選擇帳戶並產生預覽。` });
        return;
      }
      const nextSheets: Sheet[] = kind === 'csv' ? [{ sheet: 'CSV', data: csvParse(await file.text()) }] : (await readXlsxFile(file) as Sheet[]).map(sheet => ({ ...sheet, data: decodeXlsxRows(sheet.data) }));
      const usable = nextSheets.filter(sheet => sheet.data.length > 1 && sheet.data[0].some(value => String(value ?? '').trim()));
      if (!usable.length) throw new Error('檔案沒有有效工作表');
      setFileName(file.name); setFileType(kind); setSheets(nextSheets); selectSheet(usable[0]);
    } catch (error) { setFileFeedback({ tone: 'error', text: error instanceof Error ? error.message : '檔案解析失敗' }); }
  };

  const makePreview = () => {
    try {
      const next = buildImportPreview(records, mapping, account, transactions, dateFormat);
      setPreview(next); setPreviewFeedback({ tone: 'success', text: `預覽完成：有效 ${next.filter(row => !row.error).length}，錯誤 ${next.filter(row => row.error).length}。` });
    } catch (error) { setPreviewFeedback({ tone: 'error', text: error instanceof Error ? error.message : '欄位對應無效' }); }
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) { setPresetFeedback({ tone: 'error', text: '請輸入 preset 名稱' }); return; }
    const existing = presets.find(preset => preset.name === name);
    if (existing && !window.confirm(`「${name}」已存在，是否覆蓋？`)) {
      setPresetFeedback({ tone: 'cancelled', text: '已取消儲存，preset 未變更。' });
      return;
    }
    const nowValue = new Date().toISOString();
    const preset: ImportPreset = {
      id: existing?.id || `preset-${crypto.randomUUID?.() ?? Date.now().toString(36)}`, name, mapping, dateFormat, defaultCurrency: account?.currency,
      createdAt: existing?.createdAt || nowValue, updatedAt: nowValue, schemaVersion: IMPORT_SCHEMA_VERSION
    };
    onPresets([...presets.filter(item => item.id !== preset.id), preset]); setPresetFeedback({ tone: 'success', text: `已儲存 preset「${name}」` });
  };

  const applyPreset = (preset: ImportPreset) => {
    const applied = applyMappingPreset(preset, headers);
    if (applied.error) { setPresetFeedback({ tone: 'error', text: applied.error }); return; }
    setMapping(applied.mapping); setDateFormat(applied.dateFormat); setPreview([]); setPresetFeedback({ tone: 'success', text: `已套用 preset「${preset.name}」，請重新產生預覽。` });
  };

  const renamePreset = (preset: ImportPreset) => {
    const name = window.prompt('新名稱', preset.name)?.trim();
    if (!name) return;
    if (presets.some(item => item.name === name && item.id !== preset.id)) { setPresetFeedback({ tone: 'error', text: 'preset 名稱已存在' }); return; }
    onPresets(presets.map(item => item.id === preset.id ? { ...item, name, updatedAt: new Date().toISOString() } : item));
    setPresetFeedback({ tone: 'success', text: `已重新命名為「${name}」` });
  };

  const commit = () => {
    if (!account || !fileType || !preview.length) { setCommitFeedback({ tone: 'error', text: '缺少匯入帳戶或有效預覽資料，請重新選擇帳戶並產生預覽。' }); return; }
    const id = createImportSessionId();
    const imported = createImportTransactions(preview, account, id);
    if (!imported.length) { setCommitFeedback({ tone: 'error', text: '目前沒有可匯入的列（已勾選且無錯誤），請重新確認勾選內容。' }); return; }
    if (!window.confirm(`即將正式匯入 ${imported.length} 筆交易至「${account.name}」。匯入後可用「撤銷」復原，但只要其中任一筆事後被編輯過，整批就無法再撤銷。是否繼續？`)) {
      setCommitFeedback({ tone: 'cancelled', text: '已取消匯入，尚未寫入任何交易。' });
      return;
    }
    const timestamp = new Date().toISOString();
    onCommit({
      id, fileName, fileType, importedAt: timestamp, accountId: account.id, totalRows: preview.length,
      validRows: preview.filter(row => !row.error).length, invalidRows: preview.filter(row => row.error).length,
      duplicateRows: preview.filter(row => row.duplicate === 'certain').length, importedRows: imported.length,
      skippedRows: preview.filter(row => !row.selected || Boolean(row.error)).length, mapping, source: fileType === 'csv' ? 'csv' : fileType === 'pdf' ? 'pdf' : 'excel',
      createdAt: timestamp, schemaVersion: IMPORT_SCHEMA_VERSION, warnings: preview.filter(row => row.warning).map(row => `第 ${row.rowNumber} 列：${row.warning}`), status: 'imported'
    }, imported);
    setPreview([]); setRecords([]); setCommitFeedback({ tone: 'success', text: `已匯入 ${imported.length} 筆交易。` });
  };

  const rollback = (sessionId: string) => {
    const outcome = onRollback(sessionId);
    if (outcome.ok) { setRollbackFeedback({ tone: 'success', text: `已撤銷 ${outcome.count} 筆交易。` }); return; }
    if (outcome.reason === 'edited') { setRollbackFeedback({ tone: 'error', text: `無法撤銷：本次匯入的交易中有 ${outcome.editedCount} 筆已被編輯過，請改為手動刪除。` }); return; }
    setRollbackFeedback({ tone: 'error', text: '無法撤銷：此批交易已不存在（可能已被逐筆刪除），沒有可撤銷的項目。' });
  };

  const field = (label: string, key: keyof ImportMapping) => <label>{label}<select value={mapping[key] || ''} onChange={event => { const value = event.currentTarget.value; setMapping(current => ({ ...current, [key]: value || undefined })); }}><option value="">未對應</option>{headers.map(header => <option value={header} key={header}>{header}</option>)}</select></label>;

  return <div className="financial-account-list import-center">
    <p className="note">檔案只在本機記憶體解析，不保存原始檔或工作表資料。支援 CSV、XLSX 與文字型 PDF；掃描／圖片型 PDF 不支援。限制 5 MB／2,000 列。</p>
    <div className="financial-account-fields">
      <label>匯入帳戶<select value={accountId} onChange={event => setAccountId(event.currentTarget.value)}><option value="">選擇啟用帳戶</option>{targets.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label>選擇檔案<input type="file" accept={IMPORT_FILE_ACCEPT} onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void parseFile(file); }} /></label>
      {fileType === 'xlsx' && <label>工作表<select value={sheetName} onChange={event => { const sheet = sheets.find(item => item.sheet === event.currentTarget.value); if (sheet) selectSheet(sheet, true); }}>{sheets.map(sheet => <option value={sheet.sheet} key={sheet.sheet}>{sheet.sheet}</option>)}</select></label>}
      <label>日期格式<select value={dateFormat} onChange={event => setDateFormat(event.currentTarget.value as 'ymd' | 'mdy' | 'dmy')}><option value="ymd">YYYY/MM/DD</option><option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option></select></label>
      {field('交易日期', 'occurredAt')}{field('單一金額', 'amount')}{field('收入', 'credit')}{field('支出', 'debit')}{field('描述', 'description')}{field('商家／對象', 'merchant')}{field('類別', 'categoryId')}{field('外部 ID', 'externalId')}
    </div>
    <FeedbackLine feedback={fileFeedback} />
    <div className="financial-account-fields"><label>Preset 名稱<input value={presetName} onChange={event => setPresetName(event.currentTarget.value)} /></label><button className="small" type="button" onClick={savePreset}>儲存／覆蓋 preset</button></div>
    {presets.map(preset => <p className="note" key={preset.id}>{preset.name}｜更新 {formatTimestamp(preset.updatedAt)} <button className="small" type="button" onClick={() => applyPreset(preset)}>套用</button><button className="small" type="button" onClick={() => renamePreset(preset)}>重新命名</button><button className="danger small" type="button" onClick={() => onPresets(presets.filter(item => item.id !== preset.id))}>刪除</button></p>)}
    <FeedbackLine feedback={presetFeedback} />
    {records.length > 0 && <button className="small" type="button" onClick={makePreview}>產生匯入預覽</button>}
    <FeedbackLine feedback={previewFeedback} />
    {preview.length > 0 && <><div className="import-preview">{preview.slice(0, 50).map(row => { const suggestion = row.categorySuggestion?.kind === 'suggestion' ? row.categorySuggestion : undefined; const updateCategory = (categoryId: string) => setPreview(current => reconcileImportPreviewDuplicates(current.map(item => item.rowNumber === row.rowNumber ? updateImportPreviewRowCategory(item, categoryId, account!, transactions) : item), account!, transactions)); return <div className={row.error ? 'warning-message' : 'note'} key={row.rowNumber}><label><input type="checkbox" checked={row.selected} disabled={Boolean(row.error)} onChange={event => { const checked = event.currentTarget.checked; setPreview(current => current.map(item => item.rowNumber === row.rowNumber ? { ...item, selected: checked } : item)); }} /> 第 {row.rowNumber} 列｜{row.type ? transactionTypeLabel(row.type) : '方向未確認'}｜{row.description || '—'}｜{row.amount ?? '—'}｜{row.error || row.duplicate}</label>{!row.error && row.warning && <span className="import-preview-warning">{row.warning}</span>}{row.type && !row.error && account && <span className="import-preview-category">｜分類：<select aria-label={`第 ${row.rowNumber} 列分類`} value={row.categoryId} onChange={event => updateCategory(event.currentTarget.value)}>{categoriesForTransactionType(row.type).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></span>}{suggestion && row.type && !row.error && account && <span className="import-preview-suggestion">｜<span className="import-preview-suggestion-copy">建議：{transactionCategoryLabel(suggestion.categoryId)}（{importCategorySuggestionReasonLabel(suggestion.reasonCodes[0])}）</span><button className="small" type="button" onClick={() => updateCategory(suggestion.categoryId)}>套用建議</button></span>}</div>; })}</div><button className="small" type="button" disabled={selectedRowCount === 0} onClick={commit}>正式批次匯入已選列</button></>}
    <FeedbackLine feedback={commitFeedback} />
    <h3>匯入紀錄</h3>{sessions.slice().reverse().map(session => <p className="note" key={session.id}>{session.fileName}｜成功 {session.importedRows}｜{session.status} {session.status === 'imported' && <button className="small" type="button" onClick={() => rollback(session.id)}>撤銷</button>}</p>)}
    <FeedbackLine feedback={rollbackFeedback} />
  </div>;
}
