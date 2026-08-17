import { BadgeDollarSign, BrainCircuit, ChartNoAxesCombined, Crosshair, Flame, LineChart, ListChecks, PieChart, Scale, ShieldAlert, ShieldCheck, WalletCards, type LucideIcon } from 'lucide-react';
import { getAllocationContext } from './allocationContext';

export type ToolId = 'etf-xray' | 'investment-backtest' | 'monte-carlo' | 'investment-action-center' | 'import-transactions' | 'dividend-center' | 'ai-decision' | 'portfolio-risk' | 'rebalance-recommendation' | 'clec-strategy' | 'wealth-goal' | 'cash-flow' | 'net-worth-history' | 'retirement-planner' | 'allocation-simulator' | 'risk-center';

/**
 * Optional, additive classification of a tool's relationship to real trading decisions.
 * 'real-recommendation': surfaces amounts derived from the user's actual holdings/data that are
 * meant to inform real rebalancing decisions. 'simulation': a what-if tool fed by hypothetical or
 * user-typed inputs that never reads/writes real holdings and does not represent a recommendation.
 * Tools that are neither (e.g. dividend center, net worth history) simply omit this field.
 */
export type ToolNature = 'real-recommendation' | 'simulation';

export const TOOL_NATURE_LABELS: Record<ToolNature, string> = {
  'real-recommendation': '真實建議',
  simulation: '假設模擬'
};

export type ToolGroup = 'today-decision' | 'management-tracking' | 'planning-simulation' | 'planned';

export const TOOL_GROUP_LABELS: Record<ToolGroup, string> = {
  'today-decision': '今日決策',
  'management-tracking': '管理與追蹤',
  'planning-simulation': '規劃與模擬',
  planned: '規劃中'
};

export const TOOL_GROUP_ORDER: readonly ToolGroup[] = [
  'today-decision',
  'management-tracking',
  'planning-simulation',
  'planned'
];

export type ToolDefinition = {
  id: ToolId;
  name: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  actionLabel?: string;
  nature?: ToolNature;
  group: ToolGroup;
  priority: number;
  related?: readonly ToolId[];
};

// Central routes used by the investment-decision summaries.  Tool routes remain
// owned by TOOL_DEFINITIONS; these cover the existing non-tool destinations.
export const INVESTMENT_DECISION_ROUTES = {
  assets: '/assets',
  market: '/market',
  analytics: '/analytics',
  settings: '/settings',
  portfolioRisk: '/tools/portfolio-risk',
  rebalanceRecommendation: '/tools/rebalance-recommendation',
  dividendCenter: '/tools/dividend-center',
  aiDecision: '/tools/ai-decision',
  investmentActionCenter: '/tools/investment-action-center'
} as const;

export function isTransactionToolsTarget(pathname: string, hash: string) {
  return pathname === '/assets' && hash === '#transactions-section';
}

// This is the sole product metadata source for Tool Center and tool-page quick links.
// Rendering from this data keeps the visible name, icon, route, IA group and contextual links aligned.
export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  { id: 'etf-xray', name: 'ETF X-Ray', description: '檢視 ETF 組成與曝險。', icon: PieChart, group: 'planned', priority: 1 },
  { id: 'investment-backtest', name: '三策略再平衡模擬比較', description: '純比較、不推薦、不代表建議：依你輸入的假設情境，並列比較聰明再平衡／無腦再平衡／比率再平衡三種策略的理論計算結果。', icon: ChartNoAxesCombined, to: '/tools/investment-backtest', actionLabel: '開始比較', nature: 'simulation', group: 'planning-simulation', priority: 5, related: ['allocation-simulator', 'clec-strategy', 'rebalance-recommendation'] },
  { id: 'monte-carlo', name: '蒙地卡羅模擬', description: '評估多種市場路徑下的資產結果。', icon: Crosshair, group: 'planned', priority: 2 },
  { id: 'investment-action-center', name: '投資行動中心', description: '集中查看既有每日投資判斷、待查看事項與對應工具，不產生買賣指令。', icon: ListChecks, to: INVESTMENT_DECISION_ROUTES.investmentActionCenter, actionLabel: '查看行動', group: 'today-decision', priority: 1, related: ['ai-decision', 'risk-center', 'rebalance-recommendation'] },
  { id: 'import-transactions', name: '交易匯入（Import Transactions）', description: '前往既有交易基礎的 Import Center，從 CSV 或 XLSX 建立匯入預覽。', icon: ListChecks, to: '/assets#transactions-section', actionLabel: '前往匯入', group: 'management-tracking', priority: 5, related: ['investment-action-center', 'portfolio-risk', 'dividend-center'] },
  { id: 'dividend-center', name: '配息中心', description: '集中整理配息與現金流。', icon: BadgeDollarSign, to: '/tools/dividend-center', actionLabel: '查看股息', group: 'management-tracking', priority: 2, related: ['cash-flow', 'net-worth-history', 'wealth-goal'] },
  { id: 'ai-decision', name: 'AI 決策中心', description: '以可追溯的本地規則整理投資資料，不使用生成式 AI。', icon: BrainCircuit, to: '/tools/ai-decision', actionLabel: '查看摘要', group: 'today-decision', priority: 2, related: ['investment-action-center', 'portfolio-risk', 'rebalance-recommendation'] },
  { id: 'portfolio-risk', name: '投資組合風險與配置中心', description: '整合目前配置、集中度、槓桿、現金安全、投資資產回撤與報價品質；不提供買賣建議。', icon: ShieldAlert, to: '/tools/portfolio-risk', actionLabel: '查看中心', group: 'management-tracking', priority: 1, related: ['risk-center', 'rebalance-recommendation', 'allocation-simulator'] },
  { id: 'rebalance-recommendation', name: '再平衡建議中心', description: '以可追溯的本機資料整理個別標的理論再平衡金額，不自動下單。', icon: Scale, to: '/tools/rebalance-recommendation', actionLabel: '查看中心', nature: 'real-recommendation', group: 'today-decision', priority: 4, related: ['investment-action-center', 'portfolio-risk', 'clec-strategy'] },
  { id: 'clec-strategy', name: 'CLEC 再平衡策略中心', description: '查看目前目標配置來源、可使用的再平衡方式，以及 CLEC 策略規格是否完整；不代表所有策略目前都可執行。', icon: Scale, to: '/tools/clec-strategy', actionLabel: '查看中心', nature: 'real-recommendation', group: 'planning-simulation', priority: 1, related: ['rebalance-recommendation', 'investment-backtest', 'allocation-simulator'] },
  { id: 'wealth-goal', name: 'FIRE／財富目標', description: '設定財富目標、每月投入與預期報酬率，查看目前進度及預估達成時間。', icon: Flame, to: '/tools/wealth-goal', actionLabel: '查看目標', group: 'planning-simulation', priority: 2, related: ['retirement-planner', 'cash-flow', 'net-worth-history'] },
  { id: 'cash-flow', name: '收支與現金流', description: '設定每月收入、必要支出與投資預算，掌握現金流壓力和緊急預備金。', icon: WalletCards, to: '/tools/cash-flow', actionLabel: '查看現金流', group: 'management-tracking', priority: 3, related: ['risk-center', 'wealth-goal', 'retirement-planner'] },
  { id: 'net-worth-history', name: '淨資產歷史中心', description: '以每日快照追蹤資產、現金、負債與淨資產的長期變化。', icon: LineChart, to: '/tools/net-worth-history', actionLabel: '查看歷史', group: 'management-tracking', priority: 4, related: ['wealth-goal', 'cash-flow', 'portfolio-risk'] },
  { id: 'retirement-planner', name: '退休試算', description: '以目前淨資產、退休支出與提領率試算目標退休金與填補缺口；僅為數學試算，非投資建議。', icon: ShieldCheck, to: '/tools/retirement-planner', actionLabel: '開始試算', nature: 'simulation', group: 'planning-simulation', priority: 3, related: ['wealth-goal', 'cash-flow', 'allocation-simulator'] },
  { id: 'allocation-simulator', name: getAllocationContext('simulation').name, description: getAllocationContext('simulation').description, icon: Scale, to: '/tools/allocation-simulator', actionLabel: '開始模擬', nature: 'simulation', group: 'planning-simulation', priority: 4, related: ['portfolio-risk', 'clec-strategy', 'investment-backtest'] },
  { id: 'risk-center', name: '風險與現金安全中心', description: '整合現金、借款、槓桿及資產集中風險，快速找出最需要優先處理的財務問題。', icon: ShieldAlert, to: '/tools/risk-center', actionLabel: '查看風險', group: 'today-decision', priority: 3, related: ['cash-flow', 'portfolio-risk', 'investment-action-center'] }
];

export function getToolQuickLinks(current?: ToolId) {
  if (!current) return [];
  const currentTool = TOOL_DEFINITIONS.find(tool => tool.id === current);
  if (!currentTool?.related) return [];

  return currentTool.related.flatMap(id => {
    const tool = TOOL_DEFINITIONS.find(candidate => candidate.id === id);
    if (!tool?.to || !tool.actionLabel || tool.id === current) return [];
    return [tool as ToolDefinition & { to: string; actionLabel: string }];
  });
}
