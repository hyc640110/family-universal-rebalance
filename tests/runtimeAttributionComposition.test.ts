import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { FinancialAccount } from '../src/lib/financialAccounts';
import type { FinancialEvent, FinancialEventType } from '../src/lib/financialEvents';
import { composeRuntimeNetWorthAttribution } from '../src/lib/runtimeAttributionComposition';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = { createdAt: '2026-08-02T00:00:00.000Z', updatedAt: '2026-08-02T00:00:00.000Z' };

const accounts: FinancialAccount[] = [
  { id: 'bank-a', name: 'A', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 0, ...audit },
  { id: 'bank-b', name: 'B', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 1, ...audit },
  { id: 'usd-a', name: 'USD', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'USD', institutionName: '', note: '', isActive: true, sortOrder: 2, ...audit }
];

function snapshot(date: string, netWorth: number) {
  return { date, netWorth, totalAssets: netWorth, investmentValue: 0, cash: netWorth, debt: 0 };
}

function transaction(id: string, patch: Partial<FinancialTransaction> = {}): FinancialTransaction {
  return {
    id, accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 100,
    currency: 'TWD', categoryId: 'income-salary', description: '', merchant: '', note: '',
    occurredAt: '2026-08-02T00:00:00.000Z', fingerprint: '', excluded: false, ...audit, ...patch
  };
}

function ledgerEvent(id: string, type: FinancialEventType = 'external-income', patch: Partial<FinancialEvent> = {}): FinancialEvent {
  return {
    id, type, status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 100,
    currency: 'TWD', accountId: 'bank-a', note: '', ...audit, ...patch
  };
}

function compose(input: Partial<Parameters<typeof composeRuntimeNetWorthAttribution>[0]> = {}) {
  return composeRuntimeNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 100),
    closingSnapshot: snapshot('2026-08-05', 100),
    ledgerEvents: [],
    transactions: [],
    accounts,
    ...input
  });
}

test('Ledger 與不相關 derived evidence 在同一期間合成，且保留 residual identity 與 provenance', () => {
  const result = compose({
    openingSnapshot: snapshot('2026-08-01', 5_000_000),
    closingSnapshot: snapshot('2026-08-05', 5_100_000),
    ledgerEvents: [ledgerEvent('ledger-income', 'external-income', { amount: 20_000 })],
    transactions: [transaction('derived-income', { amount: 30_000, occurredAt: '2026-08-03T00:00:00.000Z' })]
  });

  assert.equal(result.ledgerContribution, 20_000);
  assert.equal(result.derivedContribution, 30_000);
  assert.equal(result.classifiedEventContribution, 50_000);
  assert.equal(result.unexplainedResidual, 50_000);
  assert.equal(result.netWorthChange, result.ledgerContribution + result.derivedContribution + result.unexplainedResidual);
  assert.equal(result.attributionQuality, 'partial');
  assert.deepEqual(result.eventClassifications.map(item => [item.id, item.provenance, item.contribution]), [
    ['ledger-income', 'ledger', 20_000],
    ['derived-income', 'derived-transaction', 30_000]
  ]);
});

test('有效 linked Ledger event 優先，已消費 transaction 不得再產生 derived contribution', () => {
  const result = compose({
    closingSnapshot: snapshot('2026-08-05', 200),
    ledgerEvents: [ledgerEvent('linked-income', 'external-income', { source: 'linked-transaction', transactionId: 'already-linked' })],
    transactions: [transaction('already-linked')]
  });

  assert.equal(result.ledgerContribution, 100);
  assert.equal(result.derivedContribution, 0);
  assert.equal(result.reconciliationResults.find(item => item.transactionId === 'already-linked')?.status, 'matched');
  assert.deepEqual(result.eventClassifications.map(item => item.provenance), ['ledger']);
});

test('derived-only evidence 可在 residual 落入容差時成為 reconciled，但 provenance 仍明確標示為 derived', () => {
  const result = compose({
    closingSnapshot: snapshot('2026-08-05', 200),
    transactions: [transaction('derived-only')]
  });

  assert.equal(result.ledgerContribution, 0);
  assert.equal(result.derivedContribution, 100);
  assert.equal(result.unexplainedResidual, 0);
  assert.equal(result.attributionQuality, 'reconciled');
  assert.deepEqual(result.eventClassifications.map(item => [item.id, item.provenance]), [['derived-only', 'derived-transaction']]);
});

test('duplicate、ambiguous、unsupported 與 invalid transaction 一律不得成為 derived contribution', () => {
  const result = compose({
    transactions: [
      transaction('duplicate'),
      transaction('ambiguous'),
      transaction('unsupported', { type: 'expense', categoryId: 'expense-investment' }),
      transaction('invalid', { amount: 0 })
    ],
    ledgerEvents: [
      ledgerEvent('duplicate-a', 'external-income', { source: 'linked-transaction', transactionId: 'duplicate' }),
      ledgerEvent('duplicate-b', 'external-income', { source: 'linked-transaction', transactionId: 'duplicate' }),
      ledgerEvent('manual-ambiguous')
    ]
  });

  assert.equal(result.derivedContribution, 0);
  assert.deepEqual(result.reconciliationResults.map(item => [item.transactionId, item.status]), [
    ['duplicate', 'duplicate'],
    ['ambiguous', 'ambiguous'],
    ['unsupported', 'unsupported'],
    ['invalid', 'invalid']
  ]);
});

test('Ledger 與 derived 共用 opening < effectiveDate <= closing 台北日曆日期間，且同 transactionId 最多一次', () => {
  const result = compose({
    openingSnapshot: snapshot('2026-08-01', 100),
    closingSnapshot: snapshot('2026-08-02', 500),
    ledgerEvents: [
      ledgerEvent('opening-ledger', 'external-income', { effectiveDate: '2026-08-01' }),
      ledgerEvent('closing-ledger', 'external-income', { effectiveDate: '2026-08-02' })
    ],
    transactions: [
      transaction('opening-derived', { occurredAt: '2026-08-01T01:00:00.000Z' }),
      transaction('closing-derived', { occurredAt: '2026-08-01T16:00:00.000Z' }),
      transaction('closing-derived', { amount: 999, occurredAt: '2026-08-01T16:00:00.000Z' })
    ]
  });

  assert.equal(result.ledgerContribution, 100);
  assert.equal(result.derivedContribution, 100);
  assert.deepEqual(result.eventClassifications.map(item => item.id), ['closing-ledger', 'closing-derived']);
  assert.equal(result.diagnostics.some(item => item.code === 'ledger-event-outside-period-excluded'), true);
});

test('同日且淨值相同的有效 snapshots 是 zero-length period，不得因日期相同而 unavailable', () => {
  const result = compose({
    openingSnapshot: snapshot('2026-08-02', 100),
    closingSnapshot: snapshot('2026-08-02', 100)
  });

  assert.equal(result.netWorthChange, 0);
  assert.equal(result.ledgerContribution, 0);
  assert.equal(result.derivedContribution, 0);
  assert.equal(result.unexplainedResidual, 0);
  assert.equal(result.attributionQuality, 'snapshot-only');
  assert.equal(result.diagnostics.some(item => item.code === 'invalid-attribution-period'), false);
});

test('同日 snapshot 淨值差額保留為 residual，Ledger 與 derived evidence 都不得進入空期間', () => {
  const result = compose({
    openingSnapshot: snapshot('2026-08-02', 100),
    closingSnapshot: snapshot('2026-08-02', 120),
    ledgerEvents: [ledgerEvent('same-day-ledger', 'external-income', { effectiveDate: '2026-08-02', amount: 20 })],
    transactions: [transaction('same-day-derived', { amount: 20, occurredAt: '2026-08-01T16:00:00.000Z' })]
  });

  assert.equal(result.netWorthChange, 20);
  assert.equal(result.ledgerContribution, 0);
  assert.equal(result.derivedContribution, 0);
  assert.equal(result.unexplainedResidual, 20);
  assert.equal(result.attributionQuality, 'snapshot-only');
  assert.deepEqual(result.eventClassifications, []);
  assert.equal(result.diagnostics.some(item => item.code === 'ledger-event-outside-period-excluded'), true);
});

test('倒序或非 canonical 日期才是 invalid attribution period', () => {
  const reverse = compose({
    openingSnapshot: snapshot('2026-08-03', 100),
    closingSnapshot: snapshot('2026-08-02', 120)
  });
  const invalidDate = compose({
    openingSnapshot: snapshot('invalid-date', 100),
    closingSnapshot: snapshot('2026-08-02', 120)
  });

  for (const result of [reverse, invalidDate]) {
    assert.equal(result.netWorthChange, null);
    assert.equal(result.ledgerContribution, null);
    assert.equal(result.derivedContribution, null);
    assert.equal(result.unexplainedResidual, null);
    assert.equal(result.attributionQuality, 'unavailable');
    assert.equal(result.diagnostics.some(item => item.code === 'invalid-attribution-period'), true);
  }
});

test('external income、expense、dividend 的正負號正確；transfer 與 adjustment 都是零貢獻診斷', () => {
  const result = compose({
    closingSnapshot: snapshot('2026-08-05', 115),
    ledgerEvents: [
      ledgerEvent('income', 'external-income', { amount: 30 }),
      ledgerEvent('expense', 'external-expense', { amount: 10 }),
      ledgerEvent('dividend', 'dividend', { amount: 5 }),
      ledgerEvent('transfer', 'internal-transfer', { amount: 50 }),
      ledgerEvent('adjustment', 'adjustment', { amount: 30 })
    ]
  });

  assert.equal(result.ledgerContribution, 25);
  assert.equal(result.derivedContribution, 0);
  assert.equal(result.unexplainedResidual, -10);
  assert.equal(result.attributionQuality, 'partial');
  assert.deepEqual(result.eventClassifications.map(item => [item.id, item.contribution, item.disposition]), [
    ['income', 30, 'contributing'], ['expense', -10, 'contributing'], ['dividend', 5, 'contributing'],
    ['transfer', 0, 'excluded'], ['adjustment', 0, 'adjustment']
  ]);
  assert.equal(result.diagnostics.some(item => item.code === 'adjustment-excluded'), true);
});

test('adjustment 不降低 residual、不提升 quality，且單獨存在時不會成為 reconciled', () => {
  const result = compose({
    closingSnapshot: snapshot('2026-08-05', 130),
    ledgerEvents: [ledgerEvent('adjustment', 'adjustment', { amount: 30 })]
  });

  assert.equal(result.ledgerContribution, 0);
  assert.equal(result.unexplainedResidual, 30);
  assert.equal(result.attributionQuality, 'snapshot-only');
});

test('非 TWD Ledger 或 transaction evidence 均 fail-safe 排除並保留診斷', () => {
  const result = compose({
    ledgerEvents: [ledgerEvent('usd-ledger', 'external-income', { currency: 'USD', amount: 50 })],
    transactions: [transaction('usd-derived', { accountId: 'usd-a', currency: 'USD' })]
  });

  assert.equal(result.ledgerContribution, 0);
  assert.equal(result.derivedContribution, 0);
  assert.equal(result.diagnostics.some(item => item.code === 'ledger-event-currency-unsupported'), true);
  assert.equal(result.diagnostics.some(item => item.code === 'derived-transaction-currency-unsupported'), true);
});

test('composition 對輸入不 mutation，並保留 derived evidence 是 runtime provenance 而非 Ledger event', () => {
  const ledgerEvents = [ledgerEvent('ledger', 'external-income', { amount: 20 })];
  const transactions = [transaction('derived')];
  const before = JSON.stringify({ ledgerEvents, transactions, accounts });

  const result = compose({ ledgerEvents, transactions });

  assert.equal(JSON.stringify({ ledgerEvents, transactions, accounts }), before);
  assert.equal(result.eventClassifications.some(item => item.provenance === 'derived-transaction'), true);
  assert.equal(result.eventClassifications.some(item => item.id === 'derived' && item.provenance === 'ledger'), false);
});

test('composition 的台北日期邊界不依 runtime timezone 改變', () => {
  const code = "import { composeRuntimeNetWorthAttribution } from './src/lib/runtimeAttributionComposition.ts'; console.log(JSON.stringify(composeRuntimeNetWorthAttribution({ openingSnapshot: { date: '2026-08-01', netWorth: 0, totalAssets: 0, investmentValue: 0, cash: 0, debt: 0 }, closingSnapshot: { date: '2026-08-02', netWorth: 100, totalAssets: 100, investmentValue: 0, cash: 100, debt: 0 }, ledgerEvents: [], transactions: [{ id: 'boundary', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'income-salary', description: '', merchant: '', note: '', occurredAt: '2026-08-01T16:00:00.000Z', fingerprint: '', excluded: false, createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' }], accounts: [{ id: 'bank-a', name: 'A', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 0, createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' }] })));";
  const projectRoot = fileURLToPath(new URL('..', import.meta.url));
  const outputs = ['UTC', 'Asia/Taipei', 'America/New_York'].map(timeZone => execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', code], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, TZ: timeZone }
  }).trim());

  assert.deepEqual(outputs, [outputs[0], outputs[0], outputs[0]]);
  assert.match(outputs[0]!, /"derivedContribution":100/);
});
