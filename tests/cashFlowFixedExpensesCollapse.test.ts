import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React, { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import CashFlowPage from '../src/pages/CashFlowPage';
import type { CashFlowProfile } from '../src/lib/cashFlow';

// UI-only follow-up to the cash-flow page: moves the "新增項目" button out of the
// "固定支出清單" title row and down next to "儲存現金流設定", and adds a collapse/expand
// toggle on the title row (reusing the site-wide SectionCard collapsible-card markup and
// CollapseEyeIcon, not a new mechanism). Purely a display concern — no calculation,
// schema, or persistence change.

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const profile: CashFlowProfile = {
  schemaVersion: 3,
  monthlyIncome: 60000,
  fixedExpenses: [{ id: 'rent', name: '示範支出項目', amount: 15000, category: 'housing', enabled: true }],
  variableExpenseBudget: null,
  monthlyInvestmentBudget: 10000,
  emergencyFundTargetMonths: 6,
  notes: ''
};

async function mountInJsdom(profileInput: CashFlowProfile | undefined = profile) {
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
  const onSave = () => {};
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(CashFlowPage, { profile: profileInput, currentCash: 100000, onSave })));
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
  const findButton = (text: string) => [...container.querySelectorAll('button')].find(candidate => candidate.textContent === text) as HTMLButtonElement;
  const findToggle = () => container.querySelector('.section-toggle') as HTMLButtonElement;
  return { container, click, change, focus, findButton, findToggle };
}

test('the fixed-expense-list section defaults open, its items visible, with a toggle in the title row', async () => {
  const { container, findToggle } = await mountInJsdom();
  const toggle = findToggle();
  assert.ok(toggle, 'expected a section-toggle button when the section starts open');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.match(toggle.textContent || '', /收合/);
  assert.match(container.innerHTML, /示範支出項目/, 'item fields should be visible while open');
  assert.match(container.innerHTML, /15,?000|15000/);
});

test('clicking the toggle collapses the section, hiding every item field, leaving only the title row', async () => {
  const { container, click, findToggle } = await mountInJsdom();
  await click(findToggle());
  assert.doesNotMatch(container.innerHTML, /示範支出項目/, 'item name should be hidden once collapsed');
  const reopenToggle = findToggle();
  assert.match(reopenToggle.textContent || '', /展開/, 'toggle should now read 展開');
  assert.equal(reopenToggle.getAttribute('aria-expanded'), 'false');
  assert.match(container.innerHTML, /固定支出清單/, 'the title row itself must remain visible while collapsed');
});

test('clicking the toggle a second time restores the expanded view', async () => {
  const { container, click, findToggle } = await mountInJsdom();
  await click(findToggle());
  await click(findToggle());
  assert.match(container.innerHTML, /示範支出項目/, 'items should reappear after re-expanding');
  assert.match(findToggle().textContent || '', /收合/);
});

test('collapsing an empty fixed-expense list still leaves only the title row, and expanding restores the empty-state note', async () => {
  const empty: CashFlowProfile = { ...profile, fixedExpenses: [] };
  const { container, click, findToggle } = await mountInJsdom(empty);
  assert.match(container.innerHTML, /尚未設定固定支出/);
  await click(findToggle());
  assert.doesNotMatch(container.innerHTML, /尚未設定固定支出/, 'the empty-state note is part of the collapsible body and must hide too');
  await click(findToggle());
  assert.match(container.innerHTML, /尚未設定固定支出/);
});

test('新增項目 button sits next to 儲存現金流設定 in the actions row, no longer inside the title row', () => {
  const source = readFileSync(new URL('../src/pages/CashFlowPage.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /section-toggle-title">固定支出清單<\/span>[\s\S]{0,80}新增項目/, '新增項目 must not sit inside the title row anymore');
  const actionsRowMatch = source.match(/<div className="actions">([\s\S]*?)<\/div><\/div>/);
  assert.ok(actionsRowMatch, 'expected the shared actions row after the fixed-expense-list section');
  const actionsRow = actionsRowMatch![1];
  assert.match(actionsRow, /新增項目/);
  assert.match(actionsRow, /儲存現金流設定/);
  const addIndex = actionsRow.indexOf('新增項目');
  const saveIndex = actionsRow.indexOf('儲存現金流設定');
  assert.ok(addIndex >= 0 && saveIndex >= 0 && addIndex < saveIndex, '新增項目 must come before 儲存現金流設定, left-to-right');
});

test('新增項目 still works while the section is collapsed (adding is decoupled from visibility)', async () => {
  const { container, click, findButton, findToggle } = await mountInJsdom();
  await click(findToggle());
  await click(findButton('新增項目'));
  await click(findToggle());
  const nameInputs = [...container.querySelectorAll('input')].filter(input => input.placeholder === '例如：房貸');
  assert.equal(nameInputs.length, 2, 'a second fixed-expense item should have been added even while the list was collapsed');
});

test('Cash Flow 元金額欄位聚焦零值時可直接輸入取代', async () => {
  const zeroProfile: CashFlowProfile = { ...profile, monthlyIncome: 0, monthlyInvestmentBudget: 0, fixedExpenses: [{ ...profile.fixedExpenses[0]!, amount: 0 }] };
  const { container, change, focus } = await mountInJsdom(zeroProfile);
  const inputs = [...container.querySelectorAll('input[type="number"]')] as HTMLInputElement[];

  for (const input of inputs) {
    await focus(input);
    assert.equal(input.value, '', '零值聚焦後必須先清空，避免新數字依瀏覽器行為被附加');
    await change(input, '1');
    assert.equal(input.value, '1');
  }
});
