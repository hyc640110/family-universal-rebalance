import type { ReactNode } from 'react';
import PageHeader from '../components/layout/PageHeader';

export default function PageFrame({ title, description, page, children }: { title: string; description: string; page: string; children: ReactNode }) {
  return <div className={`page-view route-${page}`}><PageHeader title={title} description={description} /><div className="page-stack">{children}</div></div>;
}
