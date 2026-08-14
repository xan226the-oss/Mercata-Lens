import type { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action, meta }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <span className="section-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {meta ? <div className="page-header__meta">{meta}</div> : null}
      </div>
      {action ? <div className="page-header__action">{action}</div> : null}
    </header>
  );
}
