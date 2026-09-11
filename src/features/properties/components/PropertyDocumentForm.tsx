import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { PROPERTY_DOCUMENT_TYPES } from '../types';
import type { PropertyDocumentFormValues, PropertyDocumentType } from '../types';
import { DOCUMENT_FILE_INPUT_ACCEPT, validateDocumentFile } from '../validation';
import './PropertyDocumentForm.css';

interface PropertyDocumentFormProps {
  onSubmit: (values: PropertyDocumentFormValues) => Promise<void>;
  onCancel: () => void;
}

export function PropertyDocumentForm({ onSubmit, onCancel }: PropertyDocumentFormProps) {
  const { t, locale } = useLanguage();
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<PropertyDocumentType>('titleDeed');
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
      const typeLabel = PROPERTY_DOCUMENT_TYPES.find((docType) => docType.id === type)?.title[locale] ?? '';
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
    <form className="property-document-form" onSubmit={handleSubmit} noValidate>
      <FormField label={t('fieldDocumentType')} htmlFor={`${formId}-type`}>
        <select
          id={`${formId}-type`}
          className="form-input"
          value={type}
          onChange={(e) => setType(e.target.value as PropertyDocumentType)}
        >
          {PROPERTY_DOCUMENT_TYPES.map((docType) => (
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
          className="property-document-form__file-input"
          type="file"
          accept={DOCUMENT_FILE_INPUT_ACCEPT}
          onChange={handleFileChange}
        />
      </FormField>

      {submitError && (
        <p className="property-document-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="property-document-form__actions">
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
