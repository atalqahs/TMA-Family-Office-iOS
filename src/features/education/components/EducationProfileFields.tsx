import { useId } from 'react';
import { FormField } from '../../../components/FormField';
import { useLanguage } from '../../../hooks/useLanguage';
import { EDUCATION_STATUSES } from '../types';
import type { EducationProfileFormValues } from '../types';
import type { EducationProfileFormErrors } from '../validation';

interface EducationProfileFieldsProps {
  values: EducationProfileFormValues;
  errors: EducationProfileFormErrors;
  onChange: <K extends keyof EducationProfileFormValues>(key: K, value: EducationProfileFormValues[K]) => void;
}

/**
 * The Education-specific fields shared by both the create and edit forms
 * (Phase 11 Part 4.C): stage/institution/gradeOrYear/specialization/
 * status/notes. Never includes any Family identity field -- those are
 * read-only, resolved live from Family (see EducationProfile's own doc
 * comment). `educationStage` is deliberately free text, never a rigid
 * hard-coded taxonomy.
 */
export function EducationProfileFields({ values, errors, onChange }: EducationProfileFieldsProps) {
  const { t, locale } = useLanguage();
  const formId = useId();

  return (
    <>
      <FormField
        label={t('fieldEducationStage')}
        htmlFor={`${formId}-stage`}
        error={errors.educationStage && t(errors.educationStage)}
      >
        <input
          id={`${formId}-stage`}
          className="form-input"
          type="text"
          value={values.educationStage}
          onChange={(e) => onChange('educationStage', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldInstitution')} htmlFor={`${formId}-institution`}>
        <input
          id={`${formId}-institution`}
          className="form-input"
          type="text"
          value={values.institution ?? ''}
          onChange={(e) => onChange('institution', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldGradeOrYear')} htmlFor={`${formId}-gradeOrYear`}>
        <input
          id={`${formId}-gradeOrYear`}
          className="form-input"
          type="text"
          value={values.gradeOrYear ?? ''}
          onChange={(e) => onChange('gradeOrYear', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldSpecialization')} htmlFor={`${formId}-specialization`}>
        <input
          id={`${formId}-specialization`}
          className="form-input"
          type="text"
          value={values.specialization ?? ''}
          onChange={(e) => onChange('specialization', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldEducationStatus')} htmlFor={`${formId}-status`}>
        <select
          id={`${formId}-status`}
          className="form-input"
          value={values.educationStatus}
          onChange={(e) => onChange('educationStatus', e.target.value as EducationProfileFormValues['educationStatus'])}
        >
          {EDUCATION_STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('fieldNotes')} htmlFor={`${formId}-notes`}>
        <textarea
          id={`${formId}-notes`}
          className="form-input"
          value={values.notes ?? ''}
          onChange={(e) => onChange('notes', e.target.value)}
          rows={4}
        />
      </FormField>
    </>
  );
}
