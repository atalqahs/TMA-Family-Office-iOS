import { FormField } from '../../../components/FormField';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLinkedEntityLabel, type LinkableEntities } from '../linkedEntity';
import { CONTRACT_LINKED_ENTITY_TYPES } from '../types';
import type { ContractLinkedEntityType } from '../types';
import './LinkedEntityFields.css';

interface LinkedEntityFieldsProps {
  idPrefix: string;
  entities: LinkableEntities;
  entitiesLoading: boolean;
  linkedEntityType: ContractLinkedEntityType | '';
  onLinkedEntityTypeChange: (type: ContractLinkedEntityType | '') => void;
  linkedEntityId: string;
  onLinkedEntityIdChange: (id: string) => void;
  linkedEntityIdError?: string;
}

/**
 * The optional "Linked To" relationship block, shared by add and edit —
 * both go through ContractForm only (there is no separate "complete a
 * cycle"-style second workflow for Contracts the way Vehicles maintenance
 * has), so this stays a small focused field group rather than a second
 * component. Picking a type shows a second dropdown scoped to just that
 * type's existing entities; an empty category shows a clear message
 * instead of an empty/crashing dropdown.
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
            onLinkedEntityTypeChange(e.target.value as ContractLinkedEntityType | '');
            onLinkedEntityIdChange('');
          }}
        >
          <option value="">{t('linkedToNoneLabel')}</option>
          {CONTRACT_LINKED_ENTITY_TYPES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      {linkedEntityType && (
        <FormField
          label={CONTRACT_LINKED_ENTITY_TYPES.find((option) => option.id === linkedEntityType)!.title[locale]}
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
