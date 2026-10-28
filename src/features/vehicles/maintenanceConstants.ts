/**
 * Quick-pick "Service After" interval presets shown as buttons on any
 * maintenance form — a convenience only, never a restriction: any value up
 * to `MAX_SERVICE_INTERVAL_KM` (validation.ts) can still be typed directly.
 * Single source of truth, shared by every form that edits a service
 * interval (MaintenanceRecordForm, CompleteServiceForm).
 */
export const SERVICE_INTERVAL_PRESETS_KM = [1000, 3000, 5000, 10000, 20000, 50000];
