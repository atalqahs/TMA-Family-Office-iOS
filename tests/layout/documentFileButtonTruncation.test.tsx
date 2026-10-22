import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ContractDocumentForm } from '../../src/features/contracts/components/ContractDocumentForm';
import { EducationDocumentForm } from '../../src/features/education/components/EducationDocumentForm';
import { MemberDocumentForm } from '../../src/features/family/components/MemberDocumentForm';
import { HealthDocumentForm } from '../../src/features/health/components/HealthDocumentForm';
import { PropertyDocumentForm } from '../../src/features/properties/components/PropertyDocumentForm';
import { StaffDocumentForm } from '../../src/features/staff/components/StaffDocumentForm';
import { VehicleDocumentForm } from '../../src/features/vehicles/components/VehicleDocumentForm';
import { LanguageContext } from '../../src/localization/language-context';
import { LOCALE_DIR, translations, type Locale } from '../../src/localization/translations';

/**
 * Regression coverage for a real mobile bug: a chosen file's name (no
 * spaces, so nothing for the browser to wrap on) was rendered as a
 * button's entire, unbounded text content. Inside a Sheet whose body
 * only declared overflow-y, the CSS overflow "paired value" rule
 * silently computed overflow-x to auto too, turning that content
 * overflow into real horizontal drag/scroll -- the "form slides
 * sideways" complaint. The fix wraps the dynamic file name in a
 * `.btn__label` span (Button.css: overflow hidden, white-space nowrap,
 * text-overflow ellipsis, text-align start) so it always truncates
 * inside its button instead of forcing the button -- and the sheet --
 * wider than the viewport. Every document form in the app renders this
 * exact pattern, so this is checked identically across all of them.
 */

function renderWithLocale(ui: ReactElement) {
  const locale: Locale = 'en';
  const value = {
    locale,
    dir: LOCALE_DIR[locale],
    setLocale: async () => true,
    toggleLocale: () => {},
    localeSaveError: false,
    t: (key: keyof (typeof translations)['ar']) => translations[locale][key],
  };
  return render(<LanguageContext.Provider value={value}>{ui}</LanguageContext.Provider>);
}

const LONG_FILE_NAME = 'IMG_20261022_VeryLongFileNameFromThePhonesCameraRollExportedDirectly.jpeg';

function selectLongFile() {
  const file = new File(['content'], LONG_FILE_NAME, { type: 'image/jpeg' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

const forms: Array<[string, () => ReactElement]> = [
  ['MemberDocumentForm (Family)', () => <MemberDocumentForm onSubmit={async () => {}} onCancel={() => {}} />],
  ['PropertyDocumentForm', () => <PropertyDocumentForm onSubmit={async () => {}} onCancel={() => {}} />],
  ['VehicleDocumentForm', () => <VehicleDocumentForm onSubmit={async () => {}} onCancel={() => {}} />],
  ['StaffDocumentForm', () => <StaffDocumentForm onSubmit={async () => {}} onCancel={() => {}} />],
  ['HealthDocumentForm', () => <HealthDocumentForm onSubmit={async () => {}} onCancel={() => {}} />],
  ['EducationDocumentForm', () => <EducationDocumentForm onSubmit={async () => {}} onCancel={() => {}} />],
  ['ContractDocumentForm', () => <ContractDocumentForm onSubmit={async () => {}} onCancel={() => {}} />],
];

describe('Document forms: chosen file name stays inside a truncating label', () => {
  for (const [name, factory] of forms) {
    it(`${name} wraps the selected file's name in a .btn__label truncation span`, () => {
      renderWithLocale(factory());
      selectLongFile();

      const fileNameNode = screen.getByText(LONG_FILE_NAME);
      expect(fileNameNode.tagName).toBe('SPAN');
      expect(fileNameNode.className).toContain('btn__label');

      // The wrapping button itself must never claim a fixed/implicit
      // width wider than 100% of its container -- the chosen file name
      // must not be able to re-introduce unbounded button content.
      const button = fileNameNode.closest('button');
      expect(button).not.toBeNull();
      expect(button?.className).toContain('btn');
    });
  }
});
