import { BadgeDollarSign, BrainCircuit, ChartNoAxesCombined, Crosshair, Flame, LineChart, PieChart, Scale, ShieldAlert, ShieldCheck, WalletCards, type LucideIcon } from 'lucide-react';

export type ToolId = 'etf-xray' | 'investment-backtest' | 'monte-carlo' | 'dividend-center' | 'ai-decision' | 'portfolio-risk' | 'rebalance-recommendation' | 'clec-strategy' | 'wealth-goal' | 'cash-flow' | 'net-worth-history' | 'retirement-planner' | 'allocation-simulator' | 'risk-center';

export type ToolDefinition = {
  id: ToolId;
  name: string;
  quickLabel?: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  actionLabel?: string;
};

// This is the single product navigation order. Tool Center and every tool-page
// quick link derive their order from here; planned tools stay unavailable.
export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  { id: 'etf-xray', name: 'ETF X-Ray', description: '檢視 ETF 組成與曝險。', icon: PieChart },
  { id: 'investment-backtest', name: '投資回測', description: '比較策略在歷史期間的表現。', icon: ChartNoAxesCombined },
  { id: 'monte-carlo', name: '蒙地卡羅模擬', description: '評估多種市場路徑下的資產結果。', icon: Crosshair },
  { id: 'dividend-center', name: '配息中心', quickLabel: '股息中心', description: '集中整理配息與現金流。', icon: BadgeDollarSign, to: '/tools/dividend-center', actionLabel: '查看股息' },
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

export const TOOL_NAVIGATION_ORDER = TOOL_DEFINITIONS.map(tool => tool.id) as readonly ToolId[];

export const getAvailableToolsInNavigationOrder = () => TOOL_DEFINITIONS.filter((tool): tool is ToolDefinition & Required<Pick<ToolDefinition, 'to' | 'actionLabel'>> => Boolean(tool.to && tool.actionLabel));

export const getToolQuickLinks = (current: ToolId) => getAvailableToolsInNavigationOrder().filter(tool => tool.id !== current);
