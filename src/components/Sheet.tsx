import { useEffect, useRef, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import './Sheet.css';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, title, closeLabel, children }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const sheetEl = sheetRef.current;

    // Prefer the first real input inside the sheet (so a form is ready to
    // type into immediately); fall back to the sheet container itself.
    const firstFocusable = sheetEl?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? sheetEl)?.focus();

    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !sheetEl) return;

      const focusables = Array.from(sheetEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Blocks background rubber-band scrolling on iOS Safari when the touch
  // starts on the backdrop itself; the sheet's own body still scrolls
  // normally since this only intercepts touches on the overlay element.
  const handleOverlayTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
  };

  return (
    <div
      className="sheet-overlay"
      role="presentation"
      onClick={onClose}
      onTouchMove={handleOverlayTouchMove}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__handle" aria-hidden="true" />
        <div className="sheet__header">
          <h2 className="sheet__title">{title}</h2>
          <IconButton icon={<X size={20} strokeWidth={1.75} />} label={closeLabel} onClick={onClose} />
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}
