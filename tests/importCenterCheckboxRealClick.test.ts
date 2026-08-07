import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

/**
 * UR-TODO-049: the import-preview checkbox's onChange handler used to read
 * `event.currentTarget.checked` *inside* the setPreview functional updater.
 * A programmatic `dispatchEvent(new Event('change'))` never reproduces this —
 * only a real DOM `.click()` does, because React only nulls out the synthetic
 * event's `currentTarget` after the synchronous dispatch completes, and a
 * setState updater can run after that point. This test drives a real jsdom
 * `HTMLInputElement.click()` (full mousedown/mouseup/click/native-toggle/
 * change sequence) against the actual rendered component, not a fabricated
 * event object, so it fails against the pre-fix source and passes after it.
 */

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
const { window } = dom;
(globalThis as unknown as { window: typeof window }).window = window;
(globalThis as unknown as { document: Document }).document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
(globalThis as unknown as { HTMLElement: typeof window.HTMLElement }).HTMLElement = window.HTMLElement;
(globalThis as unknown as { Event: typeof window.Event }).Event = window.Event;
(globalThis as unknown as { MouseEvent: typeof window.MouseEvent }).MouseEvent = window.MouseEvent;
(globalThis as unknown as { File: typeof window.File }).File = window.File;
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

const account = {
  id: 'acc-1', name: '現金', type: 'cash' as const, balanceMode: 'manual' as const, manualBalance: 0,
  currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 0, createdAt: 'x', updatedAt: 'x'
};

test('a real DOM click on an import-preview checkbox does not crash (UR-TODO-049 regression)', async () => {
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(createElement(MemoryRouter, {}, createElement(ImportCenter, {
      accounts: [account], transactions: [], sessions: [], presets: [],
      onCommit: () => {}, onRollback: () => {}, onPresets: () => {}
    })));
  });

  const select = container.querySelector('select') as HTMLSelectElement;
  await act(async () => {
    select.value = account.id;
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
  });

  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  const csv = 'date,amount,description\n2026-08-01,1000,coffee\n2026-08-02,2000,lunch\n';
  const file = new window.File([csv], 'checkbox-crash.csv', { type: 'text/csv' });
  Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
  await act(async () => {
    fileInput.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  const previewButton = Array.from(container.querySelectorAll('button')).find(b => b.textContent === '產生匯入預覽');
  assert.ok(previewButton, 'expected the 產生匯入預覽 button to be present after a valid CSV upload');
  await act(async () => {
    previewButton!.click();
  });

  const checkboxesBefore = Array.from(container.querySelectorAll('.import-preview input[type="checkbox"]')) as HTMLInputElement[];
  assert.equal(checkboxesBefore.length, 2, 'expected one checkbox per valid preview row');
  assert.equal(checkboxesBefore[0].checked, true, 'valid non-duplicate rows default to selected');

  await act(async () => {
    assert.doesNotThrow(() => checkboxesBefore[0].click(), 'a real click must not throw TypeError: Cannot read properties of null');
  });

  const checkboxesAfter = Array.from(container.querySelectorAll('.import-preview input[type="checkbox"]')) as HTMLInputElement[];
  assert.equal(checkboxesAfter.length, 2, 'the component must still be mounted (not replaced by an error boundary) after the click');
  assert.equal(checkboxesAfter[0].checked, false, 'the click must actually toggle the row off');
  assert.equal(checkboxesAfter[1].checked, true, 'the other row must be unaffected');

  await act(async () => {
    root.unmount();
  });
  container.remove();
});
