import type { TranslationKey } from '../../localization/translations';
import { validateDocumentFile } from '../../utils/fileValidation';
import type { ContractFormValues } from './types';

export { validateDocumentFile };

export interface ContractFormErrors {
  title?: TranslationKey;
  partyName?: TranslationKey;
  startDate?: TranslationKey;
  endDate?: TranslationKey;
  amount?: TranslationKey;
  linkedEntityId?: TranslationKey;
}

export function validateContractForm(values: ContractFormValues): ContractFormErrors {
  const errors: ContractFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'validationContractTitleRequired';
  }
  if (!values.partyName.trim()) {
    errors.partyName = 'validationContractPartyRequired';
  }
  if (!values.startDate) {
    errors.startDate = 'validationContractStartDateRequired';
  }
  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = 'validationContractEndDateBeforeStart';
  }
  if (values.amount !== undefined && (!Number.isFinite(values.amount) || values.amount < 0)) {
    errors.amount = 'validationContractAmountNegative';
  }
  if (values.linkedEntityType && !values.linkedEntityId) {
    errors.linkedEntityId = 'validationLinkedEntityRequired';
  }

  return errors;
}
