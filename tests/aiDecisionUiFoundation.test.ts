import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

test('AI Decision Center is a local rule summary with traceable evidence and no trading or generative implementation', () => {
  const page = read('src/pages/AiDecisionCenterPage.tsx'); const engine = read('src/lib/aiDecision.ts');
  assert.match(page, /本地規則分析，不使用生成式 AI/); assert.match(page, /判定依據/); assert.match(engine, /DecisionEvidence/);
  assert.doesNotMatch(`${page}\n${engine}`, /OpenAI|LLM|prediction|buy signal|sell signal/i);
  assert.doesNotMatch(`${page}\n${engine}`, /建議買入|建議賣出|最佳買點|最佳賣點|保證報酬/);
});
test('390px layout remains single-column and avoids wide tables', () => {
  const css = read('src/styles.css');
  assert.match(css, /\.ai-decision-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
  assert.match(css, /@media\(max-width:768px\).*\.ai-decision-grid\{grid-template-columns:1fr\}/s);
  assert.doesNotMatch(read('src/pages/AiDecisionCenterPage.tsx'), /<table/);
});
