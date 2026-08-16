import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import RetirementPlannerPage from '../src/pages/RetirementPlannerPage';
import type { CashFlowProfile } from '../src/lib/cashFlow';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const cashFlowProfile: CashFlowProfile = {
  schemaVersion: 3,
  monthlyIncome: 80_000,
  monthlyInvestmentBudget: 0,
  emergencyFundTargetMonths: 6,
  fixedExpenses: [{ id: 'rent', name: '房租', amount: 20_000, category: 'housing', enabled: true }]
};

async function mount() {
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
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(RetirementPlannerPage, {
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
  const button = (label: string) => [...container.querySelectorAll('button')].find(item => item.textContent === label) as HTMLButtonElement;
  return { container, saved, click, change, button };
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

test('退休頁最多新增十個自訂每月支出項目', async () => {
  const { container, click, button } = await mount();
  for (let index = 0; index < 10; index++) await click(button('新增自訂項目'));

  assert.equal(container.querySelectorAll('input[placeholder="例如：退休後餐費"]').length, 10);
  assert.equal(button('新增自訂項目').disabled, true);
});
