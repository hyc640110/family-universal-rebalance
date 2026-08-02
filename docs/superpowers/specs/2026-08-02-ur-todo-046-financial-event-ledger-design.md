# UR-TODO-046 Financial Event Ledger Design

Status: approved product design; implementation begins only with C1.

## Purpose

Provide a forward-only, auditable source of evidence for explaining changes in
net worth. The ledger supplements existing snapshots and transactions; it does
not rewrite history, infer legacy causes, or change investment decisions.

## Decisions

- The ledger is forward-only. `netWorthHistory`, existing `transactions`, and
  `loans` are never rewritten or backfilled.
- Existing `FinancialTransaction` is evidence, not an automatically converted
  ledger record. A ledger event can optionally link one transaction by ID.
- Every attribution result carries a quality status. A missing event is never
  converted to zero and an unexplained residual is never labelled market effect.
- The Asia/Taipei calendar-day contract is the period boundary. A ledger event
  stores the required `effectiveDate` (`YYYY-MM-DD`); optional `occurredAt` is
  an ISO timestamp for audit detail, not a competing date identity.

## C1: additive persistence contract

Add these top-level AppState fields and include them in localStorage, Firebase
canonical sync, and JSON Backup:

```ts
financialEventSchemaVersion: 1
financialEvents: FinancialEvent[]
financialEventAttributionStartDate?: string
```

`financialEventAttributionStartDate` is set only when the user first enables
the ledger. Earlier periods remain legacy and cannot be presented as complete.

```ts
type FinancialEventStatus = 'pending' | 'posted' | 'void'
type FinancialEventSource = 'manual' | 'linked-transaction'
type FinancialEventType =
  | 'external-income'
  | 'external-expense'
  | 'internal-transfer'
  | 'investment-buy'
  | 'investment-sell'
  | 'dividend'
  | 'investment-fee'
  | 'loan-disbursement'
  | 'loan-principal-payment'
  | 'loan-interest-payment'
  | 'adjustment'

type FinancialEvent = {
  id: string
  type: FinancialEventType
  status: FinancialEventStatus
  source: FinancialEventSource
  effectiveDate: string
  occurredAt?: string
  amount: number
  currency: string
  accountId?: string
  counterpartyAccountId?: string
  assetSymbol?: string
  loanId?: string
  transactionId?: string
  note: string
  createdAt: string
  updatedAt: string
}
```

Normalisation validates finite, positive money; valid calendar dates; stable
unique IDs; known references where a reference list is available; and the
event-type requirements below. Invalid imported events are excluded with a
diagnostic rather than coerced into a financial amount.

| Event type | Required linkage | Net-worth treatment |
| --- | --- | --- |
| external-income / external-expense | account | external flow |
| internal-transfer | account + counterparty account | always zero |
| investment-buy / investment-sell | account + asset symbol | internal reclassification |
| dividend / investment-fee | account; asset optional for fee | cash-flow contribution |
| loan-disbursement | account + loan | always zero |
| loan-principal-payment | account + loan | always zero |
| loan-interest-payment | account + loan | external expense |
| adjustment | account | unexplained; blocks complete quality |

`posted` and non-void events are the only candidates for future attribution.
`pending` and `void` stay auditable but do not affect a completed period.

## Compatibility and migration

C1 is additive and forward-only. Absent legacy fields normalise to an empty
ledger with no attribution start date. Existing records are retained exactly;
there is no automatic conversion from `FinancialTransaction`, CashFlowProfile,
loan fields, or Snapshot rows.

The normaliser must preserve unknown future fields through the supported
localStorage, Firebase, and Backup paths. A failed normalisation must not
overwrite the imported raw data. Preview and Production storage boundaries
remain unchanged.

## Later phases

- C2: an explicit ledger input flow and optional, one-to-one evidence links to
  existing transactions. No automatic legacy categorisation.
- C3: a pure calculator that returns known flows, excluded internal transfers,
  residual, and `unavailable | partial | reconciled | complete`. Market effect
  is unavailable unless investment-flow coverage is proven.
- C4: read-only presentation. It does not feed Household Liquidity, Rebalance,
  or AI Decision.

## C1 scope and acceptance

C1 changes only types, normalisation, AppState persistence boundaries, and
tests. It has no UI, no event entry, no attribution calculator, no legacy data
rewrite, and no Production deployment.

Required tests:

1. Valid examples for every event type, including explicit values and links.
2. Invalid dates, non-finite and non-positive amounts, duplicate IDs, and
   invalid transfer or loan links are rejected without amount coercion.
3. Legacy state remains readable without a ledger or start date.
4. localStorage normalisation, Firebase canonical payload, and JSON Backup
   round-trip retain ledger fields and preserve legacy records.
5. Preview data cannot enter Production paths.
6. Existing transaction, dividend, loan, snapshot, Household Liquidity,
   Rebalance, and AI Decision regression suites remain unchanged.

## Stop gates

Stop and return for a user decision if implementation requires automatic
conversion of legacy transactions, a different external/internal classification,
changes to existing transaction semantics, data rewrite, an attribution result
for AI Decision or Rebalance, or any incompatibility in Firebase or Backup.
