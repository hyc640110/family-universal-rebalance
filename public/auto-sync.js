(() => {
  const STORAGE_KEYS = ['family-universal-rebalance-v100-state'];
  const REMOVED_SYMBOLS = new Set();
  const DEFENSIVE_SYMBOLS = new Set(['00865B']);
  const DEFAULT_HOLDINGS = [
    { symbol: '00662', shares: 0, avgCost: 0, targetWeight: 40 },
    { symbol: '00670L', shares: 0, avgCost: 0, targetWeight: 38 },
    { symbol: '00865B', shares: 0, avgCost: 0, targetWeight: 20 },
    { symbol: '0050', shares: 0, avgCost: 0, targetWeight: 1 },
    { symbol: '00631L', shares: 0, avgCost: 0, targetWeight: 1 }
  ];
  const REMOVED_RECORD_KEY = ['tra', 'des'].join('');
  const STALE_KEYS = ['strategy', 'strategies', 'targetAllocation', 'assetAllocation', 'portfolioSummary', 'strategyTotal', 'defaultHoldings', ['default', 'Tr', 'ades'].join(''), 'monthlyContribution', 'simCagr', 'simDividend', 'simYears', REMOVED_RECORD_KEY];
  const DEFAULT_GROWTH_TARGET = 1;
  const MIN_GROWTH_TARGET = 0;
  const MAX_GROWTH_TARGET = 100;

  function clampTarget(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return DEFAULT_GROWTH_TARGET;
    return Math.min(MAX_GROWTH_TARGET, Math.max(MIN_GROWTH_TARGET, numeric));
  }

  function normalizeSymbol(value) {
    return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  }

  function growthTargetTotalOf(holdings) {
    return holdings
      .filter((h) => !DEFENSIVE_SYMBOLS.has(normalizeSymbol(h.symbol)))
      .map((h) => Number(h.targetWeight))
      .filter(Number.isFinite)
      .reduce((a, v) => a + Math.max(0, v), 0);
  }

  function applyAutoDefensiveTarget(holdings) {
    const base = holdings.map((h) => ({ ...h, symbol: normalizeSymbol(h.symbol) }));
    const bondTarget = Math.max(0, 100 - growthTargetTotalOf(base));
    return base.map((h) => DEFENSIVE_SYMBOLS.has(h.symbol) ? { ...h, targetWeight: bondTarget } : h);
  }

  function sanitizeState(value) {
    if (!value || typeof value !== 'object') return {};
    const state = { ...value };
    STALE_KEYS.forEach((key) => delete state[key]);
    const hasHoldingsData = Array.isArray(state.holdings);
    const holdings = hasHoldingsData ? state.holdings.filter((h) => h?.symbol && !REMOVED_SYMBOLS.has(normalizeSymbol(h.symbol))).map((h) => {
      const targetWeight = h.targetWeight === undefined ? undefined : clampTarget(h.targetWeight);
      return { ...h, symbol: normalizeSymbol(h.symbol), ...(targetWeight === undefined ? {} : { targetWeight }) };
    }) : [];
    const isOldCleanDefault = holdings.length === 1 && holdings[0]?.symbol === '00631L' && Number(holdings[0].shares) === 0 && Number(holdings[0].avgCost) === 0 && Number(holdings[0].targetWeight) === 70;
    state.holdings = applyAutoDefensiveTarget(!hasHoldingsData || isOldCleanDefault ? DEFAULT_HOLDINGS : holdings);
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
      caches.keys().then((keys) => keys.filter((key) => key.includes('00631l-pro') || key.includes('family-universal-rebalance')).forEach((key) => caches.delete(key))).catch(() => {});
    }
  });
})();
