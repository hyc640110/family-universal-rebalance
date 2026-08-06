import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [location.pathname]);
  return <div className="app-shell">
    <DesktopSidebar />
    <main className="app-content">{children}</main>
    <MobileBottomNav />
  </div>;
}

