import type { DividendSource, DividendSummary } from './dividends';
import type { MarketSnapshot } from './marketData';
import type { SeriesStats } from './investmentPerformanceHistory';
import type { PortfolioConcentration } from './performanceMetrics';
import type { QuoteDateStatus } from './quoteMath';
import type { RiskLevel } from './riskMetrics';

export type DecisionSeverity = 'critical' | 'warning' | 'info' | 'normal' | 'unavailable';
export type DecisionCategory = 'today' | 'market' | 'concentration' | 'cash' | 'leverage' | 'drawdown' | 'dividend' | 'quote-freshness' | 'data-quality';
export type DecisionEvidence = { label: string; value: string; source: string; asOf?: string | null };
export type DecisionItem = { id: string; category: DecisionCategory; severity: DecisionSeverity; title: string; conclusion: string; reason: string; evidence: DecisionEvidence[]; action?: { label: string; to: string } };
export type MarketFreshness = 'today' | 'recent-effective' | 'stale' | 'unavailable' | 'invalid';

export type AiDecisionInput = {
  today: string;
  dashboard: { investmentValue: number; dayPnl: number | null; dayPnlRate: number | null; cashRatio: number | null; quoteStatus: string; holdingsCount: number };
  risk: { overallLevel: RiskLevel; cash: number; cashRatio: number; cashSafetyMonths: number | null; largest?: { symbol: string; name: string }; largestHoldingRatio: number; topTwoRatio: number; topThreeRatio: number; leveragedAssets: { symbol: string }[]; leveragedValue: number; leveragedRatio: number; leveragedGrowthRatio: number };
  performance: { stats: SeriesStats; canCalculateMaxDrawdown: boolean; snapshotCount: number };
  dividend: { summary: DividendSummary; sources: DividendSource[] };
  market: MarketSnapshot;
  quoteStatuses: QuoteDateStatus[];
  quoteErrors: number;
  backupQuoteCount: number;
  targetOverLimit: boolean;
  holdingMarketValue: number;
};

const finite = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const nonNegative = (value: unknown): number | null => { const number = finite(value); return number === null || number < 0 ? null : number; };
const pct = (value: number | null) => value === null ? '資料不足' : `${value.toFixed(1)}%`;
const money = (value: number | null) => value === null ? '資料不足' : `${Math.round(value).toLocaleString('zh-TW')} 元`;
const evidence = (label: string, value: string, source: string, asOf?: string | null): DecisionEvidence => ({ label, value, source, ...(asOf ? { asOf } : {}) });
const validDate = (value: string | null | undefined) => Boolean(value && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value)));

export function deriveMarketFreshness(snapshot: MarketSnapshot, today: string): MarketFreshness {
  if (!validDate(today)) return 'invalid';
  if (snapshot.status === 'unavailable' || snapshot.status === 'failed' || !snapshot.items.length) return 'unavailable';
  const usable = snapshot.items.filter(item => item.status !== 'unavailable' && item.status !== 'failed');
  if (!usable.length) return 'unavailable';
  const dates = usable.map(item => item.asOf?.slice(0, 10)).filter((date): date is string => Boolean(date));
  if (!dates.length || dates.some(date => !validDate(date))) return 'invalid';
  if (dates.some(date => date === today)) return 'today';
  if (usable.some(item => item.status === 'recent-effective' || item.status === 'closed')) return 'recent-effective';
  return 'stale';
}

export function deriveAiDecisions(input: AiDecisionInput): DecisionItem[] {
  const investment = nonNegative(input.dashboard.investmentValue);
  const dayPnl = finite(input.dashboard.dayPnl);
  const dayRate = finite(input.dashboard.dayPnlRate);
  const totalAssets = input.risk.cashRatio > 0 ? input.risk.cash / (input.risk.cashRatio / 100) : null;
  const marketFreshness = deriveMarketFreshness(input.market, input.today);
  const marketAvailable = input.market.items.filter(item => item.status !== 'unavailable' && item.status !== 'failed');
  const marketUp = marketAvailable.filter(item => finite(item.change) !== null && item.change! > 0).length;
  const marketDown = marketAvailable.filter(item => finite(item.change) !== null && item.change! < 0).length;
  const quoteStale = input.quoteStatuses.filter(status => status === 'stale').length;
  const quoteUnknown = input.quoteStatuses.filter(status => status === 'unknown').length;
  const quoteToday = input.quoteStatuses.filter(status => status === 'today').length;
  const quoteRecent = input.quoteStatuses.filter(status => status === 'recent-trading-day').length;
  const common: DecisionItem[] = [
    { id: 'market', category: 'market' as const, severity: marketFreshness === 'today' ? 'normal' : marketFreshness === 'recent-effective' ? 'info' : marketFreshness === 'stale' ? 'warning' : 'unavailable', title: '市場資料狀態', conclusion: marketFreshness === 'today' ? '部分市場資料為今日資料。' : marketFreshness === 'recent-effective' ? '市場資料為最近有效交易日或收盤資料。' : marketFreshness === 'stale' ? '市場資料時間較舊，請先確認。' : '市場資料不足，暫不解讀市場方向。', reason: `可用 ${marketAvailable.length} 項；上漲 ${marketUp} 項、下跌 ${marketDown} 項。`, evidence: [evidence('資料時效', marketFreshness, 'MarketSnapshot'), evidence('可用項目', String(marketAvailable.length), 'MarketSnapshot'), evidence('取得時間', input.market.fetchedAt || '未提供', 'MarketSnapshot', input.market.fetchedAt)], action: { label: '前往檢視', to: '/market' } },
    { id: 'concentration', category: 'concentration' as const, severity: input.risk.largestHoldingRatio > 70 ? 'critical' : input.risk.largestHoldingRatio >= 50 ? 'warning' : input.risk.largestHoldingRatio >= 30 ? 'info' : 'normal', title: '持股集中度', conclusion: input.risk.largest ? `${input.risk.largest.symbol} 為最大單一持股。` : '尚無可計入市值的持股資料。', reason: `最大單一持股 ${pct(finite(input.risk.largestHoldingRatio))}；前二大 ${pct(finite(input.risk.topTwoRatio))}；前三大 ${pct(finite(input.risk.topThreeRatio))}。`, evidence: [evidence('最大單一持股', input.risk.largest?.symbol || '無', 'deriveRiskMetrics'), evidence('最大持股比例', pct(finite(input.risk.largestHoldingRatio)), 'deriveRiskMetrics')], action: { label: '前往檢視', to: '/tools/risk-center' } },
    { id: 'cash', category: 'cash' as const, severity: input.risk.cashSafetyMonths !== null && input.risk.cashSafetyMonths < 3 ? 'critical' : input.risk.cashSafetyMonths !== null && input.risk.cashSafetyMonths < 6 ? 'warning' : 'normal', title: '現金與流動性', conclusion: input.risk.cashSafetyMonths === null ? '目前只顯示流動性；沒有借款月付資料可計算安全月數。' : `現金可支應約 ${input.risk.cashSafetyMonths.toFixed(1)} 個月借款還款。`, reason: `現金 ${money(nonNegative(input.risk.cash))}，占總資產 ${pct(finite(input.risk.cashRatio))}。`, evidence: [evidence('現金', money(nonNegative(input.risk.cash)), 'deriveRiskMetrics'), evidence('現金比例', pct(finite(input.risk.cashRatio)), 'deriveRiskMetrics'), evidence('安全月數', input.risk.cashSafetyMonths === null ? '資料不足' : `${input.risk.cashSafetyMonths.toFixed(1)} 個月`, 'deriveRiskMetrics')], action: { label: '前往檢視', to: '/tools/risk-center' } },
    { id: 'leverage', category: 'leverage' as const, severity: input.risk.leveragedRatio >= 60 ? 'critical' : input.risk.leveragedRatio >= 40 ? 'warning' : input.risk.leveragedRatio >= 20 ? 'info' : 'normal', title: '槓桿資產', conclusion: input.risk.leveragedAssets.length ? `已辨識 ${input.risk.leveragedAssets.length} 項槓桿資產。` : '目前未辨識到槓桿資產。', reason: `槓桿資產市值 ${money(nonNegative(input.risk.leveragedValue))}，占總資產 ${pct(finite(input.risk.leveragedRatio))}、成長資產 ${pct(finite(input.risk.leveragedGrowthRatio))}。辨識僅依名稱／代號規則。`, evidence: [evidence('已辨識項目', String(input.risk.leveragedAssets.length), 'deriveRiskMetrics'), evidence('占總資產', pct(finite(input.risk.leveragedRatio)), 'deriveRiskMetrics')], action: { label: '前往檢視', to: '/tools/risk-center' } },
    { id: 'drawdown', category: 'drawdown' as const, severity: !input.performance.canCalculateMaxDrawdown ? 'unavailable' : (input.performance.stats.maxDrawdown ?? 0) <= -0.2 ? 'warning' : 'normal', title: '投資資產最大回撤', conclusion: !input.performance.canCalculateMaxDrawdown ? '有效投資績效快照不足，暫無法計算最大回撤。' : `目前歷史最大回撤為 ${pct((input.performance.stats.maxDrawdown ?? 0) * 100)}。`, reason: '只使用每日投資資產快照；不混用淨資產回撤。', evidence: [evidence('有效快照', String(input.performance.snapshotCount), 'deriveInvestmentPerformanceQuality'), evidence('最大回撤', input.performance.canCalculateMaxDrawdown ? pct((input.performance.stats.maxDrawdown ?? 0) * 100) : '資料不足', 'deriveInvestmentPerformanceStats')], action: { label: '前往檢視', to: '/analytics' } },
    { id: 'dividend', category: 'dividend' as const, severity: input.dividend.summary.yearCount ? 'normal' : 'unavailable', title: '股息摘要', conclusion: input.dividend.summary.yearCount ? `本年已入帳 ${input.dividend.summary.yearCount} 筆有效股息。` : '尚無本年有效已入帳股息資料。', reason: `本月 ${money(nonNegative(input.dividend.summary.monthAmount))}；本年 ${money(nonNegative(input.dividend.summary.yearAmount))}；累計 ${money(nonNegative(input.dividend.summary.totalAmount))}。`, evidence: [evidence('最近一筆', input.dividend.summary.latest?.assetSymbol || '無', 'dividendSummary', input.dividend.summary.latest?.occurredAt), evidence('主要來源', input.dividend.sources[0]?.assetSymbol || input.dividend.sources[0]?.assetName || '無', 'dividendSources')], action: { label: '前往檢視', to: '/tools/dividend-center' } },
    { id: 'quote-freshness', category: 'quote-freshness' as const, severity: input.dashboard.holdingsCount === 0 ? 'unavailable' : input.quoteErrors || quoteUnknown ? 'critical' : quoteStale || input.backupQuoteCount ? 'warning' : quoteRecent ? 'info' : 'normal', title: '股價更新狀態', conclusion: input.dashboard.holdingsCount === 0 ? '尚無持股，無需更新股價。' : input.quoteErrors ? '存在報價錯誤，建議更新股價資料。' : quoteUnknown ? '存在日期不明報價，建議更新股價資料。' : quoteStale ? '存在過期報價，建議更新股價資料。' : quoteRecent ? '目前為最近有效交易日報價。' : '持股報價符合今日日期契約。', reason: input.dashboard.quoteStatus, evidence: [evidence('今日報價', String(quoteToday), 'quoteDateStatus'), evidence('最近有效', String(quoteRecent), 'quoteDateStatus'), evidence('過期／不明', `${quoteStale}／${quoteUnknown}`, 'quoteDateStatus'), evidence('報價錯誤', String(input.quoteErrors), 'quoteDisplayStatus')], action: { label: '前往檢視', to: '/assets' } },
  ];
  const anomalies = [input.dashboard.holdingsCount === 0 ? '尚無持股' : '', input.quoteErrors ? '報價錯誤' : '', quoteUnknown ? '報價日期不明' : '', input.targetOverLimit ? '目標比例合計超過 100%' : '', investment === null ? '投資資產數值無效' : '', totalAssets !== null && totalAssets === 0 && input.holdingMarketValue > 0 ? '總資產與持股市值互相矛盾' : '', marketFreshness === 'unavailable' ? '市場資料 unavailable' : '', input.performance.snapshotCount < 2 ? '投資績效快照不足' : '', input.dividend.summary.yearCount === 0 ? '股息有效資料不足' : ''].filter(Boolean);
  const quality: DecisionItem = { id: 'data-quality', category: 'data-quality', severity: anomalies.length ? (input.quoteErrors || input.targetOverLimit ? 'critical' : 'warning') : 'normal', title: '資料品質', conclusion: anomalies.length ? `偵測到 ${anomalies.length} 項需要留意的資料狀態。` : '目前未偵測到核心資料異常。', reason: anomalies.length ? anomalies.join('、') : '所有輸入均通過本地規則檢查。', evidence: [evidence('資料狀態', anomalies.length ? anomalies.join('、') : '正常', 'AI Decision Rule Engine'), evidence('今日日期', input.today, '輸入日期')], action: { label: '前往檢視', to: '/assets' } };
  const attention = [...common, quality].filter(item => item.severity === 'critical' || item.severity === 'warning').length;
  const today: DecisionItem = { id: 'today', category: 'today', severity: dayPnl === null || dayRate === null ? 'unavailable' : attention ? 'info' : 'normal', title: '今日投資摘要', conclusion: dayPnl === null || dayRate === null ? '今日損益資料不足，不以 0 替代。' : `目前投資資產 ${money(investment)}，今日損益 ${money(dayPnl)}。`, reason: `現金比例 ${pct(finite(input.dashboard.cashRatio))}；目前 ${attention} 項規則需要留意；報價狀態：${input.dashboard.quoteStatus}。`, evidence: [evidence('投資資產', money(investment), 'deriveInvestmentDashboard'), evidence('今日損益率', dayRate === null ? '資料不足' : pct(dayRate), 'deriveInvestmentDashboard'), evidence('報價狀態', input.dashboard.quoteStatus, 'quoteDisplayStatus')], action: { label: '前往檢視', to: '/home' } };
  return [today, ...common, quality];
}
