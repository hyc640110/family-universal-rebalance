import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TOOL_DEFINITIONS } from '../lib/toolNavigation';
import PageFrame from './PageFrame';

export default function ToolsPage() {
  return <PageFrame page="tools" title="工具" description="進階投資工具將在後續版本逐步提供。">
  <section className="tool-grid">{TOOL_DEFINITIONS.map(({ id, name, description, icon: Icon, to, actionLabel }) => to ? <article className="tool-card tool-card-active" key={id}>
      <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}</h2><p>{description}</p></div><Link to={to}>{actionLabel} <ArrowRight size={15} /></Link>
    </article> : <article className="tool-card" key={id} aria-disabled="true">
      <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}</h2><p>{description}</p></div><span>規劃中</span>
    </article>)}</section>
    <p className="note tool-note">這些入口目前不會產生模擬結果；完整功能將於後續版本提供。</p>
  </PageFrame>;
}
