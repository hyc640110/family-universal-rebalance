import type { ReactNode } from 'react';
import PageFrame from './PageFrame';
export default function AssetsPage({ children }: { children: ReactNode }) { return <PageFrame page="assets" title="資產" description="管理持股、現金、借款與資產配置。">{children}</PageFrame>; }
