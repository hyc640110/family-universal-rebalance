import { createContext, useContext } from 'react';

/**
 * 介面小改進 1/5: 全站隱藏金額。
 *
 * This is the first React Context in this codebase (existing global UI flags like
 * `isMobile`/`isRefreshing` are threaded as explicit props — see e.g.
 * `MarketIntelligencePage`'s `isRefreshing` prop). That pattern doesn't fit here: money
 * formatting happens inside dozens of independent sibling components scattered across
 * `App.tsx` and ~15 other files (not a small, direct parent→child prop chain), so prop
 * drilling would mean adding a `hideAmounts` prop to every one of those component
 * signatures. Context lets each component that actually renders an amount opt in with one
 * `useAmountsHidden()` call, with no change to any intermediate component's props.
 *
 * Default is `false` (visible) so any component rendered outside the Provider — e.g. in a
 * unit test — never accidentally masks a value.
 */
export const AmountVisibilityContext = createContext(false);

export function useAmountsHidden(): boolean {
  return useContext(AmountVisibilityContext);
}
