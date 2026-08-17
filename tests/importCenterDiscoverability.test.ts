import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { TOOL_DEFINITIONS, getToolQuickLinks, isTransactionToolsTarget } from '../src/lib/toolNavigation';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const importCenter = readFileSync(new URL('../src/components/import/ImportCenter.tsx', import.meta.url), 'utf8');

test('the Tool Center keeps the existing assets transaction anchor while quick navigation stays contextual', () => {
  const entry = TOOL_DEFINITIONS.find(tool => tool.id === 'import-transactions');
  assert.deepEqual(entry && { name: entry.name, to: entry.to, actionLabel: entry.actionLabel }, { name: '交易匯入（Import Transactions）', to: '/assets#transactions-section', actionLabel: '前往匯入' });

  const dividendLinks = getToolQuickLinks('dividend-center');
  assert.deepEqual(dividendLinks.map(tool => tool.id), ['cash-flow', 'net-worth-history', 'wealth-goal']);
  assert.ok(dividendLinks.length <= 3);
  assert.equal(dividendLinks.some(tool => tool.id === 'import-transactions'), false);
});

test('the existing Import Center opens only from the anchor without persisting a UI-state change', () => {
  assert.equal(isTransactionToolsTarget('/assets', '#transactions-section'), true);
  assert.equal(isTransactionToolsTarget('/assets', ''), false);
  assert.match(app, /const showTransactionTools = isTransactionToolsTarget\(routeLocation\.pathname, routeLocation\.hash\)/);
  assert.match(app, /\{showTransactionTools && <SectionCard className="page-card for-assets" id="transactions-section"/);
  assert.match(app, /getElementById\('transactions-section'\)\?\.scrollIntoView/);
  assert.doesNotMatch(importCenter, /ToolQuickNavigation/);
  const navigation = readFileSync(new URL('../src/components/ToolQuickNavigation.tsx', import.meta.url), 'utf8');
  assert.match(navigation, /<ArrowLeft size=\{16\} aria-hidden="true" \/><span>返回工具中心<\/span>/);
  assert.match(navigation, /showAssetsReturn && <Link to="\/assets" aria-label="返回資產"/);
  assert.match(navigation, /\{ id, name, icon: Icon, to \}/);
});

test('Gmail OAuth state remains compatible while its unfinished connection UI is hidden from settings', () => {
  assert.match(app, /gmailOAuth: normalizeGmailOAuth\(r\.gmailOAuth\)/);
  assert.doesNotMatch(app, /<GmailOAuthSettings/);
});
