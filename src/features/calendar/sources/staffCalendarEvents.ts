import { NON_TASK_EVENT_COLOR } from '../colors';
import type { CalendarEvent } from '../types';
import { buildDocumentExpiryEvents } from './documentExpirySource';
import { generateOccurrences } from '../../staff/salarySchedule';
import type { HouseholdStaff, StaffDocument, StaffSalarySchedule } from '../../staff/types';

/**
 * Civil ID/Passport/Residency expiry, each staff member's own documents
 * with an independent `expiryDate`, and every salary occurrence within
 * range -- reusing `generateOccurrences` (the same calendar-month-exact
 * weekly/monthly/yearly generation `staffNotifications.ts`'s "next unpaid
 * occurrence" is itself built on) rather than deriving due dates a second
 * way. Unlike Notifications (which only ever surfaces the single next
 * UNPAID occurrence), the Calendar shows every occurrence in the visible
 * month regardless of paid status -- a timeline, not an actionability
 * filter -- so a household can see salary due dates for past and future
 * months alike.
 */
export function buildStaffCalendarEvents(
  staff: HouseholdStaff[],
  salarySchedules: StaffSalarySchedule[],
  documents: StaffDocument[],
  rangeStart: string,
  rangeEnd: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const schedulesByStaff = new Map<string, StaffSalarySchedule[]>();
  for (const schedule of salarySchedules) {
    (schedulesByStaff.get(schedule.staffId) ?? schedulesByStaff.set(schedule.staffId, []).get(schedule.staffId)!).push(schedule);
  }

  for (const member of staff) {
    const route = `/staff/${member.id}`;

    if (member.civilIdExpiry && member.civilIdExpiry >= rangeStart && member.civilIdExpiry <= rangeEnd) {
      events.push({
        id: `staff:${member.id}:civil-id`,
        category: 'staff',
        sourceId: member.id,
        date: member.civilIdExpiry,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventCivilIdTitle',
        titleParams: { name: member.fullName },
      });
    }

    if (member.passportExpiry && member.passportExpiry >= rangeStart && member.passportExpiry <= rangeEnd) {
      events.push({
        id: `staff:${member.id}:passport`,
        category: 'staff',
        sourceId: member.id,
        date: member.passportExpiry,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventPassportTitle',
        titleParams: { name: member.fullName },
      });
    }

    if (member.residencyExpiry && member.residencyExpiry >= rangeStart && member.residencyExpiry <= rangeEnd) {
      events.push({
        id: `staff:${member.id}:residency`,
        category: 'staff',
        sourceId: member.id,
        date: member.residencyExpiry,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventResidencyTitle',
        titleParams: { name: member.fullName },
      });
    }

    for (const schedule of schedulesByStaff.get(member.id) ?? []) {
      for (const dueDate of generateOccurrences(schedule, rangeEnd)) {
        if (dueDate < rangeStart) continue;
        events.push({
          id: `staff:${member.id}:salary:${schedule.id}:${dueDate}`,
          category: 'staff',
          sourceId: member.id,
          date: dueDate,
          color: NON_TASK_EVENT_COLOR,
          route,
          titleKey: 'calendarEventSalaryDueTitle',
          titleParams: { name: member.fullName },
        });
      }
    }
  }

  const nameById = new Map(staff.map((member) => [member.id, member.fullName]));
  events.push(
    ...buildDocumentExpiryEvents(
      documents,
      'staff',
      rangeStart,
      rangeEnd,
      (document) => nameById.get(document.staffId) ?? '',
      (document) => `/staff/${document.staffId}`,
    ),
  );

  return events;
}
