import assert from 'node:assert/strict';
import test from 'node:test';
import type { FinancialEvent, FinancialEventStatus, FinancialEventType } from '../src/lib/financialEvents';
import { deriveNetWorthAttribution } from '../src/lib/netWorthAttribution';

const audit = {
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z'
};

function snapshot(date: string, netWorth: number) {
  return { date, netWorth, totalAssets: netWorth, investmentValue: 0, cash: netWorth, debt: 0 };
}

function event(
  type: FinancialEventType,
  amount: number,
  status: FinancialEventStatus = 'posted',
  id = `${type}-${status}-${amount}`
): FinancialEvent {
  return {
    id,
    type,
    status,
    source: 'manual',
    effectiveDate: '2026-08-02',
    amount,
    currency: 'TWD',
    accountId: 'account-a',
    note: '',
    ...audit
  };
}

test('snapshot-only: +10 萬淨值差額保留為 residual，不命名為市場效果', () => {
  const result = deriveNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 5_000_000),
    closingSnapshot: snapshot('2026-08-02', 5_100_000),
    events: []
  });

  assert.equal(result.netWorthChange, 100_000);
  assert.equal(result.classifiedEventContribution, 0);
  assert.equal(result.unexplainedResidual, 100_000);
  assert.equal(result.unexplainedResidualRatio, 0.02);
  assert.equal(result.attributionQuality, 'snapshot-only');
  assert.equal('marketEffect' in result, false);
});

test('external income and expense contribute with their economic signs', () => {
  const result = deriveNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 100),
    closingSnapshot: snapshot('2026-08-02', 110),
    events: [event('external-income', 20), event('external-expense', 10)]
  });

  assert.equal(result.classifiedEventContribution, 10);
  assert.equal(result.unexplainedResidual, 0);
  assert.equal(result.attributionQuality, 'reconciled');
  assert.deepEqual(result.eventClassifications.map(item => item.contribution), [20, -10]);
});

test('internal transfer, investment buy/sell, and loan disbursement are evidence only with zero contribution', () => {
  const result = deriveNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 100),
    closingSnapshot: snapshot('2026-08-02', 100),
    events: [
      event('internal-transfer', 50),
      event('investment-buy', 30),
      event('investment-sell', 25),
      event('loan-disbursement', 40)
    ]
  });

  assert.equal(result.classifiedEventContribution, 0);
  assert.equal(result.unexplainedResidual, 0);
  assert.equal(result.attributionQuality, 'snapshot-only');
  assert.deepEqual(result.eventClassifications.map(item => item.disposition), ['excluded', 'excluded', 'excluded', 'excluded']);
});

test('pending and void events remain auditable but never affect completed-period attribution', () => {
  const result = deriveNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 100),
    closingSnapshot: snapshot('2026-08-02', 100),
    events: [event('external-income', 20, 'pending'), event('external-income', 30, 'void')]
  });

  assert.equal(result.classifiedEventContribution, 0);
  assert.equal(result.unexplainedResidual, 0);
  assert.equal(result.attributionQuality, 'snapshot-only');
  assert.deepEqual(result.eventClassifications.map(item => item.disposition), ['not-posted', 'not-posted']);
});

test('正式 Loan component 讓本金維持零貢獻，利息只有一次負貢獻', () => {
  const result = deriveNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 100),
    closingSnapshot: snapshot('2026-08-02', 80),
    events: [event('loan-principal-payment', 10), event('loan-interest-payment', 10)]
  });

  assert.equal(result.classifiedEventContribution, -10);
  assert.equal(result.unexplainedResidual, -10);
  assert.equal(result.attributionQuality, 'partial');
  assert.deepEqual(result.eventClassifications.map(item => [item.disposition, item.contribution]), [['excluded', 0], ['contributing', -10]]);
});

test('one posted dividend contributes once, while adjustment stays explicitly non-market evidence', () => {
  const result = deriveNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 100),
    closingSnapshot: snapshot('2026-08-02', 115),
    events: [event('dividend', 10, 'posted', 'dividend-once'), event('adjustment', 5)]
  });

  assert.equal(result.classifiedEventContribution, 10);
  assert.equal(result.unexplainedResidual, 5);
  assert.equal(result.attributionQuality, 'partial');
  assert.deepEqual(result.eventClassifications.map(item => [item.type, item.disposition, item.contribution]), [
    ['dividend', 'contributing', 10],
    ['adjustment', 'adjustment', 0]
  ]);
  assert.equal(result.diagnostics.some(item => item.code === 'adjustment-excluded'), true);
});

test('valid zero snapshot is available, while missing or non-finite snapshot is unavailable', () => {
  const zero = deriveNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 0),
    closingSnapshot: snapshot('2026-08-02', 20),
    events: [event('external-income', 20)]
  });
  const missing = deriveNetWorthAttribution({ openingSnapshot: undefined, closingSnapshot: snapshot('2026-08-02', 20), events: [] });
  const nonFinite = deriveNetWorthAttribution({ openingSnapshot: snapshot('2026-08-01', Number.NaN), closingSnapshot: snapshot('2026-08-02', 20), events: [] });

  assert.equal(zero.attributionQuality, 'reconciled');
  assert.equal(zero.netWorthChange, 20);
  assert.equal(zero.unexplainedResidualRatio, null);
  assert.equal(missing.attributionQuality, 'unavailable');
  assert.equal(missing.netWorthChange, null);
  assert.equal(nonFinite.attributionQuality, 'unavailable');
});

test('calculator is deterministic and does not mutate snapshots or Ledger events', () => {
  const openingSnapshot = snapshot('2026-08-01', 100);
  const closingSnapshot = snapshot('2026-08-02', 120);
  const events = [event('external-income', 20)];
  const before = JSON.stringify({ openingSnapshot, closingSnapshot, events });

  const first = deriveNetWorthAttribution({ openingSnapshot, closingSnapshot, events });
  const second = deriveNetWorthAttribution({ openingSnapshot, closingSnapshot, events });

  assert.deepEqual(second, first);
  assert.equal(JSON.stringify({ openingSnapshot, closingSnapshot, events }), before);
});
