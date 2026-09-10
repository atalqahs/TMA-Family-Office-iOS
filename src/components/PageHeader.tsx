import type { ReactNode } from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}

export function PageHeader({ icon, title, subtitle }: PageHeaderProps) {
  return (
    <div className="page-header">
      {icon && (
        <span className="page-header__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
