(() => {
  const VERSION = '00631L Pro Web App v7 Stable';
  const STORAGE_KEYS = ['00631l-pro-v62-state', '00631l-pro-v61-state'];
  const SYMBOLS = ['00631L', '0050', '00865B'];
  const num = (n) => Number.isFinite(Number(n)) ? Number(n) : 0;
  const pct = (n) => `${Number(n || 0).toFixed(2)}%`;
  let lastSig = '';

  function readState() {
    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch (_) {}
    }
    return {};
  }

  function parseNumber(text) {
    const cleaned = String(text || '').replace(/[,NT$\s]/g, '').replace(/[^+\-\d.]/g, '');
    return Number(cleaned) || 0;
  }

  function formatSigned(text, value) {
    const raw = String(text || '').trim();
    const prefix = raw.match(/^NT\$|^\$/)?.[0] || (raw.includes('NT$') ? 'NT$' : '');
    const absText = Math.abs(value).toLocaleString('zh-TW', { maximumFractionDigits: 0 });
    if (value > 0) return `${prefix}+${absText}`;
    if (value < 0) return `${prefix}-${absText}`;
    return `${prefix}0`;
  }

  function injectStyle() {
    if (document.getElementById('v7-stable-style')) return;
    const style = document.createElement('style');
    style.id = 'v7-stable-style';
    style.textContent = `
      .v7-badge{display:inline-flex;align-items:center;gap:6px;background:#facc15;color:#111827;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:900;margin-left:8px;vertical-align:middle}
      .v7-health{margin-top:14px;background:#09182a;border:1px solid #facc1555;border-radius:16px;padding:14px;display:grid;gap:12px}
      .v7-health h3{margin:0;color:#eaf3ff;font-size:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .v7-health-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .v7-check{background:#102033;border:1px solid #1d3d66;border-radius:12px;padding:10px;color:#dbeafe;line-height:1.5}
      .v7-check b{display:block;margin-bottom:4px;color:#eaf3ff}.v7-check small{color:#9fb3c8}
      .v7-ok{border-color:#22c55e88}.v7-ok b{color:#69f0a6}.v7-warn{border-color:#facc1588}.v7-warn b{color:#facc15}.v7-bad{border-color:#ef444488}.v7-bad b{color:#ff7b7b}
      .v7-version-note{margin:0;color:#9fb3c8;line-height:1.6}
      .tw-profit-up{color:#ff4d4f!important;text-shadow:0 0 10px #ff4d4f33}
      .tw-profit-down{color:#22c55e!important;text-shadow:0 0 10px #22c55e33}
      .tw-profit-flat{color:#dbeafe!important}
      @media(max-width:900px){.v7-health-grid{grid-template-columns:1fr}.v7-badge{margin-left:0;margin-top:6px}}
    `;
    document.head.appendChild(style);
  }

  function findMainCard() {
    return Array.from(document.querySelectorAll('.card')).find((el) => el.querySelector('h2')?.textContent?.includes('同步設定')) ||
           Array.from(document.querySelectorAll('.card')).find((el) => el.querySelector('h2')?.textContent?.includes('再平衡')) ||
           document.querySelector('.card');
  }

  function addVersionBadge() {
    const title = document.querySelector('header h1, h1');
    if (!title || title.querySelector('.v7-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'v7-badge';
    badge.textContent = 'v7 Stable';
    title.appendChild(badge);
  }

  function calcPaidTerms(startDate, totalTerms) {
    if (!startDate || !totalTerms) return 0;
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return 0;
    const today = new Date();
    let months = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    if (today.getDate() >= start.getDate()) months += 1;
    return Math.max(0, Math.min(months, totalTerms));
  }

  function colorDailyPnl() {
    injectStyle();
    const stats = Array.from(document.querySelectorAll('.stat'));
    const daily = stats.find((el) => /今日損益|今日盈虧|日損益/.test(el.textContent || ''));
    if (!daily) return;
    const valueEl = daily.querySelector('b') || daily;
    const value = parseNumber(valueEl.textContent || '0');
    valueEl.classList.remove('tw-profit-up', 'tw-profit-down', 'tw-profit-flat', 'up', 'down');
    valueEl.classList.add(value > 0 ? 'tw-profit-up' : value < 0 ? 'tw-profit-down' : 'tw-profit-flat');
    if (!valueEl.dataset.twSignedValue || valueEl.dataset.twSignedValue !== String(value)) {
      valueEl.textContent = formatSigned(valueEl.textContent, value);
      valueEl.dataset.twSignedValue = String(value);
    }
  }

  function buildChecks(state) {
    const checks = [];
    const holdings = Array.isArray(state.holdings) ? state.holdings : [];
    const stockTarget = SYMBOLS.reduce((sum, s) => sum + num(holdings.find((h) => h.symbol === s)?.targetWeight), 0);
    const cashTarget = Math.max(0, 100 - stockTarget);
    const cashTotal = Array.isArray(state.cash) ? state.cash.reduce((sum, c) => sum + num(c.amount), 0) : 0;
    const loans = Array.isArray(state.loans) ? state.loans : [];
    const firebaseUrl = String(state.firebase?.databaseURL || '').trim();
    const autoSync = Boolean(state.autoSync);
    const lastSync = Number(state.__autoSyncAt || 0);

    checks.push({
      title: '目標配置',
      status: stockTarget > 100 ? 'bad' : 'ok',
      body: stockTarget > 100 ? `股票目標合計 ${pct(stockTarget)}，已超過 100%，建議調低。` : `股票目標 ${pct(stockTarget)}，現金目標自動補 ${pct(cashTarget)}。`
    });

    checks.push({
      title: '現金資料',
      status: cashTotal < 0 ? 'bad' : 'ok',
      body: cashTotal < 0 ? '現金為負數，請檢查現金管理。' : `現金資料正常，目前合計約 NT$${cashTotal.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}。`
    });

    const badLoan = loans.find((loan) => {
      const total = num(loan.totalTerms || 84);
      const paid = calcPaidTerms(loan.startDate, total);
      return total < paid;
    });
    checks.push({
      title: '借款期數',
      status: badLoan ? 'warn' : 'ok',
      body: badLoan ? '有借款的總期數小於已繳期數，請檢查借款總期數。' : `借款期數檢查正常，共 ${loans.length} 筆。`
    });

    checks.push({
      title: 'Firebase 同步',
      status: firebaseUrl && autoSync ? 'ok' : firebaseUrl ? 'warn' : 'bad',
      body: firebaseUrl && autoSync ? 'Firebase 已設定，且自動同步已啟用。' : firebaseUrl ? 'Firebase 已設定，但自動同步未啟用。' : 'Firebase 尚未設定，跨裝置同步不會生效。'
    });

    checks.push({
      title: '最後自動同步',
      status: lastSync ? 'ok' : 'warn',
      body: lastSync ? new Date(lastSync).toLocaleString('zh-TW') : '尚未偵測到自動同步時間。'
    });

    const maybeDouble = Array.isArray(state.trades) && state.trades.length > 0 && holdings.some((h) => num(h.shares) > 0);
    checks.push({
      title: '交易與初始股數',
      status: maybeDouble ? 'warn' : 'ok',
      body: maybeDouble ? '同時有初始股數與交易紀錄，若股數異常偏高，可能是重複計入。' : '未偵測到明顯重複計入風險。'
    });

    return checks;
  }

  function renderHealth() {
    injectStyle();
    addVersionBadge();
    colorDailyPnl();
    const state = readState();
    const sig = JSON.stringify({
      holdings: state.holdings,
      cash: state.cash,
      loans: state.loans,
      tradesLen: Array.isArray(state.trades) ? state.trades.length : 0,
      firebase: state.firebase,
      autoSync: state.autoSync,
      syncAt: state.__autoSyncAt
    });
    if (sig === lastSig) return;
    lastSig = sig;

    const anchor = findMainCard();
    if (!anchor?.parentElement) return;
    let box = document.querySelector('.v7-health');
    if (!box) {
      box = document.createElement('div');
      box.className = 'v7-health';
      anchor.parentElement.insertBefore(box, anchor.nextSibling);
    }

    const checks = buildChecks(state);
    box.innerHTML = `
      <h3>${VERSION}<span class="v7-badge">資料健康檢查</span></h3>
      <div class="v7-health-grid">
        ${checks.map((c) => `<div class="v7-check v7-${c.status}"><b>${c.title}</b><small>${c.body}</small></div>`).join('')}
      </div>
      <p class="v7-version-note">v7 Stable Phase 2：今日損益顏色與正負號已併入 v7 Stable，逐步減少獨立外掛檔。</p>
    `;
  }

  window.addEventListener('load', renderHealth);
  window.addEventListener('storage', renderHealth);
  window.addEventListener('focus', renderHealth);
  setInterval(renderHealth, 30000);
})();
