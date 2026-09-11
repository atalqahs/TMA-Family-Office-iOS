import { computeDateExpiryStatus } from '../../../utils/expiryStatus';
import { getLocalToday } from '../../../utils/localDate';
import { buildScheduleOccurrences } from '../../staff/salarySchedule';
import { computeOccurrenceLevel } from '../../staff/staffStatus';
import type { HouseholdStaff, StaffSalaryPayment, StaffSalarySchedule } from '../../staff/types';
import type { NotificationItem } from '../types';

/**
 * Residency/passport reuse `computeDateExpiryStatus` -- the exact same
 * local-calendar-safe utility `computeStaffStatus` itself calls, so there
 * is no second threshold definition to drift out of sync.
 *
 * Salary calls `buildScheduleOccurrences` + `computeOccurrenceLevel`
 * directly (the same functions `computeStaffStatus` calls internally)
 * rather than consuming `computeStaffStatus`'s aggregated `reasons[]` --
 * the lower-level call is used here specifically because it exposes each
 * occurrence's own `scheduleId`+`dueDate`, which this module needs for a
 * fully deterministic, collision-free notification id (two different
 * schedules may legitimately share a due date; `computeStaffStatus`'s
 * aggregated reasons do not carry the schedule id needed to tell them
 * apart). Every rule -- every-N-days/months/years generation, existing
 * payment history, the 10-day grace window -- is still the exact same
 * approved logic; nothing is reimplemented.
 */
export function buildStaffNotifications(
  staff: HouseholdStaff[],
  salarySchedules: StaffSalarySchedule[],
  salaryPayments: StaffSalaryPayment[],
  now: Date = new Date(),
): NotificationItem[] {
  const items: NotificationItem[] = [];
  const today = getLocalToday(now);

  const schedulesByStaff = new Map<string, StaffSalarySchedule[]>();
  for (const schedule of salarySchedules) {
    (schedulesByStaff.get(schedule.staffId) ?? schedulesByStaff.set(schedule.staffId, []).get(schedule.staffId)!).push(schedule);
  }

  for (const member of staff) {
    const route = `/staff/${member.id}`;

    const residencyExpiry = member.residencyExpiry;
    if (residencyExpiry) {
      const status = computeDateExpiryStatus(residencyExpiry, now);
      if (status === 'red' || status === 'orange') {
        const expired = status === 'red';
        items.push({
          id: `staff:${member.id}:residency-${expired ? 'expired' : 'expiring'}`,
          sourceType: 'staff',
          sourceId: member.id,
          kind: expired ? 'staffResidencyExpired' : 'staffResidencyExpiringSoon',
          severity: expired ? 'critical' : 'warning',
          titleKey: expired ? 'notificationTitleStaffResidencyExpired' : 'notificationTitleStaffResidencyExpiringSoon',
          titleParams: { name: member.fullName },
          messageKey: expired ? 'notificationMsgExpiredOn' : 'notificationMsgExpiringOn',
          messageParams: { date: residencyExpiry },
          effectiveDate: residencyExpiry,
          sortDate: residencyExpiry,
          route,
        });
      }
    }

    const passportExpiry = member.passportExpiry;
    if (passportExpiry) {
      const status = computeDateExpiryStatus(passportExpiry, now);
      if (status === 'red' || status === 'orange') {
        const expired = status === 'red';
        items.push({
          id: `staff:${member.id}:passport-${expired ? 'expired' : 'expiring'}`,
          sourceType: 'staff',
          sourceId: member.id,
          kind: expired ? 'staffPassportExpired' : 'staffPassportExpiringSoon',
          severity: expired ? 'critical' : 'warning',
          titleKey: expired ? 'notificationTitleStaffPassportExpired' : 'notificationTitleStaffPassportExpiringSoon',
          titleParams: { name: member.fullName },
          messageKey: expired ? 'notificationMsgExpiredOn' : 'notificationMsgExpiringOn',
          messageParams: { date: passportExpiry },
          effectiveDate: passportExpiry,
          sortDate: passportExpiry,
          route,
        });
      }
    }

    for (const schedule of schedulesByStaff.get(member.id) ?? []) {
      const occurrences = buildScheduleOccurrences(schedule, salaryPayments, today);
      for (const occurrence of occurrences) {
        const level = computeOccurrenceLevel(occurrence, today);
        if (level !== 'red' && level !== 'orange') continue;

        const overdue = level === 'red';
        items.push({
          id: `staff:${member.id}:salary:${schedule.id}:${occurrence.dueDate}`,
          sourceType: 'staff',
          sourceId: member.id,
          kind: overdue ? 'staffSalaryOverdue' : 'staffSalaryDue',
          severity: overdue ? 'critical' : 'warning',
          titleKey: overdue ? 'notificationTitleStaffSalaryOverdue' : 'notificationTitleStaffSalaryDue',
          titleParams: { name: member.fullName },
          messageKey: 'notificationMsgSalaryAmountDue',
          messageParams: { amount: String(occurrence.amount), date: occurrence.dueDate },
          effectiveDate: occurrence.dueDate,
          sortDate: occurrence.dueDate,
          route,
        });
      }
    }
  }

  return items;
}
