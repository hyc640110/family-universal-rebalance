type SyncState = {
  refreshSec?: number;
  autoSync?: boolean;
  autoSyncSec?: number;
  firebase?: { databaseURL?: string; secretPath?: string };
  holdings?: unknown[];
  trades?: unknown[];
  cash?: unknown[];
  loans?: unknown[];
};

const SYNC_STORAGE_KEYS = ['00631l-pro-v62-state', '00631l-pro-v61-state'];
const PANEL_ID = 'v72-sync-health-panel';
const STYLE_ID = 'v72-sync-health-style';

function readSyncState(): SyncState {
  for (const key of SYNC_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as SyncState;
    } catch {
      // Ignore corrupted localStorage records.
    }
  }
  return {};
}

function twTime(): string {
  return new Date().toLocaleString('zh-TW');
}

function secText(sec?: number): string {
  const value = Number(sec || 0);
  if (!value) return '未設定';
  if (value % 60 === 0) return `${value / 60} 分鐘`;
  return `${value} 秒`;
}

function maskSecret(secret?: string): string {
  const value = String(secret || '').trim();
  if (!value) return '未設定';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

function injectSyncHealthStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .v72-sync-health{margin-top:14px;background:#08182a;border:1px solid #38bdf855;border-radius:16px;padding:14px;color:#dbeafe;display:grid;gap:12px}
    .v72-sync-health h3{margin:0;color:#eaf3ff;font-size:16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .v72-sync-badge{background:#38bdf8;color:#04111f;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:900}
    .v72-sync-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .v72-sync-item{background:#102033;border:1px solid #1d3d66;border-radius:12px;padding:10px;line-height:1.45}
    .v72-sync-item b{display:block;color:#eaf3ff;margin-bottom:4px}.v72-sync-item small{color:#9fb3c8}
    .v72-good{border-color:#22c55e88}.v72-good b{color:#69f0a6}
    .v72-warn{border-color:#facc1588}.v72-warn b{color:#facc15}
    .v72-bad{border-color:#ef444488}.v72-bad b{color:#ff7b7b}
    .v72-sync-note{margin:0;color:#9fb3c8;line-height:1.6}
    @media(max-width:900px){.v72-sync-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function findSyncCard(): Element | null {
  const cards = Array.from(document.querySelectorAll('.card, section'));
  return cards.find((card) => /Firebase|備份|還原|同步設定|上傳雲端|下載雲端/.test(card.textContent || '')) || null;
}

function item(title: string, body: string, status: 'good' | 'warn' | 'bad'): string {
  return `<div class="v72-sync-item v72-${status}"><b>${title}</b><small>${body}</small></div>`;
}

function renderSyncHealth(): void {
  injectSyncHealthStyle();

  const card = findSyncCard();
  if (!card) return;

  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'v72-sync-health';
    card.appendChild(panel);
  }

  const state = readSyncState();
  const firebaseUrl = String(state.firebase?.databaseURL || '').trim();
  const secretPath = String(state.firebase?.secretPath || '').trim();
  const autoSync = Boolean(state.autoSync);
  const refreshSec = Number(state.refreshSec || 0);
  const autoSyncSec = Number(state.autoSyncSec || 0);
  const dataCount = [state.holdings, state.cash, state.loans, state.trades]
    .map((entry) => Array.isArray(entry) ? entry.length : 0)
    .reduce((sum, count) => sum + count, 0);

  const rows = [
    item('Firebase URL', firebaseUrl ? '已設定 Realtime Database URL' : '尚未設定，iPhone 和電腦不會共用資料', firebaseUrl ? 'good' : 'bad'),
    item('個人密鑰', secretPath ? `目前密鑰：${maskSecret(secretPath)}` : '尚未設定，請使用同一組密鑰同步', secretPath ? 'good' : 'bad'),
    item('自動同步', autoSync ? `已啟用，每 ${secText(autoSyncSec)} 檢查一次` : '未啟用；修改資料後需要手動上傳雲端', autoSync ? 'good' : 'warn'),
    item('股價更新', refreshSec === 300 ? '已固定為 5 分鐘' : `目前為 ${secText(refreshSec)}，建議 5 分鐘`, refreshSec === 300 ? 'good' : 'warn'),
    item('Firebase 間隔', autoSyncSec === 300 ? '已固定為 5 分鐘' : `目前為 ${secText(autoSyncSec)}，建議 5 分鐘`, autoSyncSec === 300 ? 'good' : 'warn'),
    item('本機資料', dataCount > 0 ? `本機已有 ${dataCount} 筆主要資料` : '尚未讀到主要資料', dataCount > 0 ? 'good' : 'warn')
  ].join('');

  panel.innerHTML = `
    <h3>v7.2 同步健康檢查 <span class="v72-sync-badge">Sync Health</span></h3>
    <div class="v72-sync-grid">${rows}</div>
    <p class="v72-sync-note">電腦修改資料後，若 Firebase 與自動同步皆為綠色，通常等待約 5 分鐘即可上傳；iPhone 若沒有立即更新，可按「下載雲端」強制同步。最後檢查：${twTime()}</p>
  `;
}

function updateV72Version(): void {
  const label = document.querySelector('.eyebrow');
  if (label && /00631L\s+PRO\s+WEB\s+APP/i.test(label.textContent || '')) {
    label.textContent = '00631L PRO WEB APP V7.2 SYNC HEALTH';
  }
  document.title = '00631L Pro Web App v7.2 Sync Health';
}

function runV72SyncHealth(): void {
  updateV72Version();
  renderSyncHealth();
}

window.addEventListener('load', runV72SyncHealth);
window.addEventListener('focus', runV72SyncHealth);
setInterval(runV72SyncHealth, 1500);
