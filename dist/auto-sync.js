(() => {
  const STORAGE_KEYS = ['00631l-pro-v100-state', '00631l-pro-v62-state', '00631l-pro-v61-state'];
  const REMOVED_SYMBOLS = new Set();
  const REMOVED_RECORD_KEY = ['tra', 'des'].join('');
  const STALE_KEYS = ['strategy', 'strategies', 'targetAllocation', 'assetAllocation', 'portfolioSummary', 'strategyTotal', 'defaultHoldings', ['default', 'Tr', 'ades'].join(''), 'monthlyContribution', 'simCagr', 'simDividend', 'simYears', REMOVED_RECORD_KEY];
  const DEFAULT_GROWTH_TARGET = 70;
  const MIN_GROWTH_TARGET = 30;
  const MAX_GROWTH_TARGET = 90;

  function clampTarget(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return DEFAULT_GROWTH_TARGET;
    return Math.min(MAX_GROWTH_TARGET, Math.max(MIN_GROWTH_TARGET, numeric));
  }

  function sanitizeState(value) {
    if (!value || typeof value !== 'object') return {};
    const state = { ...value };
    STALE_KEYS.forEach((key) => delete state[key]);
    state.holdings = Array.isArray(state.holdings) ? state.holdings.filter((h) => h?.symbol && !REMOVED_SYMBOLS.has(h.symbol)).map((h) => {
      if (h.symbol === '00631L') return { ...h, targetWeight: clampTarget(h.targetWeight ?? DEFAULT_GROWTH_TARGET) };
      const { targetWeight: _targetWeight, ...actualHolding } = h;
      return actualHolding;
    }) : [];
    if (!state.holdings.some((h) => h.symbol === '00631L')) state.holdings.unshift({ symbol: '00631L', shares: 0, avgCost: 0, targetWeight: DEFAULT_GROWTH_TARGET });
    const removedSymbol = Array.from(REMOVED_SYMBOLS)[0];
    state.cash = Array.isArray(state.cash) ? state.cash.filter((c) => !removedSymbol || ![c?.id, c?.name, c?.note].some((v) => String(v ?? '').includes(removedSymbol))) : [];
    state.loans = Array.isArray(state.loans) ? state.loans.map((loan) => {
      const savedLoan = { ...(loan || {}) };
      delete savedLoan[['paid', 'Months'].join('')];
      const totalMonths = savedLoan.totalMonths === undefined || savedLoan.totalMonths === null ? undefined : Math.max(0, Number(savedLoan.totalMonths) || 0);
      return { ...savedLoan, totalMonths };
    }) : [];
    return state;
  }

  function migrateLocalStorageOnce() {
    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const sanitized = sanitizeState(JSON.parse(raw));
        localStorage.setItem(key, JSON.stringify(sanitized));
      } catch (_) {}
    }
  }

  window.addEventListener('load', () => {
    migrateLocalStorageOnce();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations?.().then((registrations) => registrations.forEach((registration) => registration.unregister())).catch(() => {});
    }
    if ('caches' in window) {
      caches.keys().then((keys) => keys.filter((key) => key.includes('00631l-pro')).forEach((key) => caches.delete(key))).catch(() => {});
    }
  });
})();
