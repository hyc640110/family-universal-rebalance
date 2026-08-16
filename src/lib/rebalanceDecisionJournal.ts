import type { QuoteDateStatus } from './quoteMath';

export type RebalanceDecision = 'follow-recommendation' | 'defer' | 'reject';
export type RebalanceQuoteEvidence = {
  symbol: string;
  price: number | null;
  quoteDate: string | null;
  quoteTime: string | null;
  quoteStatus: QuoteDateStatus;
  quoteSource: string | null;
  quoteError: string | null;
};

/** The recommendation is deliberately structural: this contract must not depend on AppState. */
export type RebalanceRecommendationSnapshot = {
  canRecommend: boolean;
  [key: string]: unknown;
};

export type RebalanceDecisionSnapshotInput = {
  id: string;
  createdAt: string;
  asOfDate: string;
  decidedAt: string;
  decision: RebalanceDecision;
  note?: string | null;
  recommendation: RebalanceRecommendationSnapshot;
  quoteEvidence: RebalanceQuoteEvidence[];
};

export type RebalanceDecisionSnapshot = {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  asOfDate: string;
  decidedAt: string;
  decision: RebalanceDecision;
  note: string | null;
  recommendation: RebalanceRecommendationSnapshot;
  quoteEvidence: RebalanceQuoteEvidence[];
};

const decisions = new Set<RebalanceDecision>(['follow-recommendation', 'defer', 'reject']);
const quoteStatuses = new Set<QuoteDateStatus>(['today', 'recent-trading-day', 'stale', 'unknown', 'unavailable']);

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isTimestamp = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));
const isCalendarDay = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`));
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const cloneValue = (value: unknown, path: string): unknown => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} must be finite`);
    return value;
  }
  if (Array.isArray(value)) return value.map((item, index) => cloneValue(item, `${path}[${index}]`));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item, `${path}.${key}`)]));
  return value;
};

const freezeValue = <T>(value: T): T => {
  if (Array.isArray(value)) value.forEach(freezeValue);
  else if (isObject(value)) Object.values(value).forEach(freezeValue);
  return Object.freeze(value);
};

const validateQuoteEvidence = (value: unknown): value is RebalanceQuoteEvidence[] => {
  if (!Array.isArray(value)) return false;
  return value.every(item => {
    if (!isObject(item) || typeof item.symbol !== 'string' || item.symbol.trim() === '') return false;
    if (!(item.price === null || isFiniteNumber(item.price))) return false;
    if (!(item.quoteDate === null || typeof item.quoteDate === 'string')) return false;
    if (!(item.quoteTime === null || typeof item.quoteTime === 'string')) return false;
    if (!quoteStatuses.has(item.quoteStatus as QuoteDateStatus)) return false;
    if (!(item.quoteSource === null || typeof item.quoteSource === 'string')) return false;
    return item.quoteError === null || typeof item.quoteError === 'string';
  });
};

export function createRebalanceDecisionSnapshot(input: RebalanceDecisionSnapshotInput): RebalanceDecisionSnapshot {
  if (!isObject(input) || typeof input.id !== 'string' || input.id.trim() === '') throw new Error('id must be a non-empty string');
  if (!isTimestamp(input.createdAt)) throw new Error('createdAt must be a valid timestamp');
  if (!isCalendarDay(input.asOfDate)) throw new Error('asOfDate must be a valid calendar day');
  if (!isTimestamp(input.decidedAt)) throw new Error('decidedAt must be a valid timestamp');
  if (!decisions.has(input.decision)) throw new Error('decision is invalid');
  if (!isObject(input.recommendation) || input.recommendation.canRecommend !== true) throw new Error('canRecommend must be true');
  if (!validateQuoteEvidence(input.quoteEvidence)) throw new Error('quoteEvidence is invalid');
  const recommendation = cloneValue(input.recommendation, 'recommendation') as RebalanceRecommendationSnapshot;
  const quoteEvidence = cloneValue(input.quoteEvidence, 'quoteEvidence') as RebalanceQuoteEvidence[];
  return freezeValue({ schemaVersion: 1, id: input.id, createdAt: input.createdAt, asOfDate: input.asOfDate, decidedAt: input.decidedAt, decision: input.decision, note: input.note ?? null, recommendation, quoteEvidence });
}

export function normalizeRebalanceDecisionSnapshot(value: unknown): RebalanceDecisionSnapshot | null {
  try {
    if (!isObject(value) || value.schemaVersion !== 1 || typeof value.id !== 'string' || value.id.trim() === '') return null;
    if (!isTimestamp(value.createdAt) || !isCalendarDay(value.asOfDate) || !isTimestamp(value.decidedAt) || !decisions.has(value.decision as RebalanceDecision)) return null;
    if (!isObject(value.recommendation) || value.recommendation.canRecommend !== true || !validateQuoteEvidence(value.quoteEvidence)) return null;
    if (!(value.note === null || typeof value.note === 'string' || typeof value.note === 'undefined')) return null;
    return createRebalanceDecisionSnapshot({
      id: value.id,
      createdAt: value.createdAt,
      asOfDate: value.asOfDate,
      decidedAt: value.decidedAt,
      decision: value.decision as RebalanceDecision,
      note: value.note as string | null | undefined,
      recommendation: value.recommendation as RebalanceRecommendationSnapshot,
      quoteEvidence: value.quoteEvidence as RebalanceQuoteEvidence[],
    });
  } catch {
    return null;
  }
}

export function normalizeRebalanceDecisionJournal(value: unknown): RebalanceDecisionSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    const normalized = normalizeRebalanceDecisionSnapshot(item);
    return normalized ? [normalized] : [];
  });
}
