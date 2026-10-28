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

    // iOS Safari does NOT stop the page from scrolling/rubber-banding
    // underneath a fixed-position overlay just because body has
    // overflow:hidden -- that alone is a desktop-only fix. Pinning <body>
    // itself with position:fixed at its current scroll offset (the
    // standard, widely-used technique for this exact platform gap) is what
    // actually keeps the background completely stationary while only the
    // sheet's own body scrolls, and is what makes "return to exactly the
    // previous scroll position" on close reliable -- plain overflow:hidden
    // guarantees neither on iOS. This app has no separate scrolling
    // wrapper (global.css never sets overflow on #root or a shell div),
    // so document.body is genuinely the root scrolling element to pin.
    //
    // This MUST run before the focus() call below: focusing an element
    // the browser considers off-screen scrolls it into view by default,
    // and until body is pinned that scroll lands on the real page (it was
    // caught doing exactly that in testing -- jumping to the bottom of a
    // long list). Capturing and pinning first means there's nothing left
    // for an unwanted focus-scroll to move.
    const scrollY = window.scrollY;
    const { body } = document;
    const original = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    // Focus the dialog container itself, NOT its first input. Autofocusing
    // a text field here pops the iOS keyboard the instant the sheet starts
    // its slide-up animation -- the exact "background shifts / form jumps
    // while opening, fields need a second tap" complaint. Screen readers
    // still land inside the dialog correctly (tabIndex={-1} + aria-modal
    // below); the user then taps a field deliberately once the sheet has
    // settled, which is also the native iOS sheet/modal convention.
    // `preventScroll` is the explicit, standards-based way to stop this
    // focus from scrolling anything on its own, belt-and-suspenders with
    // the body being pinned above.
    sheetEl?.focus({ preventScroll: true });

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
      body.style.position = original.position;
      body.style.top = original.top;
      body.style.width = original.width;
      body.style.overflow = original.overflow;
      window.scrollTo(0, scrollY);
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
