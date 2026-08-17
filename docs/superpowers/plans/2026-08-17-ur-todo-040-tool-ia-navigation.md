# UR-TODO-040 Tool IA & Contextual Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the Tool Center into four explicit IA sections and replace full-directory tool-page quick navigation with at most three contextual related-tool links.

**Architecture:** Keep `TOOL_DEFINITIONS` as the single metadata source. Add additive IA metadata (`group`, `priority`, `related`) to each tool definition, derive Tool Center grouping from that source, and resolve contextual quick links through `getToolQuickLinks(current)` with fail-closed behavior when `current` is absent. Preserve existing routes, `ToolNature`, and `showAssetsReturn` behavior.

**Tech Stack:** React, TypeScript, React Router, node:test, tsx, Vite.

## Global Constraints

- Baseline: `43fcca43782e103aad5b6dd362eb631c483d79eb`.
- Branch: `feat/ur-todo-040-tool-ia-navigation`.
- Do not modify financial calculations, Household Liquidity, Rebalance domain logic, AI Decision calculation, Financial Event Ledger, attribution, transaction import behavior, schema, localStorage, JSON Backup, quote logic, holdings, retirement mathematics, or FIRE mathematics.
- Preserve all existing routes including `/assets#transactions-section`.
- Preserve existing `ToolNature` semantics and badges.
- Planned tools without `to` remain non-clickable and never appear in Quick Navigation.
- `getToolQuickLinks(undefined)` must return `[]`.
- Each routed tool may expose at most 3 related tools.
- Keep `showAssetsReturn` behavior unchanged.
- Validate desktop and 390×844 mobile layouts.

---

### Task 1: Lock the navigation contract in tests

**Files:**
- Modify: `tests/toolNavigation.test.ts`
- Test: `tests/toolNavigation.test.ts`

**Interfaces:**
- Consumes: existing `TOOL_DEFINITIONS`, `getToolQuickLinks`, `isTransactionToolsTarget`.
- Produces: regression expectations for four IA groups, deterministic group order, 14 routed tools, 2 planned tools, contextual quick-link mappings, max-three invariant, planned-tool exclusion, and fail-closed undefined-current behavior.

- [ ] **Step 1: Replace stale full-directory quick-link assertions with the new contract**

Add explicit expected group membership and expected related-tool mappings for all routed tools. Preserve route and deep-link assertions.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:tool-navigation`
Expected: FAIL because `ToolDefinition` lacks IA metadata and `getToolQuickLinks()` still returns the full routed-tool list.

- [ ] **Step 3: Commit the failing contract test**

Commit message: `test: define UR-TODO-040 tool IA contract`

---

### Task 2: Add IA metadata and contextual link resolution

**Files:**
- Modify: `src/lib/toolNavigation.ts`
- Test: `tests/toolNavigation.test.ts`

**Interfaces:**
- Produces:
  - `ToolGroup = 'today-decision' | 'management-tracking' | 'planning-simulation' | 'planned'`
  - `TOOL_GROUP_LABELS: Record<ToolGroup, string>`
  - additive `group: ToolGroup`, `priority: number`, `related?: readonly ToolId[]` on `ToolDefinition`
  - `getToolQuickLinks(current?: ToolId)` returning only contextual routed tools in declared order, or `[]` when `current` is missing

- [ ] **Step 1: Implement minimal IA metadata on all 16 definitions**

Use the approved classification and contextual mapping from the design spec. Do not alter existing ids, names, descriptions, icons, routes, action labels, or nature values.

- [ ] **Step 2: Replace full-directory `getToolQuickLinks()` logic**

Resolve the current definition, return `[]` if absent, then resolve `related` IDs through `TOOL_DEFINITIONS` in declared order. Filter out non-routed definitions and the current definition defensively.

- [ ] **Step 3: Run the focused test and verify GREEN**

Run: `npm run test:tool-navigation`
Expected: PASS.

- [ ] **Step 4: Commit**

Commit message: `feat: add contextual tool navigation metadata`

---

### Task 3: Render the Tool Center as four IA sections

**Files:**
- Modify: `src/pages/ToolsPage.tsx`
- Modify: relevant stylesheet containing `.tool-grid`, `.tool-card`, and Tool Center styles
- Modify or add: a focused UI/source regression test if existing coverage does not assert section rendering

**Interfaces:**
- Consumes: `TOOL_DEFINITIONS`, `TOOL_GROUP_LABELS`, `ToolGroup`.
- Produces: Tool Center rendering grouped by IA section with deterministic priority order while retaining existing tool-card markup and `ToolNature` badges.

- [ ] **Step 1: Write a failing Tool Center grouping regression test**

Assert the page renders/derives all four section labels and does not fall back to one flat `TOOL_DEFINITIONS.map(...)` grid.

- [ ] **Step 2: Run the focused test and verify RED**

Run the exact test script/file used by the new test.
Expected: FAIL because `ToolsPage` still renders one flat grid.

- [ ] **Step 3: Implement grouped rendering**

Render sections in fixed order: 今日決策, 管理與追蹤, 規劃與模擬, 規劃中. Within each group sort by `priority`. Reuse the existing active/planned card markup and nature badge behavior.

- [ ] **Step 4: Add minimal section-layout CSS**

Add section spacing/headings without introducing carousels, horizontal scrolling, or a new design system.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Tool Center grouping test and `npm run test:tool-navigation`.
Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: group Tool Center by user intent`

---

### Task 4: Verify Quick Navigation consumers and mobile behavior

**Files:**
- Modify only if required: `src/components/ToolQuickNavigation.tsx`
- Modify only if required: stylesheet containing `.tool-quick-navigation`
- Modify/add: regression tests covering quick navigation rendering

**Interfaces:**
- Consumes: narrowed `getToolQuickLinks(current)` result.
- Preserves: fixed “返回工具中心” link and existing optional “返回資產” link.

- [ ] **Step 1: Add a failing rendering regression if current tests do not cover max-link behavior**

Assert a routed tool renders no more than 3 related links plus fixed return controls, and a component with no `current` renders no related-tool directory fallback.

- [ ] **Step 2: Run focused test and verify RED if component/CSS changes are needed**

If the narrowed resolver already makes the component pass without production changes, record that no component change is required rather than editing for churn.

- [ ] **Step 3: Apply only necessary component/CSS changes**

Preserve `showAssetsReturn`. Do not add carousel/horizontal-scroll behavior.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the relevant quick-navigation tests and `npm run test:tool-navigation`.
Expected: PASS.

- [ ] **Step 5: Commit if production/test changes were required**

Commit message: `test: lock contextual quick navigation behavior`

---

### Task 5: Full verification and Draft PR

**Files:**
- No intended product-code changes beyond Tasks 1–4.
- PR metadata only after verification.

**Interfaces:**
- Produces: verified Draft PR for user Preview acceptance.

- [ ] **Step 1: Run TypeScript**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 2: Run full CI test aggregation**

Run: `npm run test:ci`
Expected: PASS with 0 failures.

- [ ] **Step 3: Build Production bundle**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Build Preview bundle**

Run: `npm run build:preview`
Expected: PASS.

- [ ] **Step 5: Review branch diff**

Confirm only UR-TODO-040 design/plan docs, navigation metadata/tests, Tool Center rendering/styles, and any necessary Quick Navigation regression changes are present. Confirm no financial-domain files changed.

- [ ] **Step 6: Create Draft PR**

Title: `feat: reorganize Tool Center IA and contextual navigation`

PR body must include summary, changed files, verification results, Preview placeholder/link when available, acceptance focus, compatibility/risk, and rollback approach.

- [ ] **Step 7: Wait for CI Verification and Preview**

Do not mark Ready or Merge. User acceptance must cover desktop and 390×844 mobile, all 14 routed tools reachable from Tool Center, planned tools non-clickable, max-three related links, `showAssetsReturn`, and `/assets#transactions-section` deep-link.
