const STORAGE_KEYS = ['00631l-pro-v62-state', '00631l-pro-v61-state'];
const FIVE_MINUTES_SEC = 300;

function normalizeNumberText(text: string): number {
  return Number(
    String(text || '')
      .replace(/[,NT$\s]/g, '')
      .replace(/[^+\-\d.]/g, '')
  ) || 0;
}

function formatTwdSigned(value: number): string {
  const abs = Math.abs(value).toLocaleString('zh-TW', { maximumFractionDigits: 0 });
  if (value > 0) return `$+${abs}`;
  if (value < 0) return `$-${abs}`;
  return '$0';
}

function migrateIntervalsToFiveMinutes(): void {
  STORAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;

      const state = JSON.parse(raw);
      let changed = false;

      if (state.refreshSec !== FIVE_MINUTES_SEC) {
        state.refreshSec = FIVE_MINUTES_SEC;
        changed = true;
      }

      if (state.autoSyncSec !== FIVE_MINUTES_SEC) {
        state.autoSyncSec = FIVE_MINUTES_SEC;
        changed = true;
      }

      if (changed) {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch {
      // Ignore invalid localStorage content and let the app fallback handle it.
    }
  });
}

function injectStableStyle(): void {
  if (document.getElementById('v71-stable-style')) return;

  const style = document.createElement('style');
  style.id = 'v71-stable-style';
  style.textContent = [
    '.tw-profit-up{color:#ff4d4f!important;text-shadow:0 0 10px #ff4d4f33}',
    '.tw-profit-down{color:#22c55e!important;text-shadow:0 0 10px #22c55e33}',
    '.tw-profit-flat{color:#dbeafe!important}'
  ].join('');

  document.head.appendChild(style);
}

function fixVersionLabel(): void {
  const label = document.querySelector('.eyebrow');
  if (label && /00631L\s+PRO\s+WEB\s+APP/i.test(label.textContent || '')) {
    label.textContent = '00631L PRO WEB APP V7.1 STABLE';
  }
  document.title = '00631L Pro Web App v7.1 Stable';
}

function findDailyProfitCard(): Element | null {
  return Array.from(document.querySelectorAll('.stat'))
    .find((card) => /今日損益/.test(card.textContent || '')) || null;
}

function findMoneyElement(card: Element): Element | null {
  return Array.from(card.querySelectorAll('*'))
    .reverse()
    .find((el) => /^\s*\$\s*[+\-]?\d/.test(el.textContent || '')) || null;
}

function fixDailyProfit(): void {
  injectStableStyle();

  const card = findDailyProfitCard();
  if (!card) return;

  const valueElement = findMoneyElement(card);
  if (!valueElement) return;

  const value = normalizeNumberText(valueElement.textContent || '0');
  const nextText = formatTwdSigned(value);

  if (valueElement.textContent !== nextText) {
    valueElement.textContent = nextText;
  }

  valueElement.classList.remove('tw-profit-up', 'tw-profit-down', 'tw-profit-flat', 'up', 'down');
  valueElement.classList.add(
    value > 0 ? 'tw-profit-up' : value < 0 ? 'tw-profit-down' : 'tw-profit-flat'
  );
}

function runV71Stable(): void {
  migrateIntervalsToFiveMinutes();
  fixVersionLabel();
  fixDailyProfit();
}

migrateIntervalsToFiveMinutes();
window.addEventListener('load', runV71Stable);
window.addEventListener('focus', runV71Stable);
setInterval(runV71Stable, 1000);
