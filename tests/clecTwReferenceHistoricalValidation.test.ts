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
const EXPECTED_DATASET_HASH = 'd9c049f2f5b4045244bfa0842eea41e878839d1dfad0a116f20bd0202f36f338';
const EXPECTED_COMMON_DATE_COUNT = 60;
const EXPECTED_PERIOD_COUNT = 59;
const EXPECTED_RUN = {
  'clec-442': { totalReturnPct: 25.13272033741478, maxDrawdownPct: 3.8400517988746774, rebalanceCount: 0, rebalanceDates: [] as string[] },
  'clec-433': { totalReturnPct: 21.298619313460286, maxDrawdownPct: 3.190489925005535, rebalanceCount: 0, rebalanceDates: [] as string[] },
  'clec-703': { totalReturnPct: 29.678970744141097, maxDrawdownPct: 4.565535198415116, rebalanceCount: 0, rebalanceDates: [] as string[] },
  'clec-5050': { totalReturnPct: 22.010768696232063, maxDrawdownPct: 3.3162991725879665, rebalanceCount: 0, rebalanceDates: [] as string[] }
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
  assert.equal(fixture.endDate, '2025-08-29');
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

test('H. 00631L 22:1 split normalization evidence (standalone: this split is outside the dataset window)', () => {
  const split = fixture.provenance.corporateActions['00631L'].split;
  assert.equal(split.ratio, '22:1');
  assert.equal(split.lastTradingDayPreSplitOfficialClose, 443.15);
  assert.equal(split.officialReferencePriceOnResume, 20.14);
  const computed = Math.round((split.lastTradingDayPreSplitOfficialClose / 22) * 100) / 100;
  assert.equal(computed, split.officialReferencePriceOnResume, '443.15 / 22 must reproduce the officially reported 20.14 post-split reference price');
  assert.ok(split.resumedTradingDay > fixture.endDate, 'this split must be outside the dataset window; it is not embedded in the main backtest periods');
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
