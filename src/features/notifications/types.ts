import type { TranslationKey } from '../../localization/translations';

/**
 * Notifications is a DERIVED AGGREGATION LAYER, not a domain owner: every
 * NotificationItem is computed on demand from Vehicles/Contracts/Staff/
 * Tasks' own existing derived state (see sources/*.ts, which each reuse
 * that module's own approved status/recurrence utilities rather than
 * reimplementing any business rule). Nothing here is ever persisted to
 * IndexedDB -- if the underlying source condition resolves, the item
 * simply stops being generated on the next computation. No DB_VERSION
 * bump, no notification store, no read/unread/dismissed state (see the
 * Phase 9B spec, Sections B and T).
 */
export type NotificationSourceType = 'vehicle' | 'contract' | 'staff' | 'task' | 'family';

export type NotificationSeverity = 'critical' | 'warning' | 'info';

export type NotificationKind =
  | 'vehicleRegistrationExpired'
  | 'vehicleRegistrationExpiringSoon'
  | 'vehicleInsuranceExpired'
  | 'vehicleInsuranceExpiringSoon'
  | 'vehicleMaintenanceOverdue'
  | 'vehicleMaintenanceApproaching'
  | 'contractExpired'
  | 'contractExpiringSoon'
  | 'staffResidencyExpired'
  | 'staffResidencyExpiringSoon'
  | 'staffPassportExpired'
  | 'staffPassportExpiringSoon'
  | 'staffSalaryOverdue'
  | 'staffSalaryDue'
  | 'taskOverdue'
  | 'taskDueToday'
  | 'familyCivilIdExpired'
  | 'familyCivilIdExpiringSoon'
  | 'familyPassportExpired'
  | 'familyPassportExpiringSoon';

/**
 * A small, normalized derived item. `id` is deterministic (built from the
 * source condition's own stable identity, e.g.
 * `vehicle:<vehicleId>:insurance-expired` or
 * `task:<taskId>:<occurrenceKey>`) -- NEVER a random UUID -- so the exact
 * same underlying condition always produces the exact same id and can
 * never appear twice, regardless of how many times it's recomputed.
 *
 * `titleKey`/`messageKey` are TranslationKeys (never pre-resolved
 * strings), matching the rest of the app's localization architecture;
 * `titleParams`/`messageParams` are substituted into them the same way
 * `StaffStatusReason.params` already are (see
 * notificationText.ts/StaffProfilePage.tsx) -- a small shared formatting
 * helper, never raw string concatenation.
 */
export interface NotificationItem {
  id: string;
  sourceType: NotificationSourceType;
  sourceId: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  titleKey: TranslationKey;
  titleParams?: Record<string, string>;
  messageKey: TranslationKey;
  messageParams?: Record<string, string>;
  /** The real local 'YYYY-MM-DD' driving date, when the condition has one (an expiry date, a salary due date, a task occurrence date) -- used both for display context and as the primary sort key. */
  effectiveDate?: string;
  /**
   * A secondary date used only for deterministic ordering when
   * `effectiveDate` alone doesn't fully capture recency (e.g. a
   * mileage-driven maintenance item has no due DATE at all -- its
   * underlying record's own `serviceDate` is used here instead, so
   * mileage-based items still sort sensibly relative to dated ones).
   */
  sortDate?: string;
  /** The real feature route this notification is about -- Notifications never duplicates the source's own detail UI, it only links to it. */
  route: string;
  /** Only genuinely useful extra context for rendering (e.g. km figures) -- never a second copy of the source record. */
  metadata?: Record<string, string | number>;
}
