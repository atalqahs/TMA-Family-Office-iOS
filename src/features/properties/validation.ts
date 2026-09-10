import type { TranslationKey } from '../../localization/translations';
import { validateDocumentFile } from '../../utils/fileValidation';
import type { PropertyFormValues } from './types';

export { validateDocumentFile };

export interface PropertyFormErrors {
  name?: TranslationKey;
}

export function validatePropertyForm(values: PropertyFormValues): PropertyFormErrors {
  const errors: PropertyFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'validationPropertyNameRequired';
  }

  return errors;
}
