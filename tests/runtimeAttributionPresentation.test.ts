import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveRuntimeAttributionPresentation,
  formatRuntimeAttributionMoney,
  RUNTIME_ATTRIBUTION_FX_EXCLUDED_REASON,
  RUNTIME_ATTRIBUTION_RECONCILED_DISCLAIMER
} from '../src/lib/runtimeAttributionPresentation';
import type { RuntimeAttributionComposition } from '../src/lib/runtimeAttributionComposition';
import type { NetWorthSnapshot } from '../src/lib/netWorthHistory';

function snapshot(date: string, netWorth = 100): NetWorthSnapshot {
  return { date, netWorth, totalAssets: netWorth, investmentValue: 0, cash: netWorth, debt: 0 };
}

function baseComposition(overrides: Partial<RuntimeAttributionComposition> = {}): RuntimeAttributionComposition {
  return {
    netWorthChange: 50_000,
    classifiedEventContribution: 50_000,
    unexplainedResidual: 0,
    unexplainedResidualRatio: 0,
    attributionQuality: 'partial',
    eventClassifications: [],
    ledgerContribution: 20_000,
    derivedContribution: 30_000,
    reconciliationResults: [],
    diagnostics: [],
    ...overrides
  };
}

test('maps known composition values and marks reconciled only when attributionQuality is reconciled', () => {
  const partial = deriveRuntimeAttributionPresentation({
    composition: baseComposition({ attributionQuality: 'partial' }),
    openingSnapshot: snapshot('2026-08-01'),
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.equal(partial.reconciled, false);
  assert.equal(partial.quality, 'partial');
  assert.deepEqual(partial.netWorthChange, { status: 'known', value: 50_000 });
  assert.deepEqual(partial.ledgerContribution, { status: 'known', value: 20_000 });
  assert.deepEqual(partial.derivedContribution, { status: 'known', value: 30_000 });

  const reconciled = deriveRuntimeAttributionPresentation({
    composition: baseComposition({ attributionQuality: 'reconciled' }),
    openingSnapshot: snapshot('2026-08-01'),
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.equal(reconciled.reconciled, true);
});

test('null composition fields become unavailable, never coerced to zero', () => {
  const result = deriveRuntimeAttributionPresentation({
    composition: baseComposition({ netWorthChange: null, ledgerContribution: null, derivedContribution: null, unexplainedResidual: null, attributionQuality: 'unavailable' }),
    openingSnapshot: null,
    closingSnapshot: null
  });
  assert.deepEqual(result.netWorthChange, { status: 'unavailable', value: null });
  assert.deepEqual(result.ledgerContribution, { status: 'unavailable', value: null });
  assert.deepEqual(result.derivedContribution, { status: 'unavailable', value: null });
  assert.deepEqual(result.unexplainedResidual, { status: 'unavailable', value: null });
});

test('zero-length period is detected purely from the caller-supplied snapshot dates, not the composition output', () => {
  const sameDay = deriveRuntimeAttributionPresentation({
    composition: baseComposition(),
    openingSnapshot: snapshot('2026-08-05'),
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.equal(sameDay.period.isZeroLengthPeriod, true);
  assert.equal(sameDay.period.hasComparablePeriod, false);

  const distinctDays = deriveRuntimeAttributionPresentation({
    composition: baseComposition(),
    openingSnapshot: snapshot('2026-08-01'),
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.equal(distinctDays.period.isZeroLengthPeriod, false);
  assert.equal(distinctDays.period.hasComparablePeriod, true);

  const missing = deriveRuntimeAttributionPresentation({
    composition: baseComposition(),
    openingSnapshot: null,
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.equal(missing.period.isZeroLengthPeriod, false);
  assert.equal(missing.period.hasComparablePeriod, false);
});

test('adjustment and internal-transfer events surface as zero-contribution items with a human label', () => {
  const result = deriveRuntimeAttributionPresentation({
    composition: baseComposition({
      eventClassifications: [
        { id: 'adj-1', type: 'adjustment', provenance: 'ledger', disposition: 'adjustment', contribution: 0 },
        { id: 'xfer-1', type: 'internal-transfer', provenance: 'ledger', disposition: 'excluded', contribution: 0 },
        { id: 'income-1', type: 'external-income', provenance: 'ledger', disposition: 'contributing', contribution: 20_000 },
        { id: 'buy-1', type: 'investment-buy', provenance: 'derived-transaction', disposition: 'excluded', contribution: 0 }
      ]
    }),
    openingSnapshot: snapshot('2026-08-01'),
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.equal(result.zeroContributionItems.length, 2);
  assert.ok(result.zeroContributionItems.some(item => item.id === 'adj-1' && item.label.includes('僅供參考')));
  assert.ok(result.zeroContributionItems.some(item => item.id === 'xfer-1' && item.label.includes('僅供參考')));
  assert.ok(!result.zeroContributionItems.some(item => item.id === 'income-1'));
  assert.ok(!result.zeroContributionItems.some(item => item.id === 'buy-1'));
});

test('currency-unsupported diagnostics translate into a human-readable FX exclusion reason, not raw codes', () => {
  const result = deriveRuntimeAttributionPresentation({
    composition: baseComposition({
      diagnostics: [
        { code: 'ledger-event-currency-unsupported', eventId: 'ledger-fx-1' },
        { code: 'derived-transaction-currency-unsupported', transactionId: 'txn-fx-1' },
        { code: 'ledger-event-outside-period-excluded', eventId: 'ledger-out-of-range' }
      ]
    }),
    openingSnapshot: snapshot('2026-08-01'),
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.equal(result.fxExcludedItems.length, 2);
  assert.ok(result.fxExcludedItems.every(item => item.reason === RUNTIME_ATTRIBUTION_FX_EXCLUDED_REASON));
  assert.deepEqual(result.fxExcludedItems.map(item => ({ id: item.id, provenance: item.provenance })).sort((a, b) => a.id.localeCompare(b.id)), [
    { id: 'ledger-fx-1', provenance: 'ledger' },
    { id: 'txn-fx-1', provenance: 'derived-transaction' }
  ]);
});

test('reconciled disclaimer text is a stable exported constant, never paraphrased at the call site', () => {
  assert.equal(
    RUNTIME_ATTRIBUTION_RECONCILED_DISCLAIMER,
    '殘值在容許誤差內，不代表完整歸因，也不代表您已確認所有來源'
  );
});

test('formatRuntimeAttributionMoney formats known signed amounts and reports unavailable values as insufficient data', () => {
  assert.equal(formatRuntimeAttributionMoney({ status: 'known', value: 50_000 }), '+50,000 元');
  assert.equal(formatRuntimeAttributionMoney({ status: 'known', value: -1_234 }), '-1,234 元');
  assert.equal(formatRuntimeAttributionMoney({ status: 'known', value: 0 }), '0 元');
  assert.equal(formatRuntimeAttributionMoney({ status: 'unavailable', value: null }), '資料不足');
});
