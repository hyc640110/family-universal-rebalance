import type { ReactNode } from 'react';
import PageFrame from './PageFrame';
export default function AnalyticsPage({ children }: { children: ReactNode }) { return <PageFrame page="analytics" title="分析" description="集中檢視再平衡、逢低提醒與交易建議。">{children}</PageFrame>; }
