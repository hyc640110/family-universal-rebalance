import { ArrowRight, BadgeDollarSign, BrainCircuit, ChartNoAxesCombined, Crosshair, Flame, LineChart, PieChart, Scale, ShieldAlert, ShieldCheck, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageFrame from './PageFrame';

const tools = [
  ['ETF X-Ray', '檢視 ETF 組成與曝險。', PieChart],
  ['投資回測', '比較策略在歷史期間的表現。', ChartNoAxesCombined],
  ['蒙地卡羅模擬', '評估多種市場路徑下的資產結果。', Crosshair],
  ['配息中心', '集中整理配息與現金流。', BadgeDollarSign],
  ['AI 決策中心', '以可追溯的本地規則整理投資資料，不使用生成式 AI。', BrainCircuit],
  ['投資組合風險與配置中心', '整合目前配置、集中度、槓桿、現金安全、投資資產回撤與報價品質；不提供買賣建議。', ShieldAlert],
  ['再平衡建議中心', '以可追溯的本機資料整理個別標的理論再平衡金額，不自動下單。', Scale],
  ['CLEC 再平衡策略中心', '查看目前目標配置來源、可使用的再平衡方式，以及 CLEC 策略規格是否完整；不代表所有策略目前都可執行。', Scale],
  ['FIRE／財富目標', '設定財富目標、每月投入與預期報酬率，查看目前進度及預估達成時間。', Flame],
  ['收支與現金流', '設定每月收入、必要支出與投資預算，掌握現金流壓力和緊急預備金。', WalletCards],
  ['淨資產歷史中心', '以每日快照追蹤資產、現金、負債與淨資產的長期變化。', LineChart],
  ['退休試算', '估算退休資金需求與安全存量。', ShieldCheck],
  ['資產配置模擬器', '調整目標配置與模擬投入金額，在不修改正式持股的情況下，預覽配置結果與再平衡方向。', Scale],
  ['風險與現金安全中心', '整合現金、借款、槓桿及資產集中風險，快速找出最需要優先處理的財務問題。', ShieldAlert],
] as const;

export default function ToolsPage() {
  return <PageFrame page="tools" title="工具" description="進階投資工具將在後續版本逐步提供。">
  <section className="tool-grid">{tools.map(([name, description, Icon]) => name === '資產配置模擬器' || name === '風險與現金安全中心' || name === '投資組合風險與配置中心' || name === '再平衡建議中心' || name === 'CLEC 再平衡策略中心' || name === 'FIRE／財富目標' || name === '收支與現金流' || name === '淨資產歷史中心' || name === '配息中心' || name === 'AI 決策中心' ? <article className="tool-card tool-card-active" key={name}>
      <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}</h2><p>{description}</p></div><Link to={name === 'AI 決策中心' ? '/tools/ai-decision' : name === '再平衡建議中心' ? '/tools/rebalance-recommendation' : name === 'CLEC 再平衡策略中心' ? '/tools/clec-strategy' : name === '投資組合風險與配置中心' ? '/tools/portfolio-risk' : name === '資產配置模擬器' ? '/tools/allocation-simulator' : name === '風險與現金安全中心' ? '/tools/risk-center' : name === '收支與現金流' ? '/tools/cash-flow' : name === '淨資產歷史中心' ? '/tools/net-worth-history' : name === '配息中心' ? '/tools/dividend-center' : '/tools/wealth-goal'}>{name === 'AI 決策中心' ? '查看摘要' : name === 'CLEC 再平衡策略中心' || name === '再平衡建議中心' || name === '投資組合風險與配置中心' ? '查看中心' : name === '資產配置模擬器' ? '開始模擬' : name === '風險與現金安全中心' ? '查看風險' : name === '收支與現金流' ? '查看現金流' : name === '淨資產歷史中心' ? '查看歷史' : name === '配息中心' ? '查看股息' : '查看目標'} <ArrowRight size={15} /></Link>
    </article> : <article className="tool-card" key={name} aria-disabled="true">
      <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}</h2><p>{description}</p></div><span>規劃中</span>
    </article>)}</section>
    <p className="note tool-note">這些入口目前不會產生模擬結果；完整功能將於後續版本提供。</p>
  </PageFrame>;
}
