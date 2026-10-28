import { useState } from 'react';
import { FileText } from 'lucide-react';
import { DangerButton } from '../../../components/DangerButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { formatFileSize } from '../../../utils/fileSize';
import { removeVehicleDocument } from '../vehicleService';
import { VEHICLE_DOCUMENT_TYPES } from '../types';
import type { VehicleDocument } from '../types';
import { isOfficeDocument } from '../validation';
import { openStoredDocument } from '../../../utils/documentOpen';
import './VehicleDocumentsSection.css';

interface VehicleDocumentsSectionProps {
  documents: VehicleDocument[];
  onAdd: () => void;
  onRefresh: () => Promise<void> | void;
}

interface DocumentRowProps {
  doc: VehicleDocument;
  onRemoved: () => void;
}

function DocumentRow({ doc, onRemoved }: DocumentRowProps) {
  const { t, locale } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabel = VEHICLE_DOCUMENT_TYPES.find((docType) => docType.id === doc.type)?.title[locale] ?? doc.type;

  const handleOpen = async () => {
    const result = await openStoredDocument({ file: doc.file, fileName: doc.fileName, mimeType: doc.mimeType });
    setError(result.ok ? null : t(result.errorKey ?? 'documentOpenError'));
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await removeVehicleDocument(doc.id);
      onRemoved();
    } catch (err) {
      console.error('Failed to remove document', err);
      setError(t('formSaveError'));
      setRemoving(false);
    }
  };

  return (
    <li className="vehicle-document-row">
      <span className="vehicle-document-row__icon" aria-hidden="true">
        <FileText size={20} strokeWidth={1.75} />
      </span>
      <span className="vehicle-document-row__text">
        <span className="vehicle-document-row__title">{doc.title}</span>
        <span className="vehicle-document-row__meta">
          {typeLabel} · {doc.fileName} · {formatFileSize(doc.fileSize)}
        </span>
        {doc.expiryDate && (
          <span className="vehicle-document-row__expiry">
            {t('documentExpiryPrefixLabel')} {new Intl.DateTimeFormat(locale).format(new Date(doc.expiryDate))}
          </span>
        )}
        {isOfficeDocument(doc.mimeType, doc.fileName) && (
          <span className="vehicle-document-row__hint">{t('documentExternalAppHint')}</span>
        )}
        {error && <span className="vehicle-document-row__error">{error}</span>}
      </span>
      <span className="vehicle-document-row__actions">
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

export function VehicleDocumentsSection({ documents, onAdd, onRefresh }: VehicleDocumentsSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="vehicle-documents-section">
      {documents.length === 0 ? (
        <p className="vehicle-documents-section__empty">{t('documentsEmpty')}</p>
      ) : (
        <ul className="vehicle-documents-section__list">
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
