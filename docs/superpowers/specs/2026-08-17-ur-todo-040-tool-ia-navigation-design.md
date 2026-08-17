# UR-TODO-040 Tool IA & Contextual Navigation Design

## Status

- Todo: UR-TODO-040
- Mode: Development Mode
- Baseline: `43fcca43782e103aad5b6dd362eb631c483d79eb`
- Branch: `feat/ur-todo-040-tool-ia-navigation`
- Product contract: frozen from prior Review Mode Product/UX Contract Audit

## Problem

The Tool Center currently renders all 16 tool definitions in one flat grid. Tool-page quick navigation uses `getToolQuickLinks(current)` to return every routed tool except the current tool. This makes the Tool Center poor at answering “what should I do first?” and makes tool-page navigation behave like a second full directory, especially on mobile where the links stack vertically.

UR-TODO-040 is therefore an information-architecture and navigation-responsibility issue, not a Household Liquidity or financial-domain calculation issue. The old dependency on UR-TODO-011 is removed.

## Product Contract

### Tool Center responsibility

The Tool Center is the complete directory and groups all 16 tools into four fixed IA sections:

1. `today-decision` — 今日決策
2. `management-tracking` — 管理與追蹤
3. `planning-simulation` — 規劃與模擬
4. `planned` — 規劃中

The ordering inside each section is explicit and deterministic.

### Tool nature responsibility

Existing `ToolNature` remains unchanged and continues to describe only the relationship to real trading decisions:

- `real-recommendation`
- `simulation`

`nature` must not be reused as IA group, priority, or navigation intent.

### Quick Navigation responsibility

A tool page does not reproduce the whole Tool Center. It shows:

- always: 返回工具中心
- when existing page behavior requests it: 返回資產
- up to 3 contextually related routed tools

A missing `current` tool ID must fail closed: related tools are `[]`, never the complete routed-tool list.

Planning-only tools without `to` are visible in the Tool Center’s 規劃中 section and are never candidates for Quick Navigation.

Bidirectional contextual links are allowed. Quick Navigation is not a wizard and does not need to form a DAG.

## IA Classification

### 今日決策

1. `investment-action-center` — 投資行動中心
2. `ai-decision` — AI 決策中心
3. `risk-center` — 風險與現金安全中心
4. `rebalance-recommendation` — 再平衡建議中心

### 管理與追蹤

1. `portfolio-risk` — 投資組合風險與配置中心
2. `dividend-center` — 配息中心
3. `cash-flow` — 收支與現金流
4. `net-worth-history` — 淨資產歷史中心
5. `import-transactions` — 交易匯入（Import Transactions）

### 規劃與模擬

1. `clec-strategy` — CLEC 再平衡策略中心
2. `wealth-goal` — FIRE／財富目標
3. `retirement-planner` — 退休試算
4. `allocation-simulator` — 配置模擬
5. `investment-backtest` — 三策略再平衡模擬比較

### 規劃中

1. `etf-xray` — ETF X-Ray
2. `monte-carlo` — 蒙地卡羅模擬

## Contextual Mapping

Each routed tool gets at most three related tool IDs.

| Current tool | Related tools |
|---|---|
| `investment-action-center` | `ai-decision`, `risk-center`, `rebalance-recommendation` |
| `ai-decision` | `investment-action-center`, `portfolio-risk`, `rebalance-recommendation` |
| `risk-center` | `cash-flow`, `portfolio-risk`, `investment-action-center` |
| `rebalance-recommendation` | `investment-action-center`, `portfolio-risk`, `clec-strategy` |
| `portfolio-risk` | `risk-center`, `rebalance-recommendation`, `allocation-simulator` |
| `dividend-center` | `cash-flow`, `net-worth-history`, `wealth-goal` |
| `cash-flow` | `risk-center`, `wealth-goal`, `retirement-planner` |
| `net-worth-history` | `wealth-goal`, `cash-flow`, `portfolio-risk` |
| `import-transactions` | `investment-action-center`, `portfolio-risk`, `dividend-center` |
| `clec-strategy` | `rebalance-recommendation`, `investment-backtest`, `allocation-simulator` |
| `wealth-goal` | `retirement-planner`, `cash-flow`, `net-worth-history` |
| `retirement-planner` | `wealth-goal`, `cash-flow`, `allocation-simulator` |
| `allocation-simulator` | `portfolio-risk`, `clec-strategy`, `investment-backtest` |
| `investment-backtest` | `allocation-simulator`, `clec-strategy`, `rebalance-recommendation` |

## Architecture

Keep `TOOL_DEFINITIONS` as the single product-order and metadata source. Add only additive IA/navigation metadata to `ToolDefinition` rather than creating parallel registries.

Conceptually:

```ts
export type ToolGroup = 'today-decision' | 'management-tracking' | 'planning-simulation' | 'planned';

export type ToolDefinition = {
  // existing fields unchanged
  group: ToolGroup;
  priority: number;
  related?: readonly ToolId[];
};
```

`ToolsPage` groups/sorts from `TOOL_DEFINITIONS` and renders section headings plus existing cards. Existing `nature` badges remain unchanged.

`getToolQuickLinks(current)` resolves only the current definition’s `related` IDs, preserves their declared order, filters to definitions with valid `to`, excludes the current tool defensively, and returns `[]` when `current` is absent or invalid.

`ToolQuickNavigation` keeps the existing “返回工具中心” and `showAssetsReturn` behavior and consumes the narrower `getToolQuickLinks()` result.

## UI Behavior

### Desktop

The Tool Center displays four clearly separated sections. Existing active and planned card visual states remain recognizable. No route changes are introduced.

### Mobile

The same four IA sections and same contextual mapping apply. Quick Navigation must not solve density by adding carousels or horizontal scrolling; it reduces the number of links instead.

Target validation viewport: 390 × 844.

## Compatibility and Safety

Must not modify:

- financial calculations
- Household Liquidity
- Rebalance calculation/domain logic
- AI Decision calculation
- Financial Event Ledger
- attribution
- transaction import behavior
- schema
- localStorage persistence
- JSON Backup
- quote logic
- holdings
- retirement/FIRE mathematics

Existing routes stay unchanged, including `/assets#transactions-section`.

## Acceptance Criteria

1. All 16 tool definitions appear in exactly one Tool Center section.
2. All 14 routed tools remain reachable from the Tool Center.
3. ETF X-Ray and Monte Carlo remain visibly planned and non-clickable.
4. Planned tools never appear in Quick Navigation.
5. Tool pages show no more than 3 related tool links.
6. “返回工具中心” remains present.
7. Existing `showAssetsReturn` behavior remains available and can increase a special page to 5 total navigation actions: tools return + assets return + 3 related.
8. `getToolQuickLinks(undefined)` returns an empty related-link list.
9. Existing `ToolNature` labels and semantics are unchanged.
10. Existing routes are unchanged and `/assets#transactions-section` deep-link remains valid.
11. Desktop and 390 × 844 mobile render without horizontal overflow.
12. Navigation behavior is covered by regression tests and included in `npm run test:ci`.
13. `npx tsc -b`, `npm run test:ci`, `npm run build`, and `npm run build:preview` pass before Draft PR review.

## Non-Goals

- Implement ETF X-Ray.
- Implement Monte Carlo simulation.
- Redesign individual tool internals.
- Introduce a second navigation registry.
- Reorder or alter financial decision algorithms.
- Change persistence or backup contracts.

## Risk Assessment

Low to low-medium. Primary risks are route reachability, current-tool mapping omissions, mobile layout regression, and stale navigation-test assumptions. There is no intended financial-data or calculation blast radius.
