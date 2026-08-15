import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveRuntimeAttributionPresentation,
  formatRuntimeAttributionItemContribution,
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
  assert.ok(result.zeroContributionItems.some(item => item.id === 'adj-1' && item.note.includes('僅供參考') && item.contribution === 0));
  assert.ok(result.zeroContributionItems.some(item => item.id === 'xfer-1' && item.note.includes('僅供參考') && item.contribution === 0));
  assert.ok(!result.zeroContributionItems.some(item => item.id === 'income-1'));
  assert.ok(!result.zeroContributionItems.some(item => item.id === 'buy-1'));
});

test('derivedEvidenceItems only includes contributing derived-transaction rows, never ledger evidence or zero/excluded dispositions', () => {
  const result = deriveRuntimeAttributionPresentation({
    composition: baseComposition({
      eventClassifications: [
        { id: 'derived-income-1', type: 'external-income', provenance: 'derived-transaction', disposition: 'contributing', contribution: 15_000 },
        { id: 'derived-dividend-1', type: 'dividend', provenance: 'derived-transaction', disposition: 'contributing', contribution: 3_000 },
        { id: 'ledger-income-1', type: 'external-income', provenance: 'ledger', disposition: 'contributing', contribution: 20_000 },
        { id: 'derived-adj-1', type: 'adjustment', provenance: 'derived-transaction', disposition: 'adjustment', contribution: 0 },
        { id: 'derived-unsupported-1', type: 'investment-buy', provenance: 'derived-transaction', disposition: 'excluded', contribution: 0 }
      ]
    }),
    openingSnapshot: snapshot('2026-08-01'),
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.equal(result.derivedEvidenceItems.length, 2);
  assert.deepEqual(result.derivedEvidenceItems.map(item => item.id).sort(), ['derived-dividend-1', 'derived-income-1']);
  assert.ok(result.derivedEvidenceItems.every(item => item.provenance === 'derived-transaction'));
  const income = result.derivedEvidenceItems.find(item => item.id === 'derived-income-1')!;
  assert.equal(income.contribution, 15_000);
  assert.equal(income.type, 'external-income');
  assert.equal(income.note, '外部收入');
});

test('UR-TODO-054-A: Loan derived-transaction rows (interest/fee/penalty) are excluded from derivedEvidenceItems — the generic card must never expose a component-level confirm button for a Loan repayment', () => {
  const result = deriveRuntimeAttributionPresentation({
    composition: baseComposition({
      eventClassifications: [
        { id: 'loan-payment:payment-1:principal', type: 'loan-principal-payment', provenance: 'derived-transaction', disposition: 'excluded', contribution: 0 },
        { id: 'loan-payment:payment-1:interest', type: 'loan-interest-payment', provenance: 'derived-transaction', disposition: 'contributing', contribution: -5_000 },
        { id: 'loan-payment:payment-1:fee', type: 'loan-fee', provenance: 'derived-transaction', disposition: 'contributing', contribution: -100 },
        { id: 'loan-payment:payment-1:penalty', type: 'loan-penalty', provenance: 'derived-transaction', disposition: 'contributing', contribution: -200 },
        { id: 'loan-draw:payment-2', type: 'loan-disbursement', provenance: 'derived-transaction', disposition: 'excluded', contribution: 0 },
        // A genuine non-Loan safe-taxonomy candidate must still surface normally alongside the excluded Loan rows.
        { id: 'derived-income-1', type: 'external-income', provenance: 'derived-transaction', disposition: 'contributing', contribution: 15_000 }
      ]
    }),
    openingSnapshot: snapshot('2026-08-01'),
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.deepEqual(result.derivedEvidenceItems.map(item => item.id), ['derived-income-1']);
  assert.ok(!result.derivedEvidenceItems.some(item => item.id.startsWith('loan-payment:') || item.id.startsWith('loan-draw:')));
  assert.ok(!result.derivedEvidenceItems.some(item => typeof item.type === 'string' && item.type.startsWith('loan-')));
});

test('UR-TODO-054-B: an fx-conversion classification (always zero-effect/excluded, per netWorthAttribution.ts\'s ZERO_EFFECT_EVENT_TYPES) never surfaces as a generic derivedEvidenceItems row — confirms the 054-B Contract Audit finding that FX has no Loan-style generic confirmation exposure, so RuntimeAttributionProvenanceCard needed no FX-specific exclusion logic', () => {
  const result = deriveRuntimeAttributionPresentation({
    composition: baseComposition({
      eventClassifications: [
        { id: 'fx-conversion-event-1', type: 'fx-conversion', provenance: 'ledger', disposition: 'excluded', contribution: 0 },
        { id: 'fx-conversion-event-2', type: 'fx-conversion', provenance: 'derived-transaction', disposition: 'excluded', contribution: 0 },
        // A genuine non-FX safe-taxonomy candidate must still surface normally alongside the excluded FX rows.
        { id: 'derived-income-1', type: 'external-income', provenance: 'derived-transaction', disposition: 'contributing', contribution: 15_000 }
      ]
    }),
    openingSnapshot: snapshot('2026-08-01'),
    closingSnapshot: snapshot('2026-08-05')
  });
  assert.deepEqual(result.derivedEvidenceItems.map(item => item.id), ['derived-income-1']);
  assert.ok(!result.derivedEvidenceItems.some(item => item.type === 'fx-conversion'));
  assert.ok(!result.zeroContributionItems.some(item => item.type === 'fx-conversion'), 'fx-conversion is a distinct type from adjustment/internal-transfer, so it is correctly invisible everywhere in this card, not just derivedEvidenceItems');
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
  assert.ok(result.fxExcludedItems.every(item => item.note === RUNTIME_ATTRIBUTION_FX_EXCLUDED_REASON));
  assert.ok(result.fxExcludedItems.every(item => item.contribution === null));
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

test('formatRuntimeAttributionItemContribution treats null contribution as insufficient data, distinct from a genuine 0', () => {
  assert.equal(formatRuntimeAttributionItemContribution({ id: 'a', provenance: 'derived-transaction', contribution: 15_000, note: '' }), '+15,000 元');
  assert.equal(formatRuntimeAttributionItemContribution({ id: 'b', provenance: 'ledger', contribution: 0, note: '' }), '0 元');
  assert.equal(formatRuntimeAttributionItemContribution({ id: 'c', provenance: 'ledger', contribution: null, note: '' }), '資料不足');
});
