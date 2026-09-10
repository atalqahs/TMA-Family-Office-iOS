import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { VEHICLE_DOCUMENT_TYPES } from '../types';
import type { VehicleDocumentFormValues, VehicleDocumentType } from '../types';
import { validateDocumentFile } from '../validation';
import './VehicleDocumentForm.css';

interface VehicleDocumentFormProps {
  onSubmit: (values: VehicleDocumentFormValues) => Promise<void>;
  onCancel: () => void;
}

export function VehicleDocumentForm({ onSubmit, onCancel }: VehicleDocumentFormProps) {
  const { t, locale } = useLanguage();
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<VehicleDocumentType>('registration');
  const [title, setTitle] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    const error = validateDocumentFile(selected);
    if (error) {
      setFileError(t(error));
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(selected);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setFileError(t('validationFileRequired'));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const typeLabel = VEHICLE_DOCUMENT_TYPES.find((docType) => docType.id === type)?.title[locale] ?? '';
      await onSubmit({
        type,
        title: title.trim() || typeLabel,
        file,
        expiryDate: expiryDate || undefined,
      });
    } catch (err) {
      console.error('Failed to save document', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="vehicle-document-form" onSubmit={handleSubmit} noValidate>
      <FormField label={t('fieldDocumentType')} htmlFor={`${formId}-type`}>
        <select
          id={`${formId}-type`}
          className="form-input"
          value={type}
          onChange={(e) => setType(e.target.value as VehicleDocumentType)}
        >
          {VEHICLE_DOCUMENT_TYPES.map((docType) => (
            <option key={docType.id} value={docType.id}>
              {docType.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('fieldDocumentTitle')} htmlFor={`${formId}-title`}>
        <input
          id={`${formId}-title`}
          className="form-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldDocumentExpiry')} htmlFor={`${formId}-expiry`}>
        <input
          id={`${formId}-expiry`}
          className="form-input"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldDocumentFile')} htmlFor={`${formId}-file`} error={fileError ?? undefined}>
        <SecondaryButton type="button" onClick={() => fileInputRef.current?.click()}>
          {file ? file.name : t('documentChooseFileLabel')}
        </SecondaryButton>
        <input
          ref={fileInputRef}
          id={`${formId}-file`}
          className="vehicle-document-form__file-input"
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
        />
      </FormField>

      {submitError && (
        <p className="vehicle-document-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="vehicle-document-form__actions">
        <SecondaryButton type="button" onClick={onCancel} disabled={submitting}>
          {t('actionCancel')}
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? t('formSaving') : t('actionSave')}
        </PrimaryButton>
      </div>
    </form>
  );
}
