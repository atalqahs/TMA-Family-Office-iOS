import type { TranslationKey } from '../../localization/translations';
import { DOCUMENT_FILE_INPUT_ACCEPT, isOfficeDocument, validateDocumentFile } from '../../utils/fileValidation';
import type { StaffFormValues, StaffSalaryPaymentFormValues, StaffSalaryScheduleFormValues } from './types';

export { DOCUMENT_FILE_INPUT_ACCEPT, isOfficeDocument, validateDocumentFile };

const MAX_AGE_YEARS = 130;

export interface StaffFormErrors {
  fullName?: TranslationKey;
  dateOfBirth?: TranslationKey;
  monthlySalary?: TranslationKey;
}

export function validateStaffForm(values: StaffFormValues): StaffFormErrors {
  const errors: StaffFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'validationFullNameRequired';
  }

  if (values.dateOfBirth) {
    const dob = new Date(values.dateOfBirth);
    const now = new Date();
    if (Number.isNaN(dob.getTime())) {
      errors.dateOfBirth = 'validationDateOfBirthInvalid';
    } else if (dob > now) {
      errors.dateOfBirth = 'validationDateOfBirthFuture';
    } else {
      const minDate = new Date(now);
      minDate.setFullYear(now.getFullYear() - MAX_AGE_YEARS);
      if (dob < minDate) {
        errors.dateOfBirth = 'validationDateOfBirthTooOld';
      }
    }
  }

  if (values.monthlySalary !== undefined && (!Number.isFinite(values.monthlySalary) || values.monthlySalary < 0)) {
    errors.monthlySalary = 'validationSalaryNegative';
  }

  return errors;
}

export interface SalaryScheduleFormErrors {
  amount?: TranslationKey;
  interval?: TranslationKey;
  dueDayOfMonth?: TranslationKey;
  dueMonth?: TranslationKey;
  startDate?: TranslationKey;
  endDate?: TranslationKey;
}

export function validateSalaryScheduleForm(values: StaffSalaryScheduleFormValues): SalaryScheduleFormErrors {
  const errors: SalaryScheduleFormErrors = {};

  if (!Number.isFinite(values.amount) || values.amount <= 0) {
    errors.amount = 'validationSalaryAmountInvalid';
  }
  if (!Number.isInteger(values.interval) || values.interval < 1) {
    errors.interval = 'validationScheduleIntervalInvalid';
  }
  if (!values.startDate) {
    errors.startDate = 'validationStartDateRequired';
  }
  if (
    (values.frequency === 'month' || values.frequency === 'year') &&
    (values.dueDayOfMonth === undefined || values.dueDayOfMonth < 1 || values.dueDayOfMonth > 31)
  ) {
    errors.dueDayOfMonth = 'validationDueDayInvalid';
  }
  if (values.frequency === 'year' && (values.dueMonth === undefined || values.dueMonth < 1 || values.dueMonth > 12)) {
    errors.dueMonth = 'validationDueMonthInvalid';
  }
  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = 'validationEndDateBeforeStart';
  }

  return errors;
}

export interface SalaryPaymentFormErrors {
  amount?: TranslationKey;
  paidDate?: TranslationKey;
}

export function validateSalaryPaymentForm(values: StaffSalaryPaymentFormValues): SalaryPaymentFormErrors {
  const errors: SalaryPaymentFormErrors = {};

  if (!Number.isFinite(values.amount) || values.amount <= 0) {
    errors.amount = 'validationSalaryAmountInvalid';
  }
  if (!values.paidDate) {
    errors.paidDate = 'validationPaidDateRequired';
  }

  return errors;
}
