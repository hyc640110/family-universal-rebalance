import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import type { RollbackOutcome } from '../src/lib/importCenter';
import type { ImportSession } from '../src/lib/importCenter';

/**
 * UR-TODO-051: the 撤銷 button used to call onRollback and discard its result — no feedback of any
 * kind, success or failure. This renders the real ImportCenter with a fake session and asserts the
 * exact displayed text for both the success path and the "blocked because a row was edited" failure
 * path, matching the existing role="status"/role="alert" Feedback convention used everywhere else
 * in this component (savePreset/importBackup/commit).
 */

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
const { window } = dom;
(globalThis as unknown as { window: typeof window }).window = window;
(globalThis as unknown as { document: Document }).document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
(globalThis as unknown as { HTMLElement: typeof window.HTMLElement }).HTMLElement = window.HTMLElement;
(globalThis as unknown as { Event: typeof window.Event }).Event = window.Event;
(globalThis as unknown as { requestAnimationFrame: typeof window.requestAnimationFrame }).requestAnimationFrame = window.requestAnimationFrame.bind(window);
(globalThis as unknown as { cancelAnimationFrame: typeof window.cancelAnimationFrame }).cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

const React = await import('react');
const { act } = React;
(globalThis as unknown as { React: typeof React; IS_REACT_ACT_ENVIRONMENT: boolean }).React = React;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { MemoryRouter } = await import('react-router-dom');
const { default: ImportCenter } = await import('../src/components/import/ImportCenter');
const { createElement } = React;

const session: ImportSession = {
  id: 'session-1', fileName: 'test.csv', fileType: 'csv', importedAt: 'x', accountId: 'acc-1',
  totalRows: 3, validRows: 3, invalidRows: 0, duplicateRows: 0, importedRows: 3, skippedRows: 0,
  mapping: {}, source: 'csv', createdAt: 'x', schemaVersion: 1, warnings: [], status: 'imported'
};

const renderWithRollback = async (onRollback: (sessionId: string) => RollbackOutcome) => {
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(MemoryRouter, {}, createElement(ImportCenter, {
      accounts: [], transactions: [], sessions: [session], presets: [],
      onCommit: () => {}, onRollback, onPresets: () => {}
    })));
  });
  return { container, root };
};

test('撤銷成功時顯示成功回饋（role=status），文字帶出實際筆數', async () => {
  const { container, root } = await renderWithRollback(() => ({ ok: true, count: 3 }));
  const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent === '撤銷');
  assert.ok(button, 'expected a 撤銷 button for an imported session');

  await act(async () => { button!.click(); });

  const feedback = container.querySelector('.import-feedback');
  assert.ok(feedback, 'expected a feedback element to render after clicking 撤銷');
  assert.equal(feedback!.getAttribute('role'), 'status');
  assert.equal(feedback!.textContent, '已撤銷 3 筆交易。');

  await act(async () => { root.unmount(); });
  container.remove();
});

test('撤銷因交易被編輯而失敗時顯示明確原因（role=alert），不是籠統的「撤銷失敗」', async () => {
  const { container, root } = await renderWithRollback(() => ({ ok: false, reason: 'edited', editedCount: 1, totalCount: 3 }));
  const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent === '撤銷');
  assert.ok(button);

  await act(async () => { button!.click(); });

  const feedback = container.querySelector('.import-feedback');
  assert.ok(feedback, 'expected a feedback element to render after a failed 撤銷');
  assert.equal(feedback!.getAttribute('role'), 'alert');
  assert.equal(feedback!.textContent, '無法撤銷：本次匯入的交易中有 1 筆已被編輯過，請改為手動刪除。');
  assert.notEqual(feedback!.textContent, '撤銷失敗', 'must not be a generic, unexplained failure message');

  await act(async () => { root.unmount(); });
  container.remove();
});

test('撤銷因交易已被逐筆刪除而失敗時顯示對應原因（不是與「已編輯」相同的文字）', async () => {
  const { container, root } = await renderWithRollback(() => ({ ok: false, reason: 'no-transactions' }));
  const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent === '撤銷');
  assert.ok(button);

  await act(async () => { button!.click(); });

  const feedback = container.querySelector('.import-feedback');
  assert.ok(feedback);
  assert.equal(feedback!.getAttribute('role'), 'alert');
  assert.match(feedback!.textContent || '', /無法撤銷/);
  assert.doesNotMatch(feedback!.textContent || '', /已被編輯過/, 'the no-transactions reason must read differently from the edited reason');

  await act(async () => { root.unmount(); });
  container.remove();
});
