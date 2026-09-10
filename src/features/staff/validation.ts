import type { TranslationKey } from '../../localization/translations';
import { validateDocumentFile } from '../../utils/fileValidation';
import type { StaffFormValues, StaffSalaryPaymentFormValues } from './types';

export { validateDocumentFile };

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

export interface SalaryPaymentFormErrors {
  salaryMonth?: TranslationKey;
  amount?: TranslationKey;
  paidDate?: TranslationKey;
}

export function validateSalaryPaymentForm(values: StaffSalaryPaymentFormValues): SalaryPaymentFormErrors {
  const errors: SalaryPaymentFormErrors = {};

  if (!values.salaryMonth) {
    errors.salaryMonth = 'validationSalaryMonthRequired';
  }
  if (!Number.isFinite(values.amount) || values.amount <= 0) {
    errors.amount = 'validationSalaryAmountInvalid';
  }
  if (!values.paidDate) {
    errors.paidDate = 'validationPaidDateRequired';
  }

  return errors;
}
