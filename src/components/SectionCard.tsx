import type { ReactNode } from 'react';
import './SectionCard.css';

interface SectionCardProps {
  title?: string;
  hint?: string;
  children: ReactNode;
}

export function SectionCard({ title, hint, children }: SectionCardProps) {
  return (
    <section className="section-card">
      {(title || hint) && (
        <header className="section-card__header">
          {title && <h2 className="section-card__title">{title}</h2>}
          {hint && <p className="section-card__hint">{hint}</p>}
        </header>
      )}
      <div className="section-card__body">{children}</div>
    </section>
  );
}
