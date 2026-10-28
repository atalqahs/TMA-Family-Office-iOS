import type { TranslationKey } from '../localization/translations';
import { isOfficeDocument } from './fileValidation';

/** Just the fields every stored document (Family/Property/Vehicle/Staff/Contract) already carries, so this utility never needs to know which feature module a document belongs to. */
export interface StoredDocumentLike {
  file: Blob;
  fileName: string;
  mimeType: string;
}

export interface DocumentOpenResult {
  ok: boolean;
  /** Only set when `ok` is false -- a ready-to-localize translation key describing the failure. */
  errorKey?: TranslationKey;
}

/** Minimal shape for the Web Share API's file-sharing extension -- typed locally rather than relying on the installed TypeScript DOM lib version to already declare `files` support on `ShareData`/`Navigator`. */
interface FileShareCapableNavigator {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { files: File[] }) => Promise<void>;
}

function supportsAnchorDownload(): boolean {
  return typeof document !== 'undefined' && 'download' in document.createElement('a');
}

/** The PDF/image path, unchanged from the app's original working behavior: a blob: URL opened in a new tab, which every browser this app targets already renders inline. Never used for Office documents -- see the WebKitBlobResource failure this correction exists to fix. */
function openViaBlobUrl(doc: StoredDocumentLike): DocumentOpenResult {
  let url: string | undefined;
  try {
    url = URL.createObjectURL(doc.file);
    // Deliberately no 'noopener': with it, window.open() always returns
    // null even on success (by spec), making the return value useless for
    // detecting a blocked popup. The opened content is always the user's
    // own locally-stored blob: URL, never third-party content, so there
    // is no meaningful reverse-tabnabbing risk here.
    const opened = window.open(url, '_blank');
    if (!opened) {
      // Popup blocked (common on iOS Safari): window.open returns null
      // rather than throwing, so this must be checked explicitly.
      URL.revokeObjectURL(url);
      return { ok: false, errorKey: 'documentOpenError' };
    }
    setTimeout(() => URL.revokeObjectURL(url!), 60_000);
    return { ok: true };
  } catch (err) {
    console.error('Failed to open document', err);
    if (url) URL.revokeObjectURL(url);
    return { ok: false, errorKey: 'documentOpenError' };
  }
}

/**
 * Triggers a native "Save"/download rather than a navigation: an anchor
 * with a `download` attribute tells the browser to save the resource
 * instead of trying to display it in place, which is exactly the
 * behavior that avoids WebKit's "cannot open the page" failure for a
 * document type Safari has no inline viewer for. Used only as the
 * fallback when the Web Share API's file-sharing path isn't available.
 */
function downloadViaAnchor(doc: StoredDocumentLike): DocumentOpenResult {
  let url: string | undefined;
  try {
    url = URL.createObjectURL(doc.file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = doc.fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url!), 60_000);
    return { ok: true };
  } catch (err) {
    console.error('Failed to hand off document', err);
    if (url) URL.revokeObjectURL(url);
    return { ok: false, errorKey: 'documentOpenError' };
  }
}

/**
 * The Word/Excel path. Reconstructs a real `File` from the stored Blob
 * (using the preserved filename and MIME type -- storage itself is
 * untouched) and hands it to the OS via the Web Share API's file-sharing
 * extension, which is what actually presents the iOS Share Sheet, letting
 * the user open it in Word/Excel/Files or share it elsewhere. This is
 * local handoff only -- nothing is uploaded anywhere.
 *
 * Falls back to a plain download (never to `window.open` on a blob URL,
 * which is the exact mechanism that fails on real iOS/WebKit for Office
 * documents) when the Web Share API or file-sharing isn't available, and
 * finally to a clear error message if neither mechanism can be trusted
 * not to leave the user on a broken page.
 */
async function openOfficeDocument(doc: StoredDocumentLike): Promise<DocumentOpenResult> {
  const file = new File([doc.file], doc.fileName, { type: doc.mimeType || 'application/octet-stream' });
  const nav = navigator as Navigator & FileShareCapableNavigator;

  if (typeof nav.share === 'function' && typeof nav.canShare === 'function') {
    try {
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file] });
        return { ok: true };
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // The user dismissed the Share Sheet -- a normal cancellation,
        // not a failure. Nothing else to do.
        return { ok: true };
      }
      console.error('Failed to share document', err);
      // Fall through to the download fallback below rather than giving up.
    }
  }

  if (supportsAnchorDownload()) {
    return downloadViaAnchor(doc);
  }

  return { ok: false, errorKey: 'documentOpenError' };
}

/**
 * Opens/hands off a stored document using the safest mechanism for its
 * type -- the ONE shared place this decision is made, used identically by
 * every module's DocumentsSection (Family/Properties/Vehicles/Staff/
 * Contracts) so there is never a second, module-specific implementation.
 */
export async function openStoredDocument(doc: StoredDocumentLike): Promise<DocumentOpenResult> {
  if (isOfficeDocument(doc.mimeType, doc.fileName)) {
    return openOfficeDocument(doc);
  }
  return openViaBlobUrl(doc);
}
