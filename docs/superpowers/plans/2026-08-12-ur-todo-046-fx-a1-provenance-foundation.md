# UR-TODO-046 FX-A1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 USD/TWD 外幣現金估值的可驗證 rate provenance 與加法式持久化基礎，不建立 FX attribution。

**Architecture:** 新增純 FX rate／valuation domain，將 USD 原幣餘額與 immutable-style USD/TWD reference-close rate 轉成可追溯的 TWD valuation。新快照可選擇保存 pinned valuation provenance；既有快照維持 legacy 讀取與 residual 邊界。AppState 與 JSON Backup 只加上可正規化的 `fxRateHistory`，不改 Financial Event、歸因、換匯、投資或借款。

**Tech Stack:** React、TypeScript、Node `tsx --test`、Vite。

## Global Constraints

- canonical valuation currency 固定為 `TWD`；第一版只支援 `USD -> TWD`。
- rate direction 固定 `quotePerBase`：`1 USD = N TWD`；rate type 固定 `reference-close`。
- rate 可最多 carry forward 3 個 calendar days；超過必須 fail-safe。
- 不接 provider network、不新增 Worker、不新增 UI。
- 不修改 `netWorthAttribution.ts`、`runtimeAttributionComposition.ts`、Financial Event、Ledger、Generic Split、Investment、Loan、Household Liquidity、AI Decision 或 Rebalance。
- 舊快照不回填、不重寫、不產生 FX attribution。

---

### Task 1: FX rate 與 foreign cash valuation 純契約

**Files:**
- Create: `src/lib/fxValuation.ts`
- Test: `tests/fxValuation.test.ts`

**Interfaces:**
- Consumes: `FinancialAccount`、`canonicalCalendarDay()`。
- Produces: `normalizeFxRateHistory()`、`deriveForeignCashValuation()` 與 pinned valuation normalizer。

- [ ] **Step 1: 寫入失敗測試**

```ts
const value = deriveForeignCashValuation({ account: usdAccount, valuationDate: '2026-08-12', rate });
assert.equal(value.status, 'available');
assert.equal(value.unroundedValue, 31_000);
```

- [ ] **Step 2: 執行測試確認缺少模組而失敗**

Run: `npx tsx --test tests/fxValuation.test.ts`

- [ ] **Step 3: 最小實作**

```ts
export function deriveForeignCashValuation(input: ForeignCashValuationInput): ForeignCashValuation {
  // 只接受 USD 帳戶、canonical date、有效 reference-close rate；其他狀態 fail-safe。
}
```

- [ ] **Step 4: 執行 focused tests**

Run: `npx tsx --test tests/fxValuation.test.ts`

### Task 2: 加法式 AppState／Backup／snapshot provenance 接線

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/netWorthHistory.ts`
- Test: `tests/fxValuationPersistence.test.ts`

**Interfaces:**
- Consumes: Task 1 FX normalizers、既有 `normalizeState()`、`backupPayload()`、`stateFromBackup()`。
- Produces: `fxRateHistory` 與 optional `fxValuations` 的 localStorage／Backup round-trip。

- [ ] **Step 1: 寫入失敗測試**

```ts
const restored = stateFromBackup(JSON.parse(JSON.stringify(backupPayload(state, {}))), normalizeState({})).state;
assert.deepEqual(restored.fxRateHistory, state.fxRateHistory);
assert.deepEqual(restored.netWorthHistory?.[0].fxValuations, state.netWorthHistory?.[0].fxValuations);
```

- [ ] **Step 2: 執行測試確認新欄位未持久化而失敗**

Run: `npx tsx --test tests/fxValuationPersistence.test.ts`

- [ ] **Step 3: 最小實作**

```ts
type NetWorthSnapshot = ExistingSnapshot & { fxValuations?: readonly ForeignCashValuation[] };
// normalizeState、Backup export/import 只保留正常化且有效的加法式欄位。
```

- [ ] **Step 4: 執行 focused tests**

Run: `npx tsx --test tests/fxValuationPersistence.test.ts tests/fxValuation.test.ts`

### Task 3: 治理同步與完整驗證

**Files:**
- Modify: `AI_CONTEXT/003_CURRENT_STATUS.md`
- Modify: `AI_CONTEXT/008_TODO_BACKLOG.md`
- Modify: `AI_CONTEXT/012_AI_HANDOVER.md`
- Modify: `AI_CONTEXT/020_Architecture_Decisions.md`（僅當既有 ADR 不足以記錄 FX-A1 contract）
- Modify: generated Full／Lite AI Context Bundle

- [ ] **Step 1: 以實際結果同步治理**

記錄 FX-A1 僅完成 USD/TWD foreign cash valuation provenance foundation；明示 FX attribution、conversion、foreign investment、foreign loan 均未完成。

- [ ] **Step 2: 重建 Bundle**

Run: `python tools/build_ai_context_bundle.py`

- [ ] **Step 3: 全面驗證**

Run: `npx tsc -b; npm run test:ci; npm run build; npm run build:preview`

- [ ] **Step 4: 建立 Draft PR，不合併**

先確認 diff、stashes、untracked，再 commit、push、建立 Draft PR 與隔離 Preview 驗收。
