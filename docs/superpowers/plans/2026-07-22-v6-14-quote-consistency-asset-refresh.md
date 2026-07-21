# V6.14 Quote Consistency & Asset Refresh Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Assets invoke the existing single Quote Refresh Controller and accurately explain the freshness, source, and fallback status of the shared quote map.

**Architecture:** Keep `App.tsx` as the sole owner of `quotes`, refresh state, and the existing controller. Extract only pure display and pull-gesture helpers; Assets receives callbacks and derived presentation data, never a fetch function or independent quote state.

**Tech Stack:** React, TypeScript, Vite, Node test runner, existing quote refresh controller.

## Global Constraints

- Keep Price Worker, Market Worker, Firebase, localStorage, Backup schema, data models, routing, and allocation logic unchanged.
- A manual Assets refresh uses the existing controller and retains its in-flight and timestamp merge contracts.
- `quoteDate` plus `quoteTime` determine freshness; `updatedAt` is receipt time only.
- Preserve valid prior quotes after partial or failed refreshes and label fallback/preserved values accurately.
- Pull-to-refresh is Assets-only, top-of-page-only, threshold-gated, and disabled while refreshing.
- Keep Preview and Production isolated; deploy only Preview after all automated checks pass.

---

### Task 1: Define quote presentation contracts

**Files:**
- Create: `src/lib/quotePresentation.ts`
- Create: `tests/v6QuoteConsistencyAssetRefresh.test.ts`

**Interfaces:**
- Produces `describeQuotePresentation(quote, now)` returning source text, market timestamp text, receipt timestamp text, freshness status, and fallback/preserved flags.

- [ ] **Step 1: Write failing tests** for current-day worker data, prior valid quote retained after an error, and average-cost fallback.
- [ ] **Step 2: Run** `npx tsx --test tests/v6QuoteConsistencyAssetRefresh.test.ts`; expected result: missing module failure.
- [ ] **Step 3: Implement** the pure presentation adapter using `quoteDateStatus` and source/error fields only.
- [ ] **Step 4: Re-run** the focused test; expected result: all cases pass.

### Task 2: Adapt the Assets header without a second quote state

**Files:**
- Modify: `src/pages/AssetsPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `tests/v6QuoteConsistencyAssetRefresh.test.ts`

**Interfaces:**
- Consumes `onRefreshQuotes`, `isRefreshingQuotes`, `quoteStatus`, and derived quote presentation rows from `App.tsx`.
- Produces an accessible header control and status summary; it must not call `fetch`.

- [ ] **Step 1: Write failing structural and behavior-contract tests** proving Assets receives the existing callback, disables the button while refreshing, and contains no quote fetch/state declaration.
- [ ] **Step 2: Run** the focused test; expected result: the new Assets contract assertions fail.
- [ ] **Step 3: Implement** the smallest Props extension and responsive header/status layout.
- [ ] **Step 4: Re-run** the focused test; expected result: all cases pass.

### Task 3: Add a guarded Assets pull gesture

**Files:**
- Create: `src/lib/assetsPullToRefresh.ts`
- Modify: `src/pages/AssetsPage.tsx`
- Modify: `src/styles.css`
- Modify: `tests/v6QuoteConsistencyAssetRefresh.test.ts`

**Interfaces:**
- Produces `createAssetsPullToRefresh` with touch-start, move, and end handlers plus `isArmed` state.
- Consumes the page-top condition and `isRefreshing` value; invokes `onRefresh` once only after the fixed threshold.

- [ ] **Step 1: Write failing tests** for non-top, below-threshold, threshold-release, and refreshing duplicate cases.
- [ ] **Step 2: Run** the focused test; expected result: missing helper failure.
- [ ] **Step 3: Implement** a pure gesture state machine without transforms, global listeners, or horizontal scrolling changes.
- [ ] **Step 4: Re-run** the focused test; expected result: all cases pass.

### Task 4: Regression and Preview handoff

**Files:**
- Modify: `package.json` only if a dedicated V6.14 test command is needed.
- Generated: tracked build artifacts only after builds succeed.

- [ ] **Step 1: Run** quote, V6.5, V6.6, V6.9, Market, Assets, Dashboard, Analytics, AI, Risk, Rebalance, Stability, TypeScript, builds, artifact isolation, audit, and diff check.
- [ ] **Step 2: Deploy** isolated Preview only.
- [ ] **Step 3: Verify** Preview HTML/CSS/JS HTTP 200 and Preview bundle isolation.
- [ ] **Step 4: Create** one Draft PR; do not mark Ready or merge.

## Self-review

- Scope covers one owner for quote state, reliable Assets entry points, freshness/source semantics, and no Worker mutation.
- No task changes holdings, transactions, accounts, Firebase, localStorage, Backup schema, Price Worker, Market Worker, or Production.
- Tests are specified before each new production helper or UI integration.
