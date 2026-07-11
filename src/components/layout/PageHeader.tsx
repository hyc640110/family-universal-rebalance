type PageHeaderProps = { title: string; description: string };

export default function PageHeader({ title, description }: PageHeaderProps) {
  return <header className="page-header"><div><p className="eyebrow">Universal Rebalance</p><h1>{title}</h1><p>{description}</p></div></header>;
}

