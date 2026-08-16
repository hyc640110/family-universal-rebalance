import { useMemo, useState } from 'react';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';
import { formatYuanInput, parseYuanInput, type CashFlowItem, type CashFlowProfile } from '../lib/cashFlow';
import { calculateRetirementPlan, createRetirementPlanDraft, normalizeRetirementPlan, type RetirementPlan } from '../lib/retirementPlanner';

const money = (value: number) => `${(Math.abs(value) / 10_000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬元`;
const percent = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
const MAX_CUSTOM_FIXED_EXPENSES = 10;

function createItemId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `retirement-expense-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function YuanField({ label, value, onChange, placeholder }: { label: string; value: number; onChange: (value: number) => void; placeholder?: string }) {
  return <label>{label}<input type="number" inputMode="numeric" min="0" step="1" value={formatYuanInput(value)} placeholder={placeholder} onFocus={event => {
    if (event.currentTarget.value === '0') event.currentTarget.value = '';
  }} onChange={event => {
    const rawValue = event.currentTarget.value;
    const parsed = parseYuanInput(rawValue);
    if (rawValue === '' || parsed !== null) onChange(parsed ?? 0);
  }} /></label>;
}

export default function RetirementPlannerPage({ plan, cashFlowProfile, currentNetWorth, onSave }: { plan?: RetirementPlan; cashFlowProfile?: CashFlowProfile; currentNetWorth: number; onSave: (plan: RetirementPlan) => void }) {
  const [draft, setDraft] = useState(() => plan ?? createRetirementPlanDraft());
  const calculation = useMemo(() => calculateRetirementPlan(draft, currentNetWorth), [draft, currentNetWorth]);
  const updateItem = (id: string, patch: Partial<CashFlowItem>) => setDraft(current => ({ ...current, fixedExpenses: current.fixedExpenses.map(item => item.id === id ? { ...item, ...patch } : item) }));
  const removeCustomItem = (id: string) => setDraft(current => ({ ...current, fixedExpenses: current.fixedExpenses.filter(item => item.id !== id), customFixedExpenseIds: current.customFixedExpenseIds.filter(itemId => itemId !== id) }));
  const addCustomItem = () => setDraft(current => {
    if (current.customFixedExpenseIds.length >= MAX_CUSTOM_FIXED_EXPENSES) return current;
    const id = createItemId();
    return { ...current, fixedExpenses: [...current.fixedExpenses, { id, name: '', amount: 0, category: 'other', enabled: true }], customFixedExpenseIds: [...current.customFixedExpenseIds, id] };
  });
  const updateBigExpense = (key: keyof RetirementPlan['annualBigExpenses'], value: number) => setDraft(current => ({ ...current, annualBigExpenses: { ...current.annualBigExpenses, [key]: value } }));
  const importFixedExpensesFromCashFlow = () => {
    const importedPlan = createRetirementPlanDraft(cashFlowProfile);
    if (importedPlan.fixedExpenses.length === 0) {
      window.alert('目前「收支與現金流」沒有固定支出資料可以匯入。');
      return;
    }
    if (draft.fixedExpenses.length > 0 && !window.confirm('此動作將覆蓋目前已輸入的項目，是否繼續？')) return;
    setDraft(current => ({ ...current, fixedExpenses: importedPlan.fixedExpenses, customFixedExpenseIds: [] }));
  };

  return <PageFrame page="tools" title="退休提領規劃" description="以目前淨資產、退休支出與提領率進行 FIRE 試算；此頁草稿獨立於現金流設定。">
    <section className="retirement-summary" aria-label="退休試算摘要">
      <article><small>每月小計</small><strong>{money(calculation.monthlyFixedExpenses)}</strong></article>
      <article><small>預估年總開銷</small><strong>{money(calculation.annualExpenses)}</strong></article>
      <article className="retirement-primary"><small>目標退休金（FIRE）</small><strong>{money(calculation.fireTarget)}</strong></article>
      <article><small>目前達成率</small><strong>{percent(calculation.progressPercent)}</strong></article>
    </section>

    <section className="card retirement-section">
      <header><div><div className="retirement-section-title"><h2>每月經常性開銷</h2><button type="button" className="small" onClick={importFixedExpensesFromCashFlow}>從現金流匯入</button></div><p className="note">可按需要從現金流匯入固定支出；調整只會儲存於本退休規劃，不會回寫現金流設定。</p></div><strong>每月小計 {money(calculation.monthlyFixedExpenses)}</strong></header>
      <div className="retirement-expense-list">
        {draft.fixedExpenses.length === 0 && <p className="note">尚無固定支出；可新增最多 {MAX_CUSTOM_FIXED_EXPENSES} 個自訂項目。</p>}
        {draft.fixedExpenses.map(item => <article key={item.id} className={item.enabled ? '' : 'is-disabled'}>
          <label className="retirement-expense-enabled"><input type="checkbox" checked={item.enabled} onChange={event => updateItem(item.id, { enabled: event.currentTarget.checked })} /> 計入支出</label>
          <label>項目名稱<input value={item.name} placeholder={draft.customFixedExpenseIds.includes(item.id) ? '例如：退休後餐費' : '支出名稱'} onChange={event => updateItem(item.id, { name: event.currentTarget.value })} /></label>
          <YuanField label="每月金額（元）" value={item.amount} onChange={amount => updateItem(item.id, { amount })} />
          {draft.customFixedExpenseIds.includes(item.id) && <button type="button" className="danger small" onClick={() => removeCustomItem(item.id)}>刪除</button>}
        </article>)}
      </div>
      <div className="actions"><button type="button" className="small" disabled={draft.customFixedExpenseIds.length >= MAX_CUSTOM_FIXED_EXPENSES} onClick={addCustomItem}>新增自訂項目</button><span className="note">已新增 {draft.customFixedExpenseIds.length}／{MAX_CUSTOM_FIXED_EXPENSES} 個自訂項目</span></div>
    </section>

    <section className="card retirement-section retirement-two-column">
      <div><h2>年度大額開銷</h2><YuanField label="旅遊預算（元）" value={draft.annualBigExpenses.travelBudget} onChange={value => updateBigExpense('travelBudget', value)} /><YuanField label="保險費（元）" value={draft.annualBigExpenses.insuranceFee} onChange={value => updateBigExpense('insuranceFee', value)} /></div>
      <div><h2>提領策略</h2><label className="retirement-range-label">年提領率 <output>{percent(draft.withdrawalRatePercent)}</output><input type="range" min="1" max="20" step="0.1" value={draft.withdrawalRatePercent} onChange={event => { const value = Number(event.currentTarget.value); setDraft(current => ({ ...current, withdrawalRatePercent: value })); }} /></label><p className="note">4% 法則是常見的退休提領試算起點；實際適用性會受到報酬、通膨、稅費與支出變化影響。</p></div>
    </section>

    <section className="card retirement-section retirement-two-column">
      <div><h2>填補缺口計畫</h2><label className="retirement-range-label">預計退休年限 <output>{draft.retirementYears} 年</output><input type="range" min="0" max="60" step="1" value={draft.retirementYears} onChange={event => { const value = Number(event.currentTarget.value); setDraft(current => ({ ...current, retirementYears: value })); }} /></label><label className="retirement-range-label">預期年化報酬 <output>{percent(draft.expectedAnnualReturnPercent)}</output><input type="range" min="0" max="20" step="0.1" value={draft.expectedAnnualReturnPercent} onChange={event => { const value = Number(event.currentTarget.value); setDraft(current => ({ ...current, expectedAnnualReturnPercent: value })); }} /></label></div>
      <div className="retirement-gap-results"><h2>所需投入</h2><p><span>每年需投入</span><strong>{calculation.annualContribution === null ? '請設定退休年限' : money(calculation.annualContribution)}</strong></p><p><span>平均每月負擔</span><strong>{calculation.averageMonthlyContribution === null ? '請設定退休年限' : money(calculation.averageMonthlyContribution)}</strong></p><p className="note">此計算將您的「目前淨資產」納入複利基礎，計算填補缺口所需的條件；僅為依你輸入條件的數學試算，非投資建議。</p></div>
    </section>

    <section className="card retirement-save"><div><h2>儲存退休規劃</h2><p className="note">會保存本頁草稿並納入 localStorage 與 JSON Backup；不會寫入淨資產歷史、Ledger 或現金流設定。</p></div><button type="button" onClick={() => onSave(normalizeRetirementPlan(draft) ?? createRetirementPlanDraft(cashFlowProfile))}>儲存退休規劃</button></section>
    <ToolQuickNavigation current="retirement-planner" />
  </PageFrame>;
}
