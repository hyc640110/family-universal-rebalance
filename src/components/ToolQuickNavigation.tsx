import { Link } from 'react-router-dom';
import { getToolQuickLinks, type ToolId } from '../lib/toolNavigation';

export type ToolRoute = ToolId;

export default function ToolQuickNavigation({ current }: { current: ToolRoute }) {
  return <nav className="tool-quick-navigation" aria-label="工具快速導覽"><Link to="/tools" aria-label="返回工具中心" title="返回工具中心">返回工具中心</Link>{getToolQuickLinks(current).map(link => <Link key={link.id} to={link.to} aria-label={link.name} title={link.name}>{link.name}</Link>)}</nav>;
}
