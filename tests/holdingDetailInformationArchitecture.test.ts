import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

// App.tsx owns the existing holding update handlers, so this test deliberately
// locks the information architecture at the real JSX call site instead of
// introducing a second test-only data path.
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const detailContent = app.slice(app.indexOf('function HoldingDetailContent'), app.indexOf('function AllocationPresetSummary'));

test('UR-TODO-075 Holding Detail starts with a read-only allocation summary hero', () => {
  assert.match(detailContent, /className="holding-detail-hero"/);
  assert.match(detailContent, /className="holding-detail-allocation-ring"/);
  assert.match(detailContent, /'--ring-value': ringPercent/);
  assert.match(detailContent, /className="holding-detail-identity"/);
  assert.match(detailContent, /未實現損益/);
});

test('UR-TODO-075 Holding Detail groups read-only values into basic, profit-loss, and allocation sections', () => {
  assert.match(detailContent, /className="holding-detail-section holding-detail-basic"/);
  assert.match(detailContent, /基本資訊/);
  assert.match(detailContent, /總股數/);
  assert.match(detailContent, /成交均價/);
  assert.match(detailContent, /className="holding-detail-section holding-detail-pnl"/);
  assert.match(detailContent, /損益資訊/);
  assert.match(detailContent, /今日漲跌/);
  assert.match(detailContent, /className="holding-detail-section holding-detail-allocation"/);
  assert.match(detailContent, /配置資訊/);
  assert.match(detailContent, /配置偏離/);
});

test('UR-TODO-075 Holding Detail shows one current allocation denominator and derives the target deviation', () => {
  const currentWeightLabels = detailContent.match(/<dt>目前比例<\/dt>/g) || [];
  assert.equal(currentWeightLabels.length, 1, 'current allocation must not be duplicated under a second label');
  assert.doesNotMatch(detailContent, /投資組合占比/);
  assert.match(detailContent, /const targetWeight = row\.targetWeight \?\? 0/);
  assert.match(detailContent, /const allocationDeviation = currentWeight === null \? null : currentWeight - targetWeight/);
});

test('UR-TODO-075 investment settings are collapsed by default and preserve every existing update handler', () => {
  assert.match(detailContent, /<details className="holding-detail-settings">/);
  assert.match(detailContent, /<summary>投資設定<\/summary>/);
  assert.match(detailContent, /onUpdate\(row\.symbol, 'targetWeight', clampTarget\(Number\(value\)\)\)/);
  assert.match(detailContent, /onUpdate\(row\.symbol, 'assetClass', normalizeAssetClass\(value\)\)/);
  assert.match(detailContent, /onUpdateDipAlert\(row\.symbol, \{ referencePrice: parsePositive\(value\) \}\)/);
  assert.match(detailContent, /onUpdateDipAlert\(row\.symbol, \{ enabled: checked \}\)/);
  assert.match(detailContent, /onToggleFocused\(row\.symbol\)/);
});

test('UR-TODO-075 keeps archiving in a separate final danger zone', () => {
  assert.match(detailContent, /className="holding-detail-danger-zone"/);
  assert.match(detailContent, /資產管理/);
  assert.match(detailContent, /onRemove\(row\.symbol\)/);
  assert.ok(detailContent.indexOf('holding-detail-danger-zone') > detailContent.indexOf('holding-detail-settings'));
});
