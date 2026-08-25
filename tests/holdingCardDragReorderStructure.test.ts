import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/**
 * UR-TODO-071: App.tsx cannot be imported by tests/*.test.ts (import.meta.env at module scope —
 * see rebalanceOrderHelper.ts's file-level comment for the same constraint), so the structural
 * invariants that live only in HoldingCompactCard's JSX and the surrounding drag-orchestration
 * handlers are locked in here via source inspection, matching the existing
 * v6AssetsCardInformation.test.ts pattern. The pure logic those handlers call
 * (moveHoldingDisplayOrderToIndex, resolveDragTargetIndex, moveHoldingDisplayOrder) is fully unit
 * tested elsewhere (holdingCardDragReorder.test.ts, holdingDisplayOrder.test.ts); this file only
 * guards the wiring/placement contract that source inspection can actually see.
 */
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const card = app.slice(app.indexOf('function HoldingCompactCard'), app.indexOf('function AllocationPresetPanel'));

test('UR-TODO-071 only the drag handle can start a reorder — the card article itself has no pointer handlers', () => {
  const articleOpenTag = card.slice(card.indexOf('<article'), card.indexOf('>', card.indexOf('<article')) + 1);
  assert.doesNotMatch(articleOpenTag, /onPointerDown|onPointerMove|onPointerUp|onPointerCancel/);
});

test('UR-TODO-071 the old ↑/↓ manual ordering controls are fully removed', () => {
  assert.doesNotMatch(app, /holding-order-button/);
  assert.doesNotMatch(app, /holding-order-controls/);
  assert.doesNotMatch(card, /上移|下移/);
});

test('UR-TODO-071 HoldingOrderHandle is rendered as the LAST child of holding-card-summary (Desktop Decision 2: rightmost, after 詳細)', () => {
  const summaryBlock = card.slice(card.indexOf('<div className="holding-card-summary">'), card.indexOf('</div>', card.indexOf('holding-edit-button')));
  const editButtonPos = summaryBlock.indexOf('holding-edit-button');
  const handlePos = summaryBlock.indexOf('<HoldingOrderHandle');
  assert.ok(editButtonPos > -1, 'expected 詳細/holding-edit-button to exist in the card summary');
  assert.ok(handlePos > -1, 'expected <HoldingOrderHandle to exist in the card summary');
  assert.ok(handlePos > editButtonPos, 'HoldingOrderHandle must come after 詳細 in source/DOM order');
});

test('UR-TODO-071 HoldingOrderHandle is not nested inside holding-card-identity (must be an independent row-level operation area)', () => {
  const identityBlock = card.slice(card.indexOf('<div className="holding-card-identity">'), card.indexOf('</div>', card.indexOf('holding-card-identity')));
  assert.doesNotMatch(identityBlock, /HoldingOrderHandle/);
});

test('UR-TODO-071 keyboard reorder reuses the existing single-step moveHoldingDisplayOrder helper (no parallel keyboard-only reorder path)', () => {
  assert.match(app, /onKeyboardMove=\{direction => moveHoldingDisplay\(row\.symbol, row\.quote\.name, direction\)\}/);
});

test('UR-TODO-071 pointer-drag reorder only ever writes holdingDisplayOrder, never touches holdings/m.rows directly', () => {
  const dragOrchestration = app.slice(app.indexOf('const holdingCardElementsRef'), app.indexOf('const cancelHoldingDrag') + 400);
  assert.doesNotMatch(dragOrchestration, /holdings:\s*(?!undefined)/);
  assert.match(dragOrchestration, /holdingDisplayOrder:\s*nextOrder/);
});

test('UR-TODO-071 an aria-live status region exists for reorder announcements, scoped to the sr-only utility class', () => {
  assert.match(app, /className="sr-only" role="status" aria-live="polite"/);
  assert.match(styles, /\.sr-only\{[^}]*clip:rect\(0,0,0,0\)/);
});

test('UR-TODO-071 Desktop grid extends to 9 tracks (existing 8 financial/action columns + 1 handle column), while preserving the protected today-change spacing contract', () => {
  const desktopBlock = styles.slice(styles.indexOf('@media (min-width:901px)'), styles.indexOf('@media (max-width: 768px)'));
  assert.match(desktopBlock, /\.holding-card-summary\{grid-template-columns:minmax\(152px,1\.5fr\) minmax\(62px,\.6fr\) minmax\(76px,\.7fr\) minmax\(142px,\.75fr\) minmax\(92px,1\.1fr\) minmax\(88px,\.85fr\) minmax\(132px,1\.25fr\) auto auto;column-gap:12px;row-gap:6px;/);
});

test('UR-TODO-071 the drag handle has touch-action:none and user-select:none scoped to itself, not the whole holdings list', () => {
  assert.match(styles, /\.holding-order-handle\{[^}]*touch-action:none[^}]*user-select:none/);
  assert.doesNotMatch(styles, /\.holdings\{[^}]*touch-action:none/);
  assert.doesNotMatch(styles, /\.holding-compact\{[^}]*touch-action:none/);
});

test('UR-TODO-071 Mobile: holding-card-identity shares row 1 with the handle, not a full-row span', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  // UR-TODO-073 round 3: the mobile summary reflow switched from `order`+`grid-column:auto` to named
  // grid-template-areas — identity shares row 1 with the handle, which is the same "share row 1, not
  // full-row" placement this test originally locked, just expressed via the new mechanism.
  // UR-TODO-074: the summary grid dropped from 3 columns to 2 (main content column + a side column
  // reused by handle/pnl), so row 1 is now "identity handle" instead of "identity identity handle" —
  // identity still occupies only its own column, handle still gets a dedicated one, so the
  // underlying guarantee (identity does not span the full row over the handle) is unchanged.
  assert.match(mobileBlock, /"identity handle"/);
  assert.match(mobileBlock, /\.holding-card-identity\{grid-area:identity/);
  assert.match(mobileBlock, /\.holding-order-handle\{grid-area:handle/);
});
