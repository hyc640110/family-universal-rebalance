import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

test('V6.15 derives compact mode on mobile without rewriting persisted desktop mode', () => {
  assert.match(app, /const effectiveDisplayMode = isMobile \? 'compact' : uiState\.displayMode/);
  assert.match(app, /document\.documentElement\.dataset\.displayMode = effectiveDisplayMode/);
  assert.match(app, /function writeUiState\(state: UiState\) \{ localStorage\.setItem\(UI_STATE_KEY, JSON\.stringify\(\{ displayMode: state\.displayMode \}\)\); \}/);
  assert.match(app, /r\.displayMode === 'full' \? 'full' : 'compact'/);
});

test('V6.15 removes mobile compact/full controls while retaining desktop settings controls', () => {
  assert.doesNotMatch(app, /aria-label="手機顯示模式"/);
  assert.match(app, /!isMobile && <Card title="顯示設定">/);
  assert.match(app, /onClick=\{\(\) => applyDisplayMode\('full'\)\}/);
  assert.doesNotMatch(styles, /\.mobile-mode-switch|\.settings-mode-switch/);
});

test('V6.15 uses effective compact defaults for independent SectionCards on mobile', () => {
  assert.match(app, /const defaultSectionsForMode = effectiveDisplayMode === 'full' \? FULL_UI_SECTIONS : DEFAULT_UI_STATE\.sections/);
  assert.match(app, /const defaults = effectiveDisplayMode === 'full' \? FULL_UI_SECTIONS : DEFAULT_UI_STATE\.sections/);
  assert.match(app, /editingHoldingSymbol === row\.symbol/);
  assert.match(app, /current === row\.symbol \? null : row\.symbol/);
});

test('V6.15 preserves quote refresh and assets pull-to-refresh boundaries', () => {
  assert.match(app, /className="assets-quote-refresh"/);
  assert.match(app, /assets-pull-refresh-surface/);
  assert.match(app, /assetsPullRefreshRef\.current\?\.start/);
  assert.match(app, /JSON\.stringify\(\{ displayMode: state\.displayMode \}\)/);
});
