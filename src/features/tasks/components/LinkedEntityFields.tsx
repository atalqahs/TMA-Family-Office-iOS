import { FormField } from '../../../components/FormField';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLinkedEntityLabel, type LinkableEntities } from '../linkedEntity';
import { TASK_LINKED_ENTITY_TYPES } from '../types';
import type { TaskLinkedEntityType } from '../types';
import './LinkedEntityFields.css';

interface LinkedEntityFieldsProps {
  idPrefix: string;
  entities: LinkableEntities;
  entitiesLoading: boolean;
  linkedEntityType: TaskLinkedEntityType | '';
  onLinkedEntityTypeChange: (type: TaskLinkedEntityType | '') => void;
  linkedEntityId: string;
  onLinkedEntityIdChange: (id: string) => void;
  linkedEntityIdError?: string;
}

/**
 * The optional "Linked To" relationship block for a Task — the same shape
 * as Contracts' own LinkedEntityFields, but a deliberately separate
 * Task-specific component (see ../linkedEntity.ts) rather than a shared
 * import, since Phase 8 must not touch Phase 7 modules and Tasks supports
 * a fifth linkable type (Contract) that Contracts' own picker doesn't.
 */
export function LinkedEntityFields({
  idPrefix,
  entities,
  entitiesLoading,
  linkedEntityType,
  onLinkedEntityTypeChange,
  linkedEntityId,
  onLinkedEntityIdChange,
  linkedEntityIdError,
}: LinkedEntityFieldsProps) {
  const { t, locale } = useLanguage();

  const options = linkedEntityType ? entities[linkedEntityType] : [];

  return (
    <>
      <FormField label={t('fieldLinkedTo')} htmlFor={`${idPrefix}-linkedType`}>
        <select
          id={`${idPrefix}-linkedType`}
          className="form-input"
          value={linkedEntityType}
          onChange={(e) => {
            onLinkedEntityTypeChange(e.target.value as TaskLinkedEntityType | '');
            onLinkedEntityIdChange('');
          }}
        >
          <option value="">{t('linkedToNoneLabel')}</option>
          {TASK_LINKED_ENTITY_TYPES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      {linkedEntityType && (
        <FormField
          label={TASK_LINKED_ENTITY_TYPES.find((option) => option.id === linkedEntityType)!.title[locale]}
          htmlFor={`${idPrefix}-linkedEntity`}
          error={linkedEntityIdError}
        >
          {entitiesLoading ? (
            <p className="linked-entity-fields__hint">{t('loadingLabel')}</p>
          ) : options.length === 0 ? (
            <p className="linked-entity-fields__hint">{t('linkedEntityEmptyState')}</p>
          ) : (
            <select
              id={`${idPrefix}-linkedEntity`}
              className="form-input"
              value={linkedEntityId}
              onChange={(e) => onLinkedEntityIdChange(e.target.value)}
            >
              <option value="">{t('linkedEntitySelectPlaceholder')}</option>
              {options.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {getLinkedEntityLabel(linkedEntityType, entity)}
                </option>
              ))}
            </select>
          )}
        </FormField>
      )}
    </>
  );
}
