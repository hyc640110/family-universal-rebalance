import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { TOOL_DEFINITIONS, getToolQuickLinks } from '../src/lib/toolNavigation';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const importCenter = readFileSync(new URL('../src/components/import/ImportCenter.tsx', import.meta.url), 'utf8');

test('the Tool Center and tool quick navigation use the existing assets transaction anchor', () => {
  const entry = TOOL_DEFINITIONS.find(tool => tool.id === 'import-transactions');
  assert.deepEqual(entry && { name: entry.name, to: entry.to, actionLabel: entry.actionLabel }, { name: '交易匯入（Import Transactions）', to: '/assets#transactions-section', actionLabel: '前往匯入' });
  assert.ok(getToolQuickLinks('dividend-center').some(tool => tool.id === 'import-transactions' && tool.to === '/assets#transactions-section'));
});

test('the existing Import Center opens from the anchor without persisting a UI-state change', () => {
  assert.match(app, /routeLocation\.pathname === '\/assets' && routeLocation\.hash === '#transactions-section'/);
  assert.match(app, /open=\{isTransactionImportTarget \|\| sectionOpen\('transactions'\)\}/);
  assert.match(app, /getElementById\('transactions-section'\)\?\.scrollIntoView/);
  assert.match(importCenter, /<ToolQuickNavigation current="import-transactions" showAssetsReturn \/>/);
  const navigation = readFileSync(new URL('../src/components/ToolQuickNavigation.tsx', import.meta.url), 'utf8');
  assert.match(navigation, /<ArrowLeft size=\{16\} aria-hidden="true" \/><span>返回工具中心<\/span>/);
  assert.match(navigation, /showAssetsReturn && <Link to="\/assets" aria-label="返回資產"/);
  assert.match(navigation, /\{ id, name, icon: Icon, to \}/);
});
