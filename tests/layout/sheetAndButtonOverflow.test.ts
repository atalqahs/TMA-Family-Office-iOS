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

/**
 * Every "selector-list { body }" block in the file, as (comma-split,
 * trimmed) selector entries alongside the body -- comments are stripped
 * first, since otherwise a multi-line comment immediately preceding a
 * rule gets swept into its captured "selector list" text (everything
 * between the previous `}` and the next `{`), and a comma anywhere in
 * that comment's prose would split it into fragments that never equal a
 * real selector.
 */
function cssBlocks(css: string): Array<{ entries: string[]; body: string }> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return Array.from(withoutComments.matchAll(/([^{}]+)\{([^}]*)\}/g)).map(([, selectorList, body]) => ({
    entries: selectorList.split(',').map((s) => s.trim()),
    body,
  }));
}

/** The body of the rule whose selector is EXACTLY (and only) `selector` -- never a rule where it's one of several comma-separated selectors. */
function ruleBody(css: string, selector: string): string {
  const block = cssBlocks(css).find((b) => b.entries.length === 1 && b.entries[0] === selector);
  if (!block) throw new Error(`no exclusive rule found for selector: ${selector}`);
  return block.body;
}

/** Like ruleBody, but also matches when `selector` is one entry of a comma-separated selector list (e.g. finds the shared body of ".a, .b { ... }" when asked for ".a" or ".b"). */
function sharedRuleBody(css: string, selector: string): string {
  const block = cssBlocks(css).find((b) => b.entries.includes(selector));
  if (!block) throw new Error(`no rule found whose selector list includes: ${selector}`);
  return block.body;
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

describe('forms.css: date and time inputs size to their content instead of stretching full-width', () => {
  it.each([
    ["'date'", "date"],
    ["'time'", "time"],
  ])('overrides the generic .form-input width:100% for [type=%s] with a content-based, non-hardcoded width', (_label, type) => {
    const selector = `.form-input[type='${type}']`;
    const shared = sharedRuleBody(formsCss, selector);
    expect(shared).toMatch(/width:\s*auto/);
    expect(shared).toMatch(/max-width:\s*100%/);
    expect(shared).not.toMatch(/max-width:\s*\d+px/);
    // Opts out of the parent .form-field column flex's default stretch,
    // which otherwise overrides width:auto back to full width -- and
    // resolves against dir (rtl/ltr) automatically, so the compact box
    // lands on the correct leading edge in both languages.
    expect(shared).toMatch(/align-self:\s*flex-start/);

    // A floor in `ch` units (content-relative, not a fixed px guess),
    // never a hardcoded px width that could clip a longer locale's
    // formatted value (e.g. a 12-hour time with AM/PM).
    const own = ruleBody(formsCss, selector);
    expect(own).toMatch(/min-width:\s*\d+ch/);
    expect(own).not.toMatch(/min-width:\s*\d+px/);
  });

  it.each([["'date'"], ["'time'"]])(
    'keeps the shared 44px+ touch-target height from the generic .form-input rule (not overridden) for [type=%s]',
    (typeLiteral) => {
      const type = typeLiteral.replace(/'/g, '');
      const own = ruleBody(formsCss, `.form-input[type='${type}']`);
      expect(own).not.toMatch(/min-height/);
    },
  );

  it('the generic .form-input rule itself declares the shared touch-target height', () => {
    const generic = ruleBody(formsCss, '.form-input');
    expect(generic).toMatch(/min-height:\s*var\(--touch-target\)/);
  });
});
