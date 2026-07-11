import type { ReactNode } from 'react';
import PageFrame from './PageFrame';
export default function SettingsPage({ children }: { children: ReactNode }) { return <PageFrame page="settings" title="設定" description="管理同步、備份、報價來源與系統資訊。">{children}</PageFrame>; }
