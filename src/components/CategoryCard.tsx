import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './CategoryCard.css';

interface CategoryCardProps {
  path: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  meta?: string;
  variant?: 'grid' | 'row';
  onNavigate?: () => void;
}

export function CategoryCard({
  path,
  icon: Icon,
  title,
  subtitle,
  meta,
  variant = 'grid',
  onNavigate,
}: CategoryCardProps) {
  return (
    <NavLink
      to={path}
      onClick={onNavigate}
      className={({ isActive }) =>
        ['category-card', `category-card--${variant}`, isActive ? 'category-card--active' : '']
          .filter(Boolean)
          .join(' ')
      }
    >
      <span className="category-card__icon" aria-hidden="true">
        <Icon size={variant === 'grid' ? 22 : 20} strokeWidth={1.75} />
      </span>
      <span className="category-card__text">
        <span className="category-card__title">{title}</span>
        {variant === 'row' && subtitle && <span className="category-card__subtitle">{subtitle}</span>}
        {variant === 'grid' && meta && <span className="category-card__meta">{meta}</span>}
      </span>
    </NavLink>
  );
}
