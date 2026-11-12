import type { ReactNode } from "react";
/**
 * Consistent page title and metadata header.
 * Documentation pass 2026-11-12.
 */


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
