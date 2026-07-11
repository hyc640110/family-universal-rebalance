import type { ReactNode } from 'react';
import PageFrame from './PageFrame';
export default function HomePage({ children }: { children: ReactNode }) { return <PageFrame page="home" title="首頁" description="每天 30 秒，看懂今天的資產狀態與行動重點。">{children}</PageFrame>; }
