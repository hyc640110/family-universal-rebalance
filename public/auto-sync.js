(() => {
  const STORAGE_KEYS = ['00631l-pro-v62-state', '00631l-pro-v61-state'];
  const META_KEYS = ['__autoSyncAt', '__autoSyncDevice', '__autoSyncSource'];
  let applyingRemote = false;
  let uploading = false;
  let lastSignature = '';
  let lastPullAt = 0;
  let lastUploadAt = 0;

  function readState() {
    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch (_) {}
    }
    return {};
  }

  function saveState(state) {
    const json = JSON.stringify(state);
    STORAGE_KEYS.forEach((key) => localStorage.setItem(key, json));
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

  async function pullRemoteState(force = false) {
    const local = readState();
    if (!isEnabled(local)) return;
    const now = Date.now();
    if (!force && now - lastPullAt < 12000) return;
    lastPullAt = now;
    const url = syncUrl(local.firebase);
    const remote = await fetchRemote(url);
    if (!remote) return;
    const remoteTime = Number(remote.__autoSyncAt || 0);
    const localTime = Number(local.__autoSyncAt || 0);
    if (remoteTime && remoteTime > localTime + 800) {
      applyingRemote = true;
      const next = { ...remote, firebase: remote.firebase || local.firebase, autoSync: remote.autoSync ?? local.autoSync };
      saveState(next);
      lastSignature = signature(next);
      showStatus('已自動下載雲端，重新載入中');
      setTimeout(() => location.reload(), 500);
    }
  }

  function detectLocalChange() {
    const state = readState();
    if (!isEnabled(state)) return;
    const current = signature(state);
    if (!lastSignature) {
      lastSignature = current;
      if (!state.__autoSyncAt) uploadLocalState('init');
      return;
    }
    if (current !== lastSignature && Date.now() - lastUploadAt > 1800) {
      lastSignature = current;
      uploadLocalState('local-change');
    }
  }

  function tick() {
    detectLocalChange();
    pullRemoteState(false);
  }

  window.addEventListener('load', () => {
    lastSignature = signature(readState());
    setTimeout(() => pullRemoteState(true), 1200);
    setTimeout(detectLocalChange, 2500);
  });
  window.addEventListener('focus', () => pullRemoteState(true));
  setInterval(tick, 4000);
})();
