import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/netWorthHistory.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const history = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const snapshot = (date, netWorth) => ({date,totalAssets:netWorth+100,netWorth,investmentValue:netWorth, cash:100, debt:100});

assert.deepEqual(history.normalizeNetWorthHistory(undefined), [], 'old localStorage without history is safe');
let rows = history.upsertNetWorthSnapshot([], snapshot('2026-07-01', 1000));
rows = history.upsertNetWorthSnapshot(rows, snapshot('2026-07-01', 1100));
assert.equal(rows.length, 1, 'same day snapshot is overwritten');
rows = history.upsertNetWorthSnapshot(rows, snapshot('2026-07-02', 900));
rows = history.upsertNetWorthSnapshot(rows, snapshot('2026-07-03', 1200));
assert.equal(history.historyForRange(rows, '7d', new Date('2026-07-03')).length, 3, 'range filter retains recent snapshots');
const stats = history.deriveHistoryStats(rows);
assert.equal(stats.highestNetWorth, 1200, 'highest net worth');
assert.equal(stats.todayChange, 300, 'daily change');
assert.ok(stats.maxDrawdown < 0, 'drawdown is negative after a decline');
assert.deepEqual(history.normalizeNetWorthHistory([{date:'invalid',netWorth:Infinity},{date:'2026-07-03',netWorth:NaN}]), [{date:'2026-07-03',totalAssets:0,netWorth:0,investmentValue:0,cash:0,debt:0}], 'invalid history values cannot crash the page');
console.log('PASS Net worth history: old data, same-day overwrite, range filters, stats, high water mark, drawdown and invalid values');
