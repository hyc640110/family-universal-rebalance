(() => {
  const STORAGE_KEYS = ['00631l-pro-v100-state', '00631l-pro-v62-state', '00631l-pro-v61-state'];
  const META_KEYS = ['__autoSyncAt', '__autoSyncDevice', '__autoSyncSource'];
  const REMOVED_SYMBOLS = new Set([['00', '50'].join('')]);
  const DEFAULT_GROWTH_TARGET = 70;
  const MIN_GROWTH_TARGET = 30;
  const MAX_GROWTH_TARGET = 90;
  const REMOVED_RECORD_KEY = ['tra', 'des'].join('');
  const STALE_KEYS = ['strategy', 'strategies', 'targetAllocation', 'assetAllocation', 'portfolioSummary', 'strategyTotal', 'defaultHoldings', ['default', 'Tr', 'ades'].join(''), 'monthlyContribution', 'simCagr', 'simDividend', 'simYears', REMOVED_RECORD_KEY];
  let applyingRemote = false;
  let uploading = false;
  let lastSignature = '';
  let lastUploadAt = 0;
  let initialPullDone = false;
  let isEditing = false;
  let lastLocalEditAt = 0;
  let pendingRemote = null;

  function readState() {
    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const state = sanitizeState(JSON.parse(raw));
          const json = JSON.stringify(state);
          if (raw !== json) saveState(state);
          return state;
        }
      } catch (_) {}
    }
    return {};
  }

  function saveState(state) {
    const json = JSON.stringify(sanitizeState(state));
    STORAGE_KEYS.forEach((key) => localStorage.setItem(key, json));
  }

  function removedSymbol() {
    return Array.from(REMOVED_SYMBOLS)[0];
  }

  function hasRemovedSymbol(value) {
    return String(value ?? '').includes(removedSymbol());
  }

  function clampTarget(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return DEFAULT_GROWTH_TARGET;
    return Math.min(MAX_GROWTH_TARGET, Math.max(MIN_GROWTH_TARGET, numeric));
  }

  function sanitizeState(value) {
    if (!value || typeof value !== 'object') return {};
    const state = { ...value };
    STALE_KEYS.forEach((key) => delete state[key]);
    const holdings = Array.isArray(state.holdings) ? state.holdings : [];
    state.holdings = holdings
      .filter((h) => h?.symbol && !REMOVED_SYMBOLS.has(h.symbol))
      .map((h) => {
        if (h.symbol === '00631L') return { ...h, targetWeight: clampTarget(h.targetWeight ?? DEFAULT_GROWTH_TARGET) };
        const { targetWeight: _targetWeight, ...actualHolding } = h;
        return actualHolding;
      });
    if (!state.holdings.some((h) => h.symbol === '00631L')) state.holdings.unshift({ symbol: '00631L', shares: 0, avgCost: 0, targetWeight: DEFAULT_GROWTH_TARGET });
    state.cash = Array.isArray(state.cash) ? state.cash.filter((c) => ![c?.id, c?.name, c?.note].some(hasRemovedSymbol)) : [];
    state.loans = Array.isArray(state.loans) ? state.loans.map((loan) => {
      const totalMonths = loan?.totalMonths === undefined || loan?.totalMonths === null ? undefined : Math.max(0, Number(loan.totalMonths) || 0);
      const savedLoan = { ...(loan || {}) };
      delete savedLoan[['paid', 'Months'].join('')];
      return { ...savedLoan, totalMonths };
    }) : [];
    return state;
  }

  function syncPath(config) {
    return `portfolio/${encodeURIComponent(config?.secretPath || '631128')}`;
  }

  function syncUrl(config) {
    const db = String(config?.databaseURL || '').trim();
    if (!db) return '';
    return `${db.replace(/\/$/, '')}/${syncPath(config)}.json`;
  }

  function isEnabled(state) {
    return Boolean(state?.autoSync && syncUrl(state.firebase));
  }

  function cloneWithoutMeta(value) {
    if (Array.isArray(value)) return value.map(cloneWithoutMeta);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).filter(([k]) => !META_KEYS.includes(k)).map(([k, v]) => [k, cloneWithoutMeta(v)]));
    }
    return value;
  }

  function signature(state) {
    try { return JSON.stringify(cloneWithoutMeta(state)); } catch (_) { return ''; }
  }

  function showStatus(text) {
    let el = document.getElementById('auto-sync-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'auto-sync-status';
      el.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:9999;background:#0f2f4f;color:#dbeafe;border:1px solid #38bdf8;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;box-shadow:0 8px 30px #0008;opacity:.92';
      document.body.appendChild(el);
    }
    el.textContent = text;
    clearTimeout(showStatus._timer);
    showStatus._timer = setTimeout(() => { if (el) el.style.opacity = '.45'; }, 3500);
    el.style.opacity = '.92';
  }

  function isEditableTarget(target) {
    return Boolean(target?.matches?.('input, textarea, select, [contenteditable="true"]'));
  }

  function markEditing() {
    isEditing = true;
    lastLocalEditAt = Date.now();
  }

  function isEditProtected() {
    return isEditing || Date.now() - lastLocalEditAt < 3000;
  }

  function markEditingDone() {
    lastLocalEditAt = Date.now();
    setTimeout(() => {
      if (Date.now() - lastLocalEditAt >= 2500) {
        isEditing = false;
        if (pendingRemote) showStatus('雲端有新資料，編輯完成後請手動下載或上傳同步');
      }
    }, 2600);
  }

  async function fetchRemote(url) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data && typeof data === 'object' ? data : null;
    } catch (_) {
      return null;
    }
  }

  async function uploadLocalState(reason = 'auto') {
    if (uploading || applyingRemote) return;
    const state = readState();
    if (!isEnabled(state)) return;
    const url = syncUrl(state.firebase);
    uploading = true;
    try {
      const now = Date.now();
      const next = { ...state, __autoSyncAt: now, __autoSyncDevice: navigator.userAgent.slice(0, 80), __autoSyncSource: reason };
      saveState(next);
      lastSignature = signature(next);
      lastUploadAt = now;
      await fetch(url, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) });
      showStatus('已自動上傳雲端');
    } catch (_) {
      showStatus('自動上傳失敗');
    } finally {
      uploading = false;
    }
  }

  async function pullRemoteState() {
    if (initialPullDone) return;
    initialPullDone = true;
    const local = readState();
    if (!isEnabled(local)) return;
    const url = syncUrl(local.firebase);
    const remote = await fetchRemote(url);
    if (!remote) return;
    const remoteTime = Number(remote.__autoSyncAt || 0);
    const localTime = Number(local.__autoSyncAt || 0);
    if (remoteTime && remoteTime > localTime + 800) {
      if (isEditProtected()) {
        pendingRemote = remote;
        showStatus('雲端有新資料，編輯完成後再同步');
        return;
      }
      applyingRemote = true;
      const next = sanitizeState({ ...remote, firebase: remote.firebase || local.firebase, autoSync: remote.autoSync ?? local.autoSync });
      saveState(next);
      lastSignature = signature(next);
      showStatus('初次載入已套用雲端資料');
      setTimeout(() => location.reload(), 500);
    }
  }

  function detectLocalChange() {
    const state = readState();
    if (!isEnabled(state)) return;
    const current = signature(state);
    if (!lastSignature) {
      lastSignature = current;
      if (!state.__autoSyncAt) uploadLocalState('first-sync');
      return;
    }
    if (current !== lastSignature && Date.now() - lastUploadAt > 1800) {
      lastSignature = current;
      uploadLocalState('local-change');
    }
  }

  function tick() {
    detectLocalChange();
  }

  window.addEventListener('load', () => {
    lastSignature = signature(readState());
    setTimeout(() => pullRemoteState(), 1200);
    setTimeout(detectLocalChange, 2500);
  });
  window.addEventListener('focusin', (event) => { if (isEditableTarget(event.target)) markEditing(); });
  window.addEventListener('input', (event) => { if (isEditableTarget(event.target)) markEditing(); }, true);
  window.addEventListener('focusout', (event) => { if (isEditableTarget(event.target)) markEditingDone(); });
  setInterval(tick, 4000);
})();
