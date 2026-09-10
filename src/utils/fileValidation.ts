import type { TranslationKey } from '../localization/translations';

/** Shared by every document upload flow (Family, Properties, ...). */
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
