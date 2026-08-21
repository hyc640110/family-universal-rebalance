import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/**
 * UR-TODO-072: App.tsx cannot be imported by tests/*.test.ts (import.meta.env at module scope — see
 * holdingCardDragReorderStructure.test.ts's file-level comment for the same constraint), so the
 * wiring/placement invariants that live only in App.tsx's JSX and state are locked in here via source
 * inspection, matching that file's established pattern. HoldingDetailDialog's own behavior (dialog
 * semantics, Escape, backdrop click, focus, scroll lock) is exercised with a real render in
 * holdingDetailDialog.test.ts; this file only guards that App.tsx wires it correctly and that the old
 * inline expand pattern is fully gone.
 */
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const compactCard = app.slice(app.indexOf('function HoldingCompactCard'), app.indexOf('function HoldingDetailContent'));
const detailContent = app.slice(app.indexOf('function HoldingDetailContent'), app.indexOf('function AllocationPresetSummary'));

test('UR-TODO-072 the old inline in-card detail region is fully removed from HoldingCompactCard', () => {
  assert.doesNotMatch(compactCard, /holding-editor/);
  assert.doesNotMatch(compactCard, /isEditing/);
  assert.doesNotMatch(compactCard, /holding-delete-button/);
});

test('UR-TODO-072 the 詳細 button opens the dialog via state, not an inline toggle, and never reads "收合"', () => {
  assert.match(compactCard, /onClick=\{onOpenDetail\}/);
  assert.doesNotMatch(compactCard, /收合/);
  assert.match(app, /const \[selectedHoldingDetailSymbol, setSelectedHoldingDetailSymbol\] = useState<SymbolCode \| null>\(null\)/);
});

test('UR-TODO-072 HoldingDetailDialog is imported and rendered exactly once (not once per card)', () => {
  assert.match(app, /import HoldingDetailDialog from '\.\/components\/HoldingDetailDialog'/);
  const matches = app.match(/<HoldingDetailDialog/g) || [];
  assert.equal(matches.length, 1, 'expected exactly one <HoldingDetailDialog> render site, driven by selectedHoldingDetailSymbol rather than one instance per holding card');
});

test('UR-TODO-072 the dialog content is derived fresh from m.rows every render, never a copied editable snapshot', () => {
  assert.match(app, /const selectedHoldingDetailRow = selectedHoldingDetailSymbol \? m\.rows\.find\(row => row\.symbol === selectedHoldingDetailSymbol\) \?\? null : null;/);
  // No separate useState holding a duplicated/editable copy of the selected row's fields.
  assert.doesNotMatch(app, /useState[^;]*selectedHoldingDetail(?!Symbol)/);
});

test('UR-TODO-072 HoldingDetailContent reuses the existing update handlers — no second data-update path', () => {
  assert.match(detailContent, /onUpdate\(row\.symbol, 'shares', parsePositive\(value\)\)/);
  assert.match(detailContent, /onUpdate\(row\.symbol, 'avgCost', parsePositive\(value\)\)/);
  assert.match(detailContent, /onUpdate\(row\.symbol, 'targetWeight', clampTarget\(Number\(value\)\)\)/);
  assert.match(detailContent, /onUpdate\(row\.symbol, 'assetClass', normalizeAssetClass\(value\)\)/);
  assert.match(detailContent, /onUpdateDipAlert\(row\.symbol, \{ referencePrice: parsePositive\(value\) \}\)/);
  assert.match(detailContent, /onUpdateDipAlert\(row\.symbol, \{ enabled: checked \}\)/);
  assert.match(detailContent, /onToggleFocused\(row\.symbol\)/);
  assert.match(detailContent, /onRemove\(row\.symbol\)/);
});

test('UR-TODO-072 archiving from inside the dialog reuses confirmRemoveHoldingAsset and closes the dialog only on success', () => {
  assert.match(app, /onRemove=\{symbol => \{ if \(confirmRemoveHoldingAsset\(symbol\)\) closeHoldingDetail\(\); \}\}/);
  assert.match(app, /confirmRemoveHoldingAsset = \(symbol: SymbolCode\): boolean =>/);
});

test('UR-TODO-072 closing the dialog returns focus to the button that opened it, without scrolling the page (accessibility contract)', () => {
  assert.match(app, /const holdingDetailTriggerRef = useRef<HTMLButtonElement \| null>\(null\)/);
  assert.match(app, /holdingDetailTriggerRef\.current = event\.currentTarget/);
  const closeHoldingDetail = app.slice(app.indexOf('const closeHoldingDetail ='), app.indexOf('const selectedHoldingDetailRow ='));
  assert.match(closeHoldingDetail, /setSelectedHoldingDetailSymbol\(null\)/);
  // preventScroll: plain .focus() would scroll the trigger button into view, jumping the Assets
  // page away from wherever the user was scrolled to — the exact regression this Sprint's scroll-
  // position acceptance criteria rules out (caught by manual Preview verification, not TypeScript).
  assert.match(closeHoldingDetail, /holdingDetailTriggerRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
});

test('UR-TODO-072 archiving a holding from anywhere else (e.g. the Analytics list) also clears a stale selectedHoldingDetailSymbol', () => {
  const removeHoldingAsset = app.slice(app.indexOf('const removeHoldingAsset ='), app.indexOf('const restoreHoldingAsset ='));
  assert.match(removeHoldingAsset, /setSelectedHoldingDetailSymbol\(current => current === normalizedSymbol \? null : current\)/);
});

test('UR-TODO-072 dead is-editing CSS class is fully removed from styles.css alongside the JSX', () => {
  const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(styles, /\.holding-compact\.is-editing/);
});

test('UR-TODO-072 the drag handle wiring (UR-TODO-071 contract) is untouched by this refactor', () => {
  assert.match(compactCard, /<HoldingOrderHandle label=\{row\.quote\.name\} isDragging=\{isDragging\} onDragStart=\{onDragStart\} onDragMove=\{onDragMove\} onDragEnd=\{onDragEnd\} onDragCancel=\{onDragCancel\} onKeyboardMove=\{onKeyboardMove\} \/>/);
});

test('UR-TODO-072 holdingDisplayOrder wiring at the list-render call site is untouched by this refactor', () => {
  assert.match(app, /orderHoldingRows\(m\.rows, state\.holdingDisplayOrder\)\.map\(row => <HoldingCompactCard/);
});
