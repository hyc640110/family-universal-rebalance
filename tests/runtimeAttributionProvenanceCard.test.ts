import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RuntimeAttributionProvenanceCard, { type RuntimeAttributionConfirmOutcome } from '../src/components/RuntimeAttributionProvenanceCard';
import type { RuntimeAttributionEvidenceItem, RuntimeAttributionPresentation } from '../src/lib/runtimeAttributionPresentation';

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

const render = (presentation: RuntimeAttributionPresentation, onConfirmEvidence?: (item: RuntimeAttributionEvidenceItem) => RuntimeAttributionConfirmOutcome) =>
  renderToStaticMarkup(createElement(RuntimeAttributionProvenanceCard, { presentation, ...(onConfirmEvidence ? { onConfirmEvidence } : {}) }));

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

// UR-TODO-046-C3C-C
test('確認按鈕只在有提供 onConfirmEvidence 時才渲染，且每列衍生證據各自獨立一顆', () => {
  const items = [
    { id: 'txn-1', type: 'external-income' as const, provenance: 'derived-transaction' as const, contribution: 15_000, note: '外部收入' },
    { id: 'txn-2', type: 'dividend' as const, provenance: 'derived-transaction' as const, contribution: 3_000, note: '股息' }
  ];

  const withoutCallback = render(basePresentation({ derivedEvidenceItems: items }));
  assert.doesNotMatch(withoutCallback, /runtime-attribution-confirm-button/, '沒有提供 onConfirmEvidence 時不得渲染確認按鈕');

  const withCallback = render(basePresentation({ derivedEvidenceItems: items }), () => ({ rejected: false }));
  const confirmButtonMatches = [...withCallback.matchAll(/class="runtime-attribution-confirm-button"[^>]*>確認並正式記帳<\/button>/g)];
  assert.equal(confirmButtonMatches.length, 2, '每一列衍生證據都應有各自獨立的確認按鈕');
});

test('確認按鈕與「標示為合理」toggle 使用不同的 CSS class（視覺上明顯不同），且不影響既有 toggle 渲染', () => {
  const html = render(basePresentation({
    derivedEvidenceItems: [{ id: 'txn-1', type: 'external-income', provenance: 'derived-transaction', contribution: 15_000, note: '外部收入' }]
  }), () => ({ rejected: false }));

  assert.match(html, /runtime-attribution-mark-toggle/);
  assert.match(html, /runtime-attribution-confirm-button/);
  const markClass = html.match(/class="runtime-attribution-mark-toggle[^"]*"/)?.[0];
  const confirmClass = html.match(/class="runtime-attribution-confirm-button[^"]*"/)?.[0];
  assert.notEqual(markClass, confirmClass);
});

test('一開始不渲染「本次已正式記帳」清單或錯誤訊息（尚未有任何互動）', () => {
  const html = render(basePresentation({
    derivedEvidenceItems: [{ id: 'txn-1', type: 'external-income', provenance: 'derived-transaction', contribution: 15_000, note: '外部收入' }]
  }), () => ({ rejected: false }));
  assert.doesNotMatch(html, /本次已正式記帳/);
  assert.doesNotMatch(html, /runtime-attribution-confirm-error/);
});

test('card 標頭文案已更新為反映「確認並正式記帳」能力，不再宣稱完全唯讀', () => {
  const html = render(basePresentation({ derivedEvidenceItems: [] }));
  assert.match(html, /確認並正式記帳/);
  assert.doesNotMatch(html, /不提供任何記帳、編輯或刪除操作/);
});
