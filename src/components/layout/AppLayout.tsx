import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AmountVisibilityToggle from './AmountVisibilityToggle';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout({ children, hideAmounts, onToggleHideAmounts }: { children: ReactNode; hideAmounts: boolean; onToggleHideAmounts: () => void }) {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [location.pathname]);
  return <div className="app-shell">
    <DesktopSidebar />
    <main className="app-content">{children}</main>
    <MobileBottomNav />
    <AmountVisibilityToggle hidden={hideAmounts} onToggle={onToggleHideAmounts} />
  </div>;
}

