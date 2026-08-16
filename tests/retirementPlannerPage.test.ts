import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React, { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import RetirementPlannerPage from '../src/pages/RetirementPlannerPage';
import type { CashFlowProfile } from '../src/lib/cashFlow';
import { createRetirementPlanDraft, type RetirementPlan } from '../src/lib/retirementPlanner';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const cashFlowProfile: CashFlowProfile = {
  schemaVersion: 3,
  monthlyIncome: 80_000,
  monthlyInvestmentBudget: 0,
  emergencyFundTargetMonths: 6,
  fixedExpenses: [{ id: 'rent', name: '房租', amount: 20_000, category: 'housing', enabled: true }]
};

async function mount({ confirmResult = true, plan, profile = cashFlowProfile }: { confirmResult?: boolean; plan?: RetirementPlan; profile?: CashFlowProfile } = {}) {
  const { JSDOM } = await import('jsdom');
  const browser = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  (globalThis as unknown as { window: typeof browser.window }).window = browser.window;
  (globalThis as unknown as { document: Document }).document = browser.window.document;
  Object.defineProperty(globalThis, 'navigator', { value: browser.window.navigator, configurable: true });
  (globalThis as unknown as { HTMLElement: typeof browser.window.HTMLElement }).HTMLElement = browser.window.HTMLElement;
  (globalThis as unknown as { Event: typeof browser.window.Event }).Event = browser.window.Event;
  (globalThis as unknown as { MouseEvent: typeof browser.window.MouseEvent }).MouseEvent = browser.window.MouseEvent;
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const container = browser.window.document.createElement('div');
  browser.window.document.body.appendChild(container);
  const root = createRoot(container);
  const saved: unknown[] = [];
  const confirmCalls: string[] = [];
  const alertCalls: string[] = [];
  browser.window.confirm = message => {
    confirmCalls.push(message);
    return confirmResult;
  };
  browser.window.alert = message => { alertCalls.push(message); };
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(RetirementPlannerPage, {
      plan,
      cashFlowProfile: profile,
      currentNetWorth: 1_000_000,
      onSave: plan => saved.push(plan)
    })));
  });
  const click = async (button: HTMLButtonElement) => { await act(async () => { button.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true })); }); };
  const change = async (input: HTMLInputElement, value: string) => {
    Object.getOwnPropertyDescriptor(browser.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    await act(async () => {
      input.dispatchEvent(new browser.window.Event('input', { bubbles: true }));
      input.dispatchEvent(new browser.window.Event('change', { bubbles: true }));
    });
  };
  const focus = async (input: HTMLInputElement) => { await act(async () => { input.focus(); }); };
  const blur = async (input: HTMLInputElement) => { await act(async () => { input.blur(); }); };
  const button = (label: string) => [...container.querySelectorAll('button')].find(item => item.textContent === label) as HTMLButtonElement;
  const deleteButtonFor = (itemName: string) => {
    const nameInput = [...container.querySelectorAll('.retirement-expense-list input')].find(item => (item as HTMLInputElement).value === itemName) as HTMLInputElement;
    return nameInput.closest('article')!.querySelector('button.danger') as HTMLButtonElement;
  };
  return { container, saved, confirmCalls, alertCalls, click, change, focus, blur, button, deleteButtonFor };
}

test('退休頁首次開啟保持空白草稿，不主動詢問或匯入現金流固定支出', async () => {
  const { container, confirmCalls } = await mount();

  assert.deepEqual(confirmCalls, []);
  assert.equal(container.querySelector('input[placeholder="支出名稱"]'), null);
  assert.match(container.textContent || '', /尚無固定支出/);
});

test('退休頁從現金流匯入按鈕會確認後覆蓋目前草稿，並只在儲存後回傳', async () => {
  const plan = createRetirementPlanDraft(undefined, { fixedExpenses: [{ ...cashFlowProfile.fixedExpenses[0]!, id: 'manual', name: '手動輸入', amount: 12_345 }] });
  const { container, saved, confirmCalls, click, button } = await mount({ plan });

  assert.equal((container.querySelector('input[placeholder="支出名稱"]') as HTMLInputElement).value, '手動輸入');
  await click(button('從現金流匯入'));
  assert.deepEqual(confirmCalls, ['此動作將覆蓋目前已輸入的項目並重新載入現金流全部固定支出，先前在此清單中刪除的項目可能會重新出現，是否繼續？']);
  assert.equal((container.querySelector('input[placeholder="支出名稱"]') as HTMLInputElement).value, '房租');
  assert.equal(saved.length, 0);
  await click(button('儲存退休規劃'));
  assert.equal(saved.length, 1);
  assert.deepEqual((saved[0] as { fixedExpenses: Array<{ id: string }> }).fixedExpenses.map(item => item.id), ['rent']);
  assert.equal(cashFlowProfile.fixedExpenses[0]!.amount, 20_000);
});

test('退休頁現金流沒有固定支出時顯示提示且不改變草稿', async () => {
  const emptyProfile = { ...cashFlowProfile, fixedExpenses: [] };
  const { container, alertCalls, confirmCalls, click, button } = await mount({ profile: emptyProfile });

  await click(button('從現金流匯入'));
  assert.deepEqual(confirmCalls, []);
  assert.deepEqual(alertCalls, ['目前「收支與現金流」沒有固定支出資料可以匯入。']);
  assert.equal(container.querySelector('input[placeholder="支出名稱"]'), null);
  assert.match(container.textContent || '', /尚無固定支出/);
});

test('已儲存退休草稿載入時仍可使用現金流匯入按鈕', async () => {
  const plan = createRetirementPlanDraft(undefined, { fixedExpenses: [{ ...cashFlowProfile.fixedExpenses[0]!, id: 'saved-expense', name: '已儲存支出', amount: 12_345 }] });
  const { container, confirmCalls, click, button } = await mount({ plan, confirmResult: false });

  assert.deepEqual(confirmCalls, []);
  assert.equal((container.querySelector('input[placeholder="支出名稱"]') as HTMLInputElement).value, '已儲存支出');
  await click(button('從現金流匯入'));
  assert.deepEqual(confirmCalls, ['此動作將覆蓋目前已輸入的項目並重新載入現金流全部固定支出，先前在此清單中刪除的項目可能會重新出現，是否繼續？']);
  assert.equal((container.querySelector('input[placeholder="支出名稱"]') as HTMLInputElement).value, '已儲存支出');
});

test('退休頁滑桿事件在最小、中間與最大值都不會讀取已失效的 event currentTarget', async () => {
  const { container, change } = await mount();
  const sliders = [...container.querySelectorAll('input[type="range"]')] as HTMLInputElement[];
  assert.equal(sliders.length, 3);

  for (const [slider, values] of [[sliders[0]!, ['1', '10', '20']], [sliders[1]!, ['0', '30', '60']], [sliders[2]!, ['0', '10', '20']]] as const) {
    for (const value of values) {
      await change(slider, value);
      assert.equal(slider.value, value);
    }
  }
  assert.match(container.textContent || '', /所需投入/);
});

test('退休頁元金額欄位聚焦零值時可直接輸入取代，清空失焦後回復零值', async () => {
  const { container, saved, click, change, focus, blur, button } = await mount();
  await click(button('從現金流匯入'));
  await click(button('新增自訂項目'));
  await change(container.querySelector('input[placeholder="例如：退休後餐費"]') as HTMLInputElement, '自訂支出');
  const amountInputs = () => [...container.querySelectorAll('input[type="number"]')] as HTMLInputElement[];

  for (const input of [amountInputs()[1]!, amountInputs()[2]!, amountInputs()[3]!]) {
    await focus(input);
    assert.equal(input.value, '', '聚焦預設零值時必須清空，以避免不同瀏覽器將新數字附加在 0 後');
  }
  await change(amountInputs()[1]!, '1');
  await change(amountInputs()[2]!, '2');
  await change(amountInputs()[3]!, '10000');
  const insuranceFee = amountInputs()[3]!;
  insuranceFee.select();
  await change(insuranceFee, '2');
  const travelBudget = amountInputs()[2]!;
  await change(travelBudget, '');
  await blur(travelBudget);

  assert.equal(amountInputs()[1]!.value, '1');
  assert.equal(amountInputs()[2]!.value, '0');
  assert.equal(amountInputs()[3]!.value, '2');
  await click(button('儲存退休規劃'));
  const plan = saved[0] as { fixedExpenses: Array<{ amount: number }>; annualBigExpenses: { travelBudget: number; insuranceFee: number } };
  assert.equal(plan.fixedExpenses.at(-1)?.amount, 1);
  assert.equal(plan.annualBigExpenses.travelBudget, 0);
  assert.equal(plan.annualBigExpenses.insuranceFee, 2);
});

test('退休頁最多新增十個自訂每月支出項目', async () => {
  const { container, click, button } = await mount();
  for (let index = 0; index < 10; index++) await click(button('新增自訂項目'));

  assert.equal(container.querySelectorAll('input[placeholder="例如：退休後餐費"]').length, 10);
  assert.equal(button('新增自訂項目').disabled, true);
});

const multiItemProfile: CashFlowProfile = {
  ...cashFlowProfile,
  fixedExpenses: [
    { id: 'rent', name: '房租', amount: 20_000, category: 'housing', enabled: true },
    { id: 'internet', name: '中嘉寬頻+TV', amount: 1_200, category: 'subscription', enabled: true }
  ]
};

test('匯入項目（非自訂項目）也顯示刪除按鈕，點擊後從清單正確移除，每月小計重新計算正確', async () => {
  const plan = createRetirementPlanDraft(multiItemProfile);
  const { container, saved, confirmCalls, click, button, deleteButtonFor } = await mount({ plan, profile: multiItemProfile });

  assert.deepEqual(plan.customFixedExpenseIds, [], '兩筆項目皆為匯入項目，不是自訂項目');
  assert.equal(container.querySelectorAll('.retirement-expense-list article').length, 2);
  const monthlySubtotal = () => container.querySelector('.retirement-summary article strong') as HTMLElement;
  assert.match(monthlySubtotal().textContent || '', /2\.1 萬元/, '刪除前每月小計應為房租 20,000 ＋ 中嘉寬頻+TV 1,200 = 21,200 元');

  const deleteButton = deleteButtonFor('中嘉寬頻+TV');
  assert.equal(deleteButton.getAttribute('aria-label'), '刪除固定支出 中嘉寬頻+TV');
  assert.ok(deleteButton.classList.contains('retirement-expense-delete'));
  assert.equal(deleteButton.closest('.retirement-expense-toolbar')?.querySelector('.retirement-expense-enabled input[type="checkbox"]') !== null, true, '勾選框與刪除圖示必須位於同一個頂端工具列');
  await click(deleteButton);

  assert.deepEqual(confirmCalls, ['確定要刪除「中嘉寬頻+TV」嗎？']);

  assert.equal(container.querySelectorAll('.retirement-expense-list article').length, 1, '刪除後清單只剩一筆，無殘留');
  assert.equal([...container.querySelectorAll('.retirement-expense-list input')].some(item => (item as HTMLInputElement).value === '中嘉寬頻+TV'), false);
  assert.equal([...container.querySelectorAll('.retirement-expense-list input')].some(item => (item as HTMLInputElement).value === '房租'), true, '未被刪除的房租項目維持不變');
  assert.equal(monthlySubtotal().textContent, '2 萬元', '刪除後每月小計應只剩房租 20,000 元，正確重新計算，無殘留金額');

  await click(button('儲存退休規劃'));
  assert.deepEqual((saved[0] as { fixedExpenses: Array<{ id: string }> }).fixedExpenses.map(item => item.id), ['rent']);
});

test('取消刪除固定支出時保留原項目，避免圖示按鈕誤觸造成資料遺失', async () => {
  const plan = createRetirementPlanDraft(multiItemProfile);
  const { container, confirmCalls, click, deleteButtonFor } = await mount({ plan, profile: multiItemProfile, confirmResult: false });

  await click(deleteButtonFor('中嘉寬頻+TV'));

  assert.deepEqual(confirmCalls, ['確定要刪除「中嘉寬頻+TV」嗎？']);
  assert.equal(container.querySelectorAll('.retirement-expense-list article').length, 2);
  assert.equal([...container.querySelectorAll('.retirement-expense-list input')].some(item => (item as HTMLInputElement).value === '中嘉寬頻+TV'), true);
});

test('自訂項目的刪除按鈕行為與匯入項目完全一致（同一個 handler，同一個 class）', async () => {
  const { container, click, button, deleteButtonFor } = await mount();
  await click(button('從現金流匯入'));
  await click(button('新增自訂項目'));
  const customNameInput = container.querySelector('input[placeholder="例如：退休後餐費"]') as HTMLInputElement;
  const customDeleteButton = customNameInput.closest('article')!.querySelector('button.danger') as HTMLButtonElement;
  const importedDeleteButton = deleteButtonFor('房租');

  assert.equal(customDeleteButton.className, importedDeleteButton.className, '自訂與匯入項目的刪除按鈕必須是同一個 class，視覺樣式一致');
  assert.equal(customDeleteButton.getAttribute('aria-label'), '刪除固定支出 未命名');
  assert.equal(importedDeleteButton.getAttribute('aria-label'), '刪除固定支出 房租');

  await click(importedDeleteButton);
  assert.equal(container.querySelectorAll('.retirement-expense-list article').length, 1, '刪除匯入項目後只剩自訂項目');
  assert.equal([...container.querySelectorAll('.retirement-expense-list input')].some(item => (item as HTMLInputElement).value === '房租'), false);
});

test('刪除匯入項目後再次按「從現金流匯入」，被刪除的項目會重新出現（整份覆蓋既有行為，非合併）', async () => {
  const alreadyDeletedPlan = createRetirementPlanDraft(multiItemProfile, { fixedExpenses: [multiItemProfile.fixedExpenses[0]!] });
  const { container, confirmCalls, click, button } = await mount({ plan: alreadyDeletedPlan, profile: multiItemProfile });

  assert.equal(container.querySelectorAll('.retirement-expense-list article').length, 1, '模擬使用者先前已刪除中嘉寬頻+TV，草稿只剩房租');

  await click(button('從現金流匯入'));

  assert.deepEqual(confirmCalls, ['此動作將覆蓋目前已輸入的項目並重新載入現金流全部固定支出，先前在此清單中刪除的項目可能會重新出現，是否繼續？']);
  assert.equal(container.querySelectorAll('.retirement-expense-list article').length, 2, '再次匯入是整份覆蓋 cashFlowProfile.fixedExpenses，不記得先前刪除過哪些項目，中嘉寬頻+TV 會重新出現');
  assert.equal([...container.querySelectorAll('.retirement-expense-list input')].some(item => (item as HTMLInputElement).value === '中嘉寬頻+TV'), true);
});

test('手機斷點固定支出勾選標籤保留完整文字且不換行', () => {
  const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /@media\(max-width:768px\)\{[^}]*\.retirement-expense-enabled\{[^}]*white-space:nowrap/);
});
