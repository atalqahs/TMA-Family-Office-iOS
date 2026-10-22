import { NON_TASK_EVENT_COLOR } from '../colors';
import type { CalendarEvent } from '../types';
import { buildDocumentExpiryEvents } from './documentExpirySource';
import type { FamilyMember, FamilyMemberDocument } from '../../family/types';

/**
 * Civil ID/Passport expiry dates, plus each Family Member's own documents
 * that carry an independent `expiryDate` -- the same two source-of-truth
 * fields `familyNotifications.ts` already reads, reused verbatim here
 * (no new expiry logic). Unlike Notifications, every date within range is
 * included regardless of how far away it is -- the Calendar is a
 * timeline, not an actionability filter.
 */
export function buildFamilyCalendarEvents(
  members: FamilyMember[],
  documents: FamilyMemberDocument[],
  rangeStart: string,
  rangeEnd: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const member of members) {
    const route = `/family/${member.id}`;

    if (member.civilIdExpiryDate && member.civilIdExpiryDate >= rangeStart && member.civilIdExpiryDate <= rangeEnd) {
      events.push({
        id: `family:${member.id}:civil-id`,
        category: 'family',
        sourceId: member.id,
        date: member.civilIdExpiryDate,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventCivilIdTitle',
        titleParams: { name: member.fullName },
      });
    }

    if (member.passportExpiryDate && member.passportExpiryDate >= rangeStart && member.passportExpiryDate <= rangeEnd) {
      events.push({
        id: `family:${member.id}:passport`,
        category: 'family',
        sourceId: member.id,
        date: member.passportExpiryDate,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventPassportTitle',
        titleParams: { name: member.fullName },
      });
    }
  }

  const nameById = new Map(members.map((member) => [member.id, member.fullName]));
  events.push(
    ...buildDocumentExpiryEvents(
      documents,
      'family',
      rangeStart,
      rangeEnd,
      (document) => nameById.get(document.familyMemberId) ?? '',
      (document) => `/family/${document.familyMemberId}`,
    ),
  );

  return events;
}
