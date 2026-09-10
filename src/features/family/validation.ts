import type { TranslationKey } from '../../localization/translations';
import type { FamilyMemberFormValues } from './types';

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

export const MAX_DOCUMENT_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'];

export function validateDocumentFile(file: File): TranslationKey | null {
  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return 'validationFileTooLarge';
  }
  if (file.type && !ACCEPTED_DOCUMENT_MIME_TYPES.includes(file.type)) {
    return 'validationFileTypeUnsupported';
  }
  return null;
}
