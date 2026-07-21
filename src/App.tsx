import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, SetStateAction } from 'react';
import { Download, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { APP_BUILD_TIME, APP_GIT_COMMIT, APP_NAME, APP_SUBTITLE, APP_VERSION, DEPLOYMENT_ENVIRONMENT, buildFirebaseSyncRoot, FIREBASE_BASE_PATH, STORAGE_KEY, WORKER_URL as DEFAULT_WORKER_URL } from './constants/appInfo';
import AppLayout from './components/layout/AppLayout';
import ImportCenter from './components/import/ImportCenter';
import AllocationContextNotice from './components/AllocationContextNotice';
import HomePage from './pages/HomePage';
import AssetsPage from './pages/AssetsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ToolsPage from './pages/ToolsPage';
import SettingsPage from './pages/SettingsPage';
import GmailOAuthSettings from './components/GmailOAuthSettings';
import AllocationSimulatorPage from './pages/AllocationSimulatorPage';
import RiskCenterPage from './pages/RiskCenterPage';
import WealthGoalPage from './pages/WealthGoalPage';
import DashboardDecisionPage from './pages/DashboardDecisionPage';
import PerformanceAnalyticsPage from './pages/PerformanceAnalyticsPage';
import CashFlowPage from './pages/CashFlowPage';
import NetWorthHistoryPage from './pages/NetWorthHistoryPage';
import DividendCenterPage from './pages/DividendCenterPage';
import MarketIntelligencePage from './pages/MarketIntelligencePage';
import AiDecisionCenterPage from './pages/AiDecisionCenterPage';
import PortfolioRiskPage from './pages/PortfolioRiskPage';
import RebalanceRecommendationPage from './pages/RebalanceRecommendationPage';
import ClecStrategyCenterPage from './pages/ClecStrategyCenterPage';
import InvestmentActionCenterPage from './pages/InvestmentActionCenterPage';
import { buildUnavailableMarketSnapshot, fetchMarketSnapshot, formatMarketTime, mergeMarketSnapshot, type MarketSnapshot } from './lib/marketData';
import { isMarketSectionEnabled, visibleMarketSnapshot } from './lib/marketSections';
import { isValidQuoteTimestamp, marketContentSignature, marketRefreshMessage, marketRefreshOutcome, mergeQuoteMap, quoteRefreshErrorLabel, quoteRefreshRequestInit, refreshUrl } from './lib/dataRefresh';
import { createQuoteRefreshController, type QuoteRefreshRequestOptions } from './lib/quoteRefreshController';
import { describeQuotePresentation } from './lib/quotePresentation';
import { createAssetsPullToRefresh } from './lib/assetsPullToRefresh';
import { DEFAULT_WEALTH_GOAL, normalizeWealthGoalSettings, type WealthGoalSettings } from './lib/wealthGoal';
import { deriveWealthGoalProjection } from './lib/wealthGoal';
import { deriveRiskMetrics } from './lib/riskMetrics';
import { deriveHomeDecision } from './lib/homeDecision';
import { deriveInvestmentDashboard } from './lib/investmentDashboard';
import { deriveInvestmentPerformanceQuality, deriveInvestmentPerformanceStats } from './lib/investmentPerformanceHistory';
import { dividendSources, dividendSummary } from './lib/dividends';
import { deriveAiDecisions, deriveMarketFreshness } from './lib/aiDecision';
import { derivePortfolioRisk } from './lib/portfolioRisk';
import { deriveRebalanceRecommendation } from './lib/rebalanceRecommendation';
import { createRecommendationModels } from './lib/recommendations';
import { deriveInvestmentIntelligence } from './lib/investmentIntelligence';
import { adaptInvestmentIntelligenceInput } from './lib/investmentIntelligenceAdapter';
import { deriveDailyDecisionWorkflow } from './lib/dailyDecisionWorkflow';
import { deriveInvestmentOpportunities } from './lib/investmentOpportunities';
import { deriveInvestmentActionCenter } from './lib/investmentActionCenter';
import { deriveInvestmentActionExplanations } from './lib/investmentActionExplainability';
import { allocationPresetLabel, deriveAllocationPresetPreview, normalizeAllocationPreset, normalizeAllocationRoleBySymbol, roleLabel, type AllocationPreset, type AllocationRole } from './lib/allocationPresets';
import { deriveClecStrategyCenter } from './lib/clecStrategy';
import { buildClecStrategyRuleInput } from './lib/clecStrategyRuleAdapter';
import { deriveClecStrategyRule } from './lib/clecStrategyRules';
import { deriveRebalanceExecutionEligibility } from './lib/rebalanceExecutionEligibility';
import { formatCompactHoldingWeight, formatCompactQuoteMovement } from './lib/compactAssetCard';
import { deriveCashFlow, normalizeCashFlowProfile, type CashFlowProfile } from './lib/cashFlow';
import { deriveHistoryStats, localSnapshotDate, netWorthSnapshotFromTotals, normalizeNetWorthHistory, upsertNetWorthSnapshot, type NetWorthSnapshot } from './lib/netWorthHistory';
import { formatTransactionAmount } from './lib/transactionPresentation';
import { CASH_ACCOUNT_MIGRATION_VERSION, FINANCIAL_ACCOUNT_SCHEMA_VERSION, FINANCIAL_ACCOUNT_TYPES, createFinancialAccount, deactivateFinancialAccount, financialAccountLiquidTotal, financialAccountNetWorthContribution, getFinancialAccountBalance, normalizeAccountState, normalizeFinancialAccounts, removeFinancialAccount, restoreFinancialAccount, updateFinancialAccount, type AccountBalanceMode, type FinancialAccount, type FinancialAccountType } from './lib/financialAccounts';
import { TRANSACTION_SCHEMA_VERSION, accountHasTransactions, categoriesForTransactionType, createTransactionId, createTransferTransaction, deriveTransactionAccountBalances, normalizeTransactionCategory, normalizeTransactions, transactionCategoryLabel, transactionCashFlowSummary, transactionSourceLabel, transactionStatusLabel, updateTransaction as updateTransactionRecord, validateTransferAccounts, type FinancialTransaction, type TransactionStatus, type TransactionType } from './lib/transactions';
import { EMPTY_TRANSACTION_SYNC_DIAGNOSTICS, deriveTransactionSyncDiagnostics, type TransactionSyncDiagnostics } from './lib/transactionSyncDiagnostics';
import { IMPORT_SCHEMA_VERSION, importedBySession, normalizeMappingPresets, type ImportPreset, type ImportSession } from './lib/importCenter';
import { assertNoOAuthSecrets, disconnectedGmailOAuth, normalizeGmailOAuth, type GmailOAuthState } from './lib/gmailOAuth';
import { calculateDailyProfitLoss, calculateQuoteChange, isTodayQuote, quoteDateStatus } from './lib/quoteMath';
import { canonicalSyncPayload, createSyncPayloadSnapshot, deriveSuccessfulUploadResult, deriveSyncBaselineDiagnostics, hasSyncableStateChanged, sanitizeSyncFieldFingerprints, shortSyncFingerprint, withoutSyncBaseline, type RemoteMeta, type SyncMeta, type SyncSource } from './lib/syncState';
import { describeMarketRuntime, quoteProvenanceText } from './lib/runtimeProvenance';

type SymbolCode = string;
type Quote = { symbol: SymbolCode; name: string; price: number; previousClose: number; change: number; changePct: number; quoteDate?: string; quoteTime?: string; volume: number; source: string; updatedAt: string; error?: string };
type AssetClass = 'growth' | 'defensive';
type Holding = { symbol: SymbolCode; name?: string; shares: number; avgCost: number; targetWeight?: number; assetClass: AssetClass; isArchived?: boolean; isPreviewFixture?: boolean };
type CashItem = { id: string; name: string; amount: number; note: string };
type LoanItem = { id: string; name: string; principal: number; annualRate: number; monthlyPayment: number; startDate: string; totalMonths?: number };
type FirebaseConfig = { databaseURL: string; secretPath: string };
type RebalanceMode = 'standard' | 'buy-only';
type AllocationRoleBySymbol = Record<string, AllocationRole>;
type DipAlertSetting = { enabled: boolean; referencePrice: number; thresholdPct: number };
type AppState = { holdings: Holding[]; cash: CashItem[]; accounts: FinancialAccount[]; accountSchemaVersion: number; cashAccountMigrationVersion: number; transactions: FinancialTransaction[]; transactionSchemaVersion: number; importSessions: ImportSession[]; importPresets: ImportPreset[]; importSchemaVersion: number; gmailOAuth: GmailOAuthState; loans: LoanItem[]; refreshSec: number; firebase: FirebaseConfig; workerUrl: string; autoSync: boolean; autoSyncSec: number; allocationPreset: AllocationPreset; allocationRoleBySymbol: AllocationRoleBySymbol; rebalanceMode: RebalanceMode; rebalanceThreshold: number; buyOnlyBudget: number; dipAlerts: Record<SymbolCode, DipAlertSetting>; wealthGoal: WealthGoalSettings; cashFlowProfile?: CashFlowProfile; netWorthHistory?: NetWorthSnapshot[]; syncMeta: SyncMeta; remoteMeta: RemoteMeta | null };
type BackupPayload = { version: string; exportedAt: string; holdings: Holding[]; cashAccounts: CashItem[]; accounts: FinancialAccount[]; accountSchemaVersion: number; cashAccountMigrationVersion: number; transactions: FinancialTransaction[]; transactionSchemaVersion: number; importSessions: ImportSession[]; importPresets: ImportPreset[]; importSchemaVersion: number; gmailOAuth: GmailOAuthState; loans: LoanItem[]; quotes: Record<SymbolCode, Quote>; targetRatio: number; allocationPreset: AllocationPreset; allocationRoleBySymbol: AllocationRoleBySymbol; rebalanceMode: string; rebalanceThreshold: number; buyOnlyBudget: number; dipAlerts: Record<SymbolCode, DipAlertSetting>; wealthGoal: WealthGoalSettings; cashFlowProfile?: CashFlowProfile; netWorthHistory?: NetWorthSnapshot[]; syncMeta: SyncMeta; syncSettings: { refreshSec: number; autoSync: boolean; autoSyncSec: number; workerUrl: string; firebase: FirebaseConfig; firebaseConfigured: boolean } };
type OrderSuggestion = { symbol: SymbolCode; name: string; diff: number; amount: number; price: number; targetPercent: number; currentValue: number; targetValue: number; shares: number | null; lots: number; oddLots: number; conversionText: string };
type DefensiveReminder = { status: 'missing' | 'under' | 'over' | 'ok'; message: string; item?: OrderSuggestion; items: OrderSuggestion[]; currentWeight: number; targetPercent: number };
type OrderHelper = { growthBuy: OrderSuggestion[]; growthSell: OrderSuggestion[]; skippedSell: OrderSuggestion[]; defensiveReminder: DefensiveReminder; cash: number; totalBuyAmount: number; fullBuyGap: number; shortage: number; cashEnough: boolean; cashLimited: boolean; mode: RebalanceMode; modeLabel: string; buyOnlyBudget: number; buyOnlyLimit: number; hasInvalidBuyOnlyBudget: boolean };
type DipAlertRow = { symbol: SymbolCode; name: string; price: number; setting: DipAlertSetting; drawdownPct: number | null; status: string; triggered: boolean };
type TradeAction = '買入' | '賣出' | '不需處理';
type TradeStep = { action: TradeAction; symbol: SymbolCode; name: string; amount: number; price: number; shares: number | null; conversionText: string; order: number; projectedWeight: number; note: string };
type MobileDisplayMode = 'compact' | 'full';
type SectionKey = 'overview' | 'today' | 'ai' | 'holdings' | 'orders' | 'allocation' | 'assetClass' | 'rebalance' | 'cash' | 'transactions' | 'loans' | 'sync' | 'debug' | 'dipAnalysis' | 'analyticsDetails' | 'quoteSources' | 'syncStatus' | 'syncDiagnostics' | 'targetCheck';
type UiState = { displayMode: MobileDisplayMode; sections: Partial<Record<SectionKey, boolean>> };
const marketGroupLabel = (group: string) => ({ taiwan: '台股主要指標', global: '全球主要指數', treasury: '美國公債殖利率', event: '重要經濟事件' })[group] || group;
const PREVIEW_ARCHIVED_FIXTURE_SYMBOL = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT === 'preview' ? (import.meta.env.VITE_PREVIEW_ARCHIVED_FIXTURE || '') : '';
const PREVIEW_HISTORICAL_DIVIDEND_FIXTURE = import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT === 'preview' ? { id: 'preview-historical-dividend-hist01', symbol: 'HIST01', name: '歷史測試資產', occurredAt: '2026-07-14T00:00:00.000Z' } : null;

const REMOVED_SYMBOLS = new Set<SymbolCode>();
const DEFAULT_HOLDINGS: Holding[] = [
  { symbol: '00662', name: '富邦NASDAQ', shares: 0, avgCost: 0, targetWeight: 40, assetClass: 'growth' },
  { symbol: '00670L', name: '富邦NASDAQ正2', shares: 0, avgCost: 0, targetWeight: 38, assetClass: 'growth' },
  { symbol: '00865B', name: '國泰US短期公債', shares: 0, avgCost: 0, targetWeight: 20, assetClass: 'defensive' },
  { symbol: '00631L', name: '元大台灣50正2', shares: 0, avgCost: 0, targetWeight: 1, assetClass: 'growth' }
];
const SYMBOL_NAMES: Record<SymbolCode, string> = {
  '00662': '富邦NASDAQ',
  '00670L': '富邦NASDAQ正2',
  '00631L': '元大台灣50正2',
  '00865B': '國泰US短期公債',
  '00685L': '群益臺灣加權正2',
  '00895': '富邦未來車',
  '0050': '元大台灣50'
};
const TAIWAN_SYMBOL_RE = /^\d{4,6}[A-Z]{0,3}(\.(TW|TWO))?$/;
const DEFAULT_GROWTH_TARGET = 1;
const MIN_GROWTH_TARGET = 0;
const MAX_GROWTH_TARGET = 100;
const DEFAULT_REBALANCE_MODE: RebalanceMode = 'buy-only';
const DEFAULT_REBALANCE_THRESHOLD = 5;
const DEFAULT_BUY_ONLY_BUDGET = 100000;
const DEFAULT_DIP_ALERT_THRESHOLD = -10;
const MAX_REBALANCE_THRESHOLD = 20;
const UI_STATE_KEY = `${STORAGE_KEY}-ui-v21`;
const DEFAULT_UI_STATE: UiState = { displayMode: 'compact', sections: { overview: true, today: true, ai: false, holdings: true, orders: true, allocation: false, assetClass: false, rebalance: false, cash: false, transactions: false, loans: false, sync: false, debug: false, dipAnalysis: false, analyticsDetails: false, quoteSources: false, syncStatus: false, syncDiagnostics: false, targetCheck: false } };
const FULL_UI_SECTIONS: Partial<Record<SectionKey, boolean>> = { overview: true, today: true, ai: true, holdings: true, orders: true, allocation: true, assetClass: true, rebalance: true, cash: true, transactions: true, loans: true, sync: true, debug: false, dipAnalysis: true, analyticsDetails: true, quoteSources: true, syncStatus: true, syncDiagnostics: true, targetCheck: true };
const defaultSyncMeta = (): SyncMeta => ({ dirty: true, source: '本機資料', status: '尚未建立同步基準，同步狀態未知' });
const flushFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();
const num = (n: number) => Number.isFinite(n) ? n : 0;
const formatWan = (n: number, fractionDigits = 1) => `${(Math.abs(num(n)) / 10000).toLocaleString('zh-TW', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} 萬元`;
const signedWan = (n: number) => `${n > 0 ? '+' : n < 0 ? '-' : ''}${formatWan(n)}`;
const money = (n: number) => formatWan(n);
const formatCurrency = (n: number) => formatWan(n);
const signedMoney = (n: number) => signedWan(n);
const pct = (n: number) => `${num(n).toFixed(2)}%`;
const signedPct = (n: number) => `${n > 0 ? '+' : ''}${pct(n)}`;
const tw = (iso: string) => new Date(iso).toLocaleString('zh-TW');
const normalizeSymbol = (value: unknown) => String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
const isTaiwanSymbol = (value: unknown) => TAIWAN_SYMBOL_RE.test(normalizeSymbol(value));
const sanitizeName = (value: unknown) => String(value ?? '').trim();
const pickName = (...values: unknown[]) => {
  for (const value of values) {
    const name = sanitizeName(value);
    if (name) return name;
  }
  return '';
};
const quoteNameFields = (data: unknown) => {
  const d = data && typeof data === 'object' ? data as Record<string, any> : {};
  const meta = d.raw?.chart?.result?.[0]?.meta || {};
  return [
    d.name,
    d.shortName,
    d.longName,
    d.displayName,
    d.securityName,
    d.stockName,
    d.zhName,
    d.raw?.name,
    d.raw?.shortName,
    d.raw?.longName,
    d.raw?.displayName,
    meta.shortName,
    meta.longName,
    meta.symbolName
  ];
};
const resolveSymbolName = (symbol: SymbolCode, ...sources: unknown[]) => pickName(...sources, SYMBOL_NAMES[symbol], symbol) || symbol;
const twShortTime = (iso: string) => {
  if (!iso) return '尚未更新';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '尚未更新';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const backupStamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};
function downloadTextFile(filename: string, text: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
async function copyTextWithFallback(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to textarea copy for Safari or restricted clipboard contexts.
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.opacity = '0.01';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  const ok = document.execCommand('copy');
  textarea.remove();
  if (!ok) throw new Error('copy command failed');
}
const safeNumber = (value: unknown) => {
  const n = Number(value) || 0;
  return Number.isFinite(n) ? n : 0;
};
const clampTarget = (value: number) => Math.min(MAX_GROWTH_TARGET, Math.max(MIN_GROWTH_TARGET, Number.isFinite(value) ? value : 0));
const safeHoldings = (holdings: unknown): Holding[] => Array.isArray(holdings) ? holdings.filter(Boolean) as Holding[] : [];
const rawTargetOf = (asset: unknown) => {
  const a = asset && typeof asset === 'object' ? asset as Record<string, unknown> : {};
  return a.targetWeight ?? a.targetPercent ?? a.targetRatio ?? a.allocation ?? 0;
};
const normalizeAssetClass = (value: unknown, symbol?: SymbolCode): AssetClass => {
  if (value === 'defensive') return 'defensive';
  if (value === 'growth') return 'growth';
  return normalizeSymbol(symbol) === '00865B' ? 'defensive' : 'growth';
};
const assetClassLabel = (value: AssetClass) => value === 'defensive' ? '防守資產' : '成長資產';
const isDefensiveHolding = (asset: Pick<Holding, 'assetClass'> | null | undefined) => asset?.assetClass === 'defensive';
const isGrowthHolding = (asset: Pick<Holding, 'assetClass'> | null | undefined) => asset?.assetClass !== 'defensive';
const getGrowthTargetTotal = (holdings: unknown) => {
  return safeHoldings(holdings)
    .filter(asset => isGrowthHolding(asset))
    .reduce((total, asset) => total + Math.max(0, safeNumber(rawTargetOf(asset))), 0);
};
const getDefensiveStockTargetTotal = (holdings: unknown) => {
  return safeHoldings(holdings)
    .filter(asset => isDefensiveHolding(asset))
    .reduce((total, asset) => total + Math.max(0, safeNumber(rawTargetOf(asset))), 0);
};
const getHoldingTargetTotal = (holdings: unknown) => getGrowthTargetTotal(holdings) + getDefensiveStockTargetTotal(holdings);
const getCashTarget = (holdings: unknown) => Math.max(0, 100 - getHoldingTargetTotal(holdings));
const getEffectiveTargetPercent = (asset: Holding | null | undefined, holdings: unknown) => {
  if (!asset) return 0;
  return Math.max(0, safeNumber(rawTargetOf(asset)));
};
const growthTargetTotalOf = (state: Partial<Pick<AppState, 'holdings'>>) => getGrowthTargetTotal(state?.holdings);
const growthTargetOf = (state: Partial<Pick<AppState, 'holdings'>>) => Math.min(MAX_GROWTH_TARGET, growthTargetTotalOf(state));
const defensiveTargetOf = (state: Partial<Pick<AppState, 'holdings'>>) => Math.max(0, 100 - growthTargetOf(state));
const isTargetOverLimit = (state: Partial<Pick<AppState, 'holdings'>>) => getHoldingTargetTotal(state?.holdings) > 100;
const normalizeHoldingTargets = (holdings: unknown) => safeHoldings(holdings).map(h => ({ ...h, symbol: normalizeSymbol(h?.symbol), targetWeight: getEffectiveTargetPercent(h, holdings) }));
const tone = (value: number) => value > 0 ? 'up' : value < 0 ? 'down' : 'hold';
const getRepaymentSafetyText = (months: number, days: number, monthlyPayment: number) => {
  if (monthlyPayment === 0) return <span className="safety-badge">🟢 無貸款壓力</span>;
  let badgeText = '';
  if (months >= 36) badgeText = '🟢 極度安全';
  else if (months >= 12) badgeText = '🟡 安全';
  else badgeText = '🔴 需要注意';
  return (
    <span className="safety-container">
      <span className="safety-badge">{badgeText}</span>
      <span className="safety-desc">可支應 {months.toFixed(1)} 個月（約 {days} 天）</span>
    </span>
  );
};
const getRepaymentSafetyTone = (months: number, monthlyPayment: number) => {
  if (monthlyPayment === 0) return 'good';
  if (months >= 36) return 'good';
  if (months >= 12) return 'warn';
  return 'bad';
};
const normalizeRebalanceMode = (value: unknown): RebalanceMode => value === 'standard' ? 'standard' : DEFAULT_REBALANCE_MODE;
const clampRebalanceThreshold = (value: number) => Math.min(MAX_REBALANCE_THRESHOLD, Math.max(0, num(value) || 0));
const normalizeBuyOnlyBudget = (value: unknown) => Math.max(0, safeNumber(value));
const budgetWanOf = (value: unknown) => safeNumber(value) / 10000;
const budgetFromWan = (value: unknown) => Math.max(0, safeNumber(value) * 10000);
const rebalanceModeLabel = (mode: RebalanceMode) => mode === 'standard' ? '標準再平衡' : '只買不賣';
const rebalanceModeDescription = (mode: RebalanceMode) => mode === 'standard' ? '允許買入與賣出，目標是讓配置回到目標比例。' : '不賣出超標資產，只用現金或新資金補足低配資產，適合分批投入。';
const defaultDipAlertSetting = (): DipAlertSetting => ({ enabled: false, referencePrice: 0, thresholdPct: DEFAULT_DIP_ALERT_THRESHOLD });
function normalizeDipAlertSetting(raw: unknown): DipAlertSetting {
  const r = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const rawThreshold = r.thresholdPct;
  const threshold = rawThreshold === undefined || rawThreshold === null || rawThreshold === '' ? DEFAULT_DIP_ALERT_THRESHOLD : safeNumber(rawThreshold);
  return { enabled: Boolean(r.enabled), referencePrice: Math.max(0, safeNumber(r.referencePrice)), thresholdPct: threshold };
}
function normalizeDipAlerts(raw: unknown, holdings: unknown): Record<SymbolCode, DipAlertSetting> {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return safeHoldings(holdings).reduce<Record<SymbolCode, DipAlertSetting>>((next, holding) => {
    const symbol = normalizeSymbol(holding?.symbol);
    if (symbol && isTaiwanSymbol(symbol)) next[symbol] = normalizeDipAlertSetting(source[symbol]);
    return next;
  }, {});
}
function getLotAndOddLot(shares: number) {
  const safeShares = Math.max(0, Math.floor(safeNumber(shares)));
  return { lots: Math.floor(safeShares / 1000), oddLots: safeShares % 1000 };
}
function formatShares(shares: number | null) {
  if (shares === null) return '價格不足，無法換算股數';
  const { lots, oddLots } = getLotAndOddLot(shares);
  return `${shares.toLocaleString('zh-TW')} 股（${lots} 張 + ${oddLots} 股）`;
}
function isBackupQuoteSource(source: unknown) {
  const text = String(source ?? '');
  return text.includes('備援') || text.includes('成交均價') || text.includes('離線');
}
function quoteDisplayStatus(rows: Array<{ quote: Quote }>) {
  const hasError = rows.some(row => Boolean(row.quote.error));
  const hasBackup = rows.some(row => isBackupQuoteSource(row.quote.source));
  const statuses = rows.map(row => quoteDateStatus(row.quote.quoteDate, row.quote.quoteTime));
  if (hasError) return '部分標的報價異常';
  if (statuses.includes('unknown')) return '部分標的報價日期不明';
  if (statuses.includes('unavailable')) return '台股交易日資料未涵蓋';
  if (statuses.includes('stale')) return '部分標的非今日報價';
  if (statuses.includes('recent-trading-day')) return '目前為最近交易日報價';
  if (hasBackup) return '部分標的目前使用備援價格';
  return '報價正常';
}
const defaultQuotes: Record<SymbolCode, Quote> = {
  '00662': { symbol: '00662', name: SYMBOL_NAMES['00662'], price: 0, previousClose: 0, change: 0, changePct: 0, volume: 0, source: '無股價資料', updatedAt: now() },
  '00670L': { symbol: '00670L', name: SYMBOL_NAMES['00670L'], price: 0, previousClose: 0, change: 0, changePct: 0, volume: 0, source: '無股價資料', updatedAt: now() },
  '00631L': { symbol: '00631L', name: SYMBOL_NAMES['00631L'], price: 38.42, previousClose: 37.61, change: 0.81, changePct: 2.15, volume: 0, source: '內建備援', updatedAt: now() },
  '00865B': { symbol: '00865B', name: SYMBOL_NAMES['00865B'], price: 48.52, previousClose: 48.41, change: 0.11, changePct: 0.23, volume: 0, source: '內建備援', updatedAt: now() },
  '0050': { symbol: '0050', name: SYMBOL_NAMES['0050'], price: 0, previousClose: 0, change: 0, changePct: 0, volume: 0, source: '無股價資料', updatedAt: now() }
};

const defaultState: AppState = {
  holdings: DEFAULT_HOLDINGS,
  cash: [{ id: uid(), name: '現金', amount: 0, note: '防守資產' }],
  accounts: [createFinancialAccount({ name: '現金', type: 'cash', manualBalance: 0, note: '防守資產' })],
  accountSchemaVersion: FINANCIAL_ACCOUNT_SCHEMA_VERSION,
  cashAccountMigrationVersion: CASH_ACCOUNT_MIGRATION_VERSION,
  transactions: [], transactionSchemaVersion: TRANSACTION_SCHEMA_VERSION, importSessions: [], importPresets: [], importSchemaVersion: IMPORT_SCHEMA_VERSION,
  gmailOAuth: disconnectedGmailOAuth(),
  loans: [{ id: uid(), name: '信貸', principal: 0, annualRate: 6.5, monthlyPayment: 10000, startDate: new Date().toISOString().slice(0, 10), totalMonths: 84 }],
  refreshSec: 60,
  firebase: { databaseURL: '', secretPath: FIREBASE_BASE_PATH },
  workerUrl: DEFAULT_WORKER_URL,
  autoSync: false,
  autoSyncSec: 60,
  allocationPreset: 'custom',
  allocationRoleBySymbol: {},
  rebalanceMode: DEFAULT_REBALANCE_MODE,
  rebalanceThreshold: DEFAULT_REBALANCE_THRESHOLD,
  buyOnlyBudget: DEFAULT_BUY_ONLY_BUDGET,
  dipAlerts: {},
  wealthGoal: DEFAULT_WEALTH_GOAL,
  syncMeta: defaultSyncMeta(),
  remoteMeta: null
};
type StartupIssue = { message: string; raw?: string };
let startupIssue: StartupIssue | null = null;

const REMOVED_RECORD_KEY = ['tra', 'des'].join('');
const STALE_KEYS = ['strategy', 'strategies', 'targetAllocation', 'assetAllocation', 'portfolioSummary', 'strategyTotal', 'defaultHoldings', ['default', 'Tr', 'ades'].join(''), 'monthlyContribution', 'simCagr', 'simDividend', 'simYears', REMOVED_RECORD_KEY];
const removedSymbol = () => Array.from(REMOVED_SYMBOLS)[0] || '';
function hasRemovedSymbol(value: unknown) { const symbol = removedSymbol(); return Boolean(symbol) && String(value ?? '').includes(symbol); }
function removedSymbolMessage() { const symbol = removedSymbol(); return symbol ? `${symbol} 已從正式策略移除，請勿在現金項目中使用 ${symbol} 作為名稱或備註。` : '可自行新增合法台股代號，系統會在更新股價時動態查詢。'; }
function uniqueSymbols(state?: Partial<AppState>): SymbolCode[] {
  const fromState = safeHoldings(state?.holdings).filter(h => !h.isArchived).map(h => normalizeSymbol(h?.symbol)).filter(isTaiwanSymbol);
  return Array.from(new Set(fromState.filter(s => s && !REMOVED_SYMBOLS.has(s))));
}
function backupQuote(symbol: SymbolCode, holding?: Holding): Quote {
  const base = defaultQuotes[symbol];
  const price = num(holding?.avgCost || base?.price || 0);
  return { ...(base || { symbol, name: resolveSymbolName(symbol, holding?.name), volume: 0 }), symbol, name: resolveSymbolName(symbol, holding?.name, base?.name), price, previousClose: price, change: 0, changePct: 0, volume: base?.volume || 0, source: holding?.avgCost ? '成交均價備援' : '無股價資料', updatedAt: now() };
}
function sanitizeHolding(h: Holding): Holding | null {
  const symbol = normalizeSymbol(h?.symbol);
  const isPreviewFixture = DEPLOYMENT_ENVIRONMENT === 'preview' && Boolean(PREVIEW_ARCHIVED_FIXTURE_SYMBOL) && symbol === PREVIEW_ARCHIVED_FIXTURE_SYMBOL && Boolean(h.isPreviewFixture);
  if (!symbol || (!isTaiwanSymbol(symbol) && !isPreviewFixture) || REMOVED_SYMBOLS.has(symbol)) return null;
  const name = isPreviewFixture ? ((h as Partial<Holding>)?.name || 'Preview 測試資產') : resolveSymbolName(symbol, (h as Partial<Holding>)?.name);
  const shares = Math.max(0, safeNumber(h.shares));
  const avgCost = Math.max(0, safeNumber(h.avgCost));
  const rawTarget = rawTargetOf(h);
  const targetWeight = rawTarget === undefined ? undefined : clampTarget(safeNumber(rawTarget));
  const assetClass = normalizeAssetClass((h as Partial<Holding>)?.assetClass, symbol);
  return { symbol, name, shares, avgCost, assetClass, ...(targetWeight === undefined ? {} : { targetWeight }), ...(h.isArchived ? { isArchived: true } : {}), ...(isPreviewFixture ? { isPreviewFixture: true } : {}) };
}
function sanitizeCashItem(c: CashItem): CashItem | null {
  if ([c?.id, c?.name, c?.note].some(hasRemovedSymbol)) return null;
  return { id: c.id || uid(), name: c.name || '現金', amount: Math.max(0, num(Number(c.amount))), note: c.note || '' };
}
function sanitizeLoanItem(l: LoanItem): LoanItem {
  const totalMonths = l.totalMonths === undefined || l.totalMonths === null ? undefined : Math.max(0, num(Number(l.totalMonths)));
  return { id: l.id || uid(), name: l.name || '借款', principal: Math.max(0, num(Number(l.principal))), annualRate: Math.max(0, num(Number(l.annualRate))), monthlyPayment: Math.max(0, num(Number(l.monthlyPayment))), startDate: l.startDate || new Date().toISOString().slice(0, 10), totalMonths };
}
function sanitizeSyncMeta(raw: unknown, state?: Partial<AppState>): SyncMeta {
  const r = raw && typeof raw === 'object' ? raw as Partial<SyncMeta> : {};
  const source: SyncSource = r.source === '已從雲端下載' || r.source === '已從備份匯入' ? r.source : '本機資料';
  const baselineFingerprint = typeof r.baselineFingerprint === 'string' && /^sync-v\d+-[0-9a-f]+$/.test(r.baselineFingerprint) ? r.baselineFingerprint : undefined;
  const baselineFieldFingerprints = sanitizeSyncFieldFingerprints(r.baselineFieldFingerprints);
  const baselineCanonicalSchema = typeof r.baselineCanonicalSchema === 'string' && /^sync-json-v\d+$/.test(r.baselineCanonicalSchema) ? r.baselineCanonicalSchema : undefined;
  return {
    dirty: baselineFingerprint ? Boolean(r.dirty) : true,
    source,
    ...(baselineFingerprint ? { baselineFingerprint } : {}),
    ...(baselineFingerprint && baselineFieldFingerprints ? { baselineFieldFingerprints } : {}),
    ...(baselineFingerprint && baselineCanonicalSchema ? { baselineCanonicalSchema } : {}),
    lastLocalSaveAt: r.lastLocalSaveAt,
    lastUploadAt: r.lastUploadAt,
    lastDownloadAt: r.lastDownloadAt,
    lastBackupExportAt: r.lastBackupExportAt,
    lastBackupImportAt: r.lastBackupImportAt,
    status: r.status || (baselineFingerprint ? (state?.firebase?.databaseURL ? '本機已儲存，尚未上傳雲端' : '尚未設定 Firebase，同步僅保存在本機') : '尚未建立同步基準，同步狀態未知')
  };
}
function sanitizeRemoteMeta(raw: unknown): RemoteMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<RemoteMeta>;
  return { holdingsCount: Math.max(0, safeNumber(r.holdingsCount)), cashCount: Math.max(0, safeNumber(r.cashCount)), loansCount: Math.max(0, safeNumber(r.loansCount)), updatedAt: r.updatedAt };
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
  const hasHoldingsData = Array.isArray(r.holdings);
  const rawHoldings = (hasHoldingsData ? r.holdings : []) as Holding[];
  const holdings = rawHoldings.map(h => sanitizeHolding(h)).filter(Boolean) as Holding[];
  const normalizedHoldings = normalizeHoldingTargets(hasHoldingsData ? holdings : []);
  const cash = (Array.isArray(r.cash) ? r.cash : []).map(c => sanitizeCashItem(c as CashItem)).filter(Boolean) as CashItem[];
  const loans = (Array.isArray(r.loans) ? r.loans : []).map(l => sanitizeLoanItem(l as LoanItem));
  const accountState = normalizeAccountState(r.accounts, cash);
  const transactionState = normalizeTransactions(r.transactions, accountState.accounts);
  const firebase = { ...defaultState.firebase, ...(s.firebase || {}) };
  const importSessions = Array.isArray(r.importSessions) ? r.importSessions.filter(value => value && typeof value === 'object').slice(-50) as ImportSession[] : [];
  const importPresets = normalizeMappingPresets(r.importPresets);
  const normalizedCore = { holdings: normalizedHoldings, cash, accounts: accountState.accounts, accountSchemaVersion: FINANCIAL_ACCOUNT_SCHEMA_VERSION, cashAccountMigrationVersion: CASH_ACCOUNT_MIGRATION_VERSION, transactions: transactionState.transactions, transactionSchemaVersion: TRANSACTION_SCHEMA_VERSION, importSessions, importPresets, importSchemaVersion: IMPORT_SCHEMA_VERSION, gmailOAuth: normalizeGmailOAuth(r.gmailOAuth), loans, firebase, workerUrl: DEFAULT_WORKER_URL, refreshSec: Math.max(15, num(Number(s.refreshSec || 60))), autoSync: Boolean(s.autoSync), autoSyncSec: Math.max(10, num(Number(s.autoSyncSec || 60))), allocationPreset: normalizeAllocationPreset(s.allocationPreset), allocationRoleBySymbol: normalizeAllocationRoleBySymbol(s.allocationRoleBySymbol, normalizedHoldings), rebalanceMode: normalizeRebalanceMode(s.rebalanceMode), rebalanceThreshold: clampRebalanceThreshold(Number(s.rebalanceThreshold ?? DEFAULT_REBALANCE_THRESHOLD)), buyOnlyBudget: normalizeBuyOnlyBudget(s.buyOnlyBudget ?? DEFAULT_BUY_ONLY_BUDGET), dipAlerts: normalizeDipAlerts(s.dipAlerts, normalizedHoldings) };
  const cashFlowProfile = r.cashFlowProfile === undefined ? undefined : normalizeCashFlowProfile(r.cashFlowProfile);
  const netWorthHistory = r.netWorthHistory === undefined ? undefined : normalizeNetWorthHistory(r.netWorthHistory);
  const normalized = { ...normalizedCore, wealthGoal: normalizeWealthGoalSettings(s.wealthGoal), ...(cashFlowProfile ? { cashFlowProfile } : {}), ...(netWorthHistory ? { netWorthHistory } : {}), syncMeta: sanitizeSyncMeta(s.syncMeta, normalizedCore), remoteMeta: sanitizeRemoteMeta(s.remoteMeta) };
  const baseline = deriveSyncBaselineDiagnostics(normalized, normalized.syncMeta.baselineFingerprint, normalized.syncMeta.baselineFieldFingerprints);
  return { ...normalized, syncMeta: { ...normalized.syncMeta, dirty: baseline.dirty } };
}
function readState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw); assertNoOAuthSecrets(parsed);
    const normalized = normalizeState(parsed);
    const json = JSON.stringify(normalized);
    if (raw !== json) localStorage.setItem(STORAGE_KEY, json);
    return normalized;
  } catch (error) {
    try { startupIssue = { message: error instanceof Error ? error.message : 'localStorage JSON 解析失敗', raw: localStorage.getItem(STORAGE_KEY) || '' }; } catch { startupIssue = { message: 'localStorage JSON 解析失敗' }; }
    return defaultState;
  }
}
function writeState(s: AppState) { assertNoOAuthSecrets(s); const normalized = normalizeState(s); assertNoOAuthSecrets(normalized); localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); }
function normalizeUiState(raw: unknown): UiState {
  const r = raw && typeof raw === 'object' ? raw as Partial<UiState> : {};
  return { displayMode: r.displayMode === 'full' ? 'full' : 'compact', sections: { ...DEFAULT_UI_STATE.sections, ...(r.sections || {}) } };
}
function readUiState(): UiState {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    return raw ? normalizeUiState(JSON.parse(raw)) : DEFAULT_UI_STATE;
  } catch {
    return DEFAULT_UI_STATE;
  }
}
function writeUiState(state: UiState) { localStorage.setItem(UI_STATE_KEY, JSON.stringify({ displayMode: state.displayMode })); }
function backupPayload(state: AppState, quotes: Record<SymbolCode, Quote>): BackupPayload {
  assertNoOAuthSecrets(state);
  const normalized = normalizeState(state);
  const payload = { version: APP_VERSION, exportedAt: now(), holdings: normalized.holdings, cashAccounts: normalized.cash, accounts: normalized.accounts, accountSchemaVersion: normalized.accountSchemaVersion, cashAccountMigrationVersion: normalized.cashAccountMigrationVersion, transactions: normalized.transactions, transactionSchemaVersion: normalized.transactionSchemaVersion, importSessions: normalized.importSessions, importPresets: normalized.importPresets, importSchemaVersion: normalized.importSchemaVersion, gmailOAuth: normalized.gmailOAuth, loans: normalized.loans, quotes, targetRatio: growthTargetOf(normalized), allocationPreset: normalized.allocationPreset, allocationRoleBySymbol: normalized.allocationRoleBySymbol, rebalanceMode: normalized.rebalanceMode, rebalanceThreshold: normalized.rebalanceThreshold, buyOnlyBudget: normalized.buyOnlyBudget, dipAlerts: normalized.dipAlerts, wealthGoal: normalized.wealthGoal, ...(normalized.cashFlowProfile ? { cashFlowProfile: normalized.cashFlowProfile } : {}), ...(normalized.netWorthHistory ? { netWorthHistory: normalized.netWorthHistory } : {}), syncMeta: withoutSyncBaseline(normalized.syncMeta), syncSettings: { refreshSec: normalized.refreshSec, autoSync: normalized.autoSync, autoSyncSec: normalized.autoSyncSec, workerUrl: DEFAULT_WORKER_URL, firebase: normalized.firebase, firebaseConfigured: Boolean(normalized.firebase.databaseURL) } }; assertNoOAuthSecrets(payload); return payload;
}
function backupHasRemovedStrategy(raw: unknown) {
  const r = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const keys = ['holdings', 'assets', 'assetAllocation', 'rebalance', 'strategy', 'strategies', 'defaultHoldings', 'mock', 'fallback', 'demo', 'legacy', 'cashAccounts', 'cash'];
  return keys.some(key => hasRemovedSymbol(JSON.stringify(r[key] ?? '')));
}
function stateFromBackup(raw: unknown, current: AppState): AppState {
  if (!raw || typeof raw !== 'object') throw new Error('備份檔格式不正確。');
  // Scheme A: reject the entire backup rather than silently removing an OAuth secret.
  assertNoOAuthSecrets(raw);
  if (backupHasRemovedStrategy(raw)) throw new Error(`${removedSymbol()} 已從正式策略移除，備份檔含有已移除的 ${removedSymbol()} 策略資料，請確認後再匯入。`);
  const r = raw as Partial<BackupPayload> & { assets?: Holding[]; cash?: CashItem[]; firebase?: FirebaseConfig };
  const syncSettings = (r.syncSettings || {}) as Partial<BackupPayload['syncSettings']>;
  const firebase = syncSettings.firebase || r.firebase || current.firebase;
  const importedHoldings = Array.isArray(r.holdings) ? r.holdings : Array.isArray(r.assets) ? r.assets : [];
  const quoteNames = r.quotes && typeof r.quotes === 'object' ? r.quotes : {};
  const holdings = importedHoldings.map(holding => {
    const symbol = normalizeSymbol(holding?.symbol);
    const quote = (quoteNames as Record<SymbolCode, Quote>)[symbol];
    return { ...holding, name: resolveSymbolName(symbol, holding?.name, quote?.name) };
  });
  const backupState = { ...current, holdings, cash: Array.isArray(r.cashAccounts) ? r.cashAccounts : Array.isArray(r.cash) ? r.cash : [], transactions: Array.isArray(r.transactions) ? r.transactions : [], importSessions: Array.isArray(r.importSessions) ? r.importSessions : [], importPresets: Array.isArray(r.importPresets) ? r.importPresets : [], gmailOAuth: disconnectedGmailOAuth(), loans: Array.isArray(r.loans) ? r.loans : [], refreshSec: syncSettings.refreshSec ?? current.refreshSec, autoSync: Boolean(syncSettings.autoSync ?? current.autoSync), autoSyncSec: syncSettings.autoSyncSec ?? current.autoSyncSec, allocationPreset: normalizeAllocationPreset(r.allocationPreset ?? current.allocationPreset), allocationRoleBySymbol: r.allocationRoleBySymbol ?? current.allocationRoleBySymbol, rebalanceMode: normalizeRebalanceMode(r.rebalanceMode ?? current.rebalanceMode), rebalanceThreshold: clampRebalanceThreshold(Number(r.rebalanceThreshold ?? current.rebalanceThreshold)), buyOnlyBudget: normalizeBuyOnlyBudget(r.buyOnlyBudget ?? current.buyOnlyBudget), dipAlerts: r.dipAlerts ?? current.dipAlerts, wealthGoal: r.wealthGoal ?? current.wealthGoal, ...(r.cashFlowProfile === undefined ? {} : { cashFlowProfile: r.cashFlowProfile }), ...(r.netWorthHistory === undefined ? {} : { netWorthHistory: r.netWorthHistory }), firebase };
  if (Array.isArray(r.accounts)) return normalizeState({ ...backupState, accounts: r.accounts });
  // Remove current accounts so a legacy Backup's CashItem list can migrate once instead of being shadowed by the live state.
  const { accounts: _accounts, accountSchemaVersion: _schema, cashAccountMigrationVersion: _migration, ...legacyBackupState } = backupState;
  return normalizeState(legacyBackupState);
}
function defaultSyncStatus(state: AppState) { return state.firebase.databaseURL ? '本機已儲存，尚未上傳雲端' : '尚未設定 Firebase，同步僅保存在本機'; }
function readSyncMeta(state: AppState): SyncMeta { return sanitizeSyncMeta(state.syncMeta, state); }
function localDirtyStatus(state: AppState) {
  return state.firebase.databaseURL ? '本機有新資料，請按「上傳雲端」同步到其他裝置' : '本機有新資料，尚未設定 Firebase，同步僅保存在本機';
}
function missingBaselineStatus(state: AppState) {
  return state.firebase.databaseURL ? '尚未建立同步基準，同步狀態未知；請成功上傳或下載一次' : '尚未建立同步基準，且尚未設定 Firebase';
}
function cleanSyncStatus() { return '本機與最近同步狀態無待處理變更'; }
function validateBeforeUpload(s: AppState) {
  assertNoOAuthSecrets(s);
  if (safeHoldings(s.holdings).some(h => REMOVED_SYMBOLS.has(normalizeSymbol(h.symbol)))) throw new Error(`${removedSymbol()} 已從正式策略移除，不能出現在持股資料。`);
  if (s.cash.some(c => [c.name, c.note].some(hasRemovedSymbol))) throw new Error(removedSymbolMessage());
}
function waitForDraftCommit() {
  return new Promise<void>(resolve => setTimeout(resolve, 0)).then(flushFrame).then(flushFrame);
}
function syncPath(config: FirebaseConfig) { return buildFirebaseSyncRoot(config.secretPath); }
function syncUrl(config: FirebaseConfig) { const db = config.databaseURL.trim(); if (!db) throw new Error('請先輸入 Firebase URL'); return `${db.replace(/\/$/, '')}/${syncPath(config)}.json`; }
async function uploadFirebase(config: FirebaseConfig, snapshot: ReturnType<typeof createSyncPayloadSnapshot>) { assertNoOAuthSecrets(snapshot.payload); const res = await fetch(syncUrl(config), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: snapshot.canonicalJson }); if (!res.ok) throw new Error(`Firebase ${res.status}`); return snapshot; }
async function downloadFirebase(config: FirebaseConfig) { const res = await fetch(syncUrl(config), { cache: 'no-store' }); if (!res.ok) throw new Error(`Firebase ${res.status}`); const data = await res.json(); if (!data) throw new Error(`找不到雲端資料：${syncPath(config)}`); assertNoOAuthSecrets(data); const remoteData = canonicalSyncPayload(data as Record<string, unknown>); return normalizeState({ ...remoteData, firebase: { ...config, ...((data as Partial<AppState>).firebase || {}) } }); }
function parseWorkerQuote(symbol: SymbolCode, data: unknown, holding?: Holding): Quote | null {
  const d = data as { symbol?: string; code?: string; price?: number; latestPrice?: number; previousClose?: number; quoteDate?: string; quoteTime?: string; volume?: number; source?: string };
  if (typeof d?.latestPrice !== 'number' && typeof d?.price !== 'number') return null;
  const resolvedSymbol = normalizeSymbol(d.code || d.symbol || symbol).replace(/\.(TW|TWO)$/, '');
  const price = Number(d.latestPrice ?? d.price), previousClose = Number(d.previousClose), change = calculateQuoteChange(price, previousClose);
  if (change === null || !isValidQuoteTimestamp(d.quoteDate, d.quoteTime)) return null;
  return { ...backupQuote(resolvedSymbol, holding), symbol: resolvedSymbol, name: resolveSymbolName(resolvedSymbol, ...quoteNameFields(data), holding?.name), price, previousClose, change, changePct: change / previousClose * 100, quoteDate: typeof d.quoteDate === 'string' ? d.quoteDate : undefined, quoteTime: typeof d.quoteTime === 'string' ? d.quoteTime : undefined, volume: Number(d.volume ?? 0), source: d.source || '報價 Worker', updatedAt: now() };
}
async function fetchQuote(symbol: SymbolCode, holding: Holding | undefined, { endpoint, manual }: QuoteRefreshRequestOptions): Promise<Quote> { const querySymbol = normalizeSymbol(symbol); const url = refreshUrl(endpoint, `/?symbol=${encodeURIComponent(querySymbol)}`, manual); try { if (!isTaiwanSymbol(querySymbol)) throw new Error(`不支援的台股代號格式：${querySymbol}`); const res = await fetch(url, quoteRefreshRequestInit(manual)); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error((data as { error?: string }).error || `Worker ${res.status}`); const q = parseWorkerQuote(querySymbol, data, holding); if (!q) throw new Error(`Worker 回傳格式不正確或缺少有效報價日期／時間：${JSON.stringify(data).slice(0, 80)}`); return q; } catch (error) { return { ...backupQuote(querySymbol, holding), source: holding?.avgCost ? '成交均價備援 / Worker 更新失敗' : '離線備援 / Worker 更新失敗', updatedAt: now(), error: error instanceof Error ? error.message : String(error) }; } }

function derivedHoldings(state: AppState): Holding[] {
  const holdings = safeHoldings(state.holdings);
  const map = Object.fromEntries(holdings.map(h => [normalizeSymbol(h.symbol), h])) as Record<SymbolCode, Holding>;
  const defaultMap = Object.fromEntries(DEFAULT_HOLDINGS.map(h => [h.symbol, h])) as Record<SymbolCode, Holding>;
  return uniqueSymbols(state).map(s => map[s] || defaultMap[s] || { symbol: s, shares: 0, avgCost: 0, targetWeight: 0, assetClass: 'growth' });
}
function calculateMetrics(state: AppState, quotes: Record<SymbolCode, Quote>) {
  const rows = derivedHoldings(state).map(h => { const q = quotes[h.symbol] || backupQuote(h.symbol, h); const quoteName = resolveSymbolName(h.symbol, q.name, h.name); const hasPreservedQuote = Boolean(q.error && num(q.price) > 0 && isValidQuoteTimestamp(q.quoteDate, q.quoteTime)); const hasLatestPrice = !q.error && !q.source.includes('備援') && num(q.price) > 0; const price = hasPreservedQuote || hasLatestPrice ? num(q.price) : num(h.avgCost) || num(q.price); const quote = hasPreservedQuote || hasLatestPrice ? { ...q, name: quoteName } : { ...q, name: quoteName, price, previousClose: price, change: 0, changePct: 0, quoteDate: undefined, quoteTime: undefined, source: h.avgCost ? '成交均價備援' : q.source }; const marketValue = h.shares * price; const cost = h.shares * h.avgCost; const pnl = marketValue - cost; const dayPnl = calculateDailyProfitLoss(h.shares, quote.change, quote.quoteDate, quote.quoteTime); return { ...h, name: quoteName, quote, marketValue, cost, pnl, dayPnl }; });
  const stocks = rows.reduce((a, r) => a + r.marketValue, 0);
  // V4.1 accounts are the only cash/net-worth source. Legacy CashItem stays persisted for safe rollback but is never double-counted.
  const derivedBalances = deriveTransactionAccountBalances(state.transactions);
  const cash = financialAccountLiquidTotal(state.accounts, { derivedBalances });
  const accountNetWorth = financialAccountNetWorthContribution(state.accounts, { derivedBalances });
  const debt = state.loans.reduce((a, l) => a + num(l.principal), 0);
  const totalAssets = stocks + Math.max(0, accountNetWorth);
  const netWorth = stocks + accountNetWorth - debt;
  const todayPnlAvailable = rows.length > 0 && rows.every(row => row.dayPnl !== null);
  const dayPnl = todayPnlAvailable ? rows.reduce((a, r) => a + (r.dayPnl ?? 0), 0) : 0;
  const defensiveHoldings = rows.filter(r => isDefensiveHolding(r));
  const growthHoldings = rows.filter(r => isGrowthHolding(r));
  const growth = growthHoldings.reduce((a, r) => a + r.marketValue, 0);
  const defensiveHoldingsValue = defensiveHoldings.reduce((a, r) => a + r.marketValue, 0);
  const defensive = cash + defensiveHoldingsValue;
  const growthTargetPct = growthTargetOf(state);
  const defensiveTargetPct = defensiveTargetOf(state);
  const beta = rows.reduce((a, r) => a + (r.symbol === '00631L' ? 2 : 0.05) * (totalAssets ? r.marketValue / totalAssets : 0), 0);
  const cashRatio = totalAssets ? cash / totalAssets * 100 : 0;
  const defensiveRatio = totalAssets ? defensive / totalAssets * 100 : 0;
  const leverage = netWorth > 0 ? totalAssets / netWorth : 0;
  const monthlyPayment = state.loans.reduce((a, l) => a + num(l.monthlyPayment), 0);
  const remainingMonths = state.loans.map(calculatedRemainingMonths).filter((v): v is number => v !== undefined);
  const averageRemainingMonths = remainingMonths.length ? remainingMonths.reduce((a, v) => a + v, 0) / remainingMonths.length : undefined;
  const repaymentSafetyMonths = monthlyPayment > 0 ? num(cash / monthlyPayment) : Infinity;
  const repaymentSafetyDays = monthlyPayment > 0 ? Math.round(repaymentSafetyMonths * 30) : Infinity;

  // 計算每筆信貸累積利息成本（已繳期數已在 loanPeriodSummary 中限制在 0 至總期數之間，已還本金保守估計為 0）
  const totalLoanInterestPaid = state.loans.reduce((sum, l) => {
    const paid = loanPeriodSummary(l).paid ?? 0;
    const payment = num(l.monthlyPayment);
    const totalPaid = payment * paid;
    const principalPaid = 0;
    const interestCost = Math.max(0, totalPaid - principalPaid);
    return sum + interestCost;
  }, 0);

  // 整體股票組合總損益，排除現金。
  const portfolioTotalPnl = rows.reduce((a, r) => a + r.pnl, 0);

  // 扣利息後真實淨利
  const trueNetPnlAfterInterest = portfolioTotalPnl - totalLoanInterestPaid;

  return { rows, stocks, cash, debt, totalAssets, netWorth, dayPnl, todayPnlAvailable, growth, defensive, growthHoldings, defensiveHoldings, defensiveHoldingsValue, growthTargetPct, defensiveTargetPct, beta, cashRatio, defensiveRatio, leverage, monthlyPayment, averageRemainingMonths, repaymentSafetyMonths, repaymentSafetyDays, totalLoanInterestPaid, trueNetPnlAfterInterest };
}
function rebalance(state: AppState, quotes: Record<SymbolCode, Quote>) {
  const m = calculateMetrics(state, quotes);
  const stockTarget = m.totalAssets * (m.growthTargetPct / 100);
  const defensiveTarget = m.totalAssets * (m.defensiveTargetPct / 100);
  const stockDiff = stockTarget - m.growth;
  const defensiveDiff = defensiveTarget - m.defensive;
  const stockWeight = m.totalAssets ? m.growth / m.totalAssets * 100 : 0;
  const defensiveWeight = m.totalAssets ? m.defensive / m.totalAssets * 100 : 0;
  const currentGrowthWeight = stockWeight;
  const growthTargetPercent = m.growthTargetPct;
  const deviation = stockWeight - m.growthTargetPct;
  const defensiveDeviation = defensiveWeight - m.defensiveTargetPct;
  const threshold = clampRebalanceThreshold(state.rebalanceThreshold);
  const thresholdReached = Math.abs(deviation) >= threshold;
  const mode = normalizeRebalanceMode(state.rebalanceMode);
  const belowAmountFloor = Math.abs(stockDiff) < 1000;
  let stockAction = belowAmountFloor ? '維持成長資產' : `建議${stockDiff >= 0 ? '增加' : '降低'}成長資產約 ${money(Math.abs(stockDiff))}`;
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
  const stockRow = { symbol: '成長資產', currentWeight: stockWeight, targetText: pct(m.growthTargetPct), diffText: signedWan(stockDiff), deviationText: signedPct(deviation), thresholdText: pct(threshold), action: stockAction, tone: stockTone };
  const defensiveRow = { symbol: '防守資產', currentWeight: defensiveWeight, targetText: pct(m.defensiveTargetPct), diffText: signedWan(defensiveDiff), deviationText: signedPct(defensiveDeviation), thresholdText: pct(threshold), action: defensiveAction, tone: defensiveTone };
  const defensiveDetails = [{ symbol: '現金', currentWeight: m.totalAssets ? m.cash / m.totalAssets * 100 : 0, targetText: '—', diffText: '—', deviationText: '—', thresholdText: '—', action: '列入防守資產' }, ...m.defensiveHoldings.map(r => ({ symbol: r.symbol, currentWeight: m.totalAssets ? r.marketValue / m.totalAssets * 100 : 0, targetText: '—', diffText: '—', deviationText: '—', thresholdText: '—', action: '保留實際持股，不參與再平衡' }))];
  return { rows: [stockRow, defensiveRow], stockRow, defensiveRow, defensiveDetails, stockAction, defensiveAction, defensiveCurrent: m.defensive, defensiveTarget, nonStrategy: [], mode, modeLabel: rebalanceModeLabel(mode), currentGrowthWeight, growthTargetPercent, deviation, deviationText: stockRow.deviationText, threshold, thresholdReached, thresholdStatus: thresholdReached ? '已達提醒門檻' : '尚未達門檻，維持目前配置' };
}
function withOrderAmount(item: Omit<OrderSuggestion, 'amount' | 'shares' | 'lots' | 'oddLots' | 'conversionText'>, amount: number): OrderSuggestion {
  const safeAmount = Math.max(0, safeNumber(amount));
  const shares = item.price > 0 ? Math.floor(safeAmount / item.price) : null;
  const lotInfo = getLotAndOddLot(shares ?? 0);
  return {
    ...item,
    amount: safeAmount,
    shares,
    lots: lotInfo.lots,
    oddLots: lotInfo.oddLots,
    conversionText: formatShares(shares)
  };
}
function getOrderSuggestions(state: AppState, quotes: Record<SymbolCode, Quote>, m: ReturnType<typeof calculateMetrics>): OrderHelper {
  const mode = normalizeRebalanceMode(state.rebalanceMode);
  const rows = m.rows.map(row => {
    const targetPercent = getEffectiveTargetPercent(row, state.holdings);
    const targetValue = m.totalAssets * (targetPercent / 100);
    const diff = num(targetValue - row.marketValue);
    const quote = quotes[row.symbol] || row.quote;
    const price = Math.max(0, safeNumber(quote?.price));
    return {
      symbol: row.symbol,
      name: row.quote.name || SYMBOL_NAMES[row.symbol] || row.symbol,
      diff,
      price,
      targetPercent,
      currentValue: row.marketValue,
      targetValue
    };
  });
  const cash = Math.max(0, safeNumber(m.cash));
  const buyOnlyBudget = normalizeBuyOnlyBudget(state.buyOnlyBudget);
  const buyOnlyLimit = Math.min(buyOnlyBudget, cash);
  const hasInvalidBuyOnlyBudget = mode === 'buy-only' && buyOnlyBudget <= 0;
  const rowClassMap = Object.fromEntries(m.rows.map(row => [normalizeSymbol(row.symbol), row.assetClass])) as Record<SymbolCode, AssetClass>;
  const growthRows = rows.filter(item => rowClassMap[normalizeSymbol(item.symbol)] !== 'defensive');
  const defensiveRows = rows.filter(item => rowClassMap[normalizeSymbol(item.symbol)] === 'defensive');
  const buyGaps = growthRows.filter(item => item.diff > 0).sort((a, b) => b.diff - a.diff);
  const fullBuyGap = buyGaps.reduce((total, item) => total + Math.max(0, safeNumber(item.diff)), 0);
  let remainingBudget = mode === 'buy-only' ? buyOnlyLimit : cash;
  const growthBuy = buyGaps.map(item => {
    const amount = mode === 'buy-only' ? Math.min(Math.max(0, item.diff), remainingBudget) : Math.max(0, item.diff);
    remainingBudget = mode === 'buy-only' ? Math.max(0, remainingBudget - amount) : remainingBudget;
    return withOrderAmount(item, amount);
  }).filter(item => item.amount >= 1);
  const overTargets = growthRows.filter(item => item.diff < 0).map(item => withOrderAmount(item, Math.abs(item.diff))).sort((a, b) => b.amount - a.amount);
  const growthSell = mode === 'standard' ? overTargets : [];
  const skippedSell = mode === 'buy-only' ? overTargets : [];
  const defensiveTargetPercent = getDefensiveStockTargetTotal(state.holdings);
  const defensiveCurrentWeight = m.totalAssets ? m.defensiveHoldingsValue / m.totalAssets * 100 : 0;
  const defensiveUnder = defensiveRows.filter(item => item.diff > 999).map(item => withOrderAmount(item, item.diff)).sort((a, b) => b.amount - a.amount);
  const defensiveOver = defensiveRows.filter(item => item.diff < -999).map(item => withOrderAmount(item, Math.abs(item.diff))).sort((a, b) => b.amount - a.amount);
  const defensiveNeutral = defensiveRows.filter(item => Math.abs(item.diff) <= 999).map(item => withOrderAmount(item, Math.abs(item.diff)));
  const defensiveItems = defensiveUnder.length ? defensiveUnder : defensiveOver.length ? defensiveOver : defensiveNeutral;
  const defensiveReminder: DefensiveReminder = defensiveRows.length === 0
    ? { status: 'missing', message: '目前沒有防守股票，防守資產由現金承擔。', items: [], currentWeight: defensiveCurrentWeight, targetPercent: defensiveTargetPercent }
    : defensiveUnder.length
      ? { status: 'under', message: '以下防守標的低於自訂目標，可依現金與還款安全存量分批補足。', item: defensiveUnder[0], items: defensiveUnder, currentWeight: defensiveCurrentWeight, targetPercent: defensiveTargetPercent }
      : defensiveOver.length
        ? { status: 'over', message: '以下防守標的高於自訂目標，標準再平衡時可作為資金來源。', item: defensiveOver[0], items: defensiveOver, currentWeight: defensiveCurrentWeight, targetPercent: defensiveTargetPercent }
        : { status: 'ok', message: '防守股票目前未明顯低配或高配。', item: defensiveItems[0], items: defensiveItems, currentWeight: defensiveCurrentWeight, targetPercent: defensiveTargetPercent };
  const totalBuyAmount = growthBuy.reduce((total, item) => total + item.amount, 0);
  const shortage = mode === 'standard' ? Math.max(0, totalBuyAmount - cash) : Math.max(0, fullBuyGap - buyOnlyLimit);
  return { growthBuy, growthSell, skippedSell, defensiveReminder, cash, totalBuyAmount, fullBuyGap, shortage, cashEnough: cash >= totalBuyAmount, cashLimited: mode === 'buy-only' && fullBuyGap > buyOnlyLimit, mode, modeLabel: rebalanceModeLabel(mode), buyOnlyBudget, buyOnlyLimit, hasInvalidBuyOnlyBudget };
}
function tradeStepFromSuggestion(action: TradeAction, item: OrderSuggestion, order: number, note: string): TradeStep {
  return {
    action,
    symbol: item.symbol,
    name: item.name,
    amount: item.amount,
    price: item.price,
    shares: item.shares,
    conversionText: item.conversionText,
    order,
    projectedWeight: item.targetPercent,
    note
  };
}
function getTradePlan(orderHelper: OrderHelper): TradeStep[] {
  const steps: TradeStep[] = [];
  let order = 1;
  if (orderHelper.mode === 'standard') {
    if (orderHelper.defensiveReminder.status === 'over' && orderHelper.defensiveReminder.items.length) {
      orderHelper.defensiveReminder.items.forEach(item => steps.push(tradeStepFromSuggestion('賣出', item, order++, '防守標的高於自訂目標，可作為加碼資金來源。')));
    }
    orderHelper.growthSell.forEach(item => steps.push(tradeStepFromSuggestion('賣出', item, order++, '標準再平衡：降低高於目標的成長資產。')));
  }
  orderHelper.growthBuy.forEach(item => steps.push(tradeStepFromSuggestion('買入', item, order++, orderHelper.mode === 'buy-only' ? '只買不賣：依低配缺口與可用預算分配。' : '標準再平衡：補足低於目標的成長資產。')));
  if (orderHelper.mode === 'buy-only') {
    orderHelper.skippedSell.forEach(item => steps.push(tradeStepFromSuggestion('不需處理', item, order++, '只買不賣模式下，超標資產暫不賣出也不加碼。')));
  }
  if (steps.length === 0) {
    steps.push({ action: '不需處理', symbol: '整體配置', name: orderHelper.modeLabel, amount: 0, price: 0, shares: null, conversionText: '不需換算股數', order: 1, projectedWeight: 0, note: '目前沒有明顯交易建議。' });
  }
  return steps;
}
function getFundingSource(orderHelper: OrderHelper) {
  if (orderHelper.totalBuyAmount <= 0) return '目前沒有建議加碼金額。';
  if (orderHelper.totalBuyAmount <= orderHelper.cash) return '現金';
  if (orderHelper.mode === 'standard' && orderHelper.defensiveReminder.status === 'over') return '現金 + 高配防守標的';
  return orderHelper.mode === 'buy-only' ? '現金或新資金分批投入' : '現金不足，需補充新資金或調整賣出順序';
}
function getDecisionSummary(rb: ReturnType<typeof rebalance>, orderHelper: OrderHelper, dipAlertRows: DipAlertRow[]) {
  const enabledDipAlerts = dipAlertRows.filter(row => row.setting.enabled);
  const triggeredDipAlerts = enabledDipAlerts.filter(row => row.triggered);
  const buyAmount = orderHelper.totalBuyAmount;
  return {
    adjustmentStatus: rb.thresholdReached || triggeredDipAlerts.length > 0 ? '需要關注' : '暫不需要調整',
    rebalanceStatus: rb.thresholdReached ? '已觸發再平衡' : '未觸發再平衡',
    dipStatus: enabledDipAlerts.length === 0 ? '逢低加碼提醒關閉' : triggeredDipAlerts.length > 0 ? `已觸發 ${triggeredDipAlerts.length} 檔逢低觀察` : '逢低加碼尚未觸發',
    buyAmount,
    fundingSource: getFundingSource(orderHelper),
    triggeredDipAlerts
  };
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
    reason = `成長資產高於目標 ${pct(rb.deviation)}，已超過 10%。`;
    suggestion = '暫停加碼成長資產，優先累積現金或防守標的。';
  } else if (absDeviation >= 10) {
    status = '偏離過大';
    tone = 'bad';
    reason = `成長資產${underTarget ? '低於' : '高於'}目標 ${pct(absDeviation)}，偏離幅度已達 10%。`;
    suggestion = underTarget ? '依目前再平衡模式分批補足成長資產。' : '優先補強現金或防守標的，降低配置偏離。';
  } else if (stockDiff > 0 && m.cash < stockDiff && rb.thresholdReached) {
    status = '現金不足';
    tone = 'warn';
    reason = `成長資產低於目標 ${pct(absDeviation)}，可用現金不足以補足目標差額。`;
    suggestion = '先累積現金，再分批買入成長資產。';
  } else if (overTarget && defensiveGap > 0) {
    status = '注意';
    tone = 'warn';
    reason = `成長資產高於目標 ${pct(absDeviation)}，已超過再平衡門檻 ${pct(rb.threshold)}。`;
    suggestion = rb.mode === 'buy-only' ? '暫停加碼成長資產，優先累積現金或防守標的。' : '可依標準再平衡增加現金或防守標的。';
  } else {
    status = '注意';
    tone = 'warn';
    reason = `成長資產低於目標 ${pct(absDeviation)}，已超過再平衡門檻 ${pct(rb.threshold)}。`;
    suggestion = '可依目前再平衡模式分批補足成長資產。';
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
function advice(m: ReturnType<typeof calculateMetrics>) { if (m.cashRatio < 8 || m.leverage > 1.6) return ['風險降溫', `現金水位偏低或槓桿偏高，先補防守資產；目前目標為成長資產 ${pct(m.growthTargetPct)}、防守資產 ${pct(m.defensiveTargetPct)}。`, 'bad'] as const; if (m.dayPnl < -m.stocks * 0.05) return ['小跌加碼', `可分批補足低於自訂目標的成長資產部位，避免一次打滿；目前目標為成長資產 ${pct(m.growthTargetPct)}。`, 'warn'] as const; return ['正常投入', `維持自訂目標配置；目前目標為成長資產 ${pct(m.growthTargetPct)}、防守資產 ${pct(m.defensiveTargetPct)}。`, 'good'] as const; }

const ALLOCATION_COLORS = ['#5b8def', '#58c7a5', '#f3b75f', '#d783c7', '#7ec8e3', '#a9c46c', '#e77c75', '#a98ee8', '#e6a36d', '#67b6a8'];
const FIXED_ALLOCATION_COLORS: Record<string, string> = { CASH: '#78a6f7', '00631L': '#f07d7d', '00865B': '#64c9a5' };
function allocationColor(symbol: string) {
  if (FIXED_ALLOCATION_COLORS[symbol]) return FIXED_ALLOCATION_COLORS[symbol];
  const hash = Array.from(symbol).reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7);
  return ALLOCATION_COLORS[hash % ALLOCATION_COLORS.length];
}

function AllocationDonut({ m }: { m: ReturnType<typeof calculateMetrics> }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const total = Math.max(0, num(m.totalAssets));
  const growthWeight = total > 0 ? num(m.growth) / total * 100 : 0;
  const defensiveWeight = total > 0 ? num(m.defensive) / total * 100 : 0;
  const allocationPct = (value: number) => `${num(value).toFixed(1)}%`;
  const items = [
    ...m.rows.map(row => ({ symbol: row.symbol, name: row.name, value: Math.max(0, num(row.marketValue)) })),
    { symbol: 'CASH', name: '台幣現金', value: Math.max(0, num(m.cash)) }
  ].filter(item => item.value > 0).map(item => ({ ...item, percent: total > 0 ? item.value / total * 100 : 0, color: allocationColor(item.symbol) })).sort((a, b) => b.percent - a.percent);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = items.map(item => {
    const fullLength = item.percent / 100 * circumference;
    const segment = { ...item, dash: Math.max(0, fullLength - 1.6), offset };
    offset += fullLength;
    return segment;
  });
  const activeSymbol = hoveredSymbol ?? selectedSymbol;
  const selected = items.find(item => item.symbol === activeSymbol);
  const activate = (symbol: string) => setSelectedSymbol(current => current === symbol ? null : symbol);
  if (items.length === 0) return <div className="allocation-empty">尚無可計入資產配置的市值資料。</div>;
  return <div className="allocation-chart">
    <div className="allocation-summary" aria-label="資產配置摘要">
      <div><small>總資產</small><strong>{money(total)}</strong></div>
      <div><small>成長</small><strong>{allocationPct(growthWeight)}</strong></div>
      <div><small>防守</small><strong>{allocationPct(defensiveWeight)}</strong></div>
    </div>
    <div className="allocation-donut-layout">
      <div className="allocation-donut-wrap">
        <svg className="allocation-donut" viewBox="0 0 120 120" role="img" aria-label="目前資產配置甜甜圈圖">
          <circle className="allocation-track" cx="60" cy="60" r={radius} />
          <g transform="rotate(-90 60 60)">
            {segments.map(segment => <circle key={segment.symbol} className={`allocation-segment ${activeSymbol === segment.symbol ? 'active' : ''}`} cx="60" cy="60" r={radius} stroke={segment.color} strokeDasharray={`${segment.dash} ${circumference - segment.dash}`} strokeDashoffset={-segment.offset} onMouseEnter={() => setHoveredSymbol(segment.symbol)} onMouseLeave={() => setHoveredSymbol(null)} onClick={() => activate(segment.symbol)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(segment.symbol); } }} role="button" tabIndex={0}><title>{`${segment.name} ${pct(segment.percent)}`}</title></circle>)}
          </g>
        </svg>
        <div className="allocation-donut-center"><small>{selected ? selected.name : '總資產'}</small><strong>{selected ? pct(selected.percent) : money(total)}</strong></div>
      </div>
      <div className={`allocation-legend ${showAll ? 'is-expanded' : ''}`}>
        {items.map(item => <button type="button" className={`allocation-legend-item ${activeSymbol === item.symbol ? 'active' : ''}`} key={item.symbol} onMouseEnter={() => setHoveredSymbol(item.symbol)} onMouseLeave={() => setHoveredSymbol(null)} onFocus={() => setHoveredSymbol(item.symbol)} onBlur={() => setHoveredSymbol(null)} onClick={() => activate(item.symbol)}>
          <i style={{ backgroundColor: item.color }} aria-hidden="true" />
          <span><b>{item.symbol === 'CASH' ? '台幣現金' : item.symbol}</b>{item.symbol !== 'CASH' && <small>{item.name}</small>}</span>
          <strong>{pct(item.percent)}</strong>
        </button>)}
        {items.length > 5 && <button type="button" className="allocation-expand" onClick={() => setShowAll(current => !current)}>{showAll ? '收合明細' : `展開明細（其餘 ${items.length - 5} 項）`}</button>}
      </div>
    </div>
  </div>;
}
function HoldingCompactCard({ row, totalAssets, dipSetting, isEditing, onToggleEdit, onUpdate, onUpdateDipAlert, onRemove }: {
  row: ReturnType<typeof calculateMetrics>['rows'][number];
  totalAssets: number;
  dipSetting: DipAlertSetting;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (symbol: SymbolCode, key: keyof Holding, value: number | AssetClass) => void;
  onUpdateDipAlert: (symbol: SymbolCode, patch: Partial<DipAlertSetting>) => void;
  onRemove: (symbol: SymbolCode) => void;
}) {
  const pnlPct = row.cost ? row.pnl / row.cost * 100 : 0;
  const compactWeight = formatCompactHoldingWeight(row.marketValue, totalAssets);
  const compactQuoteMovement = formatCompactQuoteMovement(row.quote.change, row.quote.changePct, row.quote.previousClose);
  return <article className={`holding holding-compact ${isEditing ? 'is-editing' : ''}`}>
    <div className="holding-mobile-summary">
      <p className="holding-mobile-weight"><span>持有比例</span><strong>{compactWeight}</strong></p>
      <div className="holding-mobile-core">
        <h3 className="holding-title"><span className="holding-symbol">{row.symbol}</span><span className="holding-name" title={row.quote.name}>{row.quote.name}</span></h3>
        <p className="holding-mobile-quote"><span><span className="holding-mobile-price-label">{row.quote.error ? '參考價' : '現價'} </span>{row.quote.price.toFixed(2)} 元</span><strong className={`holding-quote-change ${compactQuoteMovement.tone}`} aria-label={compactQuoteMovement.ariaLabel}>{compactQuoteMovement.text}</strong></p>
        <p className="holding-mobile-shares"><span className="holding-mobile-shares-label">持有 </span>{row.shares.toLocaleString('zh-TW')} 股</p>
      </div>
      <div className="holding-mobile-value"><span>目前市值</span><strong>{money(row.marketValue)}</strong><button type="button" className="holding-edit-button" aria-expanded={isEditing} onClick={onToggleEdit}>{isEditing ? '收合' : '詳細'}</button></div>
    </div>
    {row.quote.error && <p className="note holding-quote-error">{quoteRefreshErrorLabel(row.quote.error)}</p>}
    {isEditing && <div className="holding-editor">
      <div className="holding-editor-summary" aria-label="持股詳細資料">
        <p><span>總投入成本</span><strong>{money(row.cost)}</strong></p>
        <p><span>未實現損益</span><strong className={tone(row.pnl)}>{signedMoney(row.pnl)} / {signedPct(pnlPct)}</strong></p>
        <p><span>目前比例</span><strong>{compactWeight}</strong></p>
      </div>
      <div className="holding-editor-grid">
        <label>總股數<DraftInput type="number" min="0" value={row.shares} onCommit={value => onUpdate(row.symbol, 'shares', parsePositive(value))} /></label>
        <label>成交均價<DraftInput type="number" min="0" step="0.01" value={row.avgCost} onCommit={value => onUpdate(row.symbol, 'avgCost', parsePositive(value))} /></label>
        <label>目標比例 %<DraftInput inputMode="decimal" value={row.targetWeight ?? ''} onCommit={value => onUpdate(row.symbol, 'targetWeight', clampTarget(Number(value)))} /><small>{assetClassLabel(row.assetClass)}配置目標，限制 {MIN_GROWTH_TARGET}%～{MAX_GROWTH_TARGET}%。未分配比例由現金承擔。</small></label>
        <label>資產分類<select value={row.assetClass} onChange={event => { const value = event.currentTarget.value; onUpdate(row.symbol, 'assetClass', normalizeAssetClass(value)); }}><option value="growth">成長資產</option><option value="defensive">防守資產</option></select><small>分類會立即影響資產配置、再平衡與交易建議。</small></label>
        <label>波段最高價<DraftInput type="number" min="0" step="0.01" value={dipSetting.referencePrice || ''} onCommit={value => onUpdateDipAlert(row.symbol, { referencePrice: parsePositive(value) })} /><small>僅在逢低提醒啟用時用於觀察，不會自動交易。</small></label>
        <label className="holding-dip-toggle"><span>逢低提醒</span><input type="checkbox" checked={dipSetting.enabled} onChange={event => { const checked = event.currentTarget.checked; onUpdateDipAlert(row.symbol, { enabled: checked }); }} /> 啟用逢低加碼觀察</label>
      </div>
      <button type="button" className="danger small holding-delete-button" onClick={() => onRemove(row.symbol)}><Trash2 size={15} aria-hidden="true" />封存已清倉</button>
    </div>}
  </article>;
}
function AllocationPresetPanel({ holdings, preset, roleBySymbol, onApply, onKeepCustom }: {
  holdings: Array<Pick<Holding, 'symbol' | 'name' | 'targetWeight'>>;
  preset: AllocationPreset;
  roleBySymbol: AllocationRoleBySymbol;
  onApply: (preview: ReturnType<typeof deriveAllocationPresetPreview>, roles: AllocationRoleBySymbol) => void;
  onKeepCustom: () => void;
}) {
  const [draftPreset, setDraftPreset] = useState<AllocationPreset>(preset);
  const [draftRoles, setDraftRoles] = useState<AllocationRoleBySymbol>(roleBySymbol);
  useEffect(() => {
    setDraftPreset(preset);
    setDraftRoles(roleBySymbol);
  }, [preset, roleBySymbol]);
  const preview = deriveAllocationPresetPreview({ preset: draftPreset, holdings, roleBySymbol: draftRoles });
  const resetDraft = () => { setDraftPreset(preset); setDraftRoles(roleBySymbol); };
  return <Card title="正式目標配置" className="allocation-preset-panel">
    <AllocationContextNotice context="official-target" />
    <div className="allocation-preset-controls">
      <label>正式目標配置<select value={draftPreset} onChange={event => setDraftPreset(normalizeAllocationPreset(event.currentTarget.value))}><option value="custom">自訂正式配置</option><option value="clec-442">CLEC 442</option><option value="clec-433">CLEC 433</option></select></label>
      <p><small>目前正式目標配置</small><strong>{allocationPresetLabel(preset)}</strong></p>
    </div>
    {draftPreset !== 'custom' && <div className="allocation-preset-roles">{holdings.map(holding => {
      const symbol = normalizeSymbol(holding.symbol);
      const currentRole = draftRoles[symbol] || 'none';
      const occupiedRoles = new Set(Object.entries(draftRoles).filter(([otherSymbol, role]) => otherSymbol !== symbol && role !== 'none').map(([, role]) => role));
      return <label key={symbol}><span><b>{symbol}</b><small>{holding.name || symbol}｜目前目標 {pct(holding.targetWeight ?? 0)}</small></span><select value={currentRole} onChange={event => { const role = event.currentTarget.value as AllocationRole; setDraftRoles(current => ({ ...current, [symbol]: role })); }}><option value="none">未指派</option><option value="prototype" disabled={currentRole !== 'prototype' && occupiedRoles.has('prototype')}>原型資產</option><option value="leveraged" disabled={currentRole !== 'leveraged' && occupiedRoles.has('leveraged')}>槓桿資產</option><option value="cash-like" disabled={currentRole !== 'cash-like' && occupiedRoles.has('cash-like')}>類現金持股</option></select></label>;
    })}</div>}
    <div className={`allocation-preset-preview ${preview.canApply ? 'good' : 'bad'}`}>
      <h3>套用後預覽</h3>
      <p><b>{allocationPresetLabel(draftPreset)}</b>｜持股目標合計 {preview.targetTotal === null ? '無法計算' : pct(preview.targetTotal)}｜銀行現金目標 {preview.cashTargetPct === null ? '無法計算' : pct(preview.cashTargetPct)}</p>
      {preview.rows.map(row => <p key={row.symbol}><span>{row.symbol}｜{row.issue === 'duplicate-role' ? '角色重複，尚未分配' : roleLabel(row.role)}</span><strong>{pct(row.currentWeight)} → {row.nextWeight === null ? '無法計算' : pct(row.nextWeight)}</strong></p>)}
      {preview.warnings.map(item => <p className="warning-message" key={item}>{item}</p>)}
      {preview.blockingReasons.map(item => <p className="warning-message" key={item}>{item}</p>)}
    </div>
    <div className="actions"><button type="button" className="small" onClick={resetDraft}>取消預覽</button>{draftPreset === 'custom' ? <button type="button" className="small" onClick={onKeepCustom}>保留目前配置</button> : <button type="button" disabled={!preview.canApply} onClick={() => onApply(preview, draftRoles)}>確認套用 {allocationPresetLabel(draftPreset)}</button>}</div>
  </Card>;
}
function Stat({ label, value, tone: toneClass }: { label: string; value: ReactNode; tone?: string }) {
  return <div className="stat"><small>{label}</small><b className={toneClass || ''}>{value}</b></div>;
}
function Card({ id, title, children, action, style, className = '' }: { id?: string; title: string; children: ReactNode; action?: ReactNode; style?: CSSProperties; className?: string }) {
  return <section id={id} className={`card ${className}`.trim()} style={style}>
    {action ? (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {action}
      </div>
    ) : (
      <h2>{title}</h2>
    )}
    {children}
  </section>;
}
function SectionCard({ id, title, children, action, style, className = '', isMobile, collapsible = false, collapsibleOnDesktop = false, open = true, summary, status, onToggle }: { id?: string; title: string; children: ReactNode; action?: ReactNode; style?: CSSProperties; className?: string; isMobile?: boolean; collapsible?: boolean; collapsibleOnDesktop?: boolean; open?: boolean; summary?: ReactNode; status?: ReactNode; onToggle?: () => void }) {
  if (!collapsible) return <Card id={id} title={title} action={action} style={style} className={className}>{children}</Card>;
  const contentId = id ? `${id}-content` : `section-${title}-content`;
  return <section id={id} className={`card collapsible-card ${open ? 'open' : 'closed'} ${className}`.trim()} style={style}>
    <div className="section-toggle-row">
      <button type="button" className="section-toggle" aria-expanded={open} aria-controls={contentId} onClick={onToggle}>
        <span className="section-toggle-title">{title}{status && <span className="section-toggle-status">{status}</span>}</span>
        <b aria-hidden="true">{open ? '收合 ▲' : '展開 ▼'}</b>
      </button>
      {action && <div className="section-card-action">{action}</div>}
    </div>
    {!open && summary && <p className="section-summary">{summary}</p>}
    {open && <div id={contentId} className="section-content">{children}</div>}
  </section>;
}
function OrderSuggestionList({ title, items, actionLabel, emptyText }: { title: string; items: OrderSuggestion[]; actionLabel: string; emptyText: string }) {
  return <div className="order-section">
    <h3>{title}</h3>
    {items.length === 0 ? <p className="note">{emptyText}</p> : <div className="order-list">
      {items.map((item, index) => <article className="order-item" key={`${title}-${item.symbol}`}>
        <div className="order-rank">{index + 1}</div>
        <div className="order-body">
          <h4>{item.symbol} <span>{item.name}</span></h4>
          <div className="order-grid">
            <p><span>{actionLabel}金額</span><strong>{formatCurrency(item.amount)}</strong></p>
            <p><span>目前價格</span><strong>{item.price > 0 ? item.price.toFixed(2) : '價格不足'}</strong></p>
            <p><span>{actionLabel === '加碼' ? '約可買' : '約可賣'}</span><strong>{item.conversionText}</strong></p>
            <p><span>目標比例</span><strong>{pct(item.targetPercent)}</strong></p>
          </div>
        </div>
      </article>)}
    </div>}
  </div>;
}
function SkippedSellList({ items }: { items: OrderSuggestion[] }) {
  return <div className="order-section order-muted">
    <h3>超標資產暫不處理</h3>
    <p className="note">只買不賣模式不提供賣出建議；以下資產目前超標，暫不加碼。</p>
    {items.length === 0 ? <p className="note">目前沒有明顯超標資產。</p> : <div className="order-list">
      {items.map((item, index) => <article className="order-item" key={`skip-${item.symbol}`}>
        <div className="order-rank muted">{index + 1}</div>
        <div className="order-body">
          <h4>{item.symbol} <span>{item.name}</span></h4>
          <div className="order-grid">
            <p><span>超標金額</span><strong>{formatCurrency(item.amount)}</strong></p>
            <p><span>目前價格</span><strong>{item.price > 0 ? item.price.toFixed(2) : '價格不足'}</strong></p>
            <p><span>模式處理</span><strong>暫不賣出，也不加碼</strong></p>
            <p><span>目標比例</span><strong>{pct(item.targetPercent)}</strong></p>
          </div>
        </div>
      </article>)}
    </div>}
  </div>;
}
function DefensiveReminderCard({ reminder }: { reminder: DefensiveReminder }) {
  return <div className={`order-section defensive-reminder ${reminder.status}`}>
    <h3>防守資產補足提醒</h3>
    <p className="note">{reminder.message}</p>
    {reminder.items.map((item, index) => <article className="order-item" key={`defensive-${item.symbol}`}>
      <div className="order-rank muted">{index + 1}</div>
      <div className="order-body">
        <h4>{item.symbol} <span>{item.name}</span></h4>
        <div className="order-grid">
          <p><span>防守股票目前比例</span><strong>{pct(reminder.currentWeight)}</strong></p>
          <p><span>防守股票目標合計</span><strong>{pct(reminder.targetPercent)}</strong></p>
          <p><span>{reminder.status === 'over' ? '高於目標金額' : '防守資產缺口金額'}</span><strong>{formatCurrency(item.amount)}</strong></p>
          <p><span>約可買股數</span><strong>{reminder.status === 'under' ? item.conversionText : '目前不需補買'}</strong></p>
        </div>
      </div>
    </article>)}
  </div>;
}
function TradeStepList({ steps, currentWeights }: { steps: TradeStep[]; currentWeights: Record<string, number> }) {
  return <div className="trade-step-list">
    {steps.map(step => <article className={`trade-step ${step.action === '買入' ? 'buy' : step.action === '賣出' ? 'sell' : 'hold'}`} key={`${step.order}-${step.symbol}-${step.action}`}>
      <div className="order-rank">{step.order}</div>
      <div className="trade-step-body">
        <h3>步驟 {step.order}：{step.action} {step.symbol} <span>{step.name}</span></h3>
        <div className="order-grid">
          <p><span>操作類型</span><strong>{step.action}</strong></p>
          <p><span>建議金額</span><strong>{step.amount > 0 ? formatCurrency(step.amount) : '0.0 萬元'}</strong></p>
          <p><span>預估股數</span><strong>{step.shares === null ? step.conversionText : step.conversionText}</strong></p>
          <p><span>操作前比例</span><strong>{step.symbol === '整體配置' ? '—' : pct(currentWeights[step.symbol] ?? 0)}</strong></p>
          <p><span>執行後預估配置比例</span><strong>{step.projectedWeight > 0 ? pct(step.projectedWeight) : '維持現況'}</strong></p>
        </div>
        <p className="note">{step.note}</p>
      </div>
    </article>)}
  </div>;
}
function AnalyticsSummary({ rb, orderHelper, dipStatus }: { rb: ReturnType<typeof rebalance>; orderHelper: OrderHelper; dipStatus: string }) {
  return <div className="analytics-summary-grid">
    <div><small>再平衡狀態</small><strong className={rb.thresholdReached ? 'warn' : 'good'}>{rb.thresholdStatus}</strong></div>
    <div><small>目前偏離目標</small><strong className={tone(rb.deviation)}>{rb.deviationText}</strong></div>
    <div><small>成長資產</small><strong>{pct(rb.stockRow.currentWeight)} <em>/ {rb.stockRow.targetText}</em></strong></div>
    <div><small>防守資產</small><strong>{pct(rb.defensiveRow.currentWeight)} <em>/ {rb.defensiveRow.targetText}</em></strong></div>
    <div><small>本次建議操作金額</small><strong>{formatCurrency(orderHelper.totalBuyAmount)}</strong></div>
    <div><small>逢低加碼訊號</small><strong className={dipStatus.includes('已觸發') ? 'warn' : 'hold'}>{dipStatus}</strong></div>
  </div>;
}
function AllocationAnalysis({ m, rb }: { m: ReturnType<typeof calculateMetrics>; rb: ReturnType<typeof rebalance> }) {
  const [view, setView] = useState<'assets' | 'classes'>('assets');
  return <>
    <AllocationContextNotice context="analysis" showCta />
    <div className="analytics-view-toggle" role="group" aria-label="資產配置分析視角">
      <button type="button" className={view === 'assets' ? 'active' : ''} onClick={() => setView('assets')}>個別資產配置</button>
      <button type="button" className={view === 'classes' ? 'active' : ''} onClick={() => setView('classes')}>成長／防守配置</button>
    </div>
    {view === 'assets' ? <AllocationDonut m={m} /> : <div className="allocation-class-grid">
      <article><h3>成長資產</h3><p><span>目前比例</span><strong>{pct(rb.stockRow.currentWeight)}</strong></p><p><span>目標比例</span><strong>{rb.stockRow.targetText}</strong></p><p><span>差異</span><strong className={rb.stockRow.tone}>{rb.stockRow.deviationText}</strong></p><b className={rb.stockRow.tone}>{rb.stockRow.action}</b></article>
      <article><h3>防守資產</h3><p><span>目前比例</span><strong>{pct(rb.defensiveRow.currentWeight)}</strong></p><p><span>目標比例</span><strong>{rb.defensiveRow.targetText}</strong></p><p><span>差異</span><strong className={rb.defensiveRow.tone}>{rb.defensiveRow.deviationText}</strong></p><b className={rb.defensiveRow.tone}>{rb.defensiveRow.action}</b></article>
    </div>}
  </>;
}
function DipOpportunityAnalysis({ rows, onOpenAssets }: { rows: DipAlertRow[]; onOpenAssets: () => void }) {
  const enabledRows = rows.filter(row => row.setting.enabled).sort((a, b) => Number(b.triggered) - Number(a.triggered) || num(a.drawdownPct ?? 0) - num(b.drawdownPct ?? 0));
  if (!enabledRows.length) return <div className="analytics-empty"><p>目前沒有啟用逢低加碼提醒的資產。</p><button type="button" onClick={onOpenAssets}>前往資產頁設定</button></div>;
  return <div className="dip-opportunity-list">
    {enabledRows.map((row, index) => <article className={`dip-opportunity-card ${row.triggered ? 'triggered' : ''}`} key={row.symbol}>
      <div><h3>{index + 1}. {row.symbol} <span>{row.name}</span></h3><b className={row.triggered ? 'warn' : 'hold'}>{row.triggered ? '已達逢低加碼觀察條件' : '持續觀察'}</b></div>
      <div className="dip-opportunity-metrics"><p><span>最新價格</span><strong>{row.price > 0 ? `${row.price.toFixed(2)} 元` : '價格不足'}</strong></p><p><span>波段最高價</span><strong>{row.setting.referencePrice > 0 ? `${row.setting.referencePrice.toFixed(2)} 元` : '尚未設定'}</strong></p><p><span>距高點跌幅</span><strong className={row.drawdownPct !== null && row.drawdownPct <= 0 ? 'down' : ''}>{row.drawdownPct === null ? '尚未設定有效波段最高價' : signedPct(row.drawdownPct)}</strong></p><p><span>提醒門檻</span><strong>{pct(row.setting.thresholdPct)}</strong></p></div>
    </article>)}
  </div>;
}
function AnalyticsDetails({ m, rb, health, quoteSummaryText, latestQuoteTime, onCopy, copyStatus }: { m: ReturnType<typeof calculateMetrics>; rb: ReturnType<typeof rebalance>; health: ReturnType<typeof investmentHealth>; quoteSummaryText: string; latestQuoteTime: string; onCopy: () => void; copyStatus: string }) {
  return <div className="analytics-details-list">
    <details><summary>計算方式</summary><p>目前比例、目標比例與偏離幅度皆直接使用共用再平衡資料。成長資產目前 {pct(rb.stockRow.currentWeight)}，目標 {rb.stockRow.targetText}；防守資產目前 {pct(rb.defensiveRow.currentWeight)}，目標 {rb.defensiveRow.targetText}。</p></details>
    <details><summary>風險提醒</summary><p><strong className={health.tone}>{health.status}</strong>：{health.reason}</p><p>{health.suggestion}</p></details>
    <details><summary>詳細分析資料／除錯資訊</summary><p>股價狀態：{quoteSummaryText}。最近更新：{latestQuoteTime ? tw(latestQuoteTime) : '尚未更新'}。總資產：{money(m.totalAssets)}。</p><button type="button" className="small" onClick={onCopy}>{copyStatus}</button></details>
  </div>;
}
function DipAlertCard({ row, onChange }: { row: DipAlertRow; onChange: (symbol: SymbolCode, patch: Partial<DipAlertSetting>) => void }) {
  return <article className={`dip-alert-item ${row.triggered ? 'triggered' : ''}`}>
    <div className="dip-alert-head">
      <div>
        <h3>{row.symbol} <span>{row.name}</span></h3>
        <p>目前價格：{row.price > 0 ? row.price.toFixed(2) : '價格不足'}</p>
      </div>
      <label className="dip-toggle"><input type="checkbox" checked={row.setting.enabled} onChange={e => { const checked = e.currentTarget.checked; onChange(row.symbol, { enabled: checked }); }} /> 啟用</label>
    </div>
    <div className="dip-alert-fields">
      <label>波段最高價
        <DraftInput type="number" min="0" step="0.01" inputMode="decimal" value={row.setting.referencePrice || ''} onCommit={value => onChange(row.symbol, { referencePrice: Math.max(0, safeNumber(value)) })} />
      </label>
      <label>跌幅提醒門檻 %
        <DraftInput type="number" step="0.1" inputMode="decimal" value={row.setting.thresholdPct} onCommit={value => onChange(row.symbol, { thresholdPct: safeNumber(value) || DEFAULT_DIP_ALERT_THRESHOLD })} />
      </label>
    </div>
    <div className="dip-alert-result">
      <p><span>波段最高價</span><strong>{row.setting.referencePrice > 0 ? row.setting.referencePrice.toFixed(2) : '尚未設定'}</strong></p>
      <p><span>目前跌幅</span><strong className={row.drawdownPct !== null && row.drawdownPct <= 0 ? 'down' : ''}>{row.drawdownPct === null ? '尚未設定有效波段最高價' : signedPct(row.drawdownPct)}</strong></p>
      <p><span>提醒門檻</span><strong>{pct(row.setting.thresholdPct)}</strong></p>
      <p><span>狀態</span><strong className={row.triggered ? 'warn' : ''}>{row.status}</strong></p>
    </div>
  </article>;
}
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

const accountTypeLabel: Record<FinancialAccountType, string> = { cash: '現金', bank: '銀行', securities: '證券', creditCard: '信用卡', loan: '貸款', mortgage: '房貸', eWallet: '電子錢包', other: '其他' };
function FinancialAccountList({ accounts, isMobile, onCreate, onUpdate, onDeactivate, onRestore, onDelete }: { accounts: FinancialAccount[]; isMobile: boolean; onCreate: () => void; onUpdate: (id: string, patch: Partial<FinancialAccount>) => void; onDeactivate: (id: string) => void; onRestore: (id: string) => void; onDelete: (id: string) => void }) {
  return <div className="financial-account-list">
    <p className="note">帳戶是現金與淨資產的唯一計算來源。舊版現金項目已安全保留作相容資料，不再重複計算；derived 餘額會等待後續交易／持股來源接入。</p>
    {!accounts.length && <p className="note">尚無帳戶，可先新增一個手動餘額帳戶。</p>}
    {accounts.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)).map(account => {
      const balance = getFinancialAccountBalance(account);
      return <article className={`financial-account-card${account.isActive ? '' : ' is-inactive'}`} key={account.id}>
        <header><div><strong>{account.name}</strong><span>{accountTypeLabel[account.type]}｜{account.balanceMode === 'manual' ? '手動餘額' : '衍生餘額'}｜{account.isActive ? '啟用中' : '已停用'}</span></div><b>{balance.status === 'available' ? money(balance.value ?? 0) : '尚未可用'}</b></header>
        <div className="financial-account-fields">
          <label>名稱<DraftInput value={account.name} onCommit={value => onUpdate(account.id, { name: value || '未命名帳戶' })} /></label>
          <label>類型<select value={account.type} onChange={event => onUpdate(account.id, { type: event.currentTarget.value as FinancialAccountType })}>{FINANCIAL_ACCOUNT_TYPES.map(type => <option key={type} value={type}>{accountTypeLabel[type]}</option>)}</select></label>
          <label>餘額模式<select value={account.balanceMode} onChange={event => onUpdate(account.id, { balanceMode: event.currentTarget.value as AccountBalanceMode })}><option value="manual">手動</option><option value="derived">衍生（尚未接來源）</option></select></label>
          {account.balanceMode === 'manual' ? <label>餘額（萬元）<DraftInput type="number" value={account.manualBalance / 10000} onCommit={value => onUpdate(account.id, { manualBalance: parsePositive(value) * 10000 })} /></label> : <p className="account-derived-note">目前沒有交易或持股衍生來源，因此不計入餘額。</p>}
          <label>幣別<DraftInput value={account.currency} onCommit={value => onUpdate(account.id, { currency: value.toUpperCase() || 'TWD' })} /></label>
          <label>金融機構<DraftInput value={account.institutionName} onCommit={value => onUpdate(account.id, { institutionName: value })} /></label>
          <label className="account-note">備註<DraftInput value={account.note} onCommit={value => onUpdate(account.id, { note: value })} /></label>
        </div>
        <footer>{account.isActive ? <button className="small" type="button" onClick={() => onDeactivate(account.id)}>停用</button> : <button className="small" type="button" onClick={() => onRestore(account.id)}>恢復</button>}<button className="danger small" type="button" onClick={() => onDelete(account.id)}>刪除</button><small>帳戶 ID：{account.id}</small></footer>
      </article>;
    })}
    <button className="small" type="button" onClick={onCreate}>新增帳戶</button>
  </div>;
}

function TransactionList({ accounts, transactions, onCreate, onDelete, onUpdate }: { accounts: FinancialAccount[]; transactions: FinancialTransaction[]; onCreate: (input: Partial<FinancialTransaction>) => void; onDelete: (id: string) => void; onUpdate: (id: string, patch: Partial<FinancialTransaction>) => void }) {
  const [accountId, setAccountId] = useState(''); const [transferAccountId, setTransferAccountId] = useState(''); const [type, setType] = useState<TransactionType>('expense'); const [amount, setAmount] = useState(''); const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10)); const [description, setDescription] = useState(''); const [merchant, setMerchant] = useState(''); const [categoryId, setCategoryId] = useState('expense-other'); const [note, setNote] = useState(''); const [status, setStatus] = useState<TransactionStatus>('posted'); const [excluded, setExcluded] = useState(false); const [editingId, setEditingId] = useState<string | null>(null); const [message, setMessage] = useState(''); const [accountFilter, setAccountFilter] = useState(''); const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const active = accounts.filter(account => account.isActive); const summary = transactionCashFlowSummary(transactions); const money = formatTransactionAmount;
  const reset = () => { setEditingId(null); setAccountId(''); setTransferAccountId(''); setType('expense'); setAmount(''); setOccurredAt(new Date().toISOString().slice(0, 10)); setDescription(''); setMerchant(''); setCategoryId('expense-other'); setNote(''); setStatus('posted'); setExcluded(false); setMessage(''); };
  const changeType = (nextType: TransactionType) => { setType(nextType); setCategoryId(current => normalizeTransactionCategory(nextType, current)); };
  const save = () => { const numeric = Number(amount); if (type === 'transfer') { const error = validateTransferAccounts(accountId, transferAccountId, numeric, accounts); if (error) { setMessage(error); return; } } else if (!active.some(account => account.id === accountId) || !(numeric > 0)) { setMessage('請選擇有效啟用帳戶並輸入大於 0 的金額'); return; } const input = { accountId, transferAccountId: type === 'transfer' ? transferAccountId : undefined, type, amount: numeric, occurredAt: `${occurredAt}T00:00:00.000Z`, description, merchant, categoryId: type === 'transfer' ? 'transfer' : categoryId, note, status, excluded }; if (editingId) onUpdate(editingId, input); else onCreate(input); reset(); };
  const edit = (transaction: FinancialTransaction) => { setEditingId(transaction.id); setAccountId(transaction.accountId); setTransferAccountId(transaction.transferAccountId || ''); setType(transaction.type); setAmount(String(transaction.amount)); setOccurredAt(transaction.occurredAt.slice(0, 10)); setDescription(transaction.description); setMerchant(transaction.merchant); setCategoryId(transaction.categoryId); setNote(transaction.note); setStatus(transaction.status); setExcluded(transaction.excluded); setMessage(''); };
  const filtered = transactions.filter(t => (accountFilter === '' || t.accountId === accountFilter || t.transferAccountId === accountFilter) && (typeFilter === 'all' || t.type === typeFilter)).slice().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const name = (id?: string) => accounts.find(account => account.id === id)?.name || '已不存在帳戶';
  return <div className="financial-account-list"><p className="note">V4.2 僅手動交易；匯入、Gmail 與銀行連線尚未實作。accountId 永遠是來源帳戶，transferAccountId 永遠是目的帳戶。</p><div className="financial-account-fields"><label>來源帳戶<select value={accountId} onChange={event => setAccountId(event.currentTarget.value)}><option value="">選擇帳戶</option>{active.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>{type === 'transfer' && <label>目的帳戶<select value={transferAccountId} onChange={event => setTransferAccountId(event.currentTarget.value)}><option value="">選擇帳戶</option>{active.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>}<label>類型<select value={type} onChange={event => changeType(event.currentTarget.value as TransactionType)}><option value="income">收入</option><option value="expense">支出</option><option value="adjustment">調整</option><option value="transfer">帳戶轉帳</option></select></label><label>日期<input type="date" value={occurredAt} onChange={event => setOccurredAt(event.currentTarget.value)} /></label><label>金額（元）<input type="number" min="0" value={amount} onChange={event => setAmount(event.currentTarget.value)} /></label><label>狀態<select value={status} onChange={event => setStatus(event.currentTarget.value as TransactionStatus)}><option value="posted">已入帳</option><option value="pending">待入帳</option><option value="void">已作廢</option></select></label><label>類別<select value={categoryId} onChange={event => setCategoryId(event.currentTarget.value)} disabled={type === 'transfer'}>{categoriesForTransactionType(type).map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>描述<input value={description} onChange={event => setDescription(event.currentTarget.value)} /></label><label>商家／對象<input value={merchant} onChange={event => setMerchant(event.currentTarget.value)} /></label><label className="account-note">備註<input value={note} onChange={event => setNote(event.currentTarget.value)} /></label><label className="exclude-statistics"><span className="exclude-statistics-main"><input type="checkbox" checked={excluded} onChange={event => setExcluded(event.currentTarget.checked)} /><span>排除統計</span></span><small>勾選後，交易仍會保留，但不列入收支統計與衍生餘額。</small></label></div>{message && <p className="warning-message">{message}</p>}<button className="small" type="button" onClick={save}>{editingId ? '儲存編輯' : '新增交易'}</button>{editingId && <button className="small" type="button" onClick={reset}>取消編輯</button>}<p className="note">收入 {money(summary.income)}｜支出 {money(summary.expense)}</p><div className="financial-account-fields"><label>帳戶篩選<select value={accountFilter} onChange={event => setAccountFilter(event.currentTarget.value)}><option value="">全部帳戶</option>{accounts.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label><label>類型篩選<select value={typeFilter} onChange={event => setTypeFilter(event.currentTarget.value as 'all' | TransactionType)}><option value="all">全部類型</option><option value="income">收入</option><option value="expense">支出</option><option value="adjustment">調整</option><option value="transfer">帳戶轉帳</option></select></label></div>{filtered.map(transaction => <p className="note" key={transaction.id}>{transaction.type === 'transfer' ? `${name(transaction.accountId)} → ${name(transaction.transferAccountId)}` : name(transaction.accountId)}｜{money(transaction.amount)}｜{transactionCategoryLabel(transaction.categoryId)}｜{transaction.occurredAt.slice(0, 10)}｜{transactionStatusLabel(transaction.status)}｜{transactionSourceLabel(transaction.source)}{transaction.excluded ? '｜已排除' : ''}{transaction.description ? `｜${transaction.description}` : ''} <button className="small" type="button" onClick={() => edit(transaction)}>編輯</button><button className="small" type="button" onClick={() => onUpdate(transaction.id, { status: transaction.status === 'void' ? 'posted' : 'void' })}>{transaction.status === 'void' ? '恢復' : '作廢'}</button><button className="small" type="button" onClick={() => onUpdate(transaction.id, { excluded: !transaction.excluded })}>{transaction.excluded ? '重新納入' : '排除'}</button><button className="danger small" type="button" onClick={() => onDelete(transaction.id)}>刪除</button></p>)}</div>;
}


function LoanList({ items, setItems, isMobile }: { items: LoanItem[]; setItems: (items: SetStateAction<LoanItem[]>) => void; isMobile: boolean }) {
  const update = (id: string, patch: Partial<LoanItem>) => setItems(items => items.map(item => sanitizeLoanItem(item.id === id ? { ...item, ...patch } : item)));
  const remove = (item: LoanItem) => {
    if (window.confirm(`確定要刪除借款項目「${item.name || '未命名'}」嗎？`)) setItems(current => current.filter(entry => entry.id !== item.id));
  };
  const deleteButton = (item: LoanItem) => <button className="danger small compact-row-delete" type="button" aria-label={`刪除借款項目 ${item.name || '未命名'}`} onClick={() => remove(item)}><Trash2 size={15} aria-hidden="true" /><span>刪除</span></button>;
  const rowStyle: CSSProperties = isMobile ? { display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', boxSizing: 'border-box' } : {};
  const labelStyle: CSSProperties = isMobile ? { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginBottom: '0.75rem', boxSizing: 'border-box' } : {};
  const labelSpanStyle: CSSProperties = isMobile ? { fontSize: '0.9rem', color: '#888', marginBottom: '0.35rem', textAlign: 'left', display: 'block' } : {};
  return <div className="list loan-list"><p className="note" style={{ wordBreak: 'break-all', whiteSpace: 'normal', overflowWrap: 'break-word' }}>已繳期數依起始日與今天日期自動計算，已繳與剩餘為只讀欄位。</p>{!isMobile && <div className="list-row list-head"><span>名稱</span><span>本金（萬元）</span><span>利率%</span><span>月付金</span><span>起始日</span><span>總期數</span><span>已繳期數</span><span>剩餘期數</span><span>操作</span></div>}{items.map(item => { const period = loanPeriodSummary(item); return <div className="list-row" key={item.id} style={rowStyle}>{isMobile && <div className="mobile-row-toolbar"><strong>{item.name || '借款'}</strong>{deleteButton(item)}</div>}<label style={labelStyle}><span style={labelSpanStyle}>名稱</span><DraftInput value={item.name} onCommit={value => update(item.id, { name: value })} /></label><label style={labelStyle}><span style={labelSpanStyle}>本金（萬元）</span><DraftInput type="number" value={item.principal / 10000} onCommit={value => update(item.id, { principal: parsePositive(value) * 10000 })} /></label><label style={labelStyle}><span style={labelSpanStyle}>利率%</span><DraftInput type="number" value={item.annualRate} onCommit={value => update(item.id, { annualRate: parsePositive(value) })} /></label><label style={labelStyle}><span style={labelSpanStyle}>月付金</span><DraftInput type="number" value={item.monthlyPayment} onCommit={value => update(item.id, { monthlyPayment: parsePositive(value) })} /></label><label style={labelStyle}><span style={labelSpanStyle}>起始日</span><DraftInput type="date" value={item.startDate} onCommit={value => update(item.id, { startDate: value })} /></label><label style={labelStyle}><span style={labelSpanStyle}>總期數</span><DraftInput type="number" value={item.totalMonths ?? ''} onCommit={value => update(item.id, { totalMonths: value.trim() === '' ? undefined : parsePositive(value) })} /></label><div className="remaining" style={isMobile ? { display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0.25rem 0', color: '#aaa', fontSize: '0.9rem' } : undefined} title="依起始日與今天日期自動計算">{isMobile ? <span>已繳期數</span> : null}<span>{period.paid === undefined ? '—' : `${period.paid.toLocaleString('zh-TW')} 期`}</span></div><div className="remaining" style={isMobile ? { display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0.25rem 0', color: '#aaa', fontSize: '0.9rem' } : undefined} title="總期數減已繳期數">{isMobile ? <span>剩餘期數</span> : null}<span>{period.remaining === undefined ? '—' : `${period.remaining.toLocaleString('zh-TW')} 期`}</span></div>{!isMobile && deleteButton(item)}</div>; })}<button className="small" onClick={() => setItems(items => [...items, { id: uid(), name: '借款', principal: 0, annualRate: 0, monthlyPayment: 0, startDate: new Date().toISOString().slice(0, 10), totalMonths: undefined }])}>新增</button></div>;
}

function App() {
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const previewFixtureMode = DEPLOYMENT_ENVIRONMENT === 'preview' ? new URLSearchParams(typeof window === 'undefined' ? routeLocation.search : window.location.search).get('previewFixture') : null;
  const currentPage = routeLocation.pathname.replace(/^\//, '') || 'home';
  const isTransactionImportTarget = routeLocation.pathname === '/assets' && routeLocation.hash === '#transactions-section';
  const isAllocationSimulator = routeLocation.pathname === '/tools/allocation-simulator';
  const isRiskCenter = routeLocation.pathname === '/tools/risk-center';
  const isWealthGoal = routeLocation.pathname === '/tools/wealth-goal';
  const isCashFlowCenter = routeLocation.pathname === '/tools/cash-flow';
  const isNetWorthHistory = routeLocation.pathname === '/tools/net-worth-history' || routeLocation.pathname === '/net-worth-history';
    const isDividendCenter = routeLocation.pathname === '/tools/dividend-center';
    const isAiDecisionCenter = routeLocation.pathname === '/tools/ai-decision';
    const isPortfolioRiskCenter = routeLocation.pathname === '/tools/portfolio-risk';
    const isRebalanceRecommendationCenter = routeLocation.pathname === '/tools/rebalance-recommendation';
    const isClecStrategyCenter = routeLocation.pathname === '/tools/clec-strategy';
    const isInvestmentActionCenter = routeLocation.pathname === '/tools/investment-action-center';
  const marketWorkerUrl = import.meta.env.VITE_MARKET_DATA_WORKER_URL || '';
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('forceErrorBoundary') === '1') {
    throw new Error('Error Boundary 測試錯誤');
  }
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [analyticsView, setAnalyticsView] = useState<'performance' | 'risk'>('performance');
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [uiState, setUiState] = useState<UiState>(() => readUiState());
  const [state, setStateValue] = useState<AppState>(() => readState());
  const stateRef = useRef(state);
  const isApplyingRemoteRef = useRef(false);
  const didMount = useRef(false);
  const setState = (updater: SetStateAction<AppState>) => {
    const previous = stateRef.current;
    const next = typeof updater === 'function' ? (updater as (value: AppState) => AppState)(previous) : updater;
    let normalized = normalizeState(next);
    if (didMount.current && !isApplyingRemoteRef.current && hasSyncableStateChanged(previous, normalized)) {
      const savedAt = now();
      const baseline = deriveSyncBaselineDiagnostics(normalized, normalized.syncMeta.baselineFingerprint, normalized.syncMeta.baselineFieldFingerprints);
      normalized = {
        ...normalized,
        syncMeta: sanitizeSyncMeta({ ...normalized.syncMeta, source: '本機資料', lastLocalSaveAt: savedAt, dirty: baseline.dirty, status: !baseline.baselineAvailable ? missingBaselineStatus(normalized) : baseline.dirty ? localDirtyStatus(normalized) : cleanSyncStatus() }, normalized)
      };
      setLastSavedAt(savedAt);
    }
    stateRef.current = normalized;
    setStateValue(normalized);
  };
  const [quotes, setQuotes] = useState<Record<SymbolCode, Quote>>(defaultQuotes);
  const [hasUpdatedQuotes, setHasUpdatedQuotes] = useState(false);
  const m = useMemo(() => calculateMetrics(state, quotes), [state, quotes]);
  const currentNetWorthSnapshot = useMemo(() => netWorthSnapshotFromTotals({
    totalAssets: m.totalAssets,
    netWorth: m.netWorth,
    investmentValue: m.stocks,
    cash: m.cash,
    debt: m.debt
  }), [m.totalAssets, m.netWorth, m.stocks, m.cash, m.debt]);
  const syncMeta = state.syncMeta;
  const remoteMeta = state.remoteMeta;
  const syncBaselineDiagnostics = useMemo(() => deriveSyncBaselineDiagnostics(state, syncMeta.baselineFingerprint, syncMeta.baselineFieldFingerprints), [state, syncMeta.baselineFingerprint, syncMeta.baselineFieldFingerprints]);
  const transactionBaselineRef = useRef<unknown[] | undefined>(undefined);
  const [transactionSyncDiagnostics, setTransactionSyncDiagnostics] = useState<TransactionSyncDiagnostics>(EMPTY_TRANSACTION_SYNC_DIAGNOSTICS);
  useEffect(() => {
    let cancelled = false;
    const current = state.transactions;
    if (syncBaselineDiagnostics.baselineAvailable && !syncBaselineDiagnostics.dirty) {
      transactionBaselineRef.current = JSON.parse(JSON.stringify(current)) as unknown[];
    }
    const baseline = transactionBaselineRef.current;
    void deriveTransactionSyncDiagnostics(baseline, current, normalizeTransactions(current, state.accounts).transactions).then(diagnostics => {
      if (!cancelled) setTransactionSyncDiagnostics(diagnostics);
    });
    return () => { cancelled = true; };
  }, [state.accounts, state.transactions, syncBaselineDiagnostics.baselineAvailable, syncBaselineDiagnostics.dirty]);
  const syncStatusText = /^[⏳❌]/.test(syncMeta.status) ? syncMeta.status : !syncBaselineDiagnostics.baselineAvailable ? missingBaselineStatus(state) : syncBaselineDiagnostics.dirty ? localDirtyStatus(state) : syncMeta.status || cleanSyncStatus();
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [marketSnapshot, setMarketSnapshot] = useState<MarketSnapshot>(() => buildUnavailableMarketSnapshot());
  const [isRefreshingMarket, setIsRefreshingMarket] = useState(false);
  const marketRefreshInFlightRef = useRef(false);
  const [marketRefreshStatus, setMarketRefreshStatus] = useState('');
  const refreshMarketData = async (manual = false) => {
    if (marketRefreshInFlightRef.current) return;
    marketRefreshInFlightRef.current = true;
    setIsRefreshingMarket(true);
    try {
      const next = await fetchMarketSnapshot(marketWorkerUrl, { manual });
      const merged = mergeMarketSnapshot(marketSnapshot, next);
      const visibleMerged = visibleMarketSnapshot(merged.snapshot);
      const visibleUpdated = merged.updatedGroups.filter(isMarketSectionEnabled);
      const visibleReused = merged.reusedGroups.filter(isMarketSectionEnabled);
      const outcome = merged.incomplete && visibleReused.length ? (marketSnapshot.fetchedAt ? 'partial' : 'failed') : marketRefreshOutcome(marketContentSignature(visibleMarketSnapshot(marketSnapshot)), visibleMerged);
      const detail = [visibleUpdated.length ? `本次受管理：${visibleUpdated.map(marketGroupLabel).join('、')}` : '', visibleReused.length ? `沿用前次：${visibleReused.map(marketGroupLabel).join('、')}` : ''].filter(Boolean).join('；');
      if (manual) setMarketRefreshStatus(marketRefreshMessage(outcome, visibleMerged.fetchedAt, formatMarketTime, detail));
      setMarketSnapshot(current => outcome === 'failed' && current.fetchedAt ? current : merged.snapshot);
    } finally { marketRefreshInFlightRef.current = false; setIsRefreshingMarket(false); }
  };
  useEffect(() => { void refreshMarketData(); }, [marketWorkerUrl]);
  const [isHomeSyncing, setIsHomeSyncing] = useState<'upload' | 'download' | null>(null);
  const updateRemoteMeta = (value: RemoteMeta | null) => setState(current => ({ ...current, remoteMeta: value }));
  const [accountWarning, setAccountWarning] = useState('');
  const [loadedAt] = useState(now());
  const [lastSavedAt, setLastSavedAt] = useState(state.syncMeta.lastLocalSaveAt || now());
  useEffect(() => {
    if (!PREVIEW_ARCHIVED_FIXTURE_SYMBOL || !['archived', 'clear'].includes(previewFixtureMode || '')) return;
    setState(current => {
      const holdings = safeHoldings(current.holdings);
      if (previewFixtureMode === 'clear') return { ...current, holdings: holdings.filter(holding => !(holding.isPreviewFixture && normalizeSymbol(holding.symbol) === PREVIEW_ARCHIVED_FIXTURE_SYMBOL)) };
      if (holdings.some(holding => holding.isPreviewFixture && normalizeSymbol(holding.symbol) === PREVIEW_ARCHIVED_FIXTURE_SYMBOL)) return current;
      return { ...current, holdings: [...holdings, { symbol: PREVIEW_ARCHIVED_FIXTURE_SYMBOL, name: 'Preview 測試資產', shares: 0, avgCost: 0, targetWeight: 0, assetClass: 'growth', isArchived: true, isPreviewFixture: true }] };
    });
  }, [previewFixtureMode]);
  const historicalDividendFixtureActive = Boolean(PREVIEW_HISTORICAL_DIVIDEND_FIXTURE && previewFixtureMode === 'historical-dividend');
  const historicalDividendFixture = useMemo<FinancialTransaction | null>(() => {
    if (!historicalDividendFixtureActive || !PREVIEW_HISTORICAL_DIVIDEND_FIXTURE) return null;
    const account = state.accounts.find(item => item.isActive) || state.accounts[0];
    return { id: PREVIEW_HISTORICAL_DIVIDEND_FIXTURE.id, accountId: account?.id || 'preview-historical-fixture-account', type: 'income', status: 'posted', source: 'manual', amount: 895, currency: account?.currency || 'TWD', categoryId: 'income-dividend', description: '', merchant: '', note: 'Preview historical dividend fixture', occurredAt: PREVIEW_HISTORICAL_DIVIDEND_FIXTURE.occurredAt, fingerprint: '', excluded: false, createdAt: PREVIEW_HISTORICAL_DIVIDEND_FIXTURE.occurredAt, updatedAt: PREVIEW_HISTORICAL_DIVIDEND_FIXTURE.occurredAt, assetSymbol: PREVIEW_HISTORICAL_DIVIDEND_FIXTURE.symbol, assetName: PREVIEW_HISTORICAL_DIVIDEND_FIXTURE.name };
  }, [historicalDividendFixtureActive, state.accounts]);
  const dividendCenterHoldings = useMemo(() => !historicalDividendFixture ? state.holdings : state.holdings.filter(holding => normalizeSymbol(holding.symbol) !== historicalDividendFixture.assetSymbol), [historicalDividendFixture, state.holdings]);
  const dividendCenterTransactions = useMemo(() => !historicalDividendFixture ? state.transactions : [...state.transactions.filter(transaction => normalizeSymbol(transaction.assetSymbol || '') !== historicalDividendFixture.assetSymbol), historicalDividendFixture], [historicalDividendFixture, state.transactions]);
  const [quoteStatus, setQuoteStatus] = useState('尚未更新股價');
  const [newSymbolDraft, setNewSymbolDraft] = useState('');
  const [assetMessage, setAssetMessage] = useState('');
  const [editingHoldingSymbol, setEditingHoldingSymbol] = useState<SymbolCode | null>(null);
  const [debugCopyStatus, setDebugCopyStatus] = useState('複製除錯資訊');
  const [debugInfoText, setDebugInfoText] = useState('');
  const [startupWarning, setStartupWarning] = useState<StartupIssue | null>(() => startupIssue);
  useEffect(() => { writeUiState(uiState); }, [uiState]);
  useEffect(() => { document.documentElement.dataset.displayMode = uiState.displayMode; }, [uiState.displayMode]);
  const defaultSectionsForMode = uiState.displayMode === 'full' ? FULL_UI_SECTIONS : DEFAULT_UI_STATE.sections;
  const sectionOpen = (key: SectionKey) => uiState.sections[key] ?? Boolean(defaultSectionsForMode[key]);
  const analyticsSectionOpen = (key: 'dipAnalysis' | 'analyticsDetails') => uiState.sections[key] ?? Boolean(defaultSectionsForMode[key]);
  const toggleSection = (key: SectionKey) => setUiState(current => {
    const defaults = current.displayMode === 'full' ? FULL_UI_SECTIONS : DEFAULT_UI_STATE.sections;
    return { ...current, sections: { ...current.sections, [key]: !(current.sections[key] ?? defaults[key]) } };
  });
  useEffect(() => {
    if (!isTransactionImportTarget) return;
    document.getElementById('transactions-section')?.scrollIntoView({ block: 'start' });
  }, [isTransactionImportTarget]);
  const applyDisplayMode = (displayMode: MobileDisplayMode) => setUiState({
    displayMode,
    sections: displayMode === 'full' ? FULL_UI_SECTIONS : DEFAULT_UI_STATE.sections
  });
  const updateSyncMeta = (updater: SyncMeta | ((value: SyncMeta) => SyncMeta)) => setState(current => {
    const next = sanitizeSyncMeta(typeof updater === 'function' ? (updater as (value: SyncMeta) => SyncMeta)(current.syncMeta) : updater, current);
    return { ...current, syncMeta: next };
  });
  useEffect(() => {
    if (stateRef.current !== state) return;
    writeState(state);
    didMount.current = true;
    isApplyingRemoteRef.current = false;
  }, [state]);
  const quoteRefreshControllerRef = useRef<ReturnType<typeof createQuoteRefreshController<Holding, SymbolCode, Quote>> | null>(null);
  if (!quoteRefreshControllerRef.current) {
    quoteRefreshControllerRef.current = createQuoteRefreshController({
      endpoint: DEFAULT_WORKER_URL,
      getSnapshot: () => {
        const currentState = stateRef.current;
        return { holdings: safeHoldings(currentState.holdings), symbols: uniqueSymbols(currentState) };
      },
      findHolding: (holdings, symbol) => holdings.find(holding => normalizeSymbol(holding.symbol) === symbol),
      requestQuote: fetchQuote,
      setQuotes: updater => setQuotes(current => updater(current)),
      setHasUpdatedQuotes,
      setStatus: setQuoteStatus,
      setIsRefreshing: setIsRefreshingQuotes,
      formatRefreshTime: () => tw(now()),
      applyNameAutofill: (entries, currentHoldings) => {
        const bySymbol = Object.fromEntries(entries.map(([symbol, quote]) => [symbol, quote])) as Record<SymbolCode, Quote>;
        const hasNameChange = currentHoldings.some(holding => {
          const symbol = normalizeSymbol(holding.symbol);
          const quote = bySymbol[symbol];
          const canAutofillName = !holding.name?.trim() || holding.name === SYMBOL_NAMES[symbol];
          const name = canAutofillName && quote && !quote.error ? resolveSymbolName(symbol, quote.name, holding.name) : holding.name;
          return Boolean(name && name !== holding.name);
        });
        if (hasNameChange) setState(current => ({ ...current, holdings: safeHoldings(current.holdings).map(holding => {
          const symbol = normalizeSymbol(holding.symbol);
          const quote = bySymbol[symbol];
          const canAutofillName = !holding.name?.trim() || holding.name === SYMBOL_NAMES[symbol];
          const name = canAutofillName && quote && !quote.error ? resolveSymbolName(symbol, quote.name, holding.name) : holding.name;
          return name && name !== holding.name ? { ...holding, name } : holding;
        }) }));
      },
    });
  }
  const refreshQuotes = (manual = false) => quoteRefreshControllerRef.current?.refresh(manual);
  const assetsPullRefreshRef = useRef<ReturnType<typeof createAssetsPullToRefresh> | null>(null);
  if (!assetsPullRefreshRef.current) assetsPullRefreshRef.current = createAssetsPullToRefresh({ threshold: 72, onRefresh: () => { void refreshQuotes(true); } });
  const flushDrafts = async () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    await waitForDraftCommit();
    validateBeforeUpload(stateRef.current);
    const normalized = normalizeState({
      ...stateRef.current,
      netWorthHistory: upsertNetWorthSnapshot(stateRef.current.netWorthHistory, currentNetWorthSnapshot)
    });
    stateRef.current = normalized;
    writeState(normalized);
    const savedAt = now();
    setLastSavedAt(savedAt);
    updateSyncMeta(current => ({ ...current, lastLocalSaveAt: savedAt }));
    return normalized;
  };
  const uploadCloud = async () => { 
    if (!hasUpdatedQuotes || isRefreshingQuotes) throw new Error('請等待本次股價更新完成後再上傳雲端');
    updateSyncMeta(current => ({ ...current, status: '⏳ 雲端上傳中，正在寫入 Firebase...' })); 
    const normalized = await flushDrafts(); 
    const requestSnapshot = createSyncPayloadSnapshot(normalized);
    const uploadedSnapshot = await uploadFirebase(normalized.firebase, requestSnapshot);
    transactionBaselineRef.current = Array.isArray(uploadedSnapshot.payload.transactions) ? JSON.parse(JSON.stringify(uploadedSnapshot.payload.transactions)) as unknown[] : [];
    const syncedAt = now(); 
    setLastSavedAt(syncedAt); 
    setState(current => {
      const outcome = deriveSuccessfulUploadResult(current, uploadedSnapshot);
      const changedFields = outcome.changedFields.length ? `｜差異欄位 ${outcome.changedFields.join('、')}` : '';
      return {
        ...current,
        syncMeta: sanitizeSyncMeta({
          ...current.syncMeta,
          source: '本機資料',
          baselineFingerprint: uploadedSnapshot.fingerprint,
          baselineFieldFingerprints: uploadedSnapshot.fieldFingerprints,
          baselineCanonicalSchema: uploadedSnapshot.canonicalSchema,
          dirty: outcome.dirty,
          lastUploadAt: syncedAt,
          status: outcome.dirty
            ? `🎉 上傳成功，但上傳期間本機另有未上傳變更${changedFields}｜持股 ${normalized.holdings.length} 筆｜現金 ${normalized.cash.length} 筆｜借款 ${normalized.loans.length} 筆`
            : `🎉 上傳成功！本機與雲端同步資料一致｜持股 ${normalized.holdings.length} 筆｜現金 ${normalized.cash.length} 筆｜借款 ${normalized.loans.length} 筆`
        }, current)
      };
    });
    updateRemoteMeta({
      holdingsCount: normalized.holdings.length,
      cashCount: normalized.cash.length,
      loansCount: normalized.loans.length,
      updatedAt: syncedAt
    });
  };
  const downloadCloud = async () => { 
    if (!window.confirm('下載雲端資料會覆蓋目前本機畫面資料，但不會自動合併。是否繼續？')) return;
    updateSyncMeta(current => ({ ...current, status: '⏳ 雲端下載中，正在讀取 Firebase...' })); 
    const remote = await downloadFirebase(state.firebase); 
    const downloadedAt = now(); 
    const downloadedSnapshot = createSyncPayloadSnapshot(remote);
    transactionBaselineRef.current = Array.isArray(downloadedSnapshot.payload.transactions) ? JSON.parse(JSON.stringify(downloadedSnapshot.payload.transactions)) as unknown[] : [];
    const appliedRemote = normalizeState({
      ...remote,
      syncMeta: {
        ...stateRef.current.syncMeta,
        source: '已從雲端下載',
        baselineFingerprint: downloadedSnapshot.fingerprint,
        baselineFieldFingerprints: downloadedSnapshot.fieldFingerprints,
        baselineCanonicalSchema: downloadedSnapshot.canonicalSchema,
        dirty: false,
        lastDownloadAt: downloadedAt,
        status: `🎉 下載成功！已套用雲端資料並建立同步基準｜持股 ${remote.holdings.length} 筆｜現金 ${remote.cash.length} 筆｜借款 ${remote.loans.length} 筆`
      }
    });
    isApplyingRemoteRef.current = true; 
    setState(appliedRemote);
    writeState(appliedRemote);
    setLastSavedAt(downloadedAt); 
    updateRemoteMeta({
      holdingsCount: remote.holdings.length,
      cashCount: remote.cash.length,
      loansCount: remote.loans.length,
      updatedAt: downloadedAt
    });
  };
  useEffect(() => { refreshQuotes(); }, []);
  const netWorthHistory = useMemo(() => normalizeNetWorthHistory(state.netWorthHistory), [state.netWorthHistory]);
  useEffect(() => {
    if (!hasUpdatedQuotes) return;
    const latest = netWorthHistory.at(-1);
    if (latest && latest.date === currentNetWorthSnapshot.date && latest.totalAssets === currentNetWorthSnapshot.totalAssets && latest.netWorth === currentNetWorthSnapshot.netWorth && latest.investmentValue === currentNetWorthSnapshot.investmentValue && latest.cash === currentNetWorthSnapshot.cash && latest.debt === currentNetWorthSnapshot.debt) return;
    setState(current => ({ ...current, netWorthHistory: upsertNetWorthSnapshot(current.netWorthHistory, currentNetWorthSnapshot) }));
  }, [currentNetWorthSnapshot, hasUpdatedQuotes, netWorthHistory]);
  const performanceAssets = useMemo(() => m.rows.map(row => ({
    symbol: row.symbol,
    name: row.name,
    shares: row.shares,
    avgCost: row.avgCost,
    marketValue: row.marketValue,
    cost: row.cost,
    pnl: row.pnl,
    dayPnl: row.dayPnl ?? 0,
    previousClose: row.quote.previousClose
  })), [m.rows]);
  const rb = useMemo(() => rebalance(state, quotes), [state, quotes]);
  const rebalanceDeviationText = rb.deviationText;
  const quoteSummaryText = quoteDisplayStatus(m.rows);
  const quotePresentation = useMemo(() => m.rows.map(row => ({ symbol: row.symbol, ...describeQuotePresentation(row.quote) })), [m.rows]);
  const orderHelper = useMemo(() => getOrderSuggestions(state, quotes, m), [state, quotes, m]);
  const health = useMemo(() => investmentHealth(m, rb), [m, rb]);
  const riskInput = useMemo(() => ({
    assets: m.rows.map(row => ({ symbol: row.symbol, name: row.name, assetClass: row.assetClass, marketValue: row.marketValue })),
    loans: state.loans.map(loan => ({ ...loan, remainingMonths: loanPeriodSummary(loan).remaining, paidMonths: loanPeriodSummary(loan).paid })),
    cash: m.cash, totalAssets: m.totalAssets, growthRatio: m.totalAssets ? m.growth / m.totalAssets * 100 : 0, defensiveRatio: m.defensiveRatio,
    growthTargetPct: m.growthTargetPct, allocationDeviation: rb.deviation, rebalanceThreshold: rb.threshold, thresholdReached: rb.thresholdReached
  }), [m, rb, state.loans]);
  const riskMetrics = useMemo(() => deriveRiskMetrics(riskInput), [riskInput]);
  const investmentStats = useMemo(() => deriveInvestmentPerformanceStats(netWorthHistory, 'investmentValue'), [netWorthHistory]);
  const performanceQuality = useMemo(() => deriveInvestmentPerformanceQuality(netWorthHistory), [netWorthHistory]);
  const portfolioRiskView = useMemo(() => derivePortfolioRisk({
    totalAssets: m.totalAssets, investmentValue: m.stocks, growthValue: m.growth, defensiveValue: m.defensiveHoldingsValue, cash: m.cash,
    growthTargetPct: getGrowthTargetTotal(state.holdings), defensiveTargetPct: getDefensiveStockTargetTotal(state.holdings), cashTargetPct: getCashTarget(state.holdings), targetTotalPct: getHoldingTargetTotal(state.holdings),
    allocationDeviation: rb.deviation, rebalanceThreshold: rb.threshold, thresholdReached: rb.thresholdReached,
    risk: riskMetrics, performance: { stats: investmentStats, canCalculateMaxDrawdown: performanceQuality.canCalculateMaxDrawdown, snapshotCount: performanceQuality.snapshotCount },
    quotes: m.rows.map(row => ({ symbol: row.symbol, marketValue: row.marketValue, assetClass: row.assetClass, quote: { quoteDate: row.quote.quoteDate, quoteTime: row.quote.quoteTime, source: row.quote.source, error: row.quote.error } })), rawSymbols: state.holdings.map(holding => holding.symbol)
  }), [m, state.holdings, rb, riskMetrics, investmentStats, performanceQuality]);
  const rebalanceRecommendationView = useMemo(() => deriveRebalanceRecommendation({
    totalAssets: m.totalAssets, liquidCash: m.cash, buyOnlyBudget: state.buyOnlyBudget, rebalanceMode: state.rebalanceMode,
    rebalanceThreshold: rb.threshold, allocationDeviation: rb.deviation, targetTotal: getHoldingTargetTotal(state.holdings), cashTargetPct: getCashTarget(state.holdings),
    holdings: m.rows.map(row => ({ symbol: row.symbol, name: row.name, marketValue: row.marketValue, currentWeight: m.totalAssets > 0 ? row.marketValue / m.totalAssets * 100 : 0, targetWeight: getEffectiveTargetPercent(row, state.holdings), assetClass: row.assetClass, price: row.quote.price, quoteStatus: quoteDateStatus(row.quote.quoteDate, row.quote.quoteTime), quoteSource: row.quote.source, quoteError: row.quote.error })),
    duplicateSymbols: portfolioRiskView.quality.duplicateSymbols, otherAssetValue: Math.max(0, m.totalAssets - m.stocks - m.cash),
    allocation: { growth: { currentValue: m.growth, targetWeight: getGrowthTargetTotal(state.holdings) }, defensive: { currentValue: m.defensiveHoldingsValue, targetWeight: getDefensiveStockTargetTotal(state.holdings) }, cash: { currentValue: m.cash } }
  }), [m, state.buyOnlyBudget, state.rebalanceMode, state.holdings, rb, portfolioRiskView]);
  const recommendationModels = useMemo(() => createRecommendationModels({ rebalance: rebalanceRecommendationView, portfolioRisk: portfolioRiskView }), [rebalanceRecommendationView, portfolioRiskView]);
  const clecStrategyCenterView = useMemo(() => deriveClecStrategyCenter({
    allocation: { preset: state.allocationPreset, holdings: state.holdings.map(holding => ({ symbol: holding.symbol, name: holding.name || holding.symbol, targetWeight: getEffectiveTargetPercent(holding, state.holdings) })), roleBySymbol: state.allocationRoleBySymbol },
    rebalanceMode: state.rebalanceMode,
    dataQuality: { passed: rebalanceRecommendationView.canRecommend, blockingReasons: rebalanceRecommendationView.blockingReasons, warnings: rebalanceRecommendationView.canRecommend ? ['最近有效交易日可顯示；備援、過期或日期不明報價會停止具體金額建議。'] : [] },
    trigger: { thresholdReached: rebalanceRecommendationView.thresholdReached, allocationDeviation: rebalanceRecommendationView.allocationDeviation, rebalanceThreshold: rb.threshold }
  }), [state.allocationPreset, state.allocationRoleBySymbol, state.holdings, state.rebalanceMode, rebalanceRecommendationView, rb.threshold]);
  const clecStrategyRuleView = useMemo(() => deriveClecStrategyRule(buildClecStrategyRuleInput({
    allocationPresetId: state.allocationPreset,
    rebalanceMode: state.rebalanceMode,
    asOfDate: localSnapshotDate(),
    portfolioValue: m.totalAssets > 0 ? m.totalAssets : null,
    holdings: m.rows.map(row => ({
      symbol: row.symbol,
      currentWeight: m.totalAssets > 0 ? row.marketValue / m.totalAssets * 100 : null,
      targetWeight: getEffectiveTargetPercent(row, state.holdings),
      quoteFreshness: ['unknown', 'unavailable'].includes(quoteDateStatus(row.quote.quoteDate, row.quote.quoteTime)) ? 'missing' : quoteDateStatus(row.quote.quoteDate, row.quote.quoteTime) === 'stale' ? 'stale' : 'fresh'
    })),
    availableCash: Number.isFinite(m.cash) ? m.cash : null,
    debtBalance: Number.isFinite(m.debt) ? m.debt : null,
    leverageExposure: Number.isFinite(m.leverage) ? m.leverage : null,
    threshold: { drift: rb.threshold, minCashReserve: null, maxDebt: null, maxLeverageExposure: null },
    dataQualityFlags: rebalanceRecommendationView.blockingReasons
  })), [state.allocationPreset, state.rebalanceMode, state.holdings, m, rb.threshold, rebalanceRecommendationView.blockingReasons]);
  const rebalanceExecutionEligibility = useMemo(() => deriveRebalanceExecutionEligibility({ clecRuleOutput: clecStrategyRuleView, recommendation: rebalanceRecommendationView }), [clecStrategyRuleView, rebalanceRecommendationView]);
  const wealthProjection = useMemo(() => deriveWealthGoalProjection(m.netWorth, state.wealthGoal), [m.netWorth, state.wealthGoal]);
  const cashFlowSummary = useMemo(() => state.cashFlowProfile ? deriveCashFlow(state.cashFlowProfile, m.cash) : null, [state.cashFlowProfile, m.cash]);
  const historySummary = useMemo(() => deriveHistoryStats(netWorthHistory), [netWorthHistory]);
  const dipAlertRows = useMemo<DipAlertRow[]>(() => m.rows.map(row => {
    const symbol = normalizeSymbol(row.symbol);
    const setting = normalizeDipAlertSetting(state.dipAlerts?.[symbol] ?? defaultDipAlertSetting());
    const price = Math.max(0, safeNumber((quotes[symbol] || row.quote)?.price));
    const referencePrice = Math.max(0, safeNumber(setting.referencePrice));
    const drawdownPct = price > 0 && referencePrice > 0 ? (price - referencePrice) / referencePrice * 100 : null;
    const triggered = Boolean(setting.enabled && drawdownPct !== null && drawdownPct <= setting.thresholdPct);
    const status = !setting.enabled ? '未啟用' : drawdownPct === null ? '尚未設定有效波段最高價' : triggered ? '已達逢低加碼觀察條件，可列入加碼觀察' : '尚未觸發';
    return { symbol, name: row.quote.name || SYMBOL_NAMES[symbol] || symbol, price, setting, drawdownPct, triggered, status };
  }), [m.rows, quotes, state.dipAlerts]);
  const decisionSummary = useMemo(() => getDecisionSummary(rb, orderHelper, dipAlertRows), [rb, orderHelper, dipAlertRows]);
  const tradeSteps = useMemo(() => getTradePlan(orderHelper), [orderHelper]);
  const currentWeights = useMemo(() => Object.fromEntries(m.rows.map(row => [row.symbol, m.totalAssets > 0 ? num(row.marketValue) / num(m.totalAssets) * 100 : 0])), [m.rows, m.totalAssets]);
  const todayDecision = useMemo(() => {
    const dipTriggered = decisionSummary.triggeredDipAlerts.length > 0;
    const lowCashSafety = m.monthlyPayment > 0 && m.repaymentSafetyMonths < 3;
    const defensiveUnder = orderHelper.defensiveReminder.status === 'under';
    const conclusion = !m.totalAssets ? '資料不足，暫時無法產生建議'
      : lowCashSafety ? '現金安全存量不足'
      : rb.thresholdReached ? '已達再平衡門檻'
      : dipTriggered ? '建議分批加碼觀察'
      : defensiveUnder ? '防守資產不足'
      : orderHelper.totalBuyAmount > 0 ? '建議分批加碼'
      : '維持持有，暫不需要操作';
    return { conclusion, dipTriggered, lowCashSafety };
  }, [decisionSummary.triggeredDipAlerts.length, m.totalAssets, m.monthlyPayment, m.repaymentSafetyMonths, rb.thresholdReached, orderHelper.defensiveReminder.status, orderHelper.totalBuyAmount]);
  const targetWarning = isTargetOverLimit(state) ? '持股目標比例合計已超過 100%，請調整配置' : '';
  const homeDecision = useMemo(() => deriveHomeDecision({ riskLevel:riskMetrics.overallLevel, cashUnsafe:riskMetrics.cashSafetyMonths !== null && riskMetrics.cashSafetyMonths < 6, rebalance:rb.thresholdReached, dip:decisionSummary.triggeredDipAlerts.length>0, wealthBehind:state.wealthGoal.targetYear !== undefined && wealthProjection.targetYearValue !== null && wealthProjection.targetYearValue < state.wealthGoal.targetAmount, quotesMissing:quoteSummaryText !== '報價正常', targetInvalid:Boolean(targetWarning) }), [riskMetrics,rb.thresholdReached,decisionSummary.triggeredDipAlerts.length,state.wealthGoal,wealthProjection,quoteSummaryText,targetWarning]);
  const targetCheck = useMemo(() => {
    const growthTotal = growthTargetTotalOf(state);
    const defensiveStockTotal = getDefensiveStockTargetTotal(state.holdings);
    const cashTarget = getCashTarget(state.holdings);
    const total = getHoldingTargetTotal(state.holdings);
    return { growthTotal, defensiveStockTotal, cashTarget, total, status: total > 100 ? '持股目標比例超過 100%，請調低比例' : total < 100 ? '未分配比例由現金承擔' : '正常' };
  }, [state]);
  const targetCheckHasError = targetCheck.total > 100;
  const targetCheckSummary = targetCheckHasError ? '目標比例設定錯誤' : `比例合計 ${pct(targetCheck.total)}，檢查正常`;
  useEffect(() => {
    if (!targetCheckHasError) return;
    setUiState(current => current.sections.targetCheck ? current : { ...current, sections: { ...current.sections, targetCheck: true } });
  }, [targetCheckHasError, uiState.displayMode]);
  const latestQuoteTime = useMemo(() => {
    const times = Object.values(quotes).map(q => new Date(q.updatedAt).getTime()).filter(Number.isFinite);
    return times.length ? new Date(Math.max(...times)).toISOString() : '';
  }, [quotes]);
    const investmentDashboard = useMemo(() => deriveInvestmentDashboard({
    totalAssets: m.totalAssets, investmentValue: m.stocks, dayPnl: m.dayPnl, todayPnlAvailable: m.todayPnlAvailable,
    monthChange: historySummary.monthChange, yearChange: historySummary.yearChange,
    growthRatio: rb.stockRow.currentWeight, defensiveRatio: m.defensiveRatio, cashRatio: m.cashRatio,
    allocationDeviation: rb.deviation, rebalanceThreshold: rb.threshold, thresholdReached: rb.thresholdReached,
    decision: homeDecision.primary, quoteStatus: quoteSummaryText, lastQuoteAt: latestQuoteTime, hasUpdatedQuotes,
    syncDirty: syncMeta.dirty, syncStatus: syncStatusText, targetInvalid: Boolean(targetWarning), holdingsCount: m.rows.filter(row => row.shares > 0).length
    }), [m, historySummary, rb, homeDecision.primary, quoteSummaryText, latestQuoteTime, hasUpdatedQuotes, syncMeta, syncStatusText, targetWarning]);
  const aiDecisionItems = useMemo(() => {
      const quoteRows = m.rows.map(row => row.quote);
      return deriveAiDecisions({
        today: localSnapshotDate(), dashboard: { investmentValue: m.stocks, dayPnl: investmentDashboard.dayPnl, dayPnlRate: investmentDashboard.dayPnlRate, cashRatio: investmentDashboard.cashRatio, quoteStatus: quoteSummaryText, holdingsCount: m.rows.filter(row => row.shares > 0).length },
        risk: riskMetrics, performance: { stats: investmentStats, canCalculateMaxDrawdown: performanceQuality.canCalculateMaxDrawdown, snapshotCount: performanceQuality.snapshotCount },
        dividend: { summary: dividendSummary(state.transactions), sources: dividendSources(state.transactions) }, market: marketSnapshot,
        quoteStatuses: quoteRows.map(quote => quoteDateStatus(quote.quoteDate, quote.quoteTime)), quoteErrors: quoteRows.filter(quote => Boolean(quote.error)).length, backupQuoteCount: quoteRows.filter(quote => isBackupQuoteSource(quote.source)).length,
        targetOverLimit: Boolean(targetWarning), holdingMarketValue: m.rows.reduce((sum, row) => sum + (Number.isFinite(row.marketValue) ? Math.max(0, row.marketValue) : 0), 0)
      });
  }, [m, investmentDashboard, quoteSummaryText, riskMetrics, state.transactions, marketSnapshot, targetWarning, investmentStats, performanceQuality]);
  const investmentIntelligence = useMemo(() => deriveInvestmentIntelligence(adaptInvestmentIntelligenceInput({
    dashboard: { dayPnl: investmentDashboard.dayPnl, dayPnlRate: investmentDashboard.dayPnlRate, quoteStatus: quoteSummaryText, holdingsCount: m.rows.filter(row => row.shares > 0).length },
    sync: { dirty: syncMeta.dirty, status: syncStatusText },
    risk: riskMetrics,
    portfolioRisk: portfolioRiskView,
    rebalance: rebalanceRecommendationView,
    market: { freshness: deriveMarketFreshness(marketSnapshot, localSnapshotDate()), availableCount: marketSnapshot.items.filter(item => item.status !== 'unavailable' && item.status !== 'failed').length },
    performance: { canCalculateMaxDrawdown: performanceQuality.canCalculateMaxDrawdown, snapshotCount: performanceQuality.snapshotCount, maxDrawdown: investmentStats.maxDrawdown },
    dividend: dividendSummary(state.transactions), aiDecisions: aiDecisionItems
  })), [investmentDashboard, quoteSummaryText, m.rows, syncMeta.dirty, syncStatusText, riskMetrics, portfolioRiskView, rebalanceRecommendationView, marketSnapshot, performanceQuality, investmentStats, state.transactions, aiDecisionItems]);
  const dailyDecisionWorkflow = useMemo(() => deriveDailyDecisionWorkflow(investmentIntelligence), [investmentIntelligence]);
  const investmentOpportunities = useMemo(() => deriveInvestmentOpportunities(dailyDecisionWorkflow), [dailyDecisionWorkflow]);
  const investmentActionCenter = useMemo(() => deriveInvestmentActionCenter(dailyDecisionWorkflow, investmentOpportunities), [dailyDecisionWorkflow, investmentOpportunities]);
  const investmentActionExplanations = useMemo(() => deriveInvestmentActionExplanations(investmentActionCenter), [investmentActionCenter]);
  const marketRuntime = describeMarketRuntime(marketWorkerUrl, marketSnapshot.cacheControl);
  const quoteProvenance = quoteProvenanceText(m.rows.map(row => row.quote));
  const syncFieldFingerprintText = (fingerprints?: Record<string, string>) => fingerprints
    ? Object.entries(fingerprints).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${shortSyncFingerprint(value)}`).join(' / ')
    : 'unavailable (legacy baseline)';
  const currentSyncFieldFingerprints = syncFieldFingerprintText(syncBaselineDiagnostics.currentFieldFingerprints);
  const baselineSyncFieldFingerprints = syncFieldFingerprintText(syncBaselineDiagnostics.baselineFieldFingerprints);
  const changedSyncFields = syncBaselineDiagnostics.changedFields.length ? syncBaselineDiagnostics.changedFields.join('、') : syncBaselineDiagnostics.dirty ? 'unavailable (legacy baseline)' : 'none';
  const transactionIdentityText = transactionSyncDiagnostics.identityHashes.length ? transactionSyncDiagnostics.identityHashes.join(' / ') : 'none';
  const transactionStructureText = transactionSyncDiagnostics.structuralFingerprints.length ? transactionSyncDiagnostics.structuralFingerprints.join(' / ') : 'none';
  const changedTransactionIndexes = transactionSyncDiagnostics.baselineAvailable ? (transactionSyncDiagnostics.changedIndexes.length ? transactionSyncDiagnostics.changedIndexes.join('、') : 'none') : 'unavailable';
  const changedTransactionFields = transactionSyncDiagnostics.baselineAvailable ? (transactionSyncDiagnostics.changedFieldNames.length ? transactionSyncDiagnostics.changedFieldNames.join('、') : 'none') : 'unavailable';
  const generateDebugInfo = () => [
    'family-universal-rebalance debug info',
    `Version: ${APP_VERSION}`,
    `BuildTime: ${APP_BUILD_TIME}`,
    `GitCommit: ${APP_GIT_COMMIT}`,
    `URL: ${typeof location !== 'undefined' ? location.href : ''}`,
    `UserAgent: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
    `StorageKey: ${STORAGE_KEY}`,
    `FirebaseConfigured: ${state.firebase.databaseURL.trim() ? 'true' : 'false'}`,
    `WorkerURL: ${DEFAULT_WORKER_URL}`,
    `MarketWorkerURL: ${marketRuntime.endpoint}`,
    `MarketCacheControl: ${marketRuntime.cache}`,
    `MarketSnapshot: ${marketSnapshot.status} / ${marketSnapshot.fetchedAt || '尚未取得'}`,
    `QuoteRequestCache: no-store`,
    `SyncDirty: ${syncMeta.dirty ? 'true' : 'false'}`,
    `SyncSource: ${syncMeta.source}`,
    `SyncBaseline: ${syncBaselineDiagnostics.baselineAvailable ? 'available' : 'unavailable'}`,
    `CurrentFingerprint: ${shortSyncFingerprint(syncBaselineDiagnostics.currentFingerprint)}`,
    `BaselineFingerprint: ${shortSyncFingerprint(syncBaselineDiagnostics.baselineFingerprint)}`,
    `DirtyReason: ${syncBaselineDiagnostics.reason}`,
    `CanonicalSchema: ${syncBaselineDiagnostics.canonicalSchema}`,
    `ChangedTopLevelFields: ${changedSyncFields}`,
    `CurrentTopLevelFingerprints: ${currentSyncFieldFingerprints}`,
    `BaselineTopLevelFingerprints: ${baselineSyncFieldFingerprints}`,
    `TransactionCount: ${transactionSyncDiagnostics.transactionCount}`,
    `NormalizedTransactionCount: ${transactionSyncDiagnostics.normalizedTransactionCount}`,
    `TransactionOrderFingerprint: ${transactionSyncDiagnostics.orderFingerprint}`,
    `TransactionIdentityHashes: ${transactionIdentityText}`,
    `TransactionStructuralFingerprints: ${transactionStructureText}`,
    `ChangedTransactionIndexes: ${changedTransactionIndexes}`,
    `ChangedTransactionFields: ${changedTransactionFields}`,
    `TransactionAddedRemovedReordered: ${transactionSyncDiagnostics.addedCount}/${transactionSyncDiagnostics.removedCount}/${transactionSyncDiagnostics.reorderedCount}`,
    `HoldingsCount: ${safeHoldings(state.holdings).length}`,
    `CashAccountsCount: ${state.cash.length}`,
    `DipAlertSettingsCount: ${Object.values(state.dipAlerts || {}).filter(setting => setting.enabled).length}`,
    `GrowthTargetTotal: ${pct(targetCheck.growthTotal)}`,
    `DefensiveStockTargetTotal: ${pct(targetCheck.defensiveStockTotal)}`,
    `CashTarget: ${pct(targetCheck.cashTarget)}`,
    `LastPriceUpdate: ${latestQuoteTime ? tw(latestQuoteTime) : '尚未更新'}`,
    `LastLocalSave: ${syncMeta.lastLocalSaveAt ? tw(syncMeta.lastLocalSaveAt) : tw(lastSavedAt)}`,
    `LastCloudUpload: ${syncMeta.lastUploadAt ? tw(syncMeta.lastUploadAt) : '尚未執行'}`,
    `LastCloudDownload: ${syncMeta.lastDownloadAt ? tw(syncMeta.lastDownloadAt) : '尚未執行'}`,
    `LastBackupExport: ${syncMeta.lastBackupExportAt ? tw(syncMeta.lastBackupExportAt) : '尚未執行'}`,
    `LastBackupImport: ${syncMeta.lastBackupImportAt ? tw(syncMeta.lastBackupImportAt) : '尚未執行'}`,
    `TotalAssets: ${money(m.totalAssets)}`,
    `GrowthCurrentRatio: ${pct(rb.stockRow.currentWeight)}`,
    `GrowthTargetPercent: ${pct(rb.growthTargetPercent)}`,
    `RebalanceDeviation: ${rebalanceDeviationText}`,
    `DefensiveCurrentRatio: ${pct(rb.defensiveRow.currentWeight)}`,
    `QuoteStatus: ${quoteStatus}`,
    `HoldingNames: ${m.rows.map(row => `${row.symbol}:${row.quote.name}`).join(' / ')}`,
    `QuoteSources: ${m.rows.map(row => `${row.symbol}=${row.quote.source}${row.quote.error ? ` (${row.quote.error})` : ''}`).join(' / ')}`,
    'QuoteProvenance:',
    ...quoteProvenance.map(value => `  ${value}`)
  ].join('\n');
  const copyDebugInfo = async () => {
    const text = generateDebugInfo();
    setDebugInfoText(text);
    try {
      await copyTextWithFallback(text);
      setDebugCopyStatus('已複製除錯資訊');
      setTimeout(() => setDebugCopyStatus('複製除錯資訊'), 2500);
    } catch {
      setDebugCopyStatus('複製失敗，請手動截圖或回報');
    }
  };

  const [copyStatus, setCopyStatus] = useState('📋 複製摘要');
  const generateRebalanceSummaryText = () => {
    const quoteTime = latestQuoteTime;
    const timeStr = hasUpdatedQuotes && quoteTime ? twShortTime(quoteTime) : '尚未更新';
    
    const targetGrowth = growthTargetOf(state);
    const targetDefensive = defensiveTargetOf(state);
    
    const currentGrowth = rb.stockRow.currentWeight;
    const currentDefensive = rb.defensiveRow.currentWeight;
    
    const deviation = rb.deviation;
    const threshold = rb.threshold;
    const status = rb.thresholdReached ? '已達提醒門檻' : '尚未達門檻，維持目前配置';
    
    let text = `📊 ${APP_NAME} 再平衡與加碼建議\n`;
    text += `⏰ 時間：${timeStr}\n\n`;
    
    text += `【策略目標】 成長資產：${targetGrowth.toFixed(2)}%  │  防守資產：${targetDefensive.toFixed(2)}%\n`;
    text += `【目前配置】 成長資產：${currentGrowth.toFixed(2)}%  │  防守資產：${currentDefensive.toFixed(2)}%\n\n`;
    
    text += `【偏離狀態】 目前偏離：${rebalanceDeviationText} (門檻 ${threshold.toFixed(2)}%)\n`;
    text += `【目前狀態】 ${status}\n\n`;
    
    text += `【再平衡建議】\n`;
    text += `  - 成長資產：${rb.stockAction}\n`;
    text += `  - 防守資產：${rb.defensiveAction}\n`;
    
    rb.defensiveDetails.forEach(item => {
      if (item.symbol !== '現金' && item.symbol !== '防守資產') {
        const paddedSymbol = item.symbol.padEnd(8, ' ');
        text += `  - ${paddedSymbol}：${item.action}\n`;
      }
    });
    
    text += `\n⚠️ 提示：Firebase 雲端備份仍需透過「同步與資料設定」手動操作。`;
    return text;
  };

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    try {
      const text = generateRebalanceSummaryText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyStatus('已複製再平衡與加碼建議');
        setTimeout(() => setCopyStatus('📋 複製摘要'), 2000);
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (err) {
      setCopyStatus('複製失敗，請手動選取文字');
      setTimeout(() => setCopyStatus('📋 複製摘要'), 3000);
    }
  };

  const syncDiagnostics = useMemo(() => {
    if (!state.firebase.databaseURL.trim()) {
      return { status: '未啟用雲端同步', tone: 'hold', reason: '尚未設定 Firebase Database URL。', suggestion: '請至上方輸入 Firebase URL 與金鑰以啟用同步功能。' };
    }
    if (!syncBaselineDiagnostics.baselineAvailable) {
      return { status: '尚未建立同步基準', tone: 'hold', reason: '無法證明目前本機資料已與雲端一致。', suggestion: '請成功上傳或下載一次以建立本機同步基準。' };
    }
    if (!remoteMeta) {
      return { status: '未進行資料比對', tone: 'hold', reason: '本機尚未與雲端資料進行上傳或下載。', suggestion: '請點選「下載雲端」或「上傳雲端」進行第一次比對。' };
    }
    const isCountMatch = 
      safeHoldings(state.holdings).length === remoteMeta.holdingsCount &&
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
  }, [state.firebase.databaseURL, safeHoldings(state.holdings).length, state.cash.length, state.loans.length, remoteMeta, syncMeta.dirty, syncBaselineDiagnostics.baselineAvailable]);
  const [mode, hint, modeTone] = advice(m);
  // All account mutations live here so future Transaction references can be protected at one boundary.
  const createAccount = () => setState(current => ({ ...current, accounts: [...current.accounts, createFinancialAccount({ sortOrder: current.accounts.length ? Math.max(...current.accounts.map(account => account.sortOrder)) + 1 : 0 })] }));
  const updateAccount = (id: string, patch: Partial<FinancialAccount>) => setState(current => ({ ...current, accounts: current.accounts.map(account => account.id === id ? updateFinancialAccount(account, patch) : account) }));
  const deactivateAccount = (id: string) => setState(current => ({ ...current, accounts: current.accounts.map(account => account.id === id ? deactivateFinancialAccount(account) : account) }));
  const restoreAccount = (id: string) => setState(current => ({ ...current, accounts: current.accounts.map(account => account.id === id ? restoreFinancialAccount(account) : account) }));
  const deleteAccount = (id: string) => {
    // TODO(V4.2): replace this boundary with a Transaction/accountId reference query before physical deletion.
    const hasFutureReferences = accountHasTransactions(stateRef.current.transactions, id);
    if (hasFutureReferences) { setAccountWarning('此帳戶已被交易資料引用，無法刪除，請改為停用。'); return; }
    const account = stateRef.current.accounts.find(entry => entry.id === id);
    if (account && window.confirm(`確定要刪除帳戶「${account.name}」嗎？目前尚無交易資料引用，刪除不會影響舊版現金相容資料。`)) setState(current => ({ ...current, accounts: removeFinancialAccount(current.accounts, id) }));
  };
  const createTransaction = (input: Partial<FinancialTransaction>) => setState(current => { const timestamp = now(); const account = current.accounts.find(item => item.id === input.accountId); if (!account || !input.type || !input.status || !input.occurredAt) return current; if (input.type === 'transfer') { try { return { ...current, transactions: [...current.transactions, createTransferTransaction({ accountId: input.accountId || '', transferAccountId: input.transferAccountId, status: input.status, source: 'manual', amount: input.amount || 0, currency: account.currency, description: input.description || '', merchant: input.merchant || '', note: input.note || '', occurredAt: input.occurredAt, excluded: Boolean(input.excluded) }, current.accounts, timestamp)] }; } catch { return current; } } try { const draft: FinancialTransaction = { id: createTransactionId(), accountId: input.accountId || '', type: input.type, status: input.status, source: 'manual', amount: input.amount || 0, currency: account.currency, categoryId: input.categoryId || '', description: input.description || '', merchant: input.merchant || '', note: input.note || '', occurredAt: input.occurredAt, fingerprint: '', excluded: Boolean(input.excluded), createdAt: timestamp, updatedAt: timestamp, ...(input.assetSymbol ? { assetSymbol: input.assetSymbol } : {}), ...(input.assetName ? { assetName: input.assetName } : {}), ...(input.grossAmount !== undefined ? { grossAmount: input.grossAmount } : {}), ...(input.withholdingTax !== undefined ? { withholdingTax: input.withholdingTax } : {}) }; return { ...current, transactions: [...current.transactions, updateTransactionRecord(draft, {}, current.accounts, timestamp)] }; } catch { return current; } });
  const deleteTransaction = (id: string) => setState(current => ({ ...current, transactions: current.transactions.filter(transaction => transaction.id !== id) }));
  const updateTransaction = (id: string, patch: Partial<FinancialTransaction>) => setState(current => { try { return { ...current, transactions: current.transactions.map(transaction => transaction.id === id ? updateTransactionRecord(transaction, patch, current.accounts) : transaction) }; } catch { return current; } });
  const commitImport = (session: ImportSession, imported: FinancialTransaction[]) => setState(current => ({ ...current, transactions: [...current.transactions, ...imported], importSessions: [...current.importSessions, session].slice(-50) }));
  const rollbackImport = (sessionId: string) => setState(current => { const imported = importedBySession(current.transactions, sessionId); if (!imported.length || imported.some(transaction => transaction.updatedAt !== transaction.createdAt)) return current; return { ...current, transactions: current.transactions.filter(transaction => !imported.some(item => item.id === transaction.id)), importSessions: current.importSessions.map(session => session.id === sessionId ? { ...session, status: 'reverted' } : session) }; });
  const updateDipAlert = (symbol: SymbolCode, patch: Partial<DipAlertSetting>) => {
    const normalizedSymbol = normalizeSymbol(symbol);
    setState(s => ({
      ...s,
      dipAlerts: normalizeDipAlerts({
        ...(s.dipAlerts || {}),
        [normalizedSymbol]: normalizeDipAlertSetting({ ...(s.dipAlerts?.[normalizedSymbol] || defaultDipAlertSetting()), ...patch })
      }, s.holdings)
    }));
  };
  const applyAllocationPreset = (preview: ReturnType<typeof deriveAllocationPresetPreview>, roles: AllocationRoleBySymbol) => setState(current => {
    if (!preview.canApply || preview.preset === 'custom') return current;
    if (preview.rows.some(row => row.nextWeight === null)) return current;
    const targetBySymbol = Object.fromEntries(preview.rows.map(row => [row.symbol, row.nextWeight]));
    const holdings = safeHoldings(current.holdings).map(holding => ({ ...holding, targetWeight: targetBySymbol[normalizeSymbol(holding.symbol)] ?? 0 }));
    return { ...current, holdings, allocationPreset: preview.preset, allocationRoleBySymbol: normalizeAllocationRoleBySymbol(roles, holdings) };
  });
  const keepCustomAllocation = () => setState(current => current.allocationPreset === 'custom' ? current : { ...current, allocationPreset: 'custom' });
  const updateHolding = (symbol: SymbolCode, key: keyof Holding, value: number | AssetClass) => setState(s => {
    const holdings = safeHoldings(s.holdings);
    const normalizedSymbol = normalizeSymbol(symbol);
    const exists = holdings.some(h => normalizeSymbol(h.symbol) === normalizedSymbol);
    const nextValue = key === 'assetClass' ? normalizeAssetClass(value, normalizedSymbol) : key === 'targetWeight' ? clampTarget(safeNumber(value)) : Math.max(0, safeNumber(value));
    const defaultHolding = DEFAULT_HOLDINGS.find(h => h.symbol === normalizedSymbol);
    const nextHolding: Holding = { symbol: normalizedSymbol, name: resolveSymbolName(normalizedSymbol, defaultHolding?.name), shares: 0, avgCost: 0, targetWeight: defaultHolding?.targetWeight ?? 0, assetClass: normalizeAssetClass(defaultHolding?.assetClass, normalizedSymbol), [key]: nextValue } as Holding;
    const nextHoldings = exists ? holdings.map(h => normalizeSymbol(h.symbol) === normalizedSymbol ? sanitizeHolding({ ...h, symbol: normalizedSymbol, [key]: nextValue } as Holding) || h : h) : [...holdings, nextHolding];
    return { ...s, holdings: nextHoldings, ...(key === 'targetWeight' ? { allocationPreset: 'custom' as const } : {}) };
  });
  const addHoldingAsset = () => {
    const symbol = normalizeSymbol(newSymbolDraft);
    if (!isTaiwanSymbol(symbol)) {
      setAssetMessage('請輸入合法台股代號，例如 00981A、00670L、00662、00670L.TW 或 00670L.TWO。');
      return;
    }
    if (safeHoldings(state.holdings).some(h => normalizeSymbol(h.symbol) === symbol)) {
      setAssetMessage(`${symbol} 已在持股清單中。`);
      return;
    }
    setState(s => ({ ...s, holdings: [...safeHoldings(s.holdings), { symbol, name: resolveSymbolName(symbol), shares: 0, avgCost: 0, targetWeight: 0, assetClass: 'growth' }] }));
    setNewSymbolDraft('');
    setAssetMessage(`${symbol} 已新增；按「更新股價」會自動查詢 Worker。`);
  };
  const removeHoldingAsset = (symbol: SymbolCode) => {
    const normalizedSymbol = normalizeSymbol(symbol);
    setState(s => { const dipAlerts = { ...(s.dipAlerts || {}) }; const allocationRoleBySymbol = { ...(s.allocationRoleBySymbol || {}) }; delete dipAlerts[normalizedSymbol]; delete allocationRoleBySymbol[normalizedSymbol]; return { ...s, holdings: safeHoldings(s.holdings).map(h => normalizeSymbol(h.symbol) === normalizedSymbol ? { ...h, isArchived: true, targetWeight: 0 } : h), dipAlerts, allocationRoleBySymbol }; });
    setQuotes(current => { const next = { ...current }; delete next[normalizedSymbol]; return next; });
    setEditingHoldingSymbol(current => current === normalizedSymbol ? null : current);
    setAssetMessage(`${normalizedSymbol} 已封存為已清倉資產；不會納入投資計算或股價更新，股息中心仍可選取。`);
  };
  const restoreHoldingAsset = (symbol: SymbolCode) => {
    const normalizedSymbol = normalizeSymbol(symbol);
    setState(s => ({ ...s, holdings: safeHoldings(s.holdings).map(h => normalizeSymbol(h.symbol) === normalizedSymbol ? { ...h, isArchived: false } : h) }));
    setAssetMessage(`${normalizedSymbol} 已恢復為目前持股。`);
  };
  const confirmRemoveHoldingAsset = (symbol: SymbolCode) => {
    const holding = safeHoldings(stateRef.current.holdings).find(item => normalizeSymbol(item.symbol) === normalizeSymbol(symbol));
    if ((holding?.shares || 0) > 0) { setAssetMessage(`${normalizeSymbol(symbol)} 仍有持股，請先將總股數調整為 0 後才能封存。`); return; }
    if (window.confirm(`確定將 ${normalizeSymbol(symbol)} 封存為已清倉資產嗎？股息歷史會保留，且不會再納入投資計算或更新股價。`)) removeHoldingAsset(symbol);
  };
  const metaTime = (iso?: string) => iso ? tw(iso) : '尚未執行';
  const exportBackup = () => {
    const exportedAt = now();
    const payload = { ...backupPayload(stateRef.current, quotes), exportedAt };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-universal-rebalance-backup-${backupStamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    updateSyncMeta(current => ({ ...current, lastBackupExportAt: exportedAt, status: `備份已匯出：${tw(exportedAt)}` }));
  };
  const importBackup = async (f?: File) => {
    if (!f) return;
    if (!window.confirm('匯入備份會覆蓋目前本機資料，但不會自動上傳雲端。是否繼續？')) return;
    try {
      const raw = JSON.parse(await f.text());
      const accountImport = raw && typeof raw === 'object' ? normalizeFinancialAccounts((raw as Partial<BackupPayload>).accounts) : { skipped: [] };
      const importedAt = now();
      const restored = stateFromBackup(raw, stateRef.current);
      const next = normalizeState({
        ...restored,
        syncMeta: {
          ...restored.syncMeta,
          baselineFingerprint: undefined,
          source: '已從備份匯入',
          lastLocalSaveAt: importedAt,
          lastBackupImportAt: importedAt,
          dirty: true,
          status: '已匯入備份；尚未建立此資料的同步基準'
        }
      });
      isApplyingRemoteRef.current = true;
      setState(next);
      writeState(next);
      setLastSavedAt(importedAt);
      const importedQuotes = raw && typeof raw === 'object' && (raw as Partial<BackupPayload>).quotes && typeof (raw as Partial<BackupPayload>).quotes === 'object' ? (raw as Partial<BackupPayload>).quotes as Record<SymbolCode, Quote> : null;
      if (importedQuotes) setQuotes(current => mergeQuoteMap(current, importedQuotes));
      const skippedAccountMessage = accountImport.skipped.length ? `｜略過 ${accountImport.skipped.length} 筆無法恢復的帳戶資料` : '';
      updateSyncMeta(current => ({ ...current, baselineFingerprint: undefined, source: '已從備份匯入', lastLocalSaveAt: importedAt, lastBackupImportAt: importedAt, dirty: true, status: `已匯入備份；尚未建立同步基準${skippedAccountMessage}` }));
    } catch (error) {
      updateSyncMeta(current => ({ ...current, status: error instanceof Error ? error.message : '匯入備份失敗，請確認 JSON 格式。' }));
    }
  };
  const resetState = () => {
    if (!window.confirm('重設會清除目前本機資料並恢復預設資產。此動作不可復原。請確認是否繼續。')) return;
    const resetAt = now();
    setState({ ...defaultState, syncMeta: { ...defaultSyncMeta(), source: '本機資料', baselineFingerprint: undefined, dirty: true, lastLocalSaveAt: resetAt, status: '已重設為預設資產；尚未建立同步基準' } });
    setLastSavedAt(resetAt);
    updateSyncMeta(current => ({ ...current, source: '本機資料', baselineFingerprint: undefined, dirty: true, lastLocalSaveAt: resetAt, status: '已重設為預設資產；尚未建立同步基準' }));
  };
  const exportDamagedLocalData = () => {
    if (!startupWarning?.raw) return;
    downloadTextFile(`family-universal-rebalance-damaged-localStorage-${backupStamp()}.txt`, startupWarning.raw);
  };
  const clearDamagedLocalData = () => {
    if (!window.confirm('這會清除本機 localStorage 資料，但不會刪除雲端資料。是否繼續？')) return;
    localStorage.removeItem(STORAGE_KEY);
    setStartupWarning(null);
    location.reload();
  };
  const runHomeUpload = async () => {
    if (isHomeSyncing) return;
    setIsHomeSyncing('upload');
    try { await uploadCloud(); } catch (error) { updateSyncMeta(current => ({ ...current, source: '本機資料', dirty: true, status: '❌ Firebase 同步失敗：' + (error instanceof Error ? error.message : String(error)) })); } finally { setIsHomeSyncing(null); }
  };
  const runHomeDownload = async () => {
    if (isHomeSyncing) return;
    setIsHomeSyncing('download');
    try { await downloadCloud(); } catch (error) { updateSyncMeta(current => ({ ...current, status: '❌ 下載失敗：' + (error instanceof Error ? error.message : String(error)) })); } finally { setIsHomeSyncing(null); }
  };
  const validPages = ['home', 'assets', 'analytics', 'market', 'tools', 'settings'];
  if (routeLocation.pathname === '/') return <Navigate to="/home" replace />;
    if (!validPages.includes(currentPage) && !isAllocationSimulator && !isRiskCenter && !isWealthGoal && !isCashFlowCenter && !isNetWorthHistory && !isDividendCenter && !isAiDecisionCenter && !isPortfolioRiskCenter && !isRebalanceRecommendationCenter && !isClecStrategyCenter && !isInvestmentActionCenter) return <Navigate to="/home" replace />;
  const DashboardPage = currentPage === 'assets' ? AssetsPage : currentPage === 'analytics' ? AnalyticsPage : HomePage;
  const showOn = (...pages: string[]) => pages.includes(currentPage);
  return (
    <AppLayout>
      {currentPage === 'home' && <header id="overview-section" className="hero">
        <div><p className="eyebrow">{APP_VERSION}</p><h1>{APP_NAME}</h1><h3>{APP_SUBTITLE}</h3><p>即時股價｜動態再平衡｜Firebase 雲端同步</p><p className="build-info">Build time：{APP_BUILD_TIME}</p></div>
        <div className="hero-actions" aria-label="首頁快速操作">
          <button className="hero-refresh" onClick={() => { void refreshQuotes(true); }} disabled={isRefreshingQuotes}><RefreshCw size={16} aria-hidden="true" className={isRefreshingQuotes ? 'is-spinning' : ''} /><span>{isRefreshingQuotes ? '更新中…' : '更新股價'}</span></button>
          <button className="hero-transfer" onClick={runHomeDownload} disabled={Boolean(isHomeSyncing)}><Download size={15} aria-hidden="true" /><span>{isHomeSyncing === 'download' ? '下載中…' : '下載'}</span></button>
          <button className="hero-transfer" onClick={runHomeUpload} disabled={Boolean(isHomeSyncing)}><Upload size={15} aria-hidden="true" /><span>{isHomeSyncing === 'upload' ? '上傳中…' : '上傳'}</span></button>
        </div>
      </header>}
      {startupWarning && <Card title="啟動資料安全檢查">
        <p className="warning-message">localStorage 資料解析失敗，系統已改用安全預設資料，避免整頁空白。請先匯出原始損壞資料後再決定是否重設。</p>
        <p className="note">{startupWarning.message}</p>
        <div className="actions">
          <button onClick={exportDamagedLocalData} disabled={!startupWarning.raw}>匯出原始損壞資料</button>
          <button className="danger" onClick={clearDamagedLocalData}>重設本機資料</button>
          <button className="small" onClick={() => setStartupWarning(null)}>隱藏提示</button>
        </div>
      </Card>}
      {currentPage === 'home' && <DashboardDecisionPage data={{
        total: m.totalAssets, net: m.netWorth, cash: m.cash, debt: m.debt,
        dayPnl: investmentDashboard.dayPnl, dayPnlRate: investmentDashboard.dayPnlRate, monthChange: investmentDashboard.monthChange, yearChange: investmentDashboard.yearChange, lastQuoteAt: investmentDashboard.lastQuoteAt,
        decision: investmentDashboard.decision, growthRatio: investmentDashboard.growthRatio, defensiveRatio: investmentDashboard.defensiveRatio, cashRatio: investmentDashboard.cashRatio,
        allocationDeviation: investmentDashboard.allocationDeviation, rebalanceThreshold: rb.threshold, thresholdReached: rb.thresholdReached,
        riskLabel: riskMetrics.overallLabel, reminders: investmentDashboard.reminders,
        cashSafety: riskMetrics.cashSafetyMonths === null ? '資料不足' : `${riskMetrics.cashSafetyMonths.toFixed(1)} 個月安全存量`,
        cashStatus: riskMetrics.cashSafetyMonths === null ? '資料不足' : m.cash >= riskMetrics.stableCashTarget ? '正常' : m.cash >= riskMetrics.minimumCashTarget ? '留意' : '警告',
        market: marketSnapshot,
        intelligence: investmentIntelligence,
        workflow: dailyDecisionWorkflow,
        opportunities: investmentOpportunities,
      }} />}
      {currentPage === 'market' && <MarketIntelligencePage snapshot={marketSnapshot} isRefreshing={isRefreshingMarket} refreshMessage={marketRefreshStatus} onRefresh={() => { void refreshMarketData(true); }} />}
      {showOn('assets', 'analytics') && <DashboardPage>
        {isMobile && (currentPage === 'assets' || currentPage === 'analytics') && <div className="mobile-mode-switch" aria-label="手機顯示模式">
          <button type="button" className={uiState.displayMode === 'compact' ? 'active' : ''} onClick={() => applyDisplayMode('compact')}>簡潔模式</button>
          <button type="button" className={uiState.displayMode === 'full' ? 'active' : ''} onClick={() => applyDisplayMode('full')}>完整模式</button>
        </div>}
        {currentPage === 'analytics' && <PerformanceAnalyticsPage assets={performanceAssets} history={netWorthHistory} view={analyticsView} onViewChange={setAnalyticsView} />}
        {currentPage === 'analytics' && analyticsView === 'risk' && <Card className="page-card for-analytics analytics-summary-card" title="分析摘要"><AnalyticsSummary rb={rb} orderHelper={orderHelper} dipStatus={decisionSummary.dipStatus} /></Card>}
        <SectionCard className="page-card for-home" id="overview-card" title="資產總覽" isMobile={isMobile} collapsible open={sectionOpen('overview')} onToggle={() => toggleSection('overview')} summary={`總資產 ${money(m.totalAssets)}｜防守 ${pct(m.defensiveRatio)}`}>
          <section className="grid stats">
            <Stat label="總資產" value={money(m.totalAssets)} />
            <Stat label="今日損益" value={m.todayPnlAvailable ? signedMoney(m.dayPnl) : '—'} tone={m.todayPnlAvailable ? tone(m.dayPnl) : 'hold'} />
            <Stat label="淨資產" value={money(m.netWorth)} />
            <Stat label="借款" value={money(m.debt)} tone="warn" />
            <Stat label="Beta" value={m.beta.toFixed(2)} />
            <Stat label="防守資產比例" value={pct(m.defensiveRatio)} />
            <Stat label="槓桿比例" value={m.leverage.toFixed(2) + 'x'} />
            <Stat label="策略模式" value={mode} tone={modeTone} />
          </section>
        </SectionCard>
        <SectionCard className="page-card for-home" title="今日決策" isMobile={isMobile} collapsible open={sectionOpen('today')} onToggle={() => toggleSection('today')} summary={todayDecision.conclusion}>
          <div className={`health-status ${todayDecision.lowCashSafety ? 'bad' : rb.thresholdReached || todayDecision.dipTriggered ? 'warn' : 'good'}`}>
            <div className="health-light" />
            <div>
              <small>今日建議結論</small>
              <h3>{todayDecision.conclusion}</h3>
              <p>整合再平衡門檻、逢低提醒、現金、防守資產、交易建議與還款安全後產生。</p>
            </div>
          </div>
          <div className="status-grid">
            <p><span>成長資產目前比例</span><strong>{pct(rb.stockRow.currentWeight)}</strong></p>
            <p><span>成長資產目標比例</span><strong>{pct(m.growthTargetPct)}</strong></p>
            <p><span>偏離幅度</span><strong className={tone(rb.deviation)}>{rebalanceDeviationText}</strong></p>
            <p><span>是否達再平衡門檻</span><strong className={rb.thresholdReached ? 'warn' : 'good'}>{rb.thresholdReached ? '已達門檻' : '尚未達門檻'}</strong></p>
            <p><span>是否觸發逢低加碼</span><strong className={todayDecision.dipTriggered ? 'warn' : 'hold'}>{todayDecision.dipTriggered ? '已觸發' : '尚未觸發'}</strong></p>
            <p><span>防守資產比例</span><strong>{pct(m.defensiveRatio)}</strong></p>
          </div>
        </SectionCard>
        <SectionCard className="page-card for-home" title="AI 分析與加碼建議" isMobile={isMobile} collapsible open={sectionOpen('ai')} onToggle={() => toggleSection('ai')} summary={`目前建議：${mode}`}>
          <h3>{mode}</h3><p>{hint}</p>
          {targetWarning && <p className="warning-message">{targetWarning}</p>}
          <p>Beta {m.beta.toFixed(2)}、防守資產 {pct(m.defensiveRatio)}、槓桿 {m.leverage.toFixed(2)}x。成本與股數會隨持股、現金與自訂目標即時更新。</p>
          <p className="quote-summary"><span>股價更新：{isRefreshingQuotes ? '更新中…' : hasUpdatedQuotes && latestQuoteTime ? twShortTime(latestQuoteTime) : '尚未更新'}</span><strong className={quoteSummaryText === '報價正常' ? 'good' : 'warn'}>{quoteSummaryText}</strong></p>
        </SectionCard>
        <SectionCard className="page-card for-assets" title="資產配置" isMobile={isMobile} collapsible={false} summary={`成長 ${pct(m.totalAssets ? m.growth / m.totalAssets * 100 : 0)}｜防守 ${pct(m.defensiveRatio)}`}><AllocationDonut m={m} /></SectionCard>
        <div className="for-assets"><AllocationPresetPanel holdings={m.rows.map(row => ({ symbol: row.symbol, name: row.name, targetWeight: row.targetWeight }))} preset={state.allocationPreset} roleBySymbol={state.allocationRoleBySymbol} onApply={applyAllocationPreset} onKeepCustom={keepCustomAllocation} /></div>
        <Card className="page-card for-assets" title="新增持股">
          <p className="note">新增合法台股代號後會存入本機持股清單；按「更新股價」時會逐一呼叫目前 Worker 查價。已清倉資產可封存，保留給股息歷史使用。</p>
          <div className="asset-add-row">
            <input placeholder="輸入台股代號，例如 00981A、00670L、00662" value={newSymbolDraft} onChange={e => setNewSymbolDraft(e.currentTarget.value)} onKeyDown={e => { if (e.key === 'Enter') addHoldingAsset(); }} />
            <button onClick={addHoldingAsset}>新增資產</button>
          </div>
          {assetMessage && <p className={assetMessage.includes('請輸入') ? 'warning-message' : 'note'}>{assetMessage}</p>}
        </Card>
        <div className="assets-pull-refresh-surface" onTouchStart={event => assetsPullRefreshRef.current?.start({ pageTop: window.scrollY <= 0, clientY: event.touches[0]?.clientY ?? 0, isRefreshing: isRefreshingQuotes })} onTouchMove={event => assetsPullRefreshRef.current?.move(event.touches[0]?.clientY ?? 0)} onTouchEnd={() => assetsPullRefreshRef.current?.end(isRefreshingQuotes)} onTouchCancel={() => assetsPullRefreshRef.current?.cancel()}>
        <SectionCard className="page-card for-assets" title="持股資產管理" isMobile={isMobile} collapsible open={sectionOpen('holdings')} onToggle={() => toggleSection('holdings')} summary={`${m.rows.length} 檔持股｜點選編輯管理資料`} action={<button type="button" className="assets-quote-refresh" onClick={() => { void refreshQuotes(true); }} disabled={isRefreshingQuotes}><RefreshCw size={16} aria-hidden="true" className={isRefreshingQuotes ? 'is-spinning' : ''} /><span>{isRefreshingQuotes ? '更新中…' : '更新股價'}</span></button>}>
          {targetWarning && <p className="warning-message">{targetWarning}</p>}
          {(quoteSummaryText === '部分標的非今日報價' || quoteSummaryText === '部分標的報價日期不明') && <p className="note holding-stale-notice">{quoteSummaryText}；今日漲跌僅供參考。</p>}
          <section className="asset-quote-provenance" aria-label="持股報價來源與新鮮度"><p><strong>更新狀態：</strong>{quoteStatus}</p><ul>{quotePresentation.map(quote => <li key={quote.symbol}><b>{quote.symbol}</b><span>{quote.statusLabel}</span><span>市場時間：{quote.marketTimestamp || '—'}</span><span>來源：{quote.source}</span><span>系統取得：{quote.receiptTimestamp || '—'}</span></li>)}</ul></section>
          <div className="holdings">
            {m.rows.map(row => <HoldingCompactCard key={row.symbol} row={row} totalAssets={m.totalAssets} dipSetting={normalizeDipAlertSetting(state.dipAlerts?.[row.symbol] ?? defaultDipAlertSetting())} isEditing={editingHoldingSymbol === row.symbol} onToggleEdit={() => setEditingHoldingSymbol(current => current === row.symbol ? null : row.symbol)} onUpdate={updateHolding} onUpdateDipAlert={updateDipAlert} onRemove={confirmRemoveHoldingAsset} />)}
          </div>
        </SectionCard>
        </div>
        <SectionCard className="page-card for-assets" id="accounts-section" title="帳戶管理" isMobile={isMobile} collapsible open={sectionOpen('cash')} onToggle={() => toggleSection('cash')} summary={`可用現金 ${money(m.cash)}｜${state.accounts.filter(account => account.isActive).length} 個啟用帳戶`}>
          {accountWarning && <p className="warning-message">{accountWarning}</p>}
          <FinancialAccountList accounts={state.accounts} isMobile={isMobile} onCreate={createAccount} onUpdate={updateAccount} onDeactivate={deactivateAccount} onRestore={restoreAccount} onDelete={deleteAccount} />
        </SectionCard>
        <SectionCard className="page-card for-assets" id="transactions-section" title="交易基礎" isMobile={isMobile} collapsible open={isTransactionImportTarget || sectionOpen('transactions')} onToggle={() => toggleSection('transactions')} summary={`${state.transactions.length} 筆交易`}><TransactionList accounts={state.accounts} transactions={state.transactions} onCreate={createTransaction} onDelete={deleteTransaction} onUpdate={updateTransaction} /><ImportCenter accounts={state.accounts} transactions={state.transactions} sessions={state.importSessions} presets={state.importPresets} onCommit={commitImport} onRollback={rollbackImport} onPresets={importPresets => setState(current => ({ ...current, importPresets }))} /></SectionCard>
        <Card className={`page-card for-analytics ${analyticsView === 'risk' ? '' : 'performance-risk-hidden'}`} title="資產配置分析"><AllocationAnalysis m={m} rb={rb} /></Card>
        <SectionCard className="page-card for-home" id="order-section" title="交易建議清單" isMobile={isMobile} collapsible open={sectionOpen('orders')} onToggle={() => toggleSection('orders')} summary={`建議加碼 ${formatCurrency(orderHelper.totalBuyAmount)}`}>
          <p className="mode-description"><strong>{orderHelper.modeLabel}</strong>：{rebalanceModeDescription(orderHelper.mode)}</p>
          <div className="status-grid">
            {orderHelper.mode === 'buy-only' && <>
              <p><span>只買不賣可用加碼預算</span><strong>{budgetWanOf(orderHelper.buyOnlyBudget).toLocaleString('zh-TW')} 萬<br /><small>約 {formatCurrency(orderHelper.buyOnlyBudget)}</small></strong></p>
              <p><span>本次實際可加碼上限</span><strong>{formatCurrency(orderHelper.buyOnlyLimit)}</strong></p>
            </>}
            <p><span>目前現金總額</span><strong>{formatCurrency(orderHelper.cash)}</strong></p>
            <p><span>建議加碼總額</span><strong>{formatCurrency(orderHelper.totalBuyAmount)}</strong></p>
            <p><span>現金檢查</span><strong className={orderHelper.mode === 'buy-only' && (orderHelper.cashLimited || orderHelper.cash <= 0) ? 'warn' : orderHelper.cashEnough ? 'good' : 'warn'}>{orderHelper.mode === 'buy-only' ? orderHelper.hasInvalidBuyOnlyBudget ? '預算需調整' : orderHelper.cash <= 0 ? '無可用現金' : orderHelper.cashLimited ? '依實際上限分配' : '現金足夠' : orderHelper.cashEnough ? '現金足夠' : `不足 ${formatCurrency(orderHelper.shortage)}`}</strong></p>
          </div>
          {orderHelper.mode === 'buy-only' && orderHelper.cash < orderHelper.buyOnlyBudget && orderHelper.cash > 0 && <p className="note">目前現金低於設定預算，系統將以實際現金為上限。</p>}
          {orderHelper.hasInvalidBuyOnlyBudget && <p className="warning-message">請輸入有效的可用加碼預算。</p>}
          <TradeStepList steps={tradeSteps} currentWeights={currentWeights} />
          <DefensiveReminderCard reminder={orderHelper.defensiveReminder} />
          <p className="note">若不想賣出超標資產，可優先用新資金補足低配資產，讓比例逐步回到目標。</p>
        </SectionCard>
        <SectionCard className={`page-card for-analytics ${analyticsView === 'risk' ? '' : 'performance-risk-hidden'}`} id="rebalance-section" title="再平衡與加碼建議" isMobile={isMobile} collapsible open={sectionOpen('rebalance')} onToggle={() => toggleSection('rebalance')} summary={`${rb.thresholdStatus}｜偏離 ${rebalanceDeviationText}`} action={<button className="small typography-copy-action" style={{ padding: '4px 8px', margin: 0, height: 'auto', minHeight: 'auto', display: 'inline-flex', alignItems: 'center' }} onClick={handleCopy}>{copyStatus}</button>}>
          {targetWarning && <p className="warning-message">{targetWarning}</p>}
          <div className="decision-grid">
            <p><span>目前需不需要調整？</span><strong className={decisionSummary.adjustmentStatus === '需要關注' ? 'warn' : 'good'}>{decisionSummary.adjustmentStatus}</strong></p>
            <p><span>是否觸發再平衡？</span><strong className={rb.thresholdReached ? 'warn' : 'good'}>{decisionSummary.rebalanceStatus}</strong></p>
            <p><span>是否觸發逢低加碼？</span><strong className={decisionSummary.triggeredDipAlerts.length > 0 ? 'warn' : 'hold'}>{decisionSummary.dipStatus}</strong></p>
            <p><span>建議加碼多少？</span><strong>{formatCurrency(decisionSummary.buyAmount)}</strong></p>
            <p><span>資金來源</span><strong>{decisionSummary.fundingSource}</strong></p>
            <p><span>目前模式</span><strong>{rb.modeLabel}</strong></p>
          </div>
          <div className="rebalance-settings">
            <label>再平衡模式<select value={state.rebalanceMode} onChange={e => { const value = e.currentTarget.value; setState(s => ({ ...s, rebalanceMode: normalizeRebalanceMode(value) })); }}><option value="buy-only">只買不賣</option><option value="standard">標準再平衡</option></select><small>{rebalanceModeDescription(state.rebalanceMode)}</small></label>
            <label>再平衡提醒門檻 %<DraftInput inputMode="decimal" value={state.rebalanceThreshold} onCommit={value => setState(s => ({ ...s, rebalanceThreshold: clampRebalanceThreshold(Number(value)) }))} /><small>限制 0%～{MAX_REBALANCE_THRESHOLD}%，可輸入小數。</small></label>
            <label>只買不賣可用加碼預算（萬）<DraftInput type="number" min="0" step="0.1" inputMode="decimal" value={budgetWanOf(state.buyOnlyBudget)} onCommit={value => setState(s => ({ ...s, buyOnlyBudget: budgetFromWan(value) }))} /><small>預設 10 萬；輸入 10 代表約 10.0 萬元。</small></label>
          </div>
          <div className="rebalance-alert"><p><span>再平衡模式</span><strong>{rb.modeLabel}</strong></p><p><span>目前偏離目標</span><strong className={tone(rb.deviation)}>{rebalanceDeviationText}</strong></p><p><span>再平衡門檻</span><strong>{pct(rb.threshold)}</strong></p><p><span>狀態</span><strong>{rb.thresholdStatus}</strong></p></div>
          <div className="rebalance-summary"><div><small>成長資產</small><b>{rb.stockAction}</b></div><div><small>防守資產</small><b>目前 {money(rb.defensiveCurrent)}｜目標 {money(rb.defensiveTarget)}｜{rb.defensiveAction}</b></div>{rb.nonStrategy.map(item => <div key={item}><small>實際持股</small><b>{item}</b></div>)}</div>
          {decisionSummary.triggeredDipAlerts.length > 0 && <div className="decision-callout"><h3>逢低加碼觀察標的</h3>{decisionSummary.triggeredDipAlerts.map(row => <p key={row.symbol}><strong>{row.symbol} {row.name}</strong> 目前跌幅 {row.drawdownPct === null ? '—' : signedPct(row.drawdownPct)}，門檻 {pct(row.setting.thresholdPct)}。</p>)}</div>}
          <div className="table rebalance-table"><div className="row head"><span>項目</span><span>目前比例</span><span>目標比例</span><span>偏離幅度</span><span>門檻</span><span>建議</span></div><div className="row"><span data-label="項目">{rb.stockRow.symbol}</span><span data-label="目前比例">{pct(rb.stockRow.currentWeight)}</span><span data-label="目標比例">{rb.stockRow.targetText}</span><span data-label="偏離幅度">{rb.stockRow.deviationText}</span><span data-label="門檻">{rb.stockRow.thresholdText}</span><b data-label="建議" className={rb.stockRow.tone}>{rb.stockRow.action}</b></div><div className="rebalance-group"><div className="row group-main"><span data-label="項目">{rb.defensiveRow.symbol}</span><span data-label="目前比例">{pct(rb.defensiveRow.currentWeight)}</span><span data-label="目標比例">{rb.defensiveRow.targetText}</span><span data-label="偏離幅度">{rb.defensiveRow.deviationText}</span><span data-label="門檻">{rb.defensiveRow.thresholdText}</span><b data-label="建議" className={rb.defensiveRow.tone}>{rb.defensiveRow.action}</b></div>{rb.defensiveDetails.map(r => <div className="row sub-row" key={r.symbol}><span data-label="項目">{r.symbol}</span><span data-label="目前比例">{pct(r.currentWeight)}</span><span data-label="目標比例">{r.targetText}</span><span data-label="偏離幅度">{r.deviationText}</span><span data-label="門檻">{r.thresholdText}</span><b data-label="建議" className="hold">{r.action}</b></div>)}</div></div>
        </SectionCard>
        <SectionCard className={`page-card for-analytics ${analyticsView === 'risk' ? '' : 'performance-risk-hidden'}`} id="analytics-trade-section" title="交易建議清單" isMobile={isMobile} collapsible open={sectionOpen('orders')} onToggle={() => toggleSection('orders')} summary={`建議加碼 ${formatCurrency(orderHelper.totalBuyAmount)}`}>
          <p className="mode-description"><strong>{orderHelper.modeLabel}</strong>：{rebalanceModeDescription(orderHelper.mode)}</p>
          {tradeSteps.some(step => step.action !== '不需處理') ? <TradeStepList steps={tradeSteps} currentWeights={currentWeights} /> : <div className="analytics-empty"><p>目前沒有需要執行的交易建議。</p><span>配置已在門檻內，或目前模式下暫無可執行操作。</span></div>}
          <DefensiveReminderCard reminder={orderHelper.defensiveReminder} />
          <p className="note">建議金額以萬元呈現；股價與預估股數維持原本單位。只買不賣模式不會產生賣出交易。</p>
        </SectionCard>
        <SectionCard className={`page-card for-analytics ${analyticsView === 'risk' ? '' : 'performance-risk-hidden'}`} id="dip-analysis-section" title="逢低加碼分析" isMobile={isMobile} collapsible collapsibleOnDesktop open={analyticsSectionOpen('dipAnalysis')} onToggle={() => toggleSection('dipAnalysis')} summary={decisionSummary.dipStatus}>
          <p className="note">此區只讀取目前持股的提醒設定與最新報價；波段最高價與門檻請在資產頁調整。</p>
          <DipOpportunityAnalysis rows={dipAlertRows} onOpenAssets={() => navigate('/assets')} />
          <p className="warning-message">逢低加碼提醒僅作為觀察條件，不代表必須買進。若借款管理顯示還款安全存量不足，應優先保留現金。</p>
        </SectionCard>
        <SectionCard className={`page-card for-analytics ${analyticsView === 'risk' ? '' : 'performance-risk-hidden'}`} id="analytics-details-section" title="分析說明" isMobile={isMobile} collapsible collapsibleOnDesktop open={analyticsSectionOpen('analyticsDetails')} onToggle={() => toggleSection('analyticsDetails')} summary="計算方式、風險提醒與詳細分析資料">
          <AnalyticsDetails m={m} rb={rb} health={health} quoteSummaryText={quoteSummaryText} latestQuoteTime={latestQuoteTime} onCopy={() => { void handleCopy(); }} copyStatus={copyStatus} />
        </SectionCard>
        <Card className="page-card for-home" title="借款安全摘要">
          <div className="status-grid"><p><span>借款總額</span><strong>{money(m.debt)}</strong></p><p><span>槓桿比例</span><strong>{m.leverage.toFixed(2)}x</strong></p><p><span>每月還款</span><strong>{money(m.monthlyPayment)}</strong></p><p><span>還款安全存量</span><strong>{Number.isFinite(m.repaymentSafetyMonths) ? `${m.repaymentSafetyMonths.toFixed(1)} 個月` : '無貸款壓力'}</strong></p></div>
          <p className="note">完整借款資料與編輯功能位於資產頁。</p>
        </Card>
        <SectionCard className="page-card for-assets" title="資產分類設定" isMobile={isMobile} collapsible open={sectionOpen('assetClass')} onToggle={() => toggleSection('assetClass')} summary={`目標合計 ${pct(targetCheck.total)}｜現金承擔 ${pct(targetCheck.cashTarget)}`}>
          <p className="note">現金固定列入防守資產；股票與 ETF 依每筆持股的資產分類設定分組，不再由代號強制判斷。</p>
          <div className="status-grid"><p><span>成長資產目標合計</span><strong className={targetCheck.total > 100 ? 'bad' : ''}>{pct(targetCheck.growthTotal)}</strong></p><p><span>防守股票目標合計</span><strong>{pct(targetCheck.defensiveStockTotal)}</strong></p><p><span>現金承擔目標</span><strong>{pct(targetCheck.cashTarget)}</strong></p><p><span>總目標比例</span><strong className={targetCheck.total > 100 ? 'bad' : 'good'}>{pct(targetCheck.total)}</strong></p><p><span>成長資產</span><strong>{m.growthHoldings.map(row => row.symbol).join('、') || '無'}</strong></p><p><span>防守資產</span><strong>現金{m.defensiveHoldings.length ? `、${m.defensiveHoldings.map(row => row.symbol).join('、')}` : ''}</strong></p></div>
        </SectionCard>
        <SectionCard className="page-card for-assets" id="loan-section" title="借款與還款安全" isMobile={isMobile} collapsible open={sectionOpen('loans')} onToggle={() => toggleSection('loans')} summary={`剩餘借款 ${money(m.debt)}｜安全存量 ${Number.isFinite(m.repaymentSafetyMonths) ? `${m.repaymentSafetyMonths.toFixed(1)} 個月` : '無貸款壓力'}`}>
          <div className="loan-summary"><Stat label="總借款" value={money(m.debt)} /><Stat label="每月還款" value={money(m.monthlyPayment)} /><Stat label="平均剩餘期數" value={m.averageRemainingMonths === undefined ? '—' : `${m.averageRemainingMonths.toFixed(1)} 期`} /><Stat label="還款安全存量" value={getRepaymentSafetyText(m.repaymentSafetyMonths, m.repaymentSafetyDays, m.monthlyPayment)} tone={getRepaymentSafetyTone(m.repaymentSafetyMonths, m.monthlyPayment)} /><Stat label="累積利息成本" value={money(m.totalLoanInterestPaid)} tone="hold" /><Stat label="扣利息後真實淨利" value={signedMoney(m.trueNetPnlAfterInterest)} tone={tone(m.trueNetPnlAfterInterest)} /></div>
          <p className="note loan-interest-note" style={{ marginTop: '4px', marginBottom: '12px', wordBreak: 'break-all', whiteSpace: 'normal', overflowWrap: 'break-word' }}>* 真實淨利為依目前借款資料估算，已扣除信貸至今累計利息成本；若缺少原始本金欄位，利息成本可能為保守估算。</p>
          <LoanList items={state.loans} setItems={items => setState(s => ({ ...s, loans: typeof items === 'function' ? items(s.loans) : items }))} isMobile={isMobile} />
        </SectionCard>
        {isMobile && <SectionCard className="page-card" id="sync-section-mobile" title="同步與資料設定" isMobile={isMobile} collapsible open={sectionOpen('sync')} onToggle={() => toggleSection('sync')} summary={`上傳 ${metaTime(syncMeta.lastUploadAt)}｜下載 ${metaTime(syncMeta.lastDownloadAt)}`}>
          <p className="note">手機版快速同步只會在按鈕觸發時執行；完整 Firebase、備份與持股資產管理仍在「同步與資料」分頁。</p>
          <div className="status-grid">
            <p><span>目前同步代號</span><strong>{state.firebase.secretPath || FIREBASE_BASE_PATH}</strong></p>
            <p><span>Firebase 設定</span><strong>{state.firebase.databaseURL.trim() ? '已設定' : '未設定'}</strong></p>
            <p><span>最後本機儲存</span><strong>{metaTime(syncMeta.lastLocalSaveAt || lastSavedAt)}</strong></p>
            <p><span>同步狀態</span><strong>{syncStatusText}</strong></p>
          </div>
          <div className="actions">
            <button onClick={() => uploadCloud().catch(e => updateSyncMeta(current => ({ ...current, source: '本機資料', dirty: true, status: '❌ Firebase 同步失敗：' + e.message })))}>上傳雲端</button>
            <button onClick={() => downloadCloud().catch(e => updateSyncMeta(current => ({ ...current, status: '❌ 下載失敗：' + e.message })))}>下載雲端</button>
            <button className="small" onClick={() => navigate('/settings')}>完整設定</button>
          </div>
        </SectionCard>}
      </DashboardPage>}
      {currentPage === 'tools' && <ToolsPage />}
      {isAllocationSimulator && <AllocationSimulatorPage rows={m.rows} totalAssets={m.totalAssets} cash={m.cash} />}
      {isRiskCenter && <RiskCenterPage input={riskInput} />}
      {isWealthGoal && <WealthGoalPage settings={state.wealthGoal} totalAssets={m.totalAssets} debt={m.debt} onSave={wealthGoal => setState(s => ({ ...s, wealthGoal }))} />}
      {isCashFlowCenter && <CashFlowPage profile={state.cashFlowProfile} currentCash={state.cash.length ? m.cash : null} onSave={cashFlowProfile => setState(s => ({ ...s, cashFlowProfile }))} />}
      {isNetWorthHistory && <NetWorthHistoryPage history={netWorthHistory} />}
        {isDividendCenter && <DividendCenterPage accounts={state.accounts} holdings={dividendCenterHoldings} transactions={dividendCenterTransactions} onCreate={createTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} />}
        {isAiDecisionCenter && <AiDecisionCenterPage items={aiDecisionItems} asOf={localSnapshotDate()} />}
        {isPortfolioRiskCenter && <PortfolioRiskPage view={portfolioRiskView} />}
        {isRebalanceRecommendationCenter && <RebalanceRecommendationPage view={rebalanceRecommendationView} recommendations={recommendationModels} rule={clecStrategyRuleView} eligibility={rebalanceExecutionEligibility} />}
        {isClecStrategyCenter && <ClecStrategyCenterPage view={clecStrategyCenterView} rule={clecStrategyRuleView} />}
        {isInvestmentActionCenter && <InvestmentActionCenterPage model={investmentActionCenter} explanations={investmentActionExplanations} />}
      {currentPage === 'settings' && <SettingsPage>
        <Card title="顯示設定">
          <p className="note">簡潔／完整模式只控制可收合區塊的預設展開狀態，不會改變資料或計算。</p>
          <div className="mobile-mode-switch settings-mode-switch" aria-label="顯示模式">
            <button type="button" className={uiState.displayMode === 'compact' ? 'active' : ''} aria-pressed={uiState.displayMode === 'compact'} onClick={() => applyDisplayMode('compact')}><b>簡潔模式</b><small>只顯示核心資訊，適合日常快速查看。</small></button>
            <button type="button" className={uiState.displayMode === 'full' ? 'active' : ''} aria-pressed={uiState.displayMode === 'full'} onClick={() => applyDisplayMode('full')}><b>完整模式</b><small>顯示完整分析、進階欄位與說明。</small></button>
          </div>
        </Card>
        <Card id="sync-section" title="同步與資料設定">
          <p className="note">目前同步方式為手動同步：修改資料後會先儲存在本機。要同步到其他裝置，請按「上傳雲端」。另一台裝置要取得最新資料，請按「下載雲端」。系統不會自動下載雲端資料，以避免覆蓋正在編輯的內容。</p>
          <div className="params">
            <label>Firebase URL<DraftInput value={state.firebase.databaseURL} onCommit={value => setState(s => ({ ...s, firebase: { ...s.firebase, databaseURL: value } }))} /></label>
            <label>同步代號<DraftInput value={state.firebase.secretPath} onCommit={value => setState(s => ({ ...s, firebase: { ...s.firebase, secretPath: value } }))} /></label>
            <label>Cloudflare Worker URL<input value={DEFAULT_WORKER_URL} readOnly /></label>
            <label>股價更新間隔秒數<DraftInput type="number" value={state.refreshSec} onCommit={value => setState(s => ({ ...s, refreshSec: Math.max(60, parsePositive(value, 60)) }))} /></label>
            <label><input type="checkbox" checked={state.autoSync} onChange={e => { const checked = e.currentTarget.checked; setState(s => ({ ...s, autoSync: checked })); }} /> 啟用 Firebase 手動同步設定</label>
            <label>同步延遲秒數<DraftInput type="number" min="10" value={state.autoSyncSec} onCommit={value => setState(s => ({ ...s, autoSyncSec: Math.max(10, parsePositive(value, 60)) }))} /></label>
          </div>
          <div className="actions">
            <button onClick={() => uploadCloud().catch(e => updateSyncMeta(current => ({ ...current, source: '本機資料', dirty: true, status: '❌ Firebase 同步失敗：' + e.message })))}>上傳雲端</button>
            <button onClick={() => downloadCloud().catch(e => updateSyncMeta(current => ({ ...current, status: '❌ 下載失敗：' + e.message })))}>下載雲端</button>
          </div>
          <p><b>雲端同步設定：</b>{state.firebase.databaseURL ? '已設定' : '尚未設定 Firebase URL'}</p>
          <p><b>目前 Worker：</b>{DEFAULT_WORKER_URL}</p>
          <p>
            <b>同步狀態：</b>
            <span className={syncStatusText.startsWith('❌') ? 'bad' : syncStatusText.startsWith('🎉') ? 'good' : ''}>
              {syncStatusText}
            </span>
          </p>
          <p className="note">Firebase 上傳與下載都只會在手動按鈕觸發時執行，不會自動下載覆蓋本機資料。</p>
        </Card>
        <GmailOAuthSettings value={state.gmailOAuth} onChange={gmailOAuth => setState(s => ({ ...s, gmailOAuth }))} />
        <SectionCard id="sync-status-section" title="雲端同步狀態" isMobile={isMobile} collapsible open={sectionOpen('syncStatus')} onToggle={() => toggleSection('syncStatus')} summary="查看本機、上傳、下載與備份時間">
          <div className="status-grid">
            <p><span>目前資料來源</span><strong>{syncMeta.source}</strong></p>
            <p><span>最後本機儲存</span><strong>{metaTime(syncMeta.lastLocalSaveAt || lastSavedAt)}</strong></p>
            <p><span>最後雲端上傳</span><strong>{metaTime(syncMeta.lastUploadAt)}</strong></p>
            <p><span>最後雲端下載</span><strong>{metaTime(syncMeta.lastDownloadAt)}</strong></p>
            <p><span>最後備份匯出</span><strong>{metaTime(syncMeta.lastBackupExportAt)}</strong></p>
            <p><span>最後備份匯入</span><strong>{metaTime(syncMeta.lastBackupImportAt)}</strong></p>
            <p><span>目前同步代號</span><strong>{state.firebase.secretPath || 'family-universal-rebalance'}</strong></p>
            <p><span>Firebase 設定</span><strong>{state.firebase.databaseURL.trim() ? '已設定' : '未設定'}</strong></p>
          </div>
          <p className="note">匯出、匯入與同步狀態只會更新本機資料，不會自動上傳或下載 Firebase。</p>
        </SectionCard>
        <Card title="備份 / 還原">
          <p className="note">匯出備份與匯入還原只處理本機資料，不會自動觸發 Firebase 上傳或下載。</p>
          <div className="actions">
            <button onClick={exportBackup}>匯出 JSON 備份</button>
            <label className="file">匯入 JSON 備份<input type="file" accept="application/json" onChange={e => { importBackup(e.target.files?.[0]); e.currentTarget.value = ''; }} /></label>
            <button className="danger" onClick={resetState}>重設</button>
          </div>
        </Card>
        <Card className="legacy-settings-asset-manager" title="持股資產管理">
          <p className="note">新增合法台股代號後會存入本機持股清單；按「更新股價」時會逐一呼叫目前 Worker 查價。</p>
          <div className="asset-add-row">
            <input
              placeholder="輸入台股代號，例如 00981A、00670L、00662"
              value={newSymbolDraft}
              onChange={e => setNewSymbolDraft(e.currentTarget.value)}
              onKeyDown={e => { if (e.key === 'Enter') addHoldingAsset(); }}
            />
            <button onClick={addHoldingAsset}>新增資產</button>
          </div>
          {assetMessage && <p className={assetMessage.includes('請輸入') ? 'warning-message' : 'note'}>{assetMessage}</p>}
          <div className="list asset-list">
            <div className="list-row list-head"><span>資產代號</span><span>名稱</span><span>分類</span><span>總股數</span><span>成交均價</span><span>股價來源</span><span>操作</span></div>
            {derivedHoldings(state).map(item => {
              const quote = quotes[item.symbol] || backupQuote(item.symbol, item);
              return <div className="list-row" key={item.symbol}>
                <span>{item.symbol}</span>
                <span>{resolveSymbolName(item.symbol, item.name, quote.name)}</span>
                <label><span>分類</span><select value={item.assetClass} onChange={e => updateHolding(item.symbol, 'assetClass', normalizeAssetClass(e.currentTarget.value))}><option value="growth">成長資產</option><option value="defensive">防守資產</option></select></label>
                <span>{item.shares.toLocaleString('zh-TW')}</span>
                <span>{item.avgCost.toFixed(2)}</span>
                <span>{quote.source}</span>
                <button className="danger small" onClick={() => confirmRemoveHoldingAsset(item.symbol)}>封存</button>
              </div>;
            })}
          </div>
          {safeHoldings(state.holdings).filter(item => item.isArchived).length > 0 && <div className="list asset-list"><div className="list-row list-head"><span>已清倉資產</span><span>名稱</span><span>狀態</span><span>操作</span></div>{safeHoldings(state.holdings).filter(item => item.isArchived).map(item => <div className="list-row" key={`archived-${item.symbol}`}><span>{item.symbol}</span><span>{item.name || resolveSymbolName(item.symbol)}</span><span>已封存</span><button className="small" onClick={() => restoreHoldingAsset(item.symbol)}>恢復持股</button></div>)}</div>}
        </Card>
        <SectionCard id="quote-sources-section" title="報價來源" isMobile={isMobile} collapsible open={sectionOpen('quoteSources')} onToggle={() => toggleSection('quoteSources')} summary="查看各持股的報價來源與更新時間">
          <p className="note">完整技術來源集中在此處，主要投資卡片只顯示簡短報價狀態。</p>
          <div className="asset-management-grid">
            {m.rows.map(row => <article className="asset-management-item" key={`source-${row.symbol}`}>
              <div><strong>{row.symbol}</strong><span>{row.quote.name}</span></div>
              <span>{row.quote.source}{row.quote.error ? `｜${row.quote.error}` : ''}</span>
              <small>{tw(row.quote.updatedAt)}</small>
            </article>)}
          </div>
        </SectionCard>
        <SectionCard id="target-check-section" title="目標比例檢查" isMobile={isMobile} collapsible open={sectionOpen('targetCheck')} onToggle={() => toggleSection('targetCheck')} summary={targetCheckSummary} status={<span className={`section-status ${targetCheckHasError ? 'bad' : 'good'}`}>{targetCheckHasError ? '錯誤' : '正常'}</span>}>
          <div className="status-grid">
            <p><span>成長資產目標合計</span><strong className={targetCheck.total > 100 ? 'bad' : ''}>{pct(targetCheck.growthTotal)}</strong></p>
            <p><span>防守股票目標合計</span><strong>{pct(targetCheck.defensiveStockTotal)}</strong></p>
            <p><span>現金承擔目標</span><strong>{pct(targetCheck.cashTarget)}</strong></p>
            <p><span>總目標比例</span><strong className={targetCheck.total > 100 ? 'bad' : 'good'}>{pct(targetCheck.total)}</strong></p>
            <p><span>狀態</span><strong className={targetCheck.total > 100 ? 'bad' : 'good'}>{targetCheck.status}</strong></p>
          </div>
          {targetCheckHasError && <p className="warning-message">持股目標比例合計已超過 100%，請調整配置。</p>}
        </SectionCard>
        <SectionCard id="sync-diagnostics-section" title="雲端同步診斷與比對" isMobile={isMobile} collapsible open={sectionOpen('syncDiagnostics')} onToggle={() => toggleSection('syncDiagnostics')} summary="查看本機與雲端資料的診斷及比對結果">
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
              <span data-label="資料項目">持股項目</span>
              <span data-label="本機數據">{safeHoldings(state.holdings).length} 筆</span>
              <span data-label="雲端數據">{remoteMeta ? `${remoteMeta.holdingsCount} 筆` : '—'}</span>
              <span data-label="狀態比對">{remoteMeta ? (safeHoldings(state.holdings).length === remoteMeta.holdingsCount ? <b className="good">✅ 一致</b> : <b className="bad">⚠️ 不一致</b>) : '—'}</span>
            </div>
            <div className="row">
              <span data-label="資料項目">現金帳戶</span>
              <span data-label="本機數據">{state.cash.length} 筆</span>
              <span data-label="雲端數據">{remoteMeta ? `${remoteMeta.cashCount} 筆` : '—'}</span>
              <span data-label="狀態比對">{remoteMeta ? (state.cash.length === remoteMeta.cashCount ? <b className="good">✅ 一致</b> : <b className="bad">⚠️ 不一致</b>) : '—'}</span>
            </div>
            <div className="row">
              <span data-label="資料項目">借款項目</span>
              <span data-label="本機數據">{state.loans.length} 筆</span>
              <span data-label="雲端數據">{remoteMeta ? `${remoteMeta.loansCount} 筆` : '—'}</span>
              <span data-label="狀態比對">{remoteMeta ? (state.loans.length === remoteMeta.loansCount ? <b className="good">✅ 一致</b> : <b className="bad">⚠️ 不一致</b>) : '—'}</span>
            </div>
            <div className="row">
              <span>最後更新時間</span>
              <span>{tw(lastSavedAt)}</span>
              <span>{remoteMeta && remoteMeta.updatedAt ? tw(remoteMeta.updatedAt) : '—'}</span>
              <span>時戳對照</span>
            </div>
          </div>
        </SectionCard>
      <footer className="app-footer">
        <section className="card footer-debug-card">
          <details className="debug-details footer-debug-details">
            <summary><span>版本與除錯</span><small>點開查看產品版本、commit、Build time 與除錯資訊</small></summary>
            <div className="status-grid">
              <p><span>產品版本</span><strong>{APP_VERSION}</strong></p>
              <p><span>Build time</span><strong>{APP_BUILD_TIME}</strong></p>
              <p><span>Git commit</span><strong>{APP_GIT_COMMIT}</strong></p>
              <p><span>localStorage key</span><strong>{STORAGE_KEY}</strong></p>
              <p><span>Firebase 設定</span><strong>{state.firebase.databaseURL.trim() ? '已設定' : '未設定'}</strong></p>
              <p><span>Worker URL</span><strong>{DEFAULT_WORKER_URL}</strong></p>
            </div>
            <section className="runtime-provenance" aria-label="執行環境與資料來源診斷">
              <h3>執行環境與資料來源</h3>
              <p className="note">僅顯示本機當下已取得的資訊；不會自動同步、清除快取、重設資料或覆寫任何裝置資料。</p>
              <div className="status-grid">
                <p><span>目前 URL</span><strong>{typeof location !== 'undefined' ? location.href : '—'}</strong></p>
                <p><span>同步狀態</span><strong>{syncStatusText}</strong></p>
                <p><span>同步來源</span><strong>{syncMeta.source}</strong></p>
                <p><span>Sync baseline</span><strong>{syncBaselineDiagnostics.baselineAvailable ? 'available' : 'unavailable'}</strong></p>
                <p><span>Current fingerprint</span><strong>{shortSyncFingerprint(syncBaselineDiagnostics.currentFingerprint)}</strong></p>
                <p><span>Baseline fingerprint</span><strong>{shortSyncFingerprint(syncBaselineDiagnostics.baselineFingerprint)}</strong></p>
                <p><span>Dirty reason</span><strong>{syncBaselineDiagnostics.reason}</strong></p>
                <p><span>Canonical schema</span><strong>{syncBaselineDiagnostics.canonicalSchema}</strong></p>
                <p><span>Changed top-level fields</span><strong>{changedSyncFields}</strong></p>
                <p><span>Current top-level fingerprints</span><strong>{currentSyncFieldFingerprints}</strong></p>
                <p><span>Baseline top-level fingerprints</span><strong>{baselineSyncFieldFingerprints}</strong></p>
                <p><span>Transaction count</span><strong>{transactionSyncDiagnostics.transactionCount}</strong></p>
                <p><span>Normalized transaction count</span><strong>{transactionSyncDiagnostics.normalizedTransactionCount}</strong></p>
                <p><span>Transactions order fingerprint</span><strong>{transactionSyncDiagnostics.orderFingerprint}</strong></p>
                <p><span>Transaction identity hashes</span><strong>{transactionIdentityText}</strong></p>
                <p><span>Transaction structural fingerprints</span><strong>{transactionStructureText}</strong></p>
                <p><span>Changed transaction indexes</span><strong>{changedTransactionIndexes}</strong></p>
                <p><span>Changed transaction fields</span><strong>{changedTransactionFields}</strong></p>
                <p><span>Transactions added / removed / reordered</span><strong>{transactionSyncDiagnostics.addedCount} / {transactionSyncDiagnostics.removedCount} / {transactionSyncDiagnostics.reorderedCount}</strong></p>
                <p><span>Market Worker</span><strong>{marketRuntime.endpoint}</strong></p>
                <p><span>Market response cache</span><strong>{marketRuntime.cache}</strong></p>
                <p><span>Market snapshot</span><strong>{marketSnapshot.status}｜{marketSnapshot.fetchedAt ? tw(marketSnapshot.fetchedAt) : '尚未取得'}</strong></p>
                <p><span>Quote request cache</span><strong>no-store（每次更新直接請求 Price Worker）</strong></p>
              </div>
              <div className="runtime-quote-list">
                <h4>本機 Quote 來源與時間</h4>
                {quoteProvenance.length ? quoteProvenance.map(value => <p key={value}>{value}</p>) : <p>尚無持股 Quote。</p>}
              </div>
            </section>
            <div className="actions">
              <button onClick={copyDebugInfo}>{debugCopyStatus}</button>
            </div>
            {debugInfoText && <details className="debug-details" open={debugCopyStatus.startsWith('複製失敗')}>
              <summary>查看除錯資訊文字</summary>
              <textarea className="debug-textarea" readOnly value={debugInfoText} onFocus={e => e.currentTarget.select()} />
            </details>}
            <p className="note">除錯資訊會包含版本、Build、commit、網址、裝置資訊、同步 fingerprint、匿名 transaction hash、Market／Quote 來源與資產摘要；不包含 Firebase 完整路徑、完整同步 payload、交易值、密碼、token 或 API key。</p>
          </details>
        </section>
        <Card title="更新紀錄">
          <details className="release-notes">
            <summary>查看更新紀錄</summary>
            <div className="release-group">
              <h3>V3.1 Navigation Foundation</h3>
              <ul>
                <li>新增首頁、資產、分析、工具與設定五個主要頁面。</li>
                <li>手機使用固定底部導航，桌機使用固定左側 Sidebar。</li>
                <li>採用 Hash 路由，確保 GitHub Pages 重新整理不會出現 404。</li>
                <li>既有持股、同步與投資計算仍共用同一份狀態。</li>
              </ul>
            </div>
            <div className="release-group">
              <h3>UI 2.1</h3>
              <ul>
                <li>手機版改用乾淨 DOM 順序，讓 AI 分析後方直接接持股配置。</li>
                <li>新增今日決策卡片、手機簡潔 / 完整模式與可收合區塊。</li>
                <li>持股新增成長 / 防守資產分類，分類改由使用者設定，不再由代號強制判斷。</li>
                <li>舊資料首次載入會補上 assetClass；已設定分類的資料不會被覆蓋。</li>
              </ul>
            </div>
            <div className="release-group">
              <h3>v1.3.1</h3>
              <ul>
                <li>新增逢低加碼提醒，可為每檔持股設定波段最高價與跌幅門檻。</li>
                <li>新增手機底部快捷導覽，快速跳到總覽、再平衡、下單、借款與同步。</li>
                <li>手機底部快捷列改為直接提供上傳 / 下載雲端，並將版本與除錯改為預設收合。</li>
                <li>統一逢低提醒欄位為波段最高價，並放大桌機右側快捷列。</li>
                <li>逢低提醒僅提供觀察訊號，不會自動買賣、扣現金或同步雲端。</li>
              </ul>
            </div>
            <div className="release-group">
              <h3>v1.2.0</h3>
              <ul>
                <li>新增交易建議清單，將再平衡差額換算為金額、股數與張數。</li>
                <li>新增建議加碼 / 減碼順序與現金檢查。</li>
                <li>將版本與除錯、更新紀錄移至頁面最下方。</li>
              </ul>
            </div>
            <div className="release-group">
              <h3>v1.1.1</h3>
              <ul>
                <li>新增版本號與 Build 資訊。</li>
                <li>新增一鍵複製除錯資訊。</li>
                <li>新增 Error Boundary，避免整頁空白。</li>
              </ul>
            </div>
            <div className="release-group">
              <h3>v1.1.0</h3>
              <ul>
                <li>新增 JSON 備份匯出 / 匯入。</li>
                <li>新增同步狀態提示。</li>
                <li>新增危險操作確認。</li>
                <li>新增目標比例檢查。</li>
              </ul>
            </div>
            <div className="release-group">
              <h3>v1.0.x</h3>
              <ul>
                <li>修正成長 / 防守資產分類。</li>
                <li>防守資產目標比例曾改為自動計算。</li>
                <li>預設資產可刪除。</li>
                <li>修正 00670L 名稱為富邦NASDAQ正2。</li>
                <li>優化手機版防守資產表格。</li>
              </ul>
            </div>
          </details>
        </Card>
      </footer>
      </SettingsPage>}
    </AppLayout>
  );
}
export default App;
