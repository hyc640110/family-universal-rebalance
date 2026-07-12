import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/family.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const family = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const members = family.normalizeFamilyMembers([{id:'spouse-1',name:'王小美',relationship:'spouse',birthYear:1988,includeInStatistics:true}]);
assert.deepEqual(family.normalizeFamilyMembers(undefined), [], 'old localStorage without family fields is safe');
assert.deepEqual(family.normalizeAssetOwnership(undefined, members), {}, 'old backup without ownership is safe');
const ownership = family.normalizeAssetOwnership({'holding:00631L':{ownerType:'spouse',memberId:'spouse-1'},'cash:one':{ownerType:'shared'}}, members);
assert.equal(family.assetInScope('holding:00631L', ownership, members, 'family'), true, 'included spouse asset belongs to family scope');
assert.equal(family.assetInScope('cash:one', ownership, members, 'family'), true, 'shared asset belongs to family scope');
assert.equal(family.assetInScope('holding:missing', ownership, members, 'personal'), true, 'missing ownership falls back to personal');
assert.equal(family.normalizeAssetOwnership({'holding:00631L':{ownerType:'spouse',memberId:'deleted'}}, members)['holding:00631L'].ownerType, 'personal', 'deleted member ownership falls back safely');
assert.equal(family.normalizeFamilyMembers([{id:'x',name:'',relationship:'spouse'}]).length, 0, 'invalid incomplete member ignored');
console.log('PASS Family compatibility: V3.9 fallback, old backup, old Firebase payload shape, ownership scope, deleted member fallback');
