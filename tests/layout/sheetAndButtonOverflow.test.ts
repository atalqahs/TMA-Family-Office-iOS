import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * jsdom (used by the rest of this suite) does not run real layout, so it
 * cannot measure scrollWidth/clientWidth or reproduce the horizontal
 * drag this guards against -- that was verified directly in a real
 * Chromium browser across 320/375/390/393/430px and both locales. These
 * tests instead pin the specific CSS rules that fix is built on, so a
 * future edit can't silently drop them.
 */

const sheetCss = readFileSync(resolve(__dirname, '../../src/components/Sheet.css'), 'utf-8');
const buttonCss = readFileSync(resolve(__dirname, '../../src/components/Button.css'), 'utf-8');
const formsCss = readFileSync(resolve(__dirname, '../../src/styles/forms.css'), 'utf-8');

function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`rule not found: ${selector}`);
  return match[1];
}

describe('Sheet.css: .sheet__body does not silently become horizontally scrollable', () => {
  it('declares overflow-x explicitly instead of leaving it to the overflow paired-value default', () => {
    const body = ruleBody(sheetCss, '.sheet__body');
    expect(body).toMatch(/overflow-x:\s*hidden/);
    expect(body).toMatch(/overflow-y:\s*auto/);
  });

  it('keeps the sheet itself from growing past its container width', () => {
    const sheet = ruleBody(sheetCss, '.sheet');
    expect(sheet).toMatch(/min-width:\s*0/);
  });
});

describe('Button.css: .btn truncates overflowing content instead of forcing its box wider', () => {
  it('caps width and clips overflowing text with an ellipsis', () => {
    const btn = ruleBody(buttonCss, '.btn');
    expect(btn).toMatch(/max-width:\s*100%/);
    expect(btn).toMatch(/overflow:\s*hidden/);
    expect(btn).toMatch(/white-space:\s*nowrap/);
    expect(btn).toMatch(/text-overflow:\s*ellipsis/);
  });

  it('defines a left/start-aligned .btn__label for variable-length content (e.g. a file name)', () => {
    const label = ruleBody(buttonCss, '.btn__label');
    expect(label).toMatch(/overflow:\s*hidden/);
    expect(label).toMatch(/white-space:\s*nowrap/);
    expect(label).toMatch(/text-overflow:\s*ellipsis/);
    expect(label).toMatch(/text-align:\s*start/);
  });
});

describe('forms.css: date inputs size to their content instead of stretching full-width', () => {
  it('overrides the generic .form-input width:100% for [type="date"] with a content-based, non-hardcoded width', () => {
    const dateInput = ruleBody(formsCss, '.form-input[type=\'date\']');
    expect(dateInput).toMatch(/width:\s*auto/);
    // A floor in `ch` units (content-relative, not a fixed px guess) plus a
    // ceiling of 100% -- never a hardcoded px width that could clip a
    // longer locale's formatted date.
    expect(dateInput).toMatch(/min-width:\s*\d+ch/);
    expect(dateInput).toMatch(/max-width:\s*100%/);
    expect(dateInput).not.toMatch(/min-width:\s*\d+px/);
    expect(dateInput).not.toMatch(/max-width:\s*\d+px/);
    // Opts out of the parent .form-field column flex's default stretch,
    // which otherwise overrides width:auto back to full width -- and
    // resolves against dir (rtl/ltr) automatically, so the compact box
    // lands on the correct leading edge in both languages.
    expect(dateInput).toMatch(/align-self:\s*flex-start/);
  });

  it('keeps the shared 44px+ touch-target height from the generic .form-input rule (not overridden)', () => {
    const dateInput = ruleBody(formsCss, '.form-input[type=\'date\']');
    expect(dateInput).not.toMatch(/min-height/);
    const generic = ruleBody(formsCss, '.form-input');
    expect(generic).toMatch(/min-height:\s*var\(--touch-target\)/);
  });
});
