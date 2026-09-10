import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

export function SecondaryButton({ className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={['btn', 'btn--secondary', className].filter(Boolean).join(' ')} {...rest} />;
}
