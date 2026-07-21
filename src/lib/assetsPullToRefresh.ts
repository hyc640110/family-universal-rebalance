export type AssetsPullToRefreshOptions = { threshold: number; onRefresh: () => void };

export function createAssetsPullToRefresh({ threshold, onRefresh }: AssetsPullToRefreshOptions) {
  let startY: number | null = null;
  let armed = false;
  let fired = false;

  const reset = () => { startY = null; armed = false; fired = false; };

  return {
    start({ pageTop, clientY, isRefreshing }: { pageTop: boolean; clientY: number; isRefreshing: boolean }) {
      reset();
      if (pageTop && !isRefreshing) startY = clientY;
    },
    move(clientY: number) {
      if (startY === null) return false;
      armed = clientY - startY >= threshold;
      return armed;
    },
    end(isRefreshing: boolean) {
      const shouldRefresh = armed && !fired && !isRefreshing;
      if (shouldRefresh) { fired = true; onRefresh(); }
      startY = null;
      armed = false;
      return shouldRefresh;
    },
    cancel: reset,
    isArmed: () => armed,
  };
}
