import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { allocationPresetLabel, deriveAllocationPresetPreview } from '../src/lib/allocationPresets';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('CLEC 442／433 樣板套用後正確產生目標比例、理論調整、可執行限制與阻擋原因（既有純函式契約）', () => {
  const holdings = [
    { symbol: 'AAA', name: 'AAA', targetWeight: 33 },
    { symbol: 'BBB', name: 'BBB', targetWeight: 33 },
    { symbol: 'CCC', name: 'CCC', targetWeight: 34 }
  ];
  const roles = { AAA: 'prototype' as const, BBB: 'leveraged' as const, CCC: 'cash-like' as const };

  const clec442 = deriveAllocationPresetPreview({ preset: 'clec-442', holdings, roleBySymbol: roles });
  assert.equal(clec442.canApply, true);
  assert.deepEqual(clec442.rows.map(row => [row.symbol, row.nextWeight]), [['AAA', 40], ['BBB', 40], ['CCC', 20]]);
  assert.equal(clec442.targetTotal, 100);
  assert.equal(clec442.cashTargetPct, 0);
  assert.deepEqual(clec442.blockingReasons, []);

  const clec433 = deriveAllocationPresetPreview({ preset: 'clec-433', holdings, roleBySymbol: roles });
  assert.equal(clec433.canApply, true);
  assert.deepEqual(clec433.rows.map(row => [row.symbol, row.nextWeight]), [['AAA', 40], ['BBB', 30], ['CCC', 30]]);

  const missingRole = deriveAllocationPresetPreview({ preset: 'clec-442', holdings, roleBySymbol: { AAA: 'prototype' as const } });
  assert.equal(missingRole.canApply, false);
  assert.ok(missingRole.blockingReasons.some(reason => reason.includes('槓桿資產')));
  assert.ok(missingRole.blockingReasons.some(reason => reason.includes('類現金持股')));
});

test('AllocationSimulatorPage 的樣板套用只呼叫既有 deriveAllocationPresetPreview 並覆寫 local targets，不寫入正式配置', () => {
  const page = source('src/pages/AllocationSimulatorPage.tsx');

  assert.match(page, /import \{ allocationPresetLabel, deriveAllocationPresetPreview, normalizeAllocationPreset, roleLabel, type AllocationPreset, type AllocationRole \} from '\.\.\/lib\/allocationPresets';/);
  assert.match(page, /const \[templatePreset, setTemplatePreset\] = useState<AllocationPreset>\('clec-442'\);/);
  assert.match(page, /const \[templateRoles, setTemplateRoles\] = useState<Record<string, AllocationRole>>\(\{\}\);/);
  assert.match(page, /const templatePreview = useMemo\(\(\) => deriveAllocationPresetPreview\(\{ preset: templatePreset, holdings: templateHoldings, roleBySymbol: templateRoles \}\)/);
  assert.match(page, /const applyTemplatePreview = \(\) => \{\s*if \(!templatePreview\.canApply\) return;\s*setTargets\(current => \(\{ \.\.\.current, \[CASH_TARGET_KEY\]: String\(templatePreview\.cashTargetPct \?\? 0\), \.\.\.Object\.fromEntries\(templatePreview\.rows\.map\(row => \[row\.symbol, String\(row\.nextWeight \?\? 0\)\]\)\) \}\)\);\s*\};/);
  // UR-TODO-048 phase E: applying a template always resets the cash target too, since a CLEC preset's
  // three roles always sum to 100% (cashTargetPct is always 0 whenever canApply is true).
  assert.match(page, /const CASH_TARGET_KEY = '__cash__';/);

  // The template picker must never touch AppState's allocationPreset / allocationRoleBySymbol,
  // never call onApply/applyAllocationPreset, and never persist anything.
  assert.doesNotMatch(page, /onApply|applyAllocationPreset|state\.allocationPreset|state\.allocationRoleBySymbol/);
  assert.doesNotMatch(page, /localStorage\.(setItem|removeItem)|firebase\.(set|update)|saveState|setState\(/i);
  assert.doesNotMatch(page, /createTransaction|updateTransactionRecord|createTransferTransaction/);
});

test('套用樣板不影響既有「恢復正式目標比例」與資金基數計算邏輯', () => {
  const page = source('src/pages/AllocationSimulatorPage.tsx');

  assert.match(page, /const resetTargets = \(\) => setTargets\(\{ \.\.\.Object\.fromEntries\(rows\.map\(row => \[row\.symbol, String\(officialTarget\(row\)\)\]\)\), \[CASH_TARGET_KEY\]: '0' \}\);/);
  assert.match(page, /const funding = useMemo\(\(\) => deriveAllocationSimulatorFunding\(\{ \.\.\.fundingInput, allowSafetyCashUsage \}\), \[fundingInput, allowSafetyCashUsage\]\);/);
});

test('模擬交易方向清單維持純文字呈現，樣板套用不新增任何下單或建立交易呼叫', () => {
  const page = source('src/pages/AllocationSimulatorPage.tsx');

  assert.match(page, /<section className="card"><h2>模擬交易方向<\/h2>/);
  assert.doesNotMatch(page, /下單|建立交易|placeOrder|submitOrder/);
});

test('UR-TODO-048 phase D: 樣板選單新增 CLEC 703／5050 選項，既有 442／433 選項不變', () => {
  const page = source('src/pages/AllocationSimulatorPage.tsx');

  assert.match(page, /<option value="clec-442">CLEC 442<\/option><option value="clec-433">CLEC 433<\/option><option value="clec-703">7:3<\/option><option value="clec-5050">50:50<\/option>/);
});

test('UR-TODO-048 phase E: clec-703／clec-5050 顯示文字改為「7:3」「50:50」，內部代號與 442/433 顯示文字不變', () => {
  assert.equal(allocationPresetLabel('clec-703'), '7:3');
  assert.equal(allocationPresetLabel('clec-5050'), '50:50');
  assert.equal(allocationPresetLabel('clec-442'), 'CLEC 442');
  assert.equal(allocationPresetLabel('clec-433'), 'CLEC 433');
});

test('UR-TODO-048 phase E: 現金項目為 component-local session state，不影響正式資金欄位、不出現在差額摘要／交易方向清單', () => {
  const page = source('src/pages/AllocationSimulatorPage.tsx');

  assert.match(page, /const CASH_TARGET_KEY = '__cash__';/);
  assert.match(page, /const cashTargetPercent = Math\.max\(0, safeNumber\(targets\[CASH_TARGET_KEY\]\)\);/);
  assert.match(page, /const targetTotal = entries\.reduce\(\(sum, row\) => sum \+ row\.targetPercent, 0\) \+ cashTargetPercent;/);
  assert.match(page, /aria-label="現金 模擬目標比例"/);

  // Cash must never feed into the Household Liquidity funding source, and must stay out of the
  // trade-oriented sections below.
  assert.match(page, /const funding = useMemo\(\(\) => deriveAllocationSimulatorFunding\(\{ \.\.\.fundingInput, allowSafetyCashUsage \}\), \[fundingInput, allowSafetyCashUsage\]\);/);
  const resultSummarySection = page.slice(page.indexOf('模擬差額摘要'), page.indexOf('模擬交易方向'));
  const tradeDirectionSection = page.slice(page.indexOf('模擬交易方向'));
  assert.doesNotMatch(resultSummarySection, /CASH_TARGET_KEY/);
  assert.doesNotMatch(tradeDirectionSection, /CASH_TARGET_KEY/);
});

test('UR-TODO-048 phase D: CLEC 703／5050 樣板套用後正確產生 0/70/30、0/50/50 目標比例（既有純函式契約）', () => {
  const holdings = [
    { symbol: 'AAA', name: 'AAA', targetWeight: 33 },
    { symbol: 'BBB', name: 'BBB', targetWeight: 33 },
    { symbol: 'CCC', name: 'CCC', targetWeight: 34 }
  ];
  const roles = { AAA: 'prototype' as const, BBB: 'leveraged' as const, CCC: 'cash-like' as const };

  const clec703 = deriveAllocationPresetPreview({ preset: 'clec-703', holdings, roleBySymbol: roles });
  assert.equal(clec703.canApply, true);
  assert.deepEqual(clec703.rows.map(row => [row.symbol, row.nextWeight]), [['AAA', 0], ['BBB', 70], ['CCC', 30]]);
  assert.equal(clec703.targetTotal, 100);

  const clec5050 = deriveAllocationPresetPreview({ preset: 'clec-5050', holdings, roleBySymbol: roles });
  assert.equal(clec5050.canApply, true);
  assert.deepEqual(clec5050.rows.map(row => [row.symbol, row.nextWeight]), [['AAA', 0], ['BBB', 50], ['CCC', 50]]);
  assert.equal(clec5050.targetTotal, 100);
});

test('UR-TODO-048 phase D: ClecStrategyCenterPage 未新增任何 clec-703／5050 相關內容', () => {
  const page = source('src/pages/ClecStrategyCenterPage.tsx');
  assert.doesNotMatch(page, /clec-703|clec-5050|CLEC 703|CLEC 5050/);
});
