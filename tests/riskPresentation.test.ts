import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveRiskPresentation } from '../src/lib/riskPresentation';

const completeRisk = {
  monthlyEssentialExpenses: 30_000,
  safetyCashShortfall: 0,
  investableCash: 80_000,
  dataCompleteness: 'complete' as const,
  confidence: 'high' as const,
  blockingReasons: []
};

test('完整資料保留家庭流動性金額並標示高可信度', () => {
  const view = deriveRiskPresentation(completeRisk);

  assert.equal(view.monthlyEssentialExpenses, 30_000);
  assert.equal(view.safetyCashShortfall, 0);
  assert.equal(view.investableCash, 80_000);
  assert.equal(view.confidenceLabel, '高');
  assert.equal(view.dataStatus, '資料完整');
});

test('資料不足保留 null 金額並標示低可信度', () => {
  const view = deriveRiskPresentation({
    ...completeRisk,
    monthlyEssentialExpenses: null,
    safetyCashShortfall: null,
    investableCash: null,
    dataCompleteness: 'insufficient',
    confidence: 'low'
  });

  assert.equal(view.monthlyEssentialExpenses, null);
  assert.equal(view.safetyCashShortfall, null);
  assert.equal(view.investableCash, null);
  assert.equal(view.confidenceLabel, '低');
  assert.equal(view.dataStatus, '資料不足');
});

test('只顯示 Household Liquidity 的重複來源警示', () => {
  const view = deriveRiskPresentation({
    ...completeRisk,
    blockingReasons: [
      { code: 'DUPLICATE_LIQUID_ACCOUNT_ID', message: '流動現金輸入包含重複 accountId。', sourceIds: ['cash-1'] },
      { code: 'DEBT_PAYMENT_MISSING', message: '缺少借款清單，不能假設家庭沒有每月借款還款。', sourceIds: [] },
      { code: 'DUPLICATE_LOAN_LINK', message: '同一 Loan 被多個 Cash Flow debt item 連結。', sourceIds: ['loan-1', 'cashflow-1'] }
    ]
  });

  assert.deepEqual(view.duplicateSourceWarnings, [
    '流動現金輸入包含重複 accountId。',
    '同一 Loan 被多個 Cash Flow debt item 連結。'
  ]);
});
