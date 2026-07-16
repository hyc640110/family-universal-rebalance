import type { ReactNode } from 'react';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';
export default function AnalyticsPage({ children }: { children: ReactNode }) { return <PageFrame page="analytics" title="分析" description="檢視即時持股績效、風險與再平衡資訊。">{children}<ToolQuickNavigation /></PageFrame>; }
