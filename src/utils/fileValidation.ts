import type { TranslationKey } from '../localization/translations';

/**
 * Shared by every document upload flow (Family, Properties, Vehicles,
 * Staff, Contracts, ...). This file is the ONE source of truth for which
 * document formats the app accepts — extend the list below, never
 * duplicate a format list inside a feature module.
 */
export const MAX_DOCUMENT_FILE_SIZE = 20 * 1024 * 1024;

interface DocumentFormat {
  /** Lowercase extensions including the dot, e.g. '.pdf'. */
  extensions: string[];
  /** The MIME type(s) a browser reliably reports for this format. */
  mimeTypes: string[];
}

const SUPPORTED_DOCUMENT_FORMATS: DocumentFormat[] = [
  { extensions: ['.pdf'], mimeTypes: ['application/pdf'] },
  { extensions: ['.jpg', '.jpeg'], mimeTypes: ['image/jpeg'] },
  { extensions: ['.png'], mimeTypes: ['image/png'] },
  { extensions: ['.heic'], mimeTypes: ['image/heic'] },
  { extensions: ['.webp'], mimeTypes: ['image/webp'] },
  { extensions: ['.doc'], mimeTypes: ['application/msword'] },
  { extensions: ['.docx'], mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
  { extensions: ['.xls'], mimeTypes: ['application/vnd.ms-excel'] },
  { extensions: ['.xlsx'], mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] },
];

/** File-type specifiers for the `<input type="file" accept="...">` attribute — one shared string so no form hardcodes its own list. */
export const DOCUMENT_FILE_INPUT_ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',');

/**
 * MIME types that iOS/Safari and other browsers sometimes report instead
 * of a format's real MIME type — an empty string, the generic binary
 * placeholder, or (since .docx/.xlsx are technically zip archives) a zip
 * MIME type. None of these identify a format on their own; when we see
 * one, the file's extension decides instead.
 */
const UNRELIABLE_MIME_TYPES = new Set(['', 'application/octet-stream', 'application/zip', 'application/x-zip-compressed']);

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.slice(dotIndex).toLowerCase();
}

function findFormatByMimeType(mimeType: string): DocumentFormat | undefined {
  return SUPPORTED_DOCUMENT_FORMATS.find((format) => format.mimeTypes.includes(mimeType));
}

function findFormatByExtension(extension: string): DocumentFormat | undefined {
  return SUPPORTED_DOCUMENT_FORMATS.find((format) => format.extensions.includes(extension));
}

/**
 * Validates a document file against the shared size limit and the shared
 * supported-format list, using MIME type and file extension together
 * rather than either alone — iOS/browser file pickers don't always report
 * a reliable MIME type (particularly for Word/Excel files picked from
 * Files/iCloud Drive), so extension is the fallback rather than a second
 * independent source of truth:
 *
 * 1. A specific, recognized MIME type (not one of the generic/unreliable
 *    placeholders above) is trusted immediately — this is the normal case
 *    for most desktop browsers and for images.
 * 2. Otherwise, if the MIME type is missing or one of those unreliable
 *    placeholders, the extension decides — this is the common iOS case
 *    for Office documents.
 * 3. A specific MIME type that does NOT match any supported format is
 *    never overridden by the extension — e.g. a '.docx' file reported as
 *    'image/png' is rejected rather than trusted, since that mismatch is
 *    exactly the "disguised file" case validation exists to catch.
 */
export function validateDocumentFile(file: File): TranslationKey | null {
  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return 'validationFileTooLarge';
  }

  const mimeType = file.type.toLowerCase();
  const extension = getExtension(file.name);

  if (mimeType && !UNRELIABLE_MIME_TYPES.has(mimeType)) {
    return findFormatByMimeType(mimeType) ? null : 'validationFileTypeUnsupported';
  }

  return findFormatByExtension(extension) ? null : 'validationFileTypeUnsupported';
}

const OFFICE_DOCUMENT_MIME_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const OFFICE_DOCUMENT_EXTENSIONS = new Set(['.doc', '.docx', '.xls', '.xlsx']);

/**
 * True for a stored Word/Excel document — used only to decide whether to
 * show a short "may open in another app" hint next to the Open action.
 * PDFs and images preview inline in every browser this app targets, so
 * they never need this hint; Office documents are handed off to the
 * OS/browser's own viewer or another app, which this app has no way to
 * detect or influence, per the existing "never build a document
 * renderer" rule.
 */
export function isOfficeDocument(mimeType: string, fileName: string): boolean {
  return OFFICE_DOCUMENT_MIME_TYPES.has(mimeType.toLowerCase()) || OFFICE_DOCUMENT_EXTENSIONS.has(getExtension(fileName));
}
