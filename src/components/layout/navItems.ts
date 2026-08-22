import { BarChart3, BriefcaseBusiness, ChartColumnBig, Cog, Home, House, LineChart, Settings, Wrench } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/home', label: '首頁', icon: Home, mobileIcon: House, mobileIconProps: { fill: 'currentColor', strokeWidth: 2.25 } },
  { to: '/assets', label: '資產', icon: BriefcaseBusiness, mobileIcon: BriefcaseBusiness, mobileIconProps: { fill: 'currentColor' } },
  { to: '/analytics', label: '分析', icon: BarChart3, mobileIcon: ChartColumnBig, mobileIconProps: { fill: 'currentColor' } },
  { to: '/market', label: '市場', icon: LineChart, mobileIcon: LineChart, mobileIconProps: { fill: 'none', strokeWidth: 2.25 } },
  { to: '/tools', label: '工具', icon: Wrench, mobileIcon: Wrench, mobileIconProps: { fill: 'currentColor' } },
  { to: '/settings', label: '設定', icon: Settings, mobileIcon: Cog, mobileIconProps: { fill: 'none', strokeWidth: 2.75 } },
] as const;

