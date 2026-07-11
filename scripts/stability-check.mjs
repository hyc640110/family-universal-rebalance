import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

const checks = [
  ['Holding persists name', /type Holding = \{[^}]*name\?: string/.test(app)],
  ['Quote parser reads dynamic names', /quoteNameFields/.test(app) && /parseWorkerQuote\(symbol: SymbolCode, data: unknown, holding\?: Holding\)/.test(app)],
  ['Quote refresh writes names to holdings only on changes', /hasNameChange/.test(app) && /return name && name !== h\.name \? \{ \.\.\.h, name \} : h/.test(app)],
  ['Backup import can recover names from quotes', /const quoteNames = r\.quotes/.test(app) && /resolveSymbolName\(symbol, holding\?\.name, quote\?\.name\)/.test(app)],
  ['Deviation has a single rendered text source', /const rebalanceDeviationText = rb\.deviationText/.test(app) && /summary=\{`\$\{rb\.thresholdStatus\}｜偏離 \$\{rebalanceDeviationText\}`\}/.test(app)],
  ['Deviation formula is currentGrowthWeight minus growthTargetPercent', /const currentGrowthWeight = stockWeight/.test(app) && /const growthTargetPercent = m\.growthTargetPct/.test(app) && /const deviation = stockWeight - m\.growthTargetPct/.test(app)],
  ['Compact and full modes reset their section presets', /const FULL_UI_SECTIONS/.test(app) && /applyDisplayMode\('compact'\)/.test(app) && /applyDisplayMode\('full'\)/.test(app)],
  ['Full mode sections remain manually collapsible', /const defaultSectionsForMode = uiState\.displayMode === 'full' \? FULL_UI_SECTIONS : DEFAULT_UI_STATE\.sections/.test(app)]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}

if (failed.length) {
  process.exitCode = 1;
}
