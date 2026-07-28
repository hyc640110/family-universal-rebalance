import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { HouseholdLiquidityDiagnosticPresentation } from '../lib/householdLiquidityDiagnosticPresentation';

type Props = Readonly<{
  title: string;
  presentation: HouseholdLiquidityDiagnosticPresentation;
}>;

export default function HouseholdLiquidityDiagnosticList({ title, presentation }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!presentation.items.length) return null;
  const visible = presentation.items.slice(0, 3);
  const additional = presentation.items.slice(3);
  const renderItem = (item: HouseholdLiquidityDiagnosticPresentation['items'][number]) => <li key={item.key}>
    <span>{item.message}</span>
    <Link to={item.action.to}>{item.action.label}</Link>
  </li>;

  return <aside className="household-liquidity-diagnostics" aria-label={title}>
    <strong>{title}</strong>
    <ul>{visible.map(renderItem)}</ul>
    {additional.length > 0 && <>
      <button type="button" className="household-liquidity-diagnostics-toggle" aria-expanded={expanded} onClick={() => setExpanded(current => !current)}>{expanded ? '收合' : '展開全部'}</button>
      {expanded && <ul>{additional.map(renderItem)}</ul>}
    </>}
  </aside>;
}
