import { useRef, useState } from 'react';
import { deriveFxConversionExecutedRate, type FxConversionFeeTreatment } from '../../lib/fxConversionIdentity';
import type { FxConversionCreationFailureReason, FxConversionCreationInput, FxConversionCreationResult } from '../../lib/fxConversionProducer';
import type { FinancialAccount } from '../../lib/financialAccounts';
import type { FinancialTransaction } from '../../lib/transactions';

/**
 * UR-TODO-046 FX-F2C-2: manual FX conversion producer form. `enabled` is the UI half of the
 * required double gate (see App.tsx for the write-path half, enforced inside
 * `buildFxConversionCreation`'s own `gateEnabled` check) — hiding this component does not by
 * itself make the producer safe, it only controls whether a human ever sees the entry point.
 * Deliberately a thin, mostly-presentational component: it owns only form-draft state and the
 * double-submit guard, never the app's canonical `transactions`/`opaqueTransactions` state.
 */

const FAILURE_MESSAGES: Record<FxConversionCreationFailureReason, string> = {
  'invalid-source-account': '請選擇有效啟用的支出帳戶',
  'invalid-destination-account': '請選擇有效啟用的存入帳戶',
  'same-account': '支出帳戶與存入帳戶不得相同',
  'unsupported-currency-pair': '目前僅支援一個新台幣帳戶與一個美元帳戶互換',
  'invalid-source-amount': '支出金額必須大於 0',
  'invalid-destination-amount': '存入金額必須大於 0',
  'invalid-effective-date': '請輸入有效的生效日期',
  'invalid-fee-treatment': '手續費狀態無效',
  'explicit-fee-transaction-not-found': '所選手續費交易不存在，請重新選擇或改選其他手續費狀態',
  'leg-construction-failed': '交易建立失敗，請確認輸入內容',
  'unsupported-payload-version': '內部格式版本不支援',
  'malformed-payload': '資料格式錯誤',
  'same-currency': '來源與目的幣別不得相同',
  'same-source-destination': '來源與目的交易不得相同',
  'missing-source-transaction': '找不到來源交易',
  'missing-destination-transaction': '找不到目的交易',
  'source-currency-mismatch': '來源幣別不一致',
  'destination-currency-mismatch': '目的幣別不一致',
  'non-positive-amount': '金額必須大於 0',
  'source-amount-mismatch': '來源金額不一致',
  'destination-amount-mismatch': '目的金額不一致',
  'duplicate-transaction-claim': '偵測到重複的換匯記錄'
};

const describeResult = (result: FxConversionCreationResult): string | null => {
  if (result.status === 'success') return null;
  if (result.status === 'gate-blocked') return '目前尚未開放建立換匯記錄';
  return FAILURE_MESSAGES[result.reason] || '建立失敗，請確認輸入內容';
};

type FeeChoice = 'unknown' | 'none' | 'included' | 'explicit';

export default function FxConversionProducerForm({ enabled, accounts, transactions, onSubmit }: {
  enabled: boolean;
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  onSubmit: (input: FxConversionCreationInput) => FxConversionCreationResult;
}) {
  const candidateAccounts = accounts.filter(account => account.isActive && (account.currency === 'TWD' || account.currency === 'USD'));
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [sourceAmount, setSourceAmount] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [destinationAmount, setDestinationAmount] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [feeChoice, setFeeChoice] = useState<FeeChoice>('unknown');
  const [feeTransactionId, setFeeTransactionId] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  if (!enabled) return null;

  const sourceAccount = candidateAccounts.find(account => account.id === sourceAccountId);
  const destinationAccount = candidateAccounts.find(account => account.id === destinationAccountId);
  const parsedSourceAmount = Number(sourceAmount);
  const parsedDestinationAmount = Number(destinationAmount);
  const derivedRate = sourceAccount && destinationAccount && sourceAccount.currency !== destinationAccount.currency
    && Number.isFinite(parsedSourceAmount) && parsedSourceAmount > 0 && Number.isFinite(parsedDestinationAmount) && parsedDestinationAmount > 0
    ? deriveFxConversionExecutedRate({
      sourceCurrency: sourceAccount.currency as 'TWD' | 'USD', destinationCurrency: destinationAccount.currency as 'TWD' | 'USD',
      sourceAmount: parsedSourceAmount, destinationAmount: parsedDestinationAmount
    })
    : undefined;

  const feeTreatment: FxConversionFeeTreatment = feeChoice === 'explicit'
    ? { type: 'explicit', feeTransactionId }
    : { type: feeChoice };

  const reset = () => {
    setSourceAccountId(''); setSourceAmount(''); setDestinationAccountId(''); setDestinationAmount('');
    setEffectiveDate(new Date().toISOString().slice(0, 10)); setFeeChoice('unknown'); setFeeTransactionId(''); setNote('');
  };

  const submit = () => {
    // Re-entrancy guard: `submittingRef` (unlike React state) mutates synchronously, so it
    // blocks a second click dispatched back-to-back in the same synchronous browser event burst
    // — the exact "double click before anything re-renders" case a `disabled` attribute alone
    // cannot catch, because `onSubmit`/`setState` here are themselves fully synchronous. The
    // release is deferred to a microtask (not the same `finally`) so it stays latched for the
    // remainder of *this* synchronous burst; a later, genuinely separate click (after the
    // microtask queue has drained) submits again normally.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const input: FxConversionCreationInput = {
      sourceAccountId, sourceAmount: parsedSourceAmount, destinationAccountId, destinationAmount: parsedDestinationAmount,
      effectiveDate, feeTreatment, note
    };
    const result = onSubmit(input);
    const failure = describeResult(result);
    if (failure) { setMessage(failure); } else { setMessage('已建立換匯記錄'); reset(); }
    queueMicrotask(() => { submittingRef.current = false; setSubmitting(false); });
  };

  return <div className="fx-conversion-producer-form">
    <p className="note">手動建立一次完整的外幣換匯記錄（僅支援新台幣／美元互換），會同時建立支出、存入兩筆交易與一筆換匯記錄。</p>
    <div className="financial-account-fields">
      <label>支出帳戶<select value={sourceAccountId} onChange={event => setSourceAccountId(event.currentTarget.value)}>
        <option value="">選擇帳戶</option>
        {candidateAccounts.map(account => <option value={account.id} key={account.id}>{account.name}（{account.currency}）</option>)}
      </select></label>
      <label>支出金額<input type="number" min="0" value={sourceAmount} onChange={event => setSourceAmount(event.currentTarget.value)} /></label>
      <label>存入帳戶<select value={destinationAccountId} onChange={event => setDestinationAccountId(event.currentTarget.value)}>
        <option value="">選擇帳戶</option>
        {candidateAccounts.map(account => <option value={account.id} key={account.id}>{account.name}（{account.currency}）</option>)}
      </select></label>
      <label>存入金額<input type="number" min="0" value={destinationAmount} onChange={event => setDestinationAmount(event.currentTarget.value)} /></label>
      <label>生效日期<input type="date" value={effectiveDate} onChange={event => setEffectiveDate(event.currentTarget.value)} /></label>
      <label>手續費<select value={feeChoice} onChange={event => setFeeChoice(event.currentTarget.value as FeeChoice)}>
        <option value="unknown">尚未確認</option>
        <option value="none">無手續費</option>
        <option value="included">已內含於金額中</option>
        <option value="explicit">連結既有交易</option>
      </select></label>
      {feeChoice === 'explicit' && <label>手續費交易<select value={feeTransactionId} onChange={event => setFeeTransactionId(event.currentTarget.value)}>
        <option value="">選擇交易</option>
        {transactions.map(transaction => <option value={transaction.id} key={transaction.id}>{transaction.occurredAt.slice(0, 10)}｜{transaction.amount}</option>)}
      </select></label>}
      <label className="account-note">備註<input value={note} onChange={event => setNote(event.currentTarget.value)} /></label>
    </div>
    {derivedRate !== undefined && <p className="note fx-conversion-derived-rate">換算匯率（僅供確認，非正式牌告匯率）：1 USD ≈ {derivedRate.toFixed(4)} TWD</p>}
    {message && <p className="warning-message">{message}</p>}
    <button className="small" type="button" disabled={submitting} onClick={submit}>建立換匯記錄</button>
  </div>;
}
