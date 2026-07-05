(() => {
  const STORAGE_KEYS = ['00631l-pro-v62-state', '00631l-pro-v61-state'];
  const LOAN_TERMS_KEY = '00631l-pro-loan-total-terms';
  const REMOVED_SYMBOLS = new Set([['00', '50'].join('')]);
  const LEGACY_KEYS = ['strategy', 'strategies', 'targetAllocation', 'assetAllocation', 'portfolioSummary', 'strategyTotal', 'defaultHoldings', 'defaultTrades'];
  const money = (n) => Number(n || 0).toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });
  const num = (n) => Number.isFinite(Number(n)) ? Number(n) : 0;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  let lastCloudPull = 0;
  let cloudSyncing = false;

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

  function sanitizeState(value) {
    if (!value || typeof value !== 'object') return {};
    const state = { ...value };
    LEGACY_KEYS.forEach((key) => delete state[key]);
    const holdings = Array.isArray(state.holdings) ? state.holdings : [];
    state.holdings = holdings
      .filter((h) => h?.symbol && !REMOVED_SYMBOLS.has(h.symbol))
      .map((h) => {
        if (h.symbol === '00631L') return { ...h, targetWeight: 70 };
        const { targetWeight: _targetWeight, ...actualHolding } = h;
        return actualHolding;
      });
    if (!state.holdings.some((h) => h.symbol === '00631L')) state.holdings.unshift({ symbol: '00631L', shares: 0, avgCost: 0, targetWeight: 70 });
    state.trades = Array.isArray(state.trades) ? state.trades.filter((t) => t?.symbol && !REMOVED_SYMBOLS.has(t.symbol)) : [];
    state.cash = Array.isArray(state.cash) ? state.cash.filter((c) => ![c?.id, c?.name, c?.note].some(hasRemovedSymbol)) : [];
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

  function readLoanTerms() {
    try { return JSON.parse(localStorage.getItem(LOAN_TERMS_KEY) || '{}') || {}; } catch (_) { return {}; }
  }

  function writeLoanTerms(map) {
    localStorage.setItem(LOAN_TERMS_KEY, JSON.stringify(map || {}));
  }

  function loanKey(loan, index) {
    return String(loan?.id || `${loan?.name || 'loan'}-${loan?.startDate || 'date'}-${index}`);
  }

  function getLoanTotalTerms(loan, index) {
    const map = readLoanTerms();
    const key = loanKey(loan, index);
    return Math.max(1, num(map[key] || loan?.totalTerms || 84));
  }

  function saveLoanTerm(loan, index, totalTerms) {
    const map = readLoanTerms();
    const key = loanKey(loan, index);
    map[key] = Math.max(1, num(totalTerms));
    writeLoanTerms(map);
    const next = readState();
    if (!Array.isArray(next.loans)) next.loans = [];
    if (next.loans[index]) next.loans[index].totalTerms = map[key];
    saveState(next);
    syncLoanTermsToFirebase(next).catch(() => {});
    return map[key];
  }

  async function syncLoanTermsToFirebase(localState = readState()) {
    if (cloudSyncing) return;
    const url = syncUrl(localState.firebase);
    if (!url || !Array.isArray(localState.loans)) return;
    cloudSyncing = true;
    try {
      const remote = await fetch(url, { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
      const next = sanitizeState(remote && typeof remote === 'object' ? remote : localState);
      const localLoans = Array.isArray(localState.loans) ? localState.loans : [];
      next.loans = Array.isArray(next.loans) ? next.loans : localLoans;
      localLoans.forEach((loan, index) => {
        const total = getLoanTotalTerms(loan, index);
        if (!next.loans[index]) next.loans[index] = { ...loan };
        next.loans[index].totalTerms = total;
      });
      next.firebase = next.firebase || localState.firebase;
      await fetch(url, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sanitizeState(next)) });
    } finally {
      cloudSyncing = false;
    }
  }

  async function pullLoanTermsFromFirebase() {
    const localState = readState();
    const url = syncUrl(localState.firebase);
    if (!url) return;
    const remote = await fetch(url, { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
    if (!remote || !Array.isArray(remote.loans)) return;
    const map = readLoanTerms();
    let changed = false;
    const next = readState();
    if (!Array.isArray(next.loans)) next.loans = [];
    sanitizeState(remote).loans.forEach((loan, index) => {
      const total = num(loan?.totalTerms);
      if (!total) return;
      const localLoan = next.loans[index] || loan;
      const key = loanKey(localLoan, index);
      if (map[key] !== total) {
        map[key] = total;
        changed = true;
      }
      if (next.loans[index]) next.loans[index].totalTerms = total;
    });
    if (changed) {
      writeLoanTerms(map);
      saveState(next);
      renderLoanSummary();
    }
  }

  function parseMoney(text) {
    const cleaned = String(text || '').replace(/[,$NT\s]/g, '').replace(/[^-\d.]/g, '');
    return Number(cleaned) || 0;
  }

  function findCard(title) {
    return Array.from(document.querySelectorAll('.card')).find((el) => el.querySelector('h2')?.textContent?.includes(title));
  }

  function findNetWorthFromStats() {
    const stats = Array.from(document.querySelectorAll('.stat'));
    const net = stats.find((el) => el.querySelector('small')?.textContent?.trim() === '淨資產');
    return parseMoney(net?.querySelector('b')?.textContent || '0');
  }

  function buildYearRows(start, state) {
    const years = Math.min(10, Math.max(1, num(state.simYears || 10)));
    const monthlyContribution = num(state.monthlyContribution || 0);
    const annualReturn = (num(state.simCagr || 0) + num(state.simDividend || 0)) / 100;
    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    let value = start;
    const rows = [];
    for (let month = 1; month <= years * 12; month++) {
      value = value * (1 + monthlyReturn) + monthlyContribution;
      if (month % 12 === 0) {
        const year = month / 12;
        const gain = start ? ((value - start) / start) * 100 : 0;
        rows.push({ year, value, gain });
      }
    }
    return rows;
  }

  function calcPaidTerms(startDate, totalTerms) {
    if (!startDate || !totalTerms) return 0;
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return 0;
    const today = new Date();
    let months = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    if (today.getDate() >= start.getDate()) months += 1;
    return clamp(months, 0, totalTerms);
  }

  function injectStyle() {
    if (document.getElementById('yearly-growth-style')) return;
    const style = document.createElement('style');
    style.id = 'yearly-growth-style';
    style.textContent = `
      .year-projection{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
      .year-projection div{background:#09182a;border:1px solid #1d3d66;border-radius:12px;padding:10px;display:flex;justify-content:space-between;gap:8px;align-items:center}
      .year-projection span{color:#9fb3c8;font-size:13px;white-space:nowrap}
      .year-projection b{color:#ff7b7b;font-size:14px;text-align:right}
      .year-projection small{color:#69f0a6;display:block;font-size:12px;margin-top:2px;text-align:right}
      .current-shares-line{background:#0f2f4f;border:1px solid #38bdf8;border-radius:12px;padding:10px 12px;color:#e0f2fe!important;box-shadow:0 0 0 1px #38bdf833}
      .current-shares-line b{color:#7dd3fc!important;font-size:15px}
      .current-shares-line .share-number{color:#facc15;font-size:20px;font-weight:900;letter-spacing:.03em}
      .loan-term-panel{margin-top:14px;background:#09182a;border:1px solid #1d3d66;border-radius:14px;padding:12px;display:grid;gap:10px}
      .loan-term-panel h3{margin:0;color:#eaf3ff;font-size:15px}
      .loan-term-row{display:grid;grid-template-columns:1.2fr repeat(3,1fr);gap:10px;align-items:center;background:#102033;border-radius:10px;padding:10px;color:#dbeafe}
      .loan-term-row b{color:#facc15}.loan-term-row small{color:#9fb3c8}.loan-extra-term{border:1px dashed #38bdf866!important}
      .trade-field-labels{display:grid;grid-template-columns:repeat(9,1fr);gap:12px;margin:0 0 -6px;color:#93c5fd;font-size:12px;font-weight:800;letter-spacing:.02em}
      .trade-field-labels span{background:#0f2f4f;border:1px solid #1d3d66;border-radius:8px;padding:6px 8px;text-align:center}
      .trade-form input::placeholder{color:#93c5fd;opacity:1}
      @media(max-width:900px){.year-projection{grid-template-columns:1fr}.loan-term-row{grid-template-columns:1fr 1fr}.current-shares-line .share-number{font-size:18px}.trade-field-labels{display:none}}
    `;
    document.head.appendChild(style);
  }

  function updateYearlyGrowth() {
    injectStyle();
    const card = findCard('十年成長曲線');
    if (!card) return;
    const state = readState();
    const start = findNetWorthFromStats();
    if (!start) return;
    const rows = buildYearRows(start, state);
    let box = card.querySelector('.year-projection');
    if (!box) {
      box = document.createElement('div');
      box.className = 'year-projection';
      card.appendChild(box);
    }
    box.innerHTML = rows.map((r) => `
      <div>
        <span>第 ${r.year} 年</span>
        <b>${money(r.value)}<small>約 +${r.gain.toFixed(1)}%</small></b>
      </div>
    `).join('');
  }

  function highlightCurrentShares() {
    document.querySelectorAll('.holding p').forEach((p) => {
      if (!p.textContent?.includes('目前股數')) return;
      p.classList.add('current-shares-line');
      const label = p.querySelector('b')?.outerHTML || '<b>目前股數：</b>';
      const value = p.textContent.replace('目前股數：', '').trim();
      if (!p.querySelector('.share-number')) p.innerHTML = `${label}<span class="share-number">${value}</span>`;
    });
  }

  function updateLoanTerms() {
    const card = findCard('借款管理');
    if (!card) return;
    const state = readState();
    const loans = Array.isArray(state.loans) ? state.loans : [];
    const rows = Array.from(card.querySelectorAll('.list-row'));
    rows.forEach((row, index) => {
      const loan = loans[index] || {};
      const totalTerms = getLoanTotalTerms(loan, index);
      const existing = row.querySelector('.loan-extra-term input');
      if (existing) {
        if (document.activeElement !== existing && String(existing.value) !== String(totalTerms)) existing.value = String(totalTerms);
        return;
      }
      const label = document.createElement('label');
      label.className = 'loan-extra-term';
      label.innerHTML = `借款總期數<input type="number" min="1" value="${totalTerms}" />`;
      const input = label.querySelector('input');
      const persist = () => {
        const saved = saveLoanTerm(loan, index, input.value);
        input.value = String(saved);
        renderLoanSummary();
      };
      input.addEventListener('input', persist);
      input.addEventListener('change', persist);
      input.addEventListener('blur', persist);
      const deleteButton = row.querySelector('button');
      row.insertBefore(label, deleteButton || null);
    });
    renderLoanSummary();
  }

  function renderLoanSummary() {
    const card = findCard('借款管理');
    if (!card) return;
    const state = readState();
    const loans = Array.isArray(state.loans) ? state.loans : [];
    let panel = card.querySelector('.loan-term-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'loan-term-panel';
      card.appendChild(panel);
    }
    panel.innerHTML = `<h3>借款期數進度</h3>` + loans.map((loan, index) => {
      const total = getLoanTotalTerms(loan, index);
      const paid = calcPaidTerms(loan.startDate, total);
      const remaining = Math.max(0, total - paid);
      return `<div class="loan-term-row"><span>${loan.name || `借款 ${index + 1}`}</span><span><small>總期數</small><br><b>${total}</b></span><span><small>已繳期數</small><br><b>${paid}</b></span><span><small>剩餘期數</small><br><b>${remaining}</b></span></div>`;
    }).join('');
  }

  function labelTradeInputs() {
    const card = findCard('交易紀錄');
    const form = card?.querySelector('.trade-form');
    if (!card || !form || card.querySelector('.trade-field-labels')) return;
    const labels = ['日期', '股票', '買賣', '股數', '成交價', '手續費', '證交稅', '備註', '操作'];
    const row = document.createElement('div');
    row.className = 'trade-field-labels';
    row.innerHTML = labels.map((x) => `<span>${x}</span>`).join('');
    form.parentElement?.insertBefore(row, form);
    const controls = Array.from(form.querySelectorAll('input,select'));
    ['日期', '股票', '買賣', '股數', '成交價', '手續費', '證交稅', '備註'].forEach((label, i) => {
      const el = controls[i];
      if (!el) return;
      el.setAttribute('aria-label', label);
      if (el.tagName === 'INPUT') el.setAttribute('placeholder', label);
      el.setAttribute('title', label);
    });
  }

  function pullCloudOccasionally() {
    const now = Date.now();
    if (now - lastCloudPull < 8000) return;
    lastCloudPull = now;
    pullLoanTermsFromFirebase().catch(() => {});
  }

  function updateAll() {
    updateYearlyGrowth();
    highlightCurrentShares();
    updateLoanTerms();
    labelTradeInputs();
    pullCloudOccasionally();
  }

  const schedule = () => window.requestAnimationFrame(updateAll);
  window.addEventListener('load', schedule);
  window.addEventListener('storage', schedule);
  setInterval(updateAll, 1500);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
})();
