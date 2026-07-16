import { useState } from 'react';
import readXlsxFile from 'read-excel-file/browser';
import { Link } from 'react-router-dom';
import type { FinancialAccount } from '../../lib/financialAccounts';
import type { FinancialTransaction } from '../../lib/transactions';
import {
  IMPORT_SCHEMA_VERSION,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_ROWS,
  applyMappingPreset,
  buildImportPreview,
  createImportSessionId,
  createImportTransactions,
  csvParse,
  decodeXlsxRows,
  guessImportMapping,
  rowsToRecords,
  type ImportMapping,
  type ImportPreset,
  type ImportPreviewRow,
  type ImportSession
} from '../../lib/importCenter';

type Sheet = { sheet: string; data: Array<Array<unknown>> };

type ImportCenterProps = {
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  sessions: ImportSession[];
  presets: ImportPreset[];
  onCommit: (session: ImportSession, imported: FinancialTransaction[]) => void;
  onRollback: (sessionId: string) => void;
  onPresets: (presets: ImportPreset[]) => void;
};

const formatTimestamp = (iso: string) => new Date(iso).toLocaleString('zh-TW');
export default function ImportCenter({ accounts, transactions, sessions, presets, onCommit, onRollback, onPresets }: ImportCenterProps) {
  const [accountId, setAccountId] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheetName, setSheetName] = useState('');
  const [records, setRecords] = useState<ReturnType<typeof rowsToRecords>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [dateFormat, setDateFormat] = useState<'ymd' | 'mdy' | 'dmy'>('ymd');
  const [preview, setPreview] = useState<ImportPreviewRow[]>([]);
  const [presetName, setPresetName] = useState('');
  const [message, setMessage] = useState('');
  const targets = accounts.filter(account => account.isActive && ['cash', 'bank', 'creditCard', 'eWallet', 'securities'].includes(account.type));
  const account = targets.find(item => item.id === accountId);

  const selectSheet = (sheet: Sheet, keep = false) => {
    try {
      const next = rowsToRecords(sheet.data);
      if (next.length > MAX_IMPORT_ROWS) throw new Error('工作表超過 2,000 列限制');
      const names = Object.keys(next[0]?.raw || {});
      const compatible = keep && Object.values(mapping).filter(value => typeof value === 'string').every(value => !value || names.includes(value));
      setSheetName(sheet.sheet); setRecords(next); setHeaders(names); setMapping(compatible ? mapping : guessImportMapping(names)); setPreview([]);
      setMessage(`${sheet.sheet}：${next.length} 筆資料列${compatible ? '，保留相容 mapping。' : '，請確認欄位對應。'}`);
    } catch (error) {
      setSheetName(sheet.sheet); setRecords([]); setHeaders([]); setPreview([]);
      setMessage(`${sheet.sheet} 無可匯入資料：${error instanceof Error ? error.message : '解析失敗'}`);
    }
  };

  const parseFile = async (file: File) => {
    try {
      if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error('檔案超過 5 MB 限制');
      const lower = file.name.toLowerCase();
      const kind = lower.endsWith('.csv') ? 'csv' : lower.endsWith('.xlsx') ? 'xlsx' : null;
      if (!kind) throw new Error('僅支援 UTF-8 CSV 或 .xlsx；.xls 請先另存為 .xlsx');
      const nextSheets: Sheet[] = kind === 'csv' ? [{ sheet: 'CSV', data: csvParse(await file.text()) }] : (await readXlsxFile(file) as Sheet[]).map(sheet => ({ ...sheet, data: decodeXlsxRows(sheet.data) }));
      const usable = nextSheets.filter(sheet => sheet.data.length > 1 && sheet.data[0].some(value => String(value ?? '').trim()));
      if (!usable.length) throw new Error('檔案沒有有效工作表');
      setFileName(file.name); setFileType(kind); setSheets(nextSheets); selectSheet(usable[0]);
    } catch (error) { setMessage(error instanceof Error ? error.message : '檔案解析失敗'); }
  };

  const makePreview = () => {
    try {
      const next = buildImportPreview(records, mapping, account, transactions, dateFormat);
      setPreview(next); setMessage(`預覽完成：有效 ${next.filter(row => !row.error).length}，錯誤 ${next.filter(row => row.error).length}。`);
    } catch (error) { setMessage(error instanceof Error ? error.message : '欄位對應無效'); }
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return setMessage('請輸入 preset 名稱');
    const existing = presets.find(preset => preset.name === name);
    if (existing && !window.confirm(`「${name}」已存在，是否覆蓋？`)) return;
    const nowValue = new Date().toISOString();
    const preset: ImportPreset = {
      id: existing?.id || `preset-${crypto.randomUUID?.() ?? Date.now().toString(36)}`, name, mapping, dateFormat, defaultCurrency: account?.currency,
      createdAt: existing?.createdAt || nowValue, updatedAt: nowValue, schemaVersion: IMPORT_SCHEMA_VERSION
    };
    onPresets([...presets.filter(item => item.id !== preset.id), preset]); setMessage(`已儲存 preset「${name}」`);
  };

  const applyPreset = (preset: ImportPreset) => {
    const applied = applyMappingPreset(preset, headers);
    if (applied.error) return setMessage(applied.error);
    setMapping(applied.mapping); setDateFormat(applied.dateFormat); setPreview([]); setMessage(`已套用 preset「${preset.name}」，請重新產生預覽。`);
  };

  const commit = () => {
    if (!account || !fileType || !preview.length) return;
    const id = createImportSessionId();
    const imported = createImportTransactions(preview, account, id);
    const timestamp = new Date().toISOString();
    onCommit({
      id, fileName, fileType, importedAt: timestamp, accountId: account.id, totalRows: preview.length,
      validRows: preview.filter(row => !row.error).length, invalidRows: preview.filter(row => row.error).length,
      duplicateRows: preview.filter(row => row.duplicate === 'certain').length, importedRows: imported.length,
      skippedRows: preview.filter(row => !row.selected || Boolean(row.error)).length, mapping, source: fileType === 'csv' ? 'csv' : 'excel',
      createdAt: timestamp, schemaVersion: IMPORT_SCHEMA_VERSION, warnings: preview.filter(row => row.warning).map(row => `第 ${row.rowNumber} 列：${row.warning}`), status: 'imported'
    }, imported);
    setPreview([]); setRecords([]); setMessage(`已匯入 ${imported.length} 筆交易。`);
  };

  const field = (label: string, key: keyof ImportMapping) => <label>{label}<select value={mapping[key] || ''} onChange={event => { const value = event.currentTarget.value; setMapping(current => ({ ...current, [key]: value || undefined })); }}><option value="">未對應</option>{headers.map(header => <option value={header} key={header}>{header}</option>)}</select></label>;

  return <div className="financial-account-list import-center">
    <nav className="tool-quick-navigation" aria-label="交易匯入導覽"><Link to="/tools">返回工具中心</Link><Link to="/assets">返回資產</Link></nav>
    <p className="note">檔案只在本機記憶體解析，不保存原始檔或工作表資料。限制 5 MB／2,000 列。</p>
    <div className="financial-account-fields">
      <label>匯入帳戶<select value={accountId} onChange={event => setAccountId(event.currentTarget.value)}><option value="">選擇啟用帳戶</option>{targets.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label>選擇檔案<input type="file" accept=".csv,.xlsx" onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void parseFile(file); }} /></label>
      {fileType === 'xlsx' && <label>工作表<select value={sheetName} onChange={event => { const sheet = sheets.find(item => item.sheet === event.currentTarget.value); if (sheet) selectSheet(sheet, true); }}>{sheets.map(sheet => <option value={sheet.sheet} key={sheet.sheet}>{sheet.sheet}</option>)}</select></label>}
      <label>日期格式<select value={dateFormat} onChange={event => setDateFormat(event.currentTarget.value as 'ymd' | 'mdy' | 'dmy')}><option value="ymd">YYYY/MM/DD</option><option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option></select></label>
      {field('交易日期', 'occurredAt')}{field('單一金額', 'amount')}{field('收入', 'credit')}{field('支出', 'debit')}{field('描述', 'description')}{field('商家／對象', 'merchant')}{field('類別', 'categoryId')}{field('外部 ID', 'externalId')}
    </div>
    {message && <p className="note">{message}</p>}
    <div className="financial-account-fields"><label>Preset 名稱<input value={presetName} onChange={event => setPresetName(event.currentTarget.value)} /></label><button className="small" type="button" onClick={savePreset}>儲存／覆蓋 preset</button></div>
    {presets.map(preset => <p className="note" key={preset.id}>{preset.name}｜更新 {formatTimestamp(preset.updatedAt)} <button className="small" type="button" onClick={() => applyPreset(preset)}>套用</button><button className="small" type="button" onClick={() => { const name = window.prompt('新名稱', preset.name)?.trim(); if (name && !presets.some(item => item.name === name && item.id !== preset.id)) onPresets(presets.map(item => item.id === preset.id ? { ...item, name, updatedAt: new Date().toISOString() } : item)); else if (name) setMessage('preset 名稱已存在'); }}>重新命名</button><button className="danger small" type="button" onClick={() => onPresets(presets.filter(item => item.id !== preset.id))}>刪除</button></p>)}
    {records.length > 0 && <button className="small" type="button" onClick={makePreview}>產生匯入預覽</button>}
    {preview.length > 0 && <><div className="import-preview">{preview.slice(0, 50).map(row => <label className={row.error ? 'warning-message' : 'note'} key={row.rowNumber}><input type="checkbox" checked={row.selected} disabled={Boolean(row.error)} onChange={event => setPreview(current => current.map(item => item.rowNumber === row.rowNumber ? { ...item, selected: event.currentTarget.checked } : item))} /> 第 {row.rowNumber} 列｜{row.description || '—'}｜{row.amount ?? '—'}｜{row.error || row.duplicate}</label>)}</div><button className="small" type="button" onClick={commit}>正式批次匯入已選列</button></>}
    <h3>匯入紀錄</h3>{sessions.slice().reverse().map(session => <p className="note" key={session.id}>{session.fileName}｜成功 {session.importedRows}｜{session.status} {session.status === 'imported' && <button className="small" type="button" onClick={() => onRollback(session.id)}>撤銷</button>}</p>)}
  </div>;
}
