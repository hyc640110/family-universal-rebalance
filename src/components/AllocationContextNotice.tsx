import { Link } from 'react-router-dom';
import { getAllocationContext, type AllocationContextId } from '../lib/allocationContext';

export default function AllocationContextNotice({ context: id, showCta = false }: { context: AllocationContextId; showCta?: boolean }) {
  const context = getAllocationContext(id);
  return <section className="allocation-context-notice" aria-label={`${context.name}說明`}>
    <span className="allocation-context-badge">{context.shortLabel}</span>
    <div>
      <strong>{context.name}</strong>
      <p>{context.description}</p>
    </div>
    {showCta && <Link to={context.route} aria-label={context.ariaLabel} title={context.title}>{context.ctaLabel}</Link>}
  </section>;
}
