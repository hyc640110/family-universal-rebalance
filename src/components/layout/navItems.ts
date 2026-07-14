import { BarChart3, BriefcaseBusiness, Home, LineChart, Settings, Wrench } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/home', label: '首頁', icon: Home },
  { to: '/assets', label: '資產', icon: BriefcaseBusiness },
  { to: '/analytics', label: '分析', icon: BarChart3 },
  { to: '/market', label: '市場', icon: LineChart },
  { to: '/tools', label: '工具', icon: Wrench },
  { to: '/settings', label: '設定', icon: Settings },
] as const;

