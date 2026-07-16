import { BadgeDollarSign, BrainCircuit, ChartNoAxesCombined, Crosshair, Flame, LineChart, ListChecks, PieChart, Scale, ShieldAlert, ShieldCheck, WalletCards, type LucideIcon } from 'lucide-react';

export type ToolId = 'etf-xray' | 'investment-backtest' | 'monte-carlo' | 'investment-action-center' | 'import-transactions' | 'dividend-center' | 'ai-decision' | 'portfolio-risk' | 'rebalance-recommendation' | 'clec-strategy' | 'wealth-goal' | 'cash-flow' | 'net-worth-history' | 'retirement-planner' | 'allocation-simulator' | 'risk-center';

export type ToolDefinition = {
  id: ToolId;
  name: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  actionLabel?: string;
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

// This is the sole product-order source for Tool Center and tool-page quick links.
// Rendering from this data keeps the visible name, icon, route and link metadata aligned.
export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  { id: 'etf-xray', name: 'ETF X-Ray', description: '檢視 ETF 組成與曝險。', icon: PieChart },
  { id: 'investment-backtest', name: '投資回測', description: '比較策略在歷史期間的表現。', icon: ChartNoAxesCombined },
  { id: 'monte-carlo', name: '蒙地卡羅模擬', description: '評估多種市場路徑下的資產結果。', icon: Crosshair },
  { id: 'investment-action-center', name: '投資行動中心', description: '集中查看既有每日投資判斷、待查看事項與對應工具，不產生買賣指令。', icon: ListChecks, to: INVESTMENT_DECISION_ROUTES.investmentActionCenter, actionLabel: '查看行動' },
  { id: 'import-transactions', name: '交易匯入（Import Transactions）', description: '前往既有交易基礎的 Import Center，從 CSV 或 XLSX 建立匯入預覽。', icon: ListChecks, to: '/assets#transactions-section', actionLabel: '前往匯入' },
  { id: 'dividend-center', name: '配息中心', description: '集中整理配息與現金流。', icon: BadgeDollarSign, to: '/tools/dividend-center', actionLabel: '查看股息' },
  { id: 'ai-decision', name: 'AI 決策中心', description: '以可追溯的本地規則整理投資資料，不使用生成式 AI。', icon: BrainCircuit, to: '/tools/ai-decision', actionLabel: '查看摘要' },
  { id: 'portfolio-risk', name: '投資組合風險與配置中心', description: '整合目前配置、集中度、槓桿、現金安全、投資資產回撤與報價品質；不提供買賣建議。', icon: ShieldAlert, to: '/tools/portfolio-risk', actionLabel: '查看中心' },
  { id: 'rebalance-recommendation', name: '再平衡建議中心', description: '以可追溯的本機資料整理個別標的理論再平衡金額，不自動下單。', icon: Scale, to: '/tools/rebalance-recommendation', actionLabel: '查看中心' },
  { id: 'clec-strategy', name: 'CLEC 再平衡策略中心', description: '查看目前目標配置來源、可使用的再平衡方式，以及 CLEC 策略規格是否完整；不代表所有策略目前都可執行。', icon: Scale, to: '/tools/clec-strategy', actionLabel: '查看中心' },
  { id: 'wealth-goal', name: 'FIRE／財富目標', description: '設定財富目標、每月投入與預期報酬率，查看目前進度及預估達成時間。', icon: Flame, to: '/tools/wealth-goal', actionLabel: '查看目標' },
  { id: 'cash-flow', name: '收支與現金流', description: '設定每月收入、必要支出與投資預算，掌握現金流壓力和緊急預備金。', icon: WalletCards, to: '/tools/cash-flow', actionLabel: '查看現金流' },
  { id: 'net-worth-history', name: '淨資產歷史中心', description: '以每日快照追蹤資產、現金、負債與淨資產的長期變化。', icon: LineChart, to: '/tools/net-worth-history', actionLabel: '查看歷史' },
  { id: 'retirement-planner', name: '退休試算', description: '估算退休資金需求與安全存量。', icon: ShieldCheck },
  { id: 'allocation-simulator', name: '資產配置模擬器', description: '調整目標配置與模擬投入金額，在不修改正式持股的情況下，預覽配置結果與再平衡方向。', icon: Scale, to: '/tools/allocation-simulator', actionLabel: '開始模擬' },
  { id: 'risk-center', name: '風險與現金安全中心', description: '整合現金、借款、槓桿及資產集中風險，快速找出最需要優先處理的財務問題。', icon: ShieldAlert, to: '/tools/risk-center', actionLabel: '查看風險' }
];

export function getToolQuickLinks(current?: ToolId) {
  return TOOL_DEFINITIONS.filter((tool): tool is ToolDefinition & { to: string; actionLabel: string } => Boolean(tool.to) && tool.id !== current);
}
