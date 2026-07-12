import { Link } from 'react-router-dom';

export type ToolRoute = 'wealth-goal' | 'cash-flow' | 'net-worth-history' | 'allocation-simulator' | 'risk-center';
const links: { route: ToolRoute; label: string; to: string }[] = [
  { route: 'wealth-goal', label: 'FIRE／財富目標', to: '/tools/wealth-goal' },
  { route: 'cash-flow', label: '收支與現金流', to: '/tools/cash-flow' },
  { route: 'net-worth-history', label: '淨資產歷史中心', to: '/tools/net-worth-history' },
  { route: 'allocation-simulator', label: '資產配置模擬器', to: '/tools/allocation-simulator' },
  { route: 'risk-center', label: '風險與現金安全中心', to: '/tools/risk-center' }
];

export default function ToolQuickNavigation({ current }: { current: ToolRoute }) {
  return <nav className="tool-quick-navigation" aria-label="工具快速導覽"><Link to="/tools">返回工具中心</Link>{links.filter(link => link.route !== current).map(link => <Link key={link.route} to={link.to}>{link.label}</Link>)}</nav>;
}
