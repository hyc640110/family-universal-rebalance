import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

export default function MobileBottomNav() {
  return <nav className="mobile-page-nav" aria-label="主要導覽">
    {NAV_ITEMS.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
      <Icon aria-hidden="true" size={20} strokeWidth={2} /><span>{label}</span>
    </NavLink>)}
  </nav>;
}

