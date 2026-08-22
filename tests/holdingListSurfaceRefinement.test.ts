import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

test('PR #412 holding list uses the existing elevated dark surface without changing individual holding cards', () => {
  const holdingListRule = /\.holdings\{([^}]*)\}/.exec(styles)?.[1] ?? '';
  assert.match(
    holdingListRule,
    /background:var\(--bg-surface-2\)/,
    'the holdings list wrapper must use the existing elevated surface token',
  );
  assert.match(
    styles,
    /\.stat,\.card,\.holding\{background:var\(--bg-surface\)/,
    'individual holding cards must retain their existing surface token',
  );
});
