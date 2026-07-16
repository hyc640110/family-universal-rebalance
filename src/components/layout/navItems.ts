import { BarChart3, BriefcaseBusiness, Home, LineChart, Settings, Wrench } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export type NavigationItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  subItems?: readonly { to: string; label: string }[];
};

// The desktop and mobile shells intentionally consume the same route registry.
// This keeps the primary destinations in the same product order as the app grows.
export const NAV_ITEMS: readonly NavigationItem[] = [
  { to: '/home', label: '首頁', icon: Home },
  {
    to: '/assets', label: '資產', icon: BriefcaseBusiness,
    subItems: [
      { to: '/assets', label: '持股資產' },
      { to: '/assets#overview-card', label: '資產配置' },
      { to: '/net-worth-history', label: '淨資產歷史' },
    ],
  },
  { to: '/analytics', label: '分析', icon: BarChart3 },
  { to: '/market', label: '市場', icon: LineChart },
  { to: '/tools', label: '工具', icon: Wrench },
  { to: '/settings', label: '設定', icon: Settings },
] as const;

