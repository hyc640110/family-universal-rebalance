import { NavLink } from 'react-router-dom';
import { APP_NAME, APP_VERSION } from '../../constants/appInfo';
import { NAV_ITEMS } from './navItems';

export default function DesktopSidebar() {
  return <aside className="desktop-sidebar" aria-label="主要導覽">
    <div className="sidebar-brand">
      <span className="sidebar-mark">UR</span>
      <div><strong>{APP_NAME}</strong><small>{APP_VERSION}</small></div>
    </div>
    <nav>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
        <Icon aria-hidden="true" size={20} strokeWidth={2} /><span>{label}</span>
      </NavLink>)}
    </nav>
  </aside>;
}

