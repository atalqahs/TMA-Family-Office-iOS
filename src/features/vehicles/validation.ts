import type { TranslationKey } from '../../localization/translations';
import { validateDocumentFile } from '../../utils/fileValidation';
import type { VehicleFormValues, VehicleMaintenanceFormValues } from './types';

export { validateDocumentFile };

const MIN_YEAR = 1900;

export interface VehicleFormErrors {
  name?: TranslationKey;
  year?: TranslationKey;
  currentMileage?: TranslationKey;
}

export function validateVehicleForm(values: VehicleFormValues): VehicleFormErrors {
  const errors: VehicleFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'validationVehicleNameRequired';
  }

  if (values.year !== undefined) {
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isFinite(values.year) || values.year < MIN_YEAR || values.year > maxYear) {
      errors.year = 'validationYearInvalid';
    }
  }

  if (values.currentMileage !== undefined && (!Number.isFinite(values.currentMileage) || values.currentMileage < 0)) {
    errors.currentMileage = 'validationMileageNegative';
  }

  return errors;
}

export interface MaintenanceFormErrors {
  title?: TranslationKey;
  serviceDate?: TranslationKey;
  mileage?: TranslationKey;
  nextServiceMileage?: TranslationKey;
}

export function validateMaintenanceForm(values: VehicleMaintenanceFormValues): MaintenanceFormErrors {
  const errors: MaintenanceFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'validationMaintenanceTitleRequired';
  }
  if (!values.serviceDate) {
    errors.serviceDate = 'validationMaintenanceDateRequired';
  }
  if (values.mileage !== undefined && (!Number.isFinite(values.mileage) || values.mileage < 0)) {
    errors.mileage = 'validationMileageNegative';
  }
  if (
    values.nextServiceMileage !== undefined &&
    (!Number.isFinite(values.nextServiceMileage) || values.nextServiceMileage < 0)
  ) {
    errors.nextServiceMileage = 'validationMileageNegative';
  }

  return errors;
}
