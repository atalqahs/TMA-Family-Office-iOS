import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

export function PrimaryButton({ className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={['btn', 'btn--primary', className].filter(Boolean).join(' ')} {...rest} />;
}
