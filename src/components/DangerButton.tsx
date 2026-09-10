import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

export function DangerButton({ className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={['btn', 'btn--danger', className].filter(Boolean).join(' ')} {...rest} />;
}
