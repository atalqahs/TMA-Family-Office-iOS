import type { TranslationKey } from '../../localization/translations';
import { DOCUMENT_FILE_INPUT_ACCEPT, isOfficeDocument, validateDocumentFile } from '../../utils/fileValidation';
import type { HealthProfileFormValues } from './types';

export { DOCUMENT_FILE_INPUT_ACCEPT, isOfficeDocument, validateDocumentFile };

export interface HealthProfileFormErrors {
  height?: TranslationKey;
  weight?: TranslationKey;
}

/** Height/weight are optional, but when provided must be real positive numbers -- everything else (allergies/notes/status) is free text or a fixed enum with no further validation needed. */
export function validateHealthProfileForm(values: HealthProfileFormValues): HealthProfileFormErrors {
  const errors: HealthProfileFormErrors = {};

  if (values.height !== undefined && (Number.isNaN(values.height) || values.height <= 0)) {
    errors.height = 'validationHeightInvalid';
  }
  if (values.weight !== undefined && (Number.isNaN(values.weight) || values.weight <= 0)) {
    errors.weight = 'validationWeightInvalid';
  }

  return errors;
}
