import type { TranslationKey } from '../../localization/translations';
import { DOCUMENT_FILE_INPUT_ACCEPT, isOfficeDocument, validateDocumentFile } from '../../utils/fileValidation';
import type { EducationProfileFormValues } from './types';

export { DOCUMENT_FILE_INPUT_ACCEPT, isOfficeDocument, validateDocumentFile };

export interface EducationProfileFormErrors {
  educationStage?: TranslationKey;
}

/** `educationStage` is the only required field -- everything else (institution/gradeOrYear/specialization/notes) is optional free text, and `educationStatus` is a fixed enum with a default. */
export function validateEducationProfileForm(values: EducationProfileFormValues): EducationProfileFormErrors {
  const errors: EducationProfileFormErrors = {};

  if (!values.educationStage.trim()) {
    errors.educationStage = 'validationEducationStageRequired';
  }

  return errors;
}
