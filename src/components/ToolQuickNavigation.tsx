import { Link } from 'react-router-dom';
import { ArrowLeft, WalletCards } from 'lucide-react';
import { getToolQuickLinks, type ToolId } from '../lib/toolNavigation';

export type ToolRoute = ToolId;

export default function ToolQuickNavigation({ current, showAssetsReturn = false }: { current?: ToolRoute; showAssetsReturn?: boolean }) {
  return <nav className="tool-quick-navigation" aria-label="工具快速導覽">
    <Link to="/tools" aria-label="返回工具中心" title="返回工具中心"><ArrowLeft size={16} aria-hidden="true" /><span>返回工具中心</span></Link>
    {showAssetsReturn && <Link to="/assets" aria-label="返回資產" title="返回資產"><WalletCards size={16} aria-hidden="true" /><span>返回資產</span></Link>}
    {getToolQuickLinks(current).map(({ id, name, icon: Icon, to }) => <Link key={id} to={to} aria-label={name} title={name}><Icon size={16} aria-hidden="true" /><span>{name}</span></Link>)}
  </nav>;
}
