import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveDefensiveConfigurationPresentation } from '../src/lib/defensiveConfigurationPresentation';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Analytics 防守配置狀態只接既有防守、Household Liquidity 與再平衡輸出', () => {
  const app = source('src/App.tsx');

  assert.match(app, /import DefensiveConfigurationStatusCard from '.\/components\/DefensiveConfigurationStatusCard';/);
  assert.match(app, /deriveDefensiveConfigurationPresentation\(\{[\s\S]*defensiveTotalRatio: m\.defensiveRatio,[\s\S]*protectedSafetyCash: householdLiquidityForRebalance\.protectedSafetyCash,[\s\S]*defensiveHoldingsRatio: m\.totalAssets > 0 \? m\.defensiveHoldingsValue \/ m\.totalAssets \* 100 : null,[\s\S]*investableCash: householdLiquidityForRebalance\.investableCash,[\s\S]*theoreticalDefensiveConfigurationShortfall: null,[\s\S]*safetyCashShortfall: householdLiquidityForRebalance\.safetyCashShortfall,[\s\S]*executionMethod: rb\.mode,[\s\S]*canExecute: householdLiquidityForRebalance\.canExecuteBuy,[\s\S]*blockingReasons: householdLiquidityForRebalance\.blockingReasons[\s\S]*\}/);
  assert.match(app, /<DefensiveConfigurationStatusCard presentation=\{defensiveConfigurationPresentation\} \/>/);
  assert.doesNotMatch(app, /theoreticalDefensiveConfigurationShortfall:\s*(?:m\.|rb\.|Math\.|[\d])/);
});

test('防守配置狀態保留 explicit zero、unavailable 與上游 blocking 原因', () => {
  const zero = deriveDefensiveConfigurationPresentation({
    defensiveTotalRatio: 0,
    protectedSafetyCash: 0,
    defensiveHoldingsRatio: 0,
    investableCash: 0,
    theoreticalDefensiveConfigurationShortfall: null,
    safetyCashShortfall: 0,
    executionMethod: 'buy-only',
    canExecute: true,
    blockingReasons: [],
  });
  assert.equal(zero.defensiveTotalRatio.isExplicitZero, true);
  assert.equal(zero.protectedSafetyCash.isExplicitZero, true);
  assert.equal(zero.investableCash.isExplicitZero, true);
  assert.equal(zero.theory.defensiveConfigurationShortfall.status, 'unavailable');

  const blocked = deriveDefensiveConfigurationPresentation({
    defensiveTotalRatio: 45,
    protectedSafetyCash: 120_000,
    defensiveHoldingsRatio: 15,
    investableCash: null,
    theoreticalDefensiveConfigurationShortfall: null,
    safetyCashShortfall: 20_000,
    executionMethod: 'standard',
    canExecute: false,
    blockingReasons: [{ code: 'LIQUID_ACCOUNT_UNAVAILABLE', message: '流動帳戶資料不足' }],
  });
  assert.equal(blocked.execution.status, 'blocked');
  assert.deepEqual(blocked.execution.blockingReasons, [{ code: 'LIQUID_ACCOUNT_UNAVAILABLE', message: '流動帳戶資料不足' }]);
});

test('防守配置狀態卡有可讀的 unavailable、blocking 與 390px 版面契約', () => {
  const card = source('src/components/DefensiveConfigurationStatusCard.tsx');
  const styles = source('src/styles.css');

  assert.match(card, /aria-label="防守配置狀態"/);
  assert.match(card, /防守配置狀態/);
  assert.match(card, /防守總比例（含現金與防守型持股）/);
  assert.match(card, /理論缺口/);
  assert.match(card, /尚無既有權威來源/);
  assert.match(card, /role="alert"/);
  assert.match(card, /blockingReasons\.map/);
  assert.doesNotMatch(card, /setState|localStorage|firebase|saveState/i);
  assert.match(styles, /\.defensive-configuration-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media \(max-width: 768px\)\{[\s\S]*\.defensive-configuration-grid\{grid-template-columns:1fr/);
});
