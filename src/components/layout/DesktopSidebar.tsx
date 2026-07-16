import { Link, NavLink, useLocation } from 'react-router-dom';
import { APP_NAME, APP_VERSION } from '../../constants/appInfo';
import { NAV_ITEMS } from './navItems';

export default function DesktopSidebar() {
  const location = useLocation();
  return <aside className="desktop-sidebar" aria-label="主要導覽">
    <div className="sidebar-brand">
      <span className="sidebar-mark">UR</span>
      <div><strong>{APP_NAME}</strong><small>{APP_VERSION}</small></div>
    </div>
    <nav>
      {NAV_ITEMS.map(({ to, label, icon: Icon, subItems }) => <div key={to}>
        <NavLink to={to} end className={({ isActive }) => isActive ? 'active' : ''}>
          <Icon aria-hidden="true" size={20} strokeWidth={2} /><span>{label}</span>
        </NavLink>
        {subItems && <div className="sidebar-subnav" aria-label={`${label}次級導覽`}>
          {subItems.map(subItem => {
            const [path, hash] = subItem.to.split('#');
            const isActive = location.pathname === path && (hash ? location.hash === `#${hash}` : !location.hash);
            return <Link key={subItem.to} to={subItem.to} className={isActive ? 'active' : ''}>{subItem.label}</Link>;
          })}
        </div>}
      </div>)}
    </nav>
  </aside>;
}

