import { ArrowRight, BadgeDollarSign, ChartNoAxesCombined, Crosshair, Flame, PieChart, Scale, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageFrame from './PageFrame';

const tools = [
  ['ETF X-Ray', '檢視 ETF 組成與曝險。', PieChart],
  ['投資回測', '比較策略在歷史期間的表現。', ChartNoAxesCombined],
  ['蒙地卡羅模擬', '評估多種市場路徑下的資產結果。', Crosshair],
  ['配息中心', '集中整理配息與現金流。', BadgeDollarSign],
  ['FIRE／財富目標', '設定財富目標、每月投入與預期報酬率，查看目前進度及預估達成時間。', Flame],
  ['退休試算', '估算退休資金需求與安全存量。', ShieldCheck],
  ['資產配置模擬器', '調整目標配置與模擬投入金額，在不修改正式持股的情況下，預覽配置結果與再平衡方向。', Scale],
  ['風險與現金安全中心', '整合現金、借款、槓桿及資產集中風險，快速找出最需要優先處理的財務問題。', ShieldAlert],
] as const;

export default function ToolsPage() {
  return <PageFrame page="tools" title="工具" description="進階投資工具將在後續版本逐步提供。">
    <section className="tool-grid">{tools.map(([name, description, Icon]) => name === '資產配置模擬器' || name === '風險與現金安全中心' || name === 'FIRE／財富目標' ? <article className="tool-card tool-card-active" key={name}>
      <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}</h2><p>{description}</p></div><Link to={name === '資產配置模擬器' ? '/tools/allocation-simulator' : name === '風險與現金安全中心' ? '/tools/risk-center' : '/tools/wealth-goal'}>{name === '資產配置模擬器' ? '開始模擬' : name === '風險與現金安全中心' ? '查看風險' : '查看目標'} <ArrowRight size={15} /></Link>
    </article> : <article className="tool-card" key={name} aria-disabled="true">
      <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}</h2><p>{description}</p></div><span>規劃中</span>
    </article>)}</section>
    <p className="note tool-note">這些入口目前不會產生模擬結果；完整功能將於後續版本提供。</p>
  </PageFrame>;
}
