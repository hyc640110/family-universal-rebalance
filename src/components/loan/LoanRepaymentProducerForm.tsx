import { useRef, useState } from 'react';
import type { LoanRepaymentCreationFailureReason, LoanRepaymentCreationInput, LoanRepaymentCreationResult } from '../../lib/loanRepaymentProducer';
import type { FinancialAccount } from '../../lib/financialAccounts';

/**
 * UR-TODO-054-A: minimal manual Loan repayment producer form. Deliberately a thin,
 * mostly-presentational component: it owns only form-draft state and the double-submit guard,
 * never the app's canonical `transactions` state. It only ever creates a *candidate* — it never
 * calls the confirmation helper — so submitting this form alone never posts anything to the
 * Financial Event Ledger (see App.tsx's `createLoanRepayment`, which is the only caller of
 * `buildLoanRepaymentCreation()`).
 */

const FAILURE_MESSAGES: Record<LoanRepaymentCreationFailureReason, string> = {
  'invalid-loan': '請選擇有效的貸款',
  'invalid-account': '請選擇有效啟用的新台幣扣款帳戶',
  'invalid-effective-date': '請輸入有效的還款日期',
  'no-components': '請至少輸入一項大於 0 的金額（本金／利息／手續費／違約金）',
  'invalid-component-amount': '金額必須是有效且不小於 0 的數字，不接受負數',
  'transaction-construction-failed': '建立失敗，請確認輸入內容'
};

const describeResult = (result: LoanRepaymentCreationResult): string | null => {
  if (result.status === 'success') return null;
  return FAILURE_MESSAGES[result.reason] || '建立失敗，請確認輸入內容';
};

function parseAmount(value: string): number {
  if (value.trim() === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export default function LoanRepaymentProducerForm({ loans, accounts, onSubmit }: {
  loans: readonly { id: string; name: string }[];
  accounts: FinancialAccount[];
  onSubmit: (input: LoanRepaymentCreationInput) => LoanRepaymentCreationResult;
}) {
  const candidateAccounts = accounts.filter(account => account.isActive && account.currency === 'TWD');
  const [loanId, setLoanId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [cashAccountId, setCashAccountId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interest, setInterest] = useState('');
  const [fee, setFee] = useState('');
  const [penalty, setPenalty] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const parsedPrincipal = parseAmount(principal);
  const parsedInterest = parseAmount(interest);
  const parsedFee = parseAmount(fee);
  const parsedPenalty = parseAmount(penalty);
  const validAmounts = [parsedPrincipal, parsedInterest, parsedFee, parsedPenalty].every(value => Number.isFinite(value) && value >= 0);
  const derivedTotal = validAmounts ? parsedPrincipal + parsedInterest + parsedFee + parsedPenalty : NaN;

  const reset = () => {
    setLoanId(''); setEffectiveDate(new Date().toISOString().slice(0, 10)); setCashAccountId('');
    setPrincipal(''); setInterest(''); setFee(''); setPenalty(''); setNote('');
  };

  const submit = () => {
    // Re-entrancy guard: mirrors FxConversionProducerForm's synchronous-burst protection —
    // release deferred to a microtask so a genuinely separate later click still submits.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const input: LoanRepaymentCreationInput = {
      loanId, cashAccountId, effectiveDate,
      components: { principal, interest, fee, penalty },
      note
    };
    const result = onSubmit(input);
    const failure = describeResult(result);
    if (failure) { setMessage(failure); } else { setMessage('已登記還款，待您於下方確認正式記帳'); reset(); }
    queueMicrotask(() => { submittingRef.current = false; setSubmitting(false); });
  };

  return <div className="loan-repayment-producer-form">
    <p className="note">手動登記一筆貸款還款。此步驟只會建立待確認的候選紀錄，尚不會正式記帳；需於下方「本次還款」清單按「確認正式記帳」才會寫入 Ledger。</p>
    <div className="financial-account-fields">
      <label>貸款<select value={loanId} onChange={event => setLoanId(event.currentTarget.value)}>
        <option value="">選擇貸款</option>
        {loans.map(loan => <option value={loan.id} key={loan.id}>{loan.name || '未命名借款'}</option>)}
      </select></label>
      <label>還款日期<input type="date" value={effectiveDate} onChange={event => setEffectiveDate(event.currentTarget.value)} /></label>
      <label>本金<input type="number" min="0" value={principal} onChange={event => setPrincipal(event.currentTarget.value)} /></label>
      <label>利息<input type="number" min="0" value={interest} onChange={event => setInterest(event.currentTarget.value)} /></label>
      <label>手續費<input type="number" min="0" value={fee} onChange={event => setFee(event.currentTarget.value)} /></label>
      <label>違約金<input type="number" min="0" value={penalty} onChange={event => setPenalty(event.currentTarget.value)} /></label>
      <label>扣款帳戶<select value={cashAccountId} onChange={event => setCashAccountId(event.currentTarget.value)}>
        <option value="">選擇帳戶</option>
        {candidateAccounts.map(account => <option value={account.id} key={account.id}>{account.name}（{account.currency}）</option>)}
      </select></label>
      <label className="account-note">備註<input value={note} onChange={event => setNote(event.currentTarget.value)} /></label>
    </div>
    <p className="note loan-repayment-derived-total">還款總額（自動加總，本金＋利息＋手續費＋違約金）：{validAmounts ? `NT$${derivedTotal.toLocaleString('zh-TW')}` : '請確認金額輸入'}</p>
    {message && <p className="warning-message">{message}</p>}
    <button className="small" type="button" disabled={submitting} onClick={submit}>登記還款</button>
  </div>;
}
