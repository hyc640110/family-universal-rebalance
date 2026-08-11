import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('P2-A does not make transaction or Ledger persistence depend on Firebase sync diagnostics', () => {
  assert.match(app, /financialEvents: serializeFinancialEventLedgerEvents\(state\.financialEventSchemaVersion, state\.financialEvents\)/);
  assert.match(app, /financialEvents: serializeFinancialEventLedgerEvents\(normalized\.financialEventSchemaVersion, normalized\.financialEvents\)/);
  assert.doesNotMatch(app, /transactionSyncDiagnostics|deriveTransactionSyncDiagnostics|mergeFinancialEventLedgers/);
});
