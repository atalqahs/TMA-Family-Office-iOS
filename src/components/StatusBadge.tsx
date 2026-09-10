import type { ReactNode } from 'react';
import './StatusBadge.css';

type StatusVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface StatusBadgeProps {
  children: ReactNode;
  variant?: StatusVariant;
}

export function StatusBadge({ children, variant = 'neutral' }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${variant}`}>{children}</span>;
}
