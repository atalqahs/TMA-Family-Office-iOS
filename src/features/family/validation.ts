import type { TranslationKey } from '../../localization/translations';
import { DOCUMENT_FILE_INPUT_ACCEPT, isOfficeDocument, validateDocumentFile } from '../../utils/fileValidation';
import type { FamilyMemberFormValues } from './types';

export { DOCUMENT_FILE_INPUT_ACCEPT, isOfficeDocument, validateDocumentFile };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AGE_YEARS = 130;

export interface FamilyMemberFormErrors {
  fullName?: TranslationKey;
  email?: TranslationKey;
  dateOfBirth?: TranslationKey;
}

export function validateFamilyMemberForm(values: FamilyMemberFormValues): FamilyMemberFormErrors {
  const errors: FamilyMemberFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'validationFullNameRequired';
  }

  if (values.email && !EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'validationEmailInvalid';
  }

  if (values.dateOfBirth) {
    const dob = new Date(values.dateOfBirth);
    const now = new Date();
    if (Number.isNaN(dob.getTime())) {
      errors.dateOfBirth = 'validationDateOfBirthInvalid';
    } else if (dob > now) {
      errors.dateOfBirth = 'validationDateOfBirthFuture';
    } else {
      const minDate = new Date(now);
      minDate.setFullYear(now.getFullYear() - MAX_AGE_YEARS);
      if (dob < minDate) {
        errors.dateOfBirth = 'validationDateOfBirthTooOld';
      }
    }
  }

  return errors;
}
