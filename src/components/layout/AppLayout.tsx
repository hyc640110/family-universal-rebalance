import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.hash]);
  return <div className="app-shell">
    <a className="skip-link" href="#app-content">跳至主要內容</a>
    <DesktopSidebar />
    <main id="app-content" className="app-content" tabIndex={-1}>{children}</main>
    <MobileBottomNav />
  </div>;
}

