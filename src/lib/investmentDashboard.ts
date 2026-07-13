export type DashboardDecision = { title: string; reason: string; to: string };

export type InvestmentDashboardInput = {
  totalAssets: number;
  investmentValue: number;
  dayPnl: number;
  todayPnlAvailable: boolean;
  monthChange: number | null;
  yearChange: number | null;
  growthRatio: number | null;
  defensiveRatio: number | null;
  cashRatio: number | null;
  allocationDeviation: number | null;
  rebalanceThreshold: number;
  thresholdReached: boolean;
  decision: DashboardDecision;
  quoteStatus: string;
  lastQuoteAt?: string;
  hasUpdatedQuotes: boolean;
  syncDirty: boolean;
  syncStatus: string;
  targetInvalid: boolean;
  holdingsCount: number;
};

export type DashboardReminder = { key: string; title: string; detail: string; tone: 'warn' | 'neutral' };

const finite = (value: number | null | undefined): number | null => Number.isFinite(value) ? Number(value) : null;

export function deriveInvestmentDashboard(input: InvestmentDashboardInput) {
  const dayPnl = input.todayPnlAvailable ? finite(input.dayPnl) : null;
  const priorInvestmentValue = input.investmentValue - (dayPnl ?? 0);
  const dayPnlRate = dayPnl !== null && priorInvestmentValue > 0 ? dayPnl / priorInvestmentValue * 100 : null;
  const reminders: DashboardReminder[] = [];
  if (input.holdingsCount === 0) reminders.push({ key: 'holdings', title: '尚無持股資料', detail: '新增持股與目標比例後，才能提供投資配置摘要。', tone: 'neutral' });
  if (input.quoteStatus !== '報價正常') reminders.push({ key: 'quotes', title: '股價資料需要確認', detail: input.quoteStatus, tone: 'warn' });
  if (input.targetInvalid) reminders.push({ key: 'targets', title: '目標比例需要調整', detail: '持股目標比例合計超過 100%。', tone: 'warn' });
  if (input.thresholdReached) reminders.push({ key: 'rebalance', title: '配置已偏離目標', detail: `偏離已達既有再平衡門檻 ${input.rebalanceThreshold.toFixed(1)}%。`, tone: 'warn' });
  if (input.syncDirty) reminders.push({ key: 'sync', title: '本機資料尚未同步', detail: input.syncStatus || '請依需要使用既有手動上傳功能。', tone: 'neutral' });
  return {
    dayPnl,
    dayPnlRate,
    monthChange: finite(input.monthChange),
    yearChange: finite(input.yearChange),
    growthRatio: finite(input.growthRatio),
    defensiveRatio: finite(input.defensiveRatio),
    cashRatio: finite(input.cashRatio),
    allocationDeviation: finite(input.allocationDeviation),
    lastQuoteAt: input.hasUpdatedQuotes && input.lastQuoteAt ? input.lastQuoteAt : null,
    decision: input.decision,
    reminders
  };
}
