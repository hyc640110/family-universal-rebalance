# UR-TODO-046 C1 Financial Event Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a forward-only Financial Event Ledger that survives AppState, localStorage, and JSON Backup / Full Restore without changing any consumer or legacy record.

**Architecture:** A new pure `financialEvents` module owns event types, normalisation, reference validation, and immutable legacy handling. `App.tsx` only calls that boundary while loading, saving, importing, and exporting. The existing Firebase root PUT protocol deliberately excludes Ledger fields; Firebase Ledger synchronization is a separate reviewed phase.

**Tech Stack:** React, TypeScript, Node test runner via `tsx`, browser localStorage, Firebase Realtime Database JSON sync, JSON Backup.

## Global Constraints

- Base branch is `origin/main` at `cccb749cabd2b3f8714176616dba5a8fb8f16844`.
- `financialEvents` is forward-only; do not alter existing `transactions`, `loans`, `cashFlowProfile`, or `netWorthHistory` records.
- Do not auto-convert FinancialTransaction records into events.
- Asia/Taipei `effectiveDate` is the only period identity; `occurredAt` is optional audit detail.
- Missing, invalid, negative, zero, NaN, and Infinity event money must not be coerced into a posted financial event.
- C1 contains no input UI, attribution calculator, Household Liquidity, Rebalance, AI Decision, Preview deployment, or Production deployment.
- Preserve localStorage and JSON Backup compatibility; future Ledger schema remains opaque and is never downgraded.
- **UR-TODO-046 C1 intentionally does not synchronize Financial Event Ledger through Firebase because the existing root PUT protocol is not mixed-version safe. Firebase Ledger synchronization requires a separate reviewed phase.**

---

### Task 1: Financial Event domain contract and normaliser

**Files:**
- Create: `src/lib/financialEvents.ts`
- Create: `tests/financialEvents.test.ts`

**Interfaces:**
- Consumes: account IDs from `FinancialAccount`, loan IDs from `AppState.loans`, and optional existing transaction IDs.
- Produces: `FinancialEvent`, `FinancialEventType`, `FinancialEventStatus`, `FinancialEventSource`, `FinancialEventReferenceContext`, and `normalizeFinancialEventLedger(raw, context)`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeFinancialEventLedger } from '../src/lib/financialEvents';

const context = {
  accountIds: new Set(['bank-a', 'broker-b']),
  loanIds: new Set(['loan-a']),
  transactionIds: new Set(['tx-a'])
};

test('keeps a valid forward-only posted dividend with its evidence link', () => {
  const result = normalizeFinancialEventLedger({
    financialEventSchemaVersion: 1,
    financialEventAttributionStartDate: '2026-08-02',
    financialEvents: [{
      id: 'event-dividend', type: 'dividend', status: 'posted', source: 'linked-transaction',
      effectiveDate: '2026-08-02', amount: 900, currency: 'TWD', accountId: 'bank-a',
      assetSymbol: '00865B', transactionId: 'tx-a', note: '',
      createdAt: '2026-08-02T00:00:00.000Z', updatedAt: '2026-08-02T00:00:00.000Z'
    }]
  }, context);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].type, 'dividend');
  assert.equal(result.attributionStartDate, '2026-08-02');
});

test('rejects non-positive money and invalid required links without coercing them', () => {
  const result = normalizeFinancialEventLedger({
    financialEvents: [{ id: 'bad', type: 'loan-principal-payment', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 0, currency: 'TWD', accountId: 'bank-a', note: '', createdAt: '2026-08-02T00:00:00.000Z', updatedAt: '2026-08-02T00:00:00.000Z' }]
  }, context);
  assert.deepEqual(result.events, []);
  assert.equal(result.skipped.length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/financialEvents.test.ts`

Expected: FAIL because `src/lib/financialEvents.ts` does not yet exist.

- [ ] **Step 3: Write the minimal implementation**

```ts
export const FINANCIAL_EVENT_SCHEMA_VERSION = 1;
export type FinancialEventType = 'external-income' | 'external-expense' | 'internal-transfer' | 'investment-buy' | 'investment-sell' | 'dividend' | 'investment-fee' | 'loan-disbursement' | 'loan-principal-payment' | 'loan-interest-payment' | 'adjustment';
export type FinancialEventStatus = 'pending' | 'posted' | 'void';
export type FinancialEventSource = 'manual' | 'linked-transaction';
export type FinancialEvent = { id: string; type: FinancialEventType; status: FinancialEventStatus; source: FinancialEventSource; effectiveDate: string; occurredAt?: string; amount: number; currency: string; accountId?: string; counterpartyAccountId?: string; assetSymbol?: string; loanId?: string; transactionId?: string; note: string; createdAt: string; updatedAt: string };
export type FinancialEventReferenceContext = { accountIds: Set<string>; loanIds: Set<string>; transactionIds: Set<string> };
export type FinancialEventLedger = {
  schemaVersion: number;
  events: FinancialEvent[];
  attributionStartDate?: string;
  skipped: string[];
};
export function normalizeFinancialEventLedger(raw: unknown, context: FinancialEventReferenceContext): FinancialEventLedger {
  // Treat raw as a read-only record. Keep only valid, uniquely identified events;
  // retain supported future fields on accepted events, and record every rejected
  // event without synthesising money, dates, links, or legacy events.
  // Return schemaVersion 1, the accepted immutable event list, an optional valid
  // Asia/Taipei YYYY-MM-DD attributionStartDate, and the rejected-item diagnostics.
}
```

Require account + counterparty account for `internal-transfer`, account + asset for investment buy/sell, account + loan for all loan events, account for external flows/dividend/fee/adjustment, and an existing transaction ID when source is `linked-transaction`. Validate real calendar dates, ISO timestamps when supplied, positive finite money, distinct internal-transfer accounts, unique IDs, and immutable input handling.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `npx tsx --test tests/financialEvents.test.ts`

Expected: PASS, including valid instances of every type, invalid link/date/money cases, duplicate IDs, optional audit timestamp, absent legacy ledger, and no mutation of raw input.

- [ ] **Step 5: Commit**

```bash
git add src/lib/financialEvents.ts tests/financialEvents.test.ts
git commit -m "feat: add financial event ledger contract"
```

### Task 2: AppState normalisation and local-only persistence wiring

**Files:**
- Modify: `src/App.tsx:91` AppState definition and `src/App.tsx:363-423` state normalisation, local read/write, Backup export/import
- Modify: `src/lib/syncState.ts:5-31` `SYNCABLE_TOP_LEVEL_FIELDS` to exclude Ledger
- Modify: `tests/syncState.test.ts`
- Create: `tests/financialEventPersistence.test.ts`

**Interfaces:**
- Consumes: `normalizeFinancialEventLedger`, `FinancialEvent[]`, AppState `accounts`, `loans`, and `transactions`.
- Produces: normalised `financialEvents`, `financialEventSchemaVersion`, optional `financialEventAttributionStartDate`, local/Backup round-trip fields, and a Firebase exclusion boundary.

- [ ] **Step 1: Write the failing persistence tests**

```ts
test('canonical Firebase payload excludes local-only Ledger fields', () => {
  const payload = canonicalSyncPayload({
    ...baseState,
    financialEventSchemaVersion: 1,
    financialEventAttributionStartDate: '2026-08-02',
    financialEvents: [validDividendEvent]
  });
  assert.equal('financialEvents' in payload, false);
  assert.equal('financialEventSchemaVersion' in payload, false);
  assert.equal('financialEventAttributionStartDate' in payload, false);
});

test('legacy Full Restore clears an existing local Ledger', async () => {
  const restored = stateFromBackup(legacyBackupWithoutLedger, currentWithLedger).state;
  assert.deepEqual(restored.financialEvents, []);
  assert.equal(restored.financialEventAttributionStartDate, undefined);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test tests/syncState.test.ts tests/financialEventPersistence.test.ts`

Expected: FAIL because Ledger is still in the Firebase allow-list or Backup Full Restore retains the current Ledger.

- [ ] **Step 3: Wire the smallest persistence boundary**

```ts
export type AppState = {
  // existing fields
  financialEventSchemaVersion: number;
  financialEvents: FinancialEvent[];
  financialEventAttributionStartDate?: string;
};

const financialEventLedger = normalizeFinancialEventLedger(r, {
  accountIds: new Set(accountState.accounts.map(account => account.id)),
  loanIds: new Set(loans.map(loan => loan.id)),
  transactionIds: new Set(transactionState.transactions.map(transaction => transaction.id))
});
```

Keep `financialEvents`, `financialEventSchemaVersion`, and `financialEventAttributionStartDate` out of `SYNCABLE_TOP_LEVEL_FIELDS`; retain them in `backupPayload` and `stateFromBackup`. A Firebase download must fail-safe when local Ledger evidence exists rather than replacing linked transactions. Do not add an event-input handler or alter a current UI component.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `npx tsx --test tests/syncState.test.ts tests/financialEventPersistence.test.ts tests/productionTransactionsSyncRegression.test.ts`

Expected: PASS. Existing transactions remain byte-for-byte semantically unchanged; the canonical Firebase payload excludes Ledger fields; Backup import/export and local normalisation preserve valid events; legacy Full Restore produces an empty ledger without a start date.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/lib/syncState.ts tests/syncState.test.ts tests/financialEventPersistence.test.ts
git commit -m "feat: persist financial event ledger"
```

### Task 3: C1 regression and compatibility gate

**Files:**
- Modify: `package.json:85` only if the two dedicated tests are not already covered by `test:ci`
- Modify: `tests/financialEventPersistence.test.ts` for full cross-boundary assertions

**Interfaces:**
- Consumes: final Task 1 and Task 2 contracts.
- Produces: one reproducible C1 verification command set and explicit proof that no consumer reads `financialEvents`.

- [ ] **Step 1: Write the failing boundary test**

```ts
test('C1 adds persistence only and does not wire a consumer', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /FinancialEvent.*(?:Page|Calculator|Attribution)/);
  assert.match(app, /financialEvents/);
});
```

- [ ] **Step 2: Run it to verify the intended boundary**

Run: `npx tsx --test tests/financialEventPersistence.test.ts`

Expected: FAIL until the test names and implementation match the final C1 persistence-only boundary.

- [ ] **Step 3: Make only the minimal test-registration or assertion adjustment**

Append exactly `tests/financialEvents.test.ts tests/financialEventPersistence.test.ts` to the existing explicit `test:ci:unit-ts` file list in `package.json`. Do not add a calculator, event form, route, dashboard card, or decision-system import.

- [ ] **Step 4: Run the full C1 verification suite**

Run: `npx tsc -b && npm run test:ci && npm run build && npm run build:preview && git diff --check`

Expected: TypeScript, all CI tests, Production build, Preview build, and whitespace checks PASS. Also run `npm audit --omit=dev --audit-level=high`; record existing findings without changing dependencies unless separately authorised.

- [ ] **Step 5: Commit**

```bash
git add package.json tests/financialEventPersistence.test.ts
git commit -m "test: verify financial event ledger boundaries"
```

## Plan self-review

- Spec coverage: Task 1 implements C1 event types, validation, links, dates, and forward-only normalisation. Task 2 implements the three persistence paths and legacy compatibility. Task 3 proves no consumer expansion and runs the required regression gate.
- Placeholder scan: no unfinished design decisions are delegated to an implementer; invalid input and legacy behavior are explicit.
- Type consistency: Task 1 exports the exact ledger fields used by Task 2; Task 3 consumes only the final persistence contract.
