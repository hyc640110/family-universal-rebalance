import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  computeDatasetHash,
  deriveClecTwReferencePeriods,
  runClecTwReferenceValidation,
  type ClecTwReferenceFixture
} from '../scripts/clecTwReferenceDataset';

const FIXTURE_PATH = new URL('./fixtures/clecTwReferenceV1.json', import.meta.url);
const rawFixtureText = readFileSync(FIXTURE_PATH, 'utf8');
const fixture: ClecTwReferenceFixture = JSON.parse(rawFixtureText);

// Locked from an actual run of runClecTwReferenceValidation() against the committed fixture
// (deriveClecTwReferencePeriods() -> runClecHistoricalBacktest(), the existing Production
// Foundation, unmodified). Not hand-authored "plausible-looking" numbers.
// UR-TODO-014-A2: window extended from 2025-08-29 to 2026-04-30 to embed 00631L's 22:1 split and
// search for a real-history full_rebalance trigger (see AC1/AC2 tests below). All four numbers
// changed because the window changed; the hash intentionally differs from the prior UR-TODO-014-A value.
const EXPECTED_DATASET_HASH = '5c143ec124492934e6e1dcb115b68b5d71414691e252d9440601164ce2221c8c';
const EXPECTED_COMMON_DATE_COUNT = 214;
const EXPECTED_PERIOD_COUNT = 213;
const EXPECTED_RUN = {
  'clec-442': { totalReturnPct: 134.32397423511665, maxDrawdownPct: 13.196019390796765, rebalanceCount: 1, rebalanceDates: ['2026-01-05'] as string[] },
  'clec-433': { totalReturnPct: 110.34216051537568, maxDrawdownPct: 10.899811042646979, rebalanceCount: 1, rebalanceDates: ['2026-01-05'] as string[] },
  'clec-703': { totalReturnPct: 157.75256337403877, maxDrawdownPct: 16.029124339825707, rebalanceCount: 2, rebalanceDates: ['2025-10-07', '2026-04-22'] as string[] },
  'clec-5050': { totalReturnPct: 104.35416277249195, maxDrawdownPct: 10.173380687647049, rebalanceCount: 2, rebalanceDates: ['2025-09-12', '2026-01-27'] as string[] }
} as const;
const THRESHOLD = { drift: 5, significantMultiplier: 2 };
const INITIAL_CAPITAL = 1_000_000;

const close = (actual: number, expected: number, epsilon = 1e-9) => Math.abs(actual - expected) <= epsilon;

test('A. dataset metadata contract has every required provenance field', () => {
  for (const field of [
    'datasetId', 'datasetVersion', 'startDate', 'endDate', 'frequency', 'timezone',
    'priceBasis', 'returnSemantics', 'executionAssumption', 'missingDataPolicy',
    'referencePortfolio', 'mappingSemantics', 'provenance'
  ]) {
    assert.ok(Object.prototype.hasOwnProperty.call(fixture, field), `missing metadata field: ${field}`);
  }
  assert.equal((fixture as unknown as { datasetId: string }).datasetId, 'clec-tw-reference-v1');
  assert.equal(fixture.startDate, '2025-06-02');
  assert.equal(fixture.endDate, '2026-04-30');
});

test('B. reference portfolio mapping is explicitly validation-only, not CLEC canonical', () => {
  assert.deepEqual(fixture.referencePortfolio, { prototype: '0050', leveraged: '00631L', 'cash-like': '00865B' });
  assert.match(fixture.mappingSemantics, /validation-only/);
  assert.match(fixture.mappingSemantics, /NOT the CLEC canonical symbol mapping/);
  assert.match(fixture.mappingSemantics, /NOT a Production default portfolio/);
  assert.match(fixture.mappingSemantics, /NOT an AppState role mapping/);
  assert.match(fixture.mappingSemantics, /NOT the user's current holdings mapping/);
  assert.match(fixture.mappingSemantics, /NOT the UR-TODO-058/);
});

test('C. fixture hash is stable and changes if the fixture content changes', () => {
  assert.equal(computeDatasetHash(rawFixtureText), EXPECTED_DATASET_HASH);
  const tampered = rawFixtureText.replace('175.90', '175.91');
  assert.notEqual(computeDatasetHash(tampered), EXPECTED_DATASET_HASH);
});

test('D. common-date validation: only dates where all three reference symbols have an official close', () => {
  const derived = deriveClecTwReferencePeriods(fixture);
  assert.equal(derived.status, 'ok');
  if (derived.status !== 'ok') return;
  assert.equal(derived.commonDateCount, EXPECTED_COMMON_DATE_COUNT);
  assert.equal(derived.periods.length, EXPECTED_PERIOD_COUNT);
  const dates = derived.periods.map(p => p.date);
  for (const suspendedDate of ['2025-06-11', '2025-06-12', '2025-06-13', '2025-06-16', '2025-06-17']) {
    assert.ok(!dates.includes(suspendedDate), `${suspendedDate} is inside 0050's documented split suspension and must never become a period`);
  }
  for (const suspendedDate of ['2026-03-25', '2026-03-26', '2026-03-27', '2026-03-30']) {
    assert.ok(!dates.includes(suspendedDate), `${suspendedDate} is inside 00631L's documented 22:1 split suspension and must never become a period`);
  }
  for (const makeupHolidayDate of ['2025-09-29', '2025-10-24']) {
    assert.ok(!dates.includes(makeupHolidayDate), `${makeupHolidayDate} is an official 2025 makeup non-trading day and must never become a period`);
  }
  for (let i = 1; i < dates.length; i += 1) assert.ok(dates[i] > dates[i - 1], 'period dates must be strictly increasing');
});

test('E. an undocumented missing price on an otherwise-trading day fails closed, not silently skipped', () => {
  const corrupted: ClecTwReferenceFixture = JSON.parse(rawFixtureText);
  corrupted.rawPrices['00865B'] = corrupted.rawPrices['00865B'].filter(([date]) => date !== '2025-07-10');
  const derived = deriveClecTwReferencePeriods(corrupted);
  assert.equal(derived.status, 'invalid_input');
  if (derived.status !== 'invalid_input') return;
  assert.ok(derived.issues.some(issue => issue.includes('2025-07-10') && issue.includes('fail-closed')));
});

test('F. a non-finite raw price fails closed instead of propagating NaN/Infinity into a period', () => {
  const corrupted: ClecTwReferenceFixture = JSON.parse(rawFixtureText);
  const index = corrupted.rawPrices['0050'].findIndex(([date]) => date === '2025-07-15');
  (corrupted.rawPrices['0050'] as unknown as [string, number][])[index] = ['2025-07-15', Number.NaN];
  const derived = deriveClecTwReferencePeriods(corrupted);
  assert.equal(derived.status, 'invalid_input');
});

test('G. 0050 4:1 split normalization: split-adjusted period return is small, not a fabricated ~-75% cliff', () => {
  const derived = deriveClecTwReferencePeriods(fixture);
  assert.equal(derived.status, 'ok');
  if (derived.status !== 'ok') return;
  const period = derived.periods.find(p => p.date === '2025-06-18');
  assert.ok(period);
  assert.ok(close(period!.returnPctByRole.prototype, 0.8640339252584228, 1e-6));
  assert.ok(Math.abs(period!.returnPctByRole.prototype) < 5, 'a real 4:1 split must never surface as a huge single-day move');

  const split = fixture.provenance.corporateActions['0050'].split;
  assert.equal(split.ratio, '4:1');
  const naiveUnadjustedReturnPct = (split.resumedTradingDayOfficialClose / split.lastTradingDayPreSplitOfficialClose - 1) * 100;
  assert.ok(naiveUnadjustedReturnPct < -70, 'without split-adjustment the raw close-to-close ratio looks like a fabricated ~-75% crash');
  assert.ok(Math.abs(period!.returnPctByRole.prototype - naiveUnadjustedReturnPct) > 50, 'normalization must materially correct the naive unadjusted return');
});

test('H. 00631L 22:1 split normalization evidence, now embedded in the main backtest window (UR-TODO-014-A2)', () => {
  const split = fixture.provenance.corporateActions['00631L'].split;
  assert.ok(split);
  assert.equal(split!.ratio, '22:1');
  assert.equal(split!.lastTradingDayPreSplitOfficialClose, 443.15);
  assert.equal(split!.officialReferencePriceOnResume, 20.14);
  const computed = Math.round((split!.lastTradingDayPreSplitOfficialClose / 22) * 100) / 100;
  assert.equal(computed, split!.officialReferencePriceOnResume, '443.15 / 22 must reproduce the officially reported 20.14 post-split reference price');
  assert.ok(split!.resumedTradingDay <= fixture.endDate, 'UR-TODO-014-A2 extended the window specifically so this split falls inside it, not just as standalone evidence');
});

test('H2. 00631L 22:1 split normalization: split-adjusted period return is small, not a fabricated ~-95% cliff', () => {
  const derived = deriveClecTwReferencePeriods(fixture);
  assert.equal(derived.status, 'ok');
  if (derived.status !== 'ok') return;
  const period = derived.periods.find(p => p.date === '2026-03-31');
  assert.ok(period);
  assert.ok(close(period!.returnPctByRole.leveraged, -4.38451991425024, 1e-6));
  assert.ok(Math.abs(period!.returnPctByRole.leveraged) < 10, 'a real 22:1 split must never surface as a huge single-day move');

  const split = fixture.provenance.corporateActions['00631L'].split!;
  const naiveUnadjustedReturnPct = (split.resumedTradingDayOfficialClose / split.lastTradingDayPreSplitOfficialClose - 1) * 100;
  assert.ok(naiveUnadjustedReturnPct < -90, 'without split-adjustment the raw close-to-close ratio looks like a fabricated ~-95% crash');
  assert.ok(Math.abs(period!.returnPctByRole.leveraged - naiveUnadjustedReturnPct) > 80, 'normalization must materially correct the naive unadjusted return');
});

test('I. 0050 distribution-inclusive return uses the official ex-dividend amount, not a bare price-return', () => {
  const derived = deriveClecTwReferencePeriods(fixture);
  assert.equal(derived.status, 'ok');
  if (derived.status !== 'ok') return;
  const period = derived.periods.find(p => p.date === '2025-07-21');
  assert.ok(period);
  const distribution = fixture.provenance.corporateActions['0050'].distributionsAppliedInThisDataset.find(d => d.exDividendDate === '2025-07-21');
  assert.ok(distribution);
  assert.equal(distribution!.amountPerUnit, 0.36);
  assert.ok(close(period!.returnPctByRole.prototype, -0.36929057337221627, 1e-6));

  const priorDate = derived.periods[derived.periods.indexOf(period!) - 1].date;
  const rawPrev = fixture.rawPrices['0050'].find(([date]) => date === priorDate)![1];
  const rawNow = fixture.rawPrices['0050'].find(([date]) => date === '2025-07-21')![1];
  const naivePriceOnlyReturn = (rawNow / rawPrev - 1) * 100;
  assert.notEqual(period!.returnPctByRole.prototype, naivePriceOnlyReturn, 'the distribution-inclusive return must differ from a bare price-only return on the ex-dividend date');
});

test('I2. 0050 second distribution-inclusive ex-dividend date (2026-01-22, UR-TODO-014-A2 window extension)', () => {
  const derived = deriveClecTwReferencePeriods(fixture);
  assert.equal(derived.status, 'ok');
  if (derived.status !== 'ok') return;
  const period = derived.periods.find(p => p.date === '2026-01-22');
  assert.ok(period);
  const distribution = fixture.provenance.corporateActions['0050'].distributionsAppliedInThisDataset.find(d => d.exDividendDate === '2026-01-22');
  assert.ok(distribution);
  assert.equal(distribution!.amountPerUnit, 1.0);
  assert.ok(close(period!.returnPctByRole.prototype, 1.3221990257480831, 1e-6));

  const priorDate = derived.periods[derived.periods.indexOf(period!) - 1].date;
  const rawPrev = fixture.rawPrices['0050'].find(([date]) => date === priorDate)![1];
  const rawNow = fixture.rawPrices['0050'].find(([date]) => date === '2026-01-22')![1];
  const naivePriceOnlyReturn = (rawNow / rawPrev - 1) * 100;
  assert.notEqual(period!.returnPctByRole.prototype, naivePriceOnlyReturn, 'the distribution-inclusive return must differ from a bare price-only return on the ex-dividend date');
});

test('J. 00631L and 00865B carry zero official distribution records in this window, cross-checked against provenance', () => {
  assert.deepEqual(fixture.provenance.corporateActions['00631L'].distributions, []);
  assert.deepEqual(fixture.provenance.corporateActions['00865B'].distributions, []);
  assert.match((fixture.provenance.corporateActions['00865B'] as unknown as { fundContractPolicy: string }).fundContractPolicy, /收益不分配/);
});

test('K. reuses the existing Production Foundation and never duplicates the 442/433/703/5050 target-weight table', () => {
  const source = readFileSync(new URL('../scripts/clecTwReferenceDataset.ts', import.meta.url), 'utf8');
  assert.match(source, /import \{ createHash \} from 'node:crypto';\n/);
  assert.match(source, /runClecHistoricalBacktest/);
  assert.doesNotMatch(source, /'clec-442':\s*\{\s*prototype:\s*40/, 'must not re-declare the CLEC preset weight table that already lives in allocationPresets.ts');
  assert.doesNotMatch(source, /localStorage\.|state\.holdings|state\.allocationPreset|JSON\.parse\(localStorage/);
});

for (const preset of ['clec-442', 'clec-433', 'clec-703', 'clec-5050'] as const) {
  test(`L. ${preset} full reference-history regression (totalReturnPct / maxDrawdownPct / rebalanceCount / rebalance timestamps)`, () => {
    const result = runClecTwReferenceValidation(fixture, { preset, initialCapital: INITIAL_CAPITAL, threshold: THRESHOLD });
    assert.equal(result.status, 'ok');
    if (result.status !== 'ok') return;
    const expected = EXPECTED_RUN[preset];
    assert.ok(close(result.totalReturnPct, expected.totalReturnPct, 1e-6));
    assert.ok(close(result.maxDrawdownPct, expected.maxDrawdownPct, 1e-6));
    assert.equal(result.rebalanceCount, expected.rebalanceCount);
    assert.deepEqual(result.periods.filter(p => p.rebalanced).map(p => p.date), expected.rebalanceDates);
    assert.equal(result.executionAssumption, 'frictionless');
  });
}

// UR-TODO-014-A2 AC1/AC2/AC3: the real-history no-trigger gap left by UR-TODO-014-A is closed here.
// clec-5050 (target leveraged=50 / cash-like=50, threshold.drift=5 * significantMultiplier=2 = 10pp)
// is the FIRST real full_rebalance across all four presets and all periods in the extended window.
test('M. first real full_rebalance trigger: clec-5050 on 2025-09-12, with an explicit pre-trigger boundary (AC1/AC2/AC3)', () => {
  const result = runClecTwReferenceValidation(fixture, { preset: 'clec-5050', initialCapital: INITIAL_CAPITAL, threshold: THRESHOLD });
  assert.equal(result.status, 'ok');
  if (result.status !== 'ok') return;

  const triggerIndex = result.periods.findIndex(p => p.rule.recommendedAction === 'full_rebalance');
  assert.notEqual(triggerIndex, -1, 'AC1: at least one CLEC preset must produce a real recommendedAction === full_rebalance from real TWSE history');
  const trigger = result.periods[triggerIndex];
  assert.equal(trigger.date, '2025-09-12');
  assert.equal(trigger.rebalanced, true);

  // AC2a: the trigger day's pre-rebalance weight actually crosses the threshold.
  const targetLeveraged = result.targetWeights.leveraged;
  assert.equal(targetLeveraged, 50);
  const triggerDrift = Math.abs(trigger.weightsBeforeRebalance.leveraged - targetLeveraged);
  assert.ok(triggerDrift >= THRESHOLD.drift * THRESHOLD.significantMultiplier, `AC2a: trigger-day drift ${triggerDrift} must be >= ${THRESHOLD.drift * THRESHOLD.significantMultiplier}`);
  assert.ok(close(triggerDrift, 10.354201823793558, 1e-6));

  // AC2b: the immediately preceding observation had NOT yet crossed the threshold (still rebalance_consider/hold).
  assert.ok(triggerIndex > 0, 'there must be a prior observation to compare against');
  const prior = result.periods[triggerIndex - 1];
  assert.equal(prior.date, '2025-09-11');
  assert.equal(prior.rebalanced, false);
  assert.notEqual(prior.rule.recommendedAction, 'full_rebalance');
  assert.equal(prior.rule.decisionStatus, 'rebalance_consider');
  const priorDrift = Math.abs(prior.weightsBeforeRebalance.leveraged - targetLeveraged);
  assert.ok(priorDrift < THRESHOLD.drift * THRESHOLD.significantMultiplier, `AC2b: prior-day drift ${priorDrift} must be < ${THRESHOLD.drift * THRESHOLD.significantMultiplier}`);
  assert.ok(priorDrift >= THRESHOLD.drift, 'AC2b: prior-day drift must still be >= the base drift threshold (rebalance_consider), not no_action');

  // AC3: rebalance_consider periods elsewhere in the run must never be counted as a rebalance event.
  const consideredButNotRebalanced = result.periods.filter(p => p.rule.decisionStatus === 'rebalance_consider');
  assert.ok(consideredButNotRebalanced.length > 0, 'the extended window must contain rebalance_consider observations to make this assertion meaningful');
  assert.ok(consideredButNotRebalanced.every(p => p.rebalanced === false), 'AC3: rebalance_consider must never itself be treated as a rebalance event');
});
