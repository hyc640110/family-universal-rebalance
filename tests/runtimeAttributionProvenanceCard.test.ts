import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RuntimeAttributionProvenanceCard from '../src/components/RuntimeAttributionProvenanceCard';
import type { RuntimeAttributionPresentation } from '../src/lib/runtimeAttributionPresentation';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function basePresentation(overrides: Partial<RuntimeAttributionPresentation> = {}): RuntimeAttributionPresentation {
  return {
    period: { openingDate: '2026-08-01', closingDate: '2026-08-05', isZeroLengthPeriod: false, hasComparablePeriod: true },
    quality: 'partial',
    reconciled: false,
    netWorthChange: { status: 'known', value: 50_000 },
    ledgerContribution: { status: 'known', value: 20_000 },
    derivedContribution: { status: 'known', value: 30_000 },
    unexplainedResidual: { status: 'known', value: 0 },
    derivedEvidenceItems: [],
    zeroContributionItems: [],
    fxExcludedItems: [],
    ...overrides
  };
}

const render = (presentation: RuntimeAttributionPresentation) => renderToStaticMarkup(createElement(RuntimeAttributionProvenanceCard, { presentation }));

test('renders one independent toggle per derived evidence item, defaulting to unmarked', () => {
  const html = render(basePresentation({
    derivedEvidenceItems: [
      { id: 'txn-1', type: 'external-income', provenance: 'derived-transaction', contribution: 15_000, note: '外部收入' },
      { id: 'txn-2', type: 'dividend', provenance: 'derived-transaction', contribution: 3_000, note: '股息' }
    ]
  }));

  const toggleMatches = [...html.matchAll(/<button type="button" role="switch" aria-checked="(true|false)" class="runtime-attribution-mark-toggle( active)?">([^<]*)<\/button>/g)];
  assert.equal(toggleMatches.length, 2, 'expected exactly one toggle per derived evidence item');
  for (const match of toggleMatches) {
    assert.equal(match[1], 'false', 'a fresh render must never start pre-marked');
    assert.equal(match[2], undefined, 'a fresh render must not carry the active class');
    assert.equal(match[3], '標示為合理');
  }
});

test('no derived-evidence section is rendered when there are no derived evidence items', () => {
  const html = render(basePresentation({ derivedEvidenceItems: [] }));
  assert.doesNotMatch(html, /runtime-attribution-derived-evidence/);
  assert.doesNotMatch(html, /runtime-attribution-mark-toggle/);
});

test('ledger evidence and zero-contribution/FX-excluded items never render a mark toggle', () => {
  const html = render(basePresentation({
    derivedEvidenceItems: [],
    zeroContributionItems: [{ id: 'adj-1', type: 'adjustment', provenance: 'ledger', contribution: 0, note: '調整（0 貢獻，僅供參考）' }],
    fxExcludedItems: [{ id: 'fx-1', provenance: 'ledger', contribution: null, note: '因缺少正式匯率，此項目未納入計算' }]
  }));
  assert.doesNotMatch(html, /runtime-attribution-mark-toggle/);
});

test('the derived-evidence explanation text is present verbatim and never claims persistence', () => {
  const html = render(basePresentation({
    derivedEvidenceItems: [{ id: 'txn-1', type: 'external-income', provenance: 'derived-transaction', contribution: 15_000, note: '外部收入' }]
  }));
  assert.match(html, /以下為系統依現有交易記錄推測的衍生貢獻，尚未經正式記帳確認。標示僅供您本次瀏覽時參考，重新整理頁面後會清除，不會寫入任何記帳紀錄，也不會影響下一次計算。/);
  for (const forbidden of ['已正式記帳', '已寫入 Ledger', '已永久確認', '已改變歷史資料', '已改變 attribution', '儲存', '送出']) {
    assert.doesNotMatch(html, new RegExp(forbidden), `forbidden wording "${forbidden}" must not appear anywhere on the card`);
  }
});
