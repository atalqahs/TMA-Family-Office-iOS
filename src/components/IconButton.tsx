import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { StatusBadge } from './StatusBadge';
import './IconButton.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  /** Accessible name — these buttons are icon-only. */
  label: string;
  /** Small count bubble shown at the corner; omitted when undefined. */
  badge?: number;
}

export function IconButton({ icon, label, badge, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={['icon-button', className].filter(Boolean).join(' ')}
      aria-label={label}
      {...rest}
    >
      {icon}
      {badge !== undefined && (
        <span className="icon-button__badge">
          <StatusBadge variant="accent">{badge}</StatusBadge>
        </span>
      )}
    </button>
  );
}
