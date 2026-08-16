import assert from 'node:assert/strict';
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

async function mount({ confirmResult = true, plan }: { confirmResult?: boolean; plan?: RetirementPlan } = {}) {
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
  browser.window.confirm = message => {
    confirmCalls.push(message);
    return confirmResult;
  };
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(RetirementPlannerPage, {
      plan,
      cashFlowProfile,
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
  return { container, saved, confirmCalls, click, change, focus, blur, button };
}

test('退休頁以現金流固定支出建立獨立草稿，顯示 FIRE 結果並只在按下儲存後回傳', async () => {
  const { container, saved, click, button } = await mount();

  assert.equal((container.querySelector('input[placeholder="支出名稱"]') as HTMLInputElement).value, '房租');
  assert.match(container.textContent || '', /每月小計/);
  assert.match(container.textContent || '', /目標退休金/);
  assert.equal(saved.length, 0);
  await click(button('儲存退休規劃'));
  assert.equal(saved.length, 1);
  assert.deepEqual((saved[0] as { fixedExpenses: Array<{ id: string }> }).fixedExpenses.map(item => item.id), ['rent']);
  assert.equal(cashFlowProfile.fixedExpenses[0]!.amount, 20_000);
});

test('首次開啟選擇匯入時，以現金流固定支出建立退休草稿', async () => {
  const { container, confirmCalls } = await mount({ confirmResult: true });

  assert.deepEqual(confirmCalls, ['是否要從『收支與現金流』的固定支出清單匯入作為起點？']);
  assert.equal((container.querySelector('input[placeholder="支出名稱"]') as HTMLInputElement).value, '房租');
});

test('首次開啟拒絕匯入時，以空白固定支出草稿開始', async () => {
  const { container, confirmCalls } = await mount({ confirmResult: false });

  assert.deepEqual(confirmCalls, ['是否要從『收支與現金流』的固定支出清單匯入作為起點？']);
  assert.equal(container.querySelector('input[placeholder="支出名稱"]'), null);
  assert.match(container.textContent || '', /尚無固定支出/);
});

test('已儲存退休草稿載入時不再詢問匯入，並保留既有草稿', async () => {
  const plan = createRetirementPlanDraft(undefined, { fixedExpenses: [{ ...cashFlowProfile.fixedExpenses[0]!, id: 'saved-expense', name: '已儲存支出', amount: 12_345 }] });
  const { container, confirmCalls } = await mount({ plan });

  assert.deepEqual(confirmCalls, []);
  assert.equal((container.querySelector('input[placeholder="支出名稱"]') as HTMLInputElement).value, '已儲存支出');
  assert.equal((container.querySelector('input[type="number"]') as HTMLInputElement).value, '12345');
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
