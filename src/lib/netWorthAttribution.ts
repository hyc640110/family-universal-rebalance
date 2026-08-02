import type { FinancialEvent, FinancialEventType } from './financialEvents';
import type { NetWorthSnapshot } from './netWorthHistory';

export const DEFAULT_NET_WORTH_ATTRIBUTION_ABSOLUTE_TOLERANCE = 0.01;

export type NetWorthAttributionQuality = 'unavailable' | 'snapshot-only' | 'partial' | 'reconciled';

export type NetWorthAttributionEventDisposition = 'contributing' | 'excluded' | 'unsupported' | 'not-posted' | 'adjustment';

export type NetWorthAttributionEventClassification = {
  id: string;
  type: FinancialEventType;
  disposition: NetWorthAttributionEventDisposition;
  contribution: number;
};

export type NetWorthAttributionDiagnosticCode =
  | 'opening-snapshot-unavailable'
  | 'closing-snapshot-unavailable'
  | 'not-posted-excluded'
  | 'excluded-from-net-worth-change'
  | 'unsupported-event-excluded'
  | 'adjustment-excluded'
  | 'invalid-event-amount-excluded';

export type NetWorthAttributionDiagnostic = {
  code: NetWorthAttributionDiagnosticCode;
  eventId?: string;
  eventType?: FinancialEventType;
};

export type NetWorthAttributionInput = {
  openingSnapshot?: NetWorthSnapshot | null;
  closingSnapshot?: NetWorthSnapshot | null;
  events: readonly FinancialEvent[];
  absoluteTolerance?: number;
};

export type NetWorthAttribution = {
  netWorthChange: number | null;
  classifiedEventContribution: number | null;
  unexplainedResidual: number | null;
  unexplainedResidualRatio: number | null;
  attributionQuality: NetWorthAttributionQuality;
  eventClassifications: NetWorthAttributionEventClassification[];
  diagnostics: NetWorthAttributionDiagnostic[];
};

const ZERO_EFFECT_EVENT_TYPES = new Set<FinancialEventType>([
  'internal-transfer',
  'investment-buy',
  'investment-sell',
  'loan-disbursement'
]);

function validNetWorth(snapshot: NetWorthSnapshot | null | undefined): snapshot is NetWorthSnapshot {
  return snapshot !== null && snapshot !== undefined && typeof snapshot.netWorth === 'number' && Number.isFinite(snapshot.netWorth);
}

function tolerance(input: number | undefined): number {
  return typeof input === 'number' && Number.isFinite(input) && input >= 0
    ? input
    : DEFAULT_NET_WORTH_ATTRIBUTION_ABSOLUTE_TOLERANCE;
}

function classifyEvent(event: FinancialEvent): { classification: NetWorthAttributionEventClassification; diagnostic?: NetWorthAttributionDiagnostic } {
  if (event.status !== 'posted') {
    return {
      classification: { id: event.id, type: event.type, disposition: 'not-posted', contribution: 0 },
      diagnostic: { code: 'not-posted-excluded', eventId: event.id, eventType: event.type }
    };
  }

  if (!Number.isFinite(event.amount) || event.amount <= 0) {
    return {
      classification: { id: event.id, type: event.type, disposition: 'unsupported', contribution: 0 },
      diagnostic: { code: 'invalid-event-amount-excluded', eventId: event.id, eventType: event.type }
    };
  }

  if (event.type === 'external-income' || event.type === 'dividend') {
    return { classification: { id: event.id, type: event.type, disposition: 'contributing', contribution: event.amount } };
  }

  if (event.type === 'external-expense' || event.type === 'investment-fee') {
    return { classification: { id: event.id, type: event.type, disposition: 'contributing', contribution: -event.amount } };
  }

  if (ZERO_EFFECT_EVENT_TYPES.has(event.type)) {
    return {
      classification: { id: event.id, type: event.type, disposition: 'excluded', contribution: 0 },
      diagnostic: { code: 'excluded-from-net-worth-change', eventId: event.id, eventType: event.type }
    };
  }

  if (event.type === 'adjustment') {
    return {
      classification: { id: event.id, type: event.type, disposition: 'adjustment', contribution: 0 },
      diagnostic: { code: 'adjustment-excluded', eventId: event.id, eventType: event.type }
    };
  }

  return {
    classification: { id: event.id, type: event.type, disposition: 'unsupported', contribution: 0 },
    diagnostic: { code: 'unsupported-event-excluded', eventId: event.id, eventType: event.type }
  };
}

/**
 * Pure C1-ledger attribution boundary. It accounts only for posted, safely classified
 * economic events and leaves all remaining change as an explicit unexplained residual.
 * The residual is never a market-effect or investment-return claim.
 */
export function deriveNetWorthAttribution(input: NetWorthAttributionInput): NetWorthAttribution {
  const diagnostics: NetWorthAttributionDiagnostic[] = [];
  if (!validNetWorth(input.openingSnapshot)) diagnostics.push({ code: 'opening-snapshot-unavailable' });
  if (!validNetWorth(input.closingSnapshot)) diagnostics.push({ code: 'closing-snapshot-unavailable' });

  const eventResults = input.events.map(classifyEvent);
  const eventClassifications = eventResults.map(item => item.classification);
  diagnostics.push(...eventResults.flatMap(item => item.diagnostic ? [item.diagnostic] : []));

  if (!validNetWorth(input.openingSnapshot) || !validNetWorth(input.closingSnapshot)) {
    return {
      netWorthChange: null,
      classifiedEventContribution: null,
      unexplainedResidual: null,
      unexplainedResidualRatio: null,
      attributionQuality: 'unavailable',
      eventClassifications,
      diagnostics
    };
  }

  const netWorthChange = input.closingSnapshot.netWorth - input.openingSnapshot.netWorth;
  const classifiedEventContribution = eventClassifications.reduce((total, item) => total + item.contribution, 0);
  const unexplainedResidual = netWorthChange - classifiedEventContribution;
  const unexplainedResidualRatio = input.openingSnapshot.netWorth === 0
    ? null
    : unexplainedResidual / Math.abs(input.openingSnapshot.netWorth);
  const hasContributingEvent = eventClassifications.some(item => item.disposition === 'contributing');
  const attributionQuality: NetWorthAttributionQuality = !hasContributingEvent
    ? 'snapshot-only'
    : Math.abs(unexplainedResidual) <= tolerance(input.absoluteTolerance)
      ? 'reconciled'
      : 'partial';

  return {
    netWorthChange,
    classifiedEventContribution,
    unexplainedResidual,
    unexplainedResidualRatio,
    attributionQuality,
    eventClassifications,
    diagnostics
  };
}
