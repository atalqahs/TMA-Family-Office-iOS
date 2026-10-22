import { fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Sheet } from '../../src/components/Sheet';

/**
 * Regression coverage for the real mobile bug: opening a bottom sheet
 * could scroll/shift the page underneath it, and closing it didn't
 * reliably return to the exact previous scroll position. jsdom has no
 * real layout or rubber-band scrolling to reproduce the iOS-only part of
 * this directly (verified separately in a real browser -- see the task
 * report), but it can verify the actual mechanism: body gets pinned with
 * position:fixed (not just overflow:hidden) while a sheet is open, is
 * fully restored on close, and that restoration calls window.scrollTo
 * with the exact offset captured when the sheet opened.
 */

function Harness() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(false)}>
        close from outside
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Test Sheet" closeLabel="Close">
        <input type="text" aria-label="first field" />
      </Sheet>
    </>
  );
}

describe('Sheet: background scroll lock', () => {
  it('pins body with position:fixed (not just overflow:hidden) while open', () => {
    window.scrollY = 240;
    render(<Harness />);
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.top).toBe('-240px');
  });

  it('restores body styles and calls scrollTo with the exact captured offset on close', () => {
    window.scrollY = 785;
    const scrollToSpy = vi.spyOn(window, 'scrollTo');
    const { getByText } = render(<Harness />);
    expect(document.body.style.position).toBe('fixed');

    fireEvent.click(getByText('close from outside'));

    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.overflow).toBe('');
    expect(scrollToSpy).toHaveBeenCalledWith(0, 785);
    scrollToSpy.mockRestore();
  });

  it('leaves body untouched when the sheet is never opened', () => {
    function ClosedHarness() {
      return (
        <Sheet open={false} onClose={() => {}} title="Test Sheet" closeLabel="Close">
          <input type="text" aria-label="first field" />
        </Sheet>
      );
    }
    render(<ClosedHarness />);
    expect(document.body.style.position).toBe('');
  });
});

describe('Sheet: focus management on open', () => {
  it('focuses the dialog container itself, not its first input (avoids popping the keyboard / scroll-into-view on open)', () => {
    render(<Harness />);
    const dialog = document.querySelector('.sheet') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(document.activeElement).toBe(dialog);

    const input = document.querySelector('input[aria-label="first field"]');
    expect(document.activeElement).not.toBe(input);
  });

  it('restores focus to the previously-focused element on close', () => {
    function HarnessWithTrigger() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            open sheet
          </button>
          <Sheet open={open} onClose={() => setOpen(false)} title="Test Sheet" closeLabel="Close">
            <input type="text" aria-label="first field" />
          </Sheet>
        </>
      );
    }
    const { getByText } = render(<HarnessWithTrigger />);
    const trigger = getByText('open sheet');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(document.activeElement).toBe(document.querySelector('.sheet'));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
  });
});
