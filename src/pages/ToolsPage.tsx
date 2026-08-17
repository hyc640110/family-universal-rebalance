import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TOOL_DEFINITIONS, TOOL_GROUP_LABELS, TOOL_GROUP_ORDER, TOOL_NATURE_LABELS } from '../lib/toolNavigation';
import PageFrame from './PageFrame';

export default function ToolsPage() {
  return <PageFrame page="tools" title="工具" description="多數投資工具已上線、可直接使用；標示「規劃中」的項目尚未提供功能。">
    {TOOL_GROUP_ORDER.map(group => {
      const tools = TOOL_DEFINITIONS
        .filter(tool => tool.group === group)
        .slice()
        .sort((a, b) => a.priority - b.priority);

      return <section className="tool-section" key={group} aria-labelledby={`tool-section-${group}`}>
        <h2 id={`tool-section-${group}`} className="tool-section-title">{TOOL_GROUP_LABELS[group]}</h2>
        <div className="tool-grid">{tools.map(({ id, name, description, icon: Icon, to, actionLabel, nature }) => to ? <article className="tool-card tool-card-active" key={id}>
          <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}{nature && <span className={`tool-nature-badge tool-nature-${nature}`}>{TOOL_NATURE_LABELS[nature]}</span>}</h2><p>{description}</p></div><Link to={to} aria-label={name} title={name}>{actionLabel} <ArrowRight size={15} aria-hidden="true" /></Link>
        </article> : <article className="tool-card" key={id} aria-disabled="true">
          <div className="tool-icon"><Icon size={22} aria-hidden="true" /></div><div><h2>{name}{nature && <span className={`tool-nature-badge tool-nature-${nature}`}>{TOOL_NATURE_LABELS[nature]}</span>}</h2><p>{description}</p></div><span>規劃中</span>
        </article>)}</div>
      </section>;
    })}
    <p className="note tool-note">標示「規劃中」的入口尚未提供功能；其餘入口皆為目前已上線、可直接使用的工具。</p>
  </PageFrame>;
}
