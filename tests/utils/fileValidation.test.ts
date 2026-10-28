import { describe, expect, it } from 'vitest';
import { MAX_DOCUMENT_FILE_SIZE, isOfficeDocument, validateDocumentFile } from '../../src/utils/fileValidation';

function file(name: string, type: string, size = 1024): File {
  const blob = new File([new Uint8Array(size)], name, { type });
  return blob;
}

describe('validateDocumentFile: MIME type + extension policy', () => {
  it('accepts a PDF with its correct MIME type', () => {
    expect(validateDocumentFile(file('report.pdf', 'application/pdf'))).toBeNull();
  });

  it('accepts a .docx with its correct MIME type', () => {
    expect(
      validateDocumentFile(file('contract.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
    ).toBeNull();
  });

  it('accepts a .docx reported with an unreliable generic MIME type (the common iOS/Files-app case) -- extension decides', () => {
    expect(validateDocumentFile(file('contract.docx', 'application/octet-stream'))).toBeNull();
  });

  it('accepts a .docx reported with an empty MIME type -- extension decides', () => {
    expect(validateDocumentFile(file('contract.docx', ''))).toBeNull();
  });

  it('accepts a .docx reported as a zip MIME type (docx is technically a zip archive) -- extension decides', () => {
    expect(validateDocumentFile(file('contract.docx', 'application/zip'))).toBeNull();
  });

  it('rejects a MIME type that is specific/reliable but matches no supported format at all', () => {
    expect(validateDocumentFile(file('notes.txt', 'text/plain'))).toBe('validationFileTypeUnsupported');
  });

  it('rejects a file whose specific, reliable MIME type contradicts a recognized extension for a DIFFERENT format -- a disguised-file mismatch, not an iOS quirk', () => {
    // Real MIME type says PNG image, but the name claims a Word document.
    expect(validateDocumentFile(file('contract.docx', 'image/png'))).toBe('validationFileTypeUnsupported');
  });

  it('rejects the inverse mismatch too: a real PDF MIME type with a .jpg name', () => {
    expect(validateDocumentFile(file('photo.jpg', 'application/pdf'))).toBe('validationFileTypeUnsupported');
  });

  it('trusts a specific, reliable MIME type when there is no extension to contradict it', () => {
    expect(validateDocumentFile(file('no-extension-file', 'application/pdf'))).toBeNull();
  });

  it('rejects a file over the shared size limit, even with a valid format', () => {
    expect(validateDocumentFile(file('big.pdf', 'application/pdf', MAX_DOCUMENT_FILE_SIZE + 1))).toBe('validationFileTooLarge');
  });

  it('accepts a file exactly at the shared size limit', () => {
    expect(validateDocumentFile(file('exact.pdf', 'application/pdf', MAX_DOCUMENT_FILE_SIZE))).toBeNull();
  });
});

describe('isOfficeDocument', () => {
  it('is true for a Word MIME type', () => {
    expect(isOfficeDocument('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'contract.docx')).toBe(true);
  });

  it('is true for an Excel extension even with an unreliable MIME type', () => {
    expect(isOfficeDocument('application/octet-stream', 'budget.xlsx')).toBe(true);
  });

  it('is false for a PDF', () => {
    expect(isOfficeDocument('application/pdf', 'report.pdf')).toBe(false);
  });

  it('is false for an image', () => {
    expect(isOfficeDocument('image/jpeg', 'photo.jpg')).toBe(false);
  });
});
