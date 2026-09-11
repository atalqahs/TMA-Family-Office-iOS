import { useState } from 'react';
import { FileText } from 'lucide-react';
import { DangerButton } from '../../../components/DangerButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { formatFileSize } from '../../../utils/fileSize';
import { removeStaffDocument } from '../staffService';
import { STAFF_DOCUMENT_TYPES } from '../types';
import type { StaffDocument } from '../types';
import { isOfficeDocument } from '../validation';
import './StaffDocumentsSection.css';

interface StaffDocumentsSectionProps {
  documents: StaffDocument[];
  onAdd: () => void;
  onRefresh: () => Promise<void> | void;
}

interface DocumentRowProps {
  doc: StaffDocument;
  onRemoved: () => void;
}

function DocumentRow({ doc, onRemoved }: DocumentRowProps) {
  const { t, locale } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabel = STAFF_DOCUMENT_TYPES.find((docType) => docType.id === doc.type)?.title[locale] ?? doc.type;

  const handleOpen = () => {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(doc.file);
      // Deliberately no 'noopener': with it, window.open() always returns
      // null even on success (by spec), making the return value useless
      // for detecting a blocked popup. The opened content is always the
      // user's own locally-stored blob: URL, never third-party content, so
      // there is no meaningful reverse-tabnabbing risk here.
      const opened = window.open(url, '_blank');
      if (!opened) {
        // Popup blocked (common on iOS Safari): window.open returns null
        // rather than throwing, so this must be checked explicitly.
        URL.revokeObjectURL(url);
        setError(t('documentOpenError'));
        return;
      }
      setError(null);
      setTimeout(() => URL.revokeObjectURL(url!), 60_000);
    } catch (err) {
      console.error('Failed to open document', err);
      if (url) URL.revokeObjectURL(url);
      setError(t('documentOpenError'));
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await removeStaffDocument(doc.id);
      onRemoved();
    } catch (err) {
      console.error('Failed to remove document', err);
      setError(t('formSaveError'));
      setRemoving(false);
    }
  };

  return (
    <li className="staff-document-row">
      <span className="staff-document-row__icon" aria-hidden="true">
        <FileText size={20} strokeWidth={1.75} />
      </span>
      <span className="staff-document-row__text">
        <span className="staff-document-row__title">{doc.title}</span>
        <span className="staff-document-row__meta">
          {typeLabel} · {doc.fileName} · {formatFileSize(doc.fileSize)}
        </span>
        {doc.expiryDate && (
          <span className="staff-document-row__expiry">
            {t('documentExpiryPrefixLabel')} {new Intl.DateTimeFormat(locale).format(new Date(doc.expiryDate))}
          </span>
        )}
        {isOfficeDocument(doc.mimeType, doc.fileName) && (
          <span className="staff-document-row__hint">{t('documentExternalAppHint')}</span>
        )}
        {error && <span className="staff-document-row__error">{error}</span>}
      </span>
      <span className="staff-document-row__actions">
        <SecondaryButton type="button" onClick={handleOpen}>
          {t('documentOpenAction')}
        </SecondaryButton>
        {confirming ? (
          <DangerButton type="button" onClick={handleRemove} disabled={removing}>
            {removing ? t('formSaving') : t('actionConfirm')}
          </DangerButton>
        ) : (
          <DangerButton type="button" onClick={() => setConfirming(true)}>
            {t('documentDeleteAction')}
          </DangerButton>
        )}
      </span>
    </li>
  );
}

export function StaffDocumentsSection({ documents, onAdd, onRefresh }: StaffDocumentsSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="staff-documents-section">
      {documents.length === 0 ? (
        <p className="staff-documents-section__empty">{t('documentsEmpty')}</p>
      ) : (
        <ul className="staff-documents-section__list">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} onRemoved={() => void onRefresh()} />
          ))}
        </ul>
      )}
      <PrimaryButton type="button" onClick={onAdd}>
        {t('documentsAddAction')}
      </PrimaryButton>
    </div>
  );
}
