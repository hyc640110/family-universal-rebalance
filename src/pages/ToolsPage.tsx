import { ArrowRight, BadgeDollarSign, ChartNoAxesCombined, Crosshair, Flame, PieChart, Scale, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageFrame from './PageFrame';

const tools = [
  ['ETF X-Ray', '檢視 ETF 組成與曝險。', PieChart],
  ['投資回測', '比較策略在歷史期間的表現。', ChartNoAxesCombined],
  ['蒙地卡羅模擬', '評估多種市場路徑下的資產結果。', Crosshair],
  ['配息中心', '集中整理配息與現金流。', BadgeDollarSign],
  ['FIRE／財富目標', '追蹤財務自由目標進度。', Flame],
  ['退休試算', '估算退休資金需求與安全存量。', ShieldCheck],
  ['資產配置模擬器', '調整目標配置與模擬投入金額，在不修改正式持股的情況下，預覽配置結果與再平衡方向。', Scale],
] as const;

export default function ToolsPage() {
  return <PageFrame page="tools" title="工具" description="進階投資工具將在後續版本逐步提供。">
    <section className="tool-grid">{tools.map(([name, description, Icon]) => name === '資產配置模擬器' ? <article className="tool-card tool-card-active" key={name}>
      <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}</h2><p>{description}</p></div><Link to="/tools/allocation-simulator">開始模擬 <ArrowRight size={15} /></Link>
    </article> : <article className="tool-card" key={name} aria-disabled="true">
      <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}</h2><p>{description}</p></div><span>規劃中</span>
    </article>)}</section>
    <p className="note tool-note">這些入口目前不會產生模擬結果；完整功能將於後續版本提供。</p>
  </PageFrame>;
}
