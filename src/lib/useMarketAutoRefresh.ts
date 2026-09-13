import { useEffect, useRef } from 'react';
import { shouldRefreshMarket } from './marketRefreshExperience';

export function useMarketAutoRefresh(active: boolean, lastAttemptAt: number | null, refresh: () => void) {
  const latest = useRef({ lastAttemptAt, refresh });
  useEffect(() => { latest.current = { lastAttemptAt, refresh }; }, [lastAttemptAt, refresh]);
  useEffect(() => {
    if (!active) return;
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      if (shouldRefreshMarket(latest.current.lastAttemptAt, Date.now())) latest.current.refresh();
    };
    check();
    const timer = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [active]);
}
