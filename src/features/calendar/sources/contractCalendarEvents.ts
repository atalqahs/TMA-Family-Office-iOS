import { NON_TASK_EVENT_COLOR } from '../colors';
import type { CalendarEvent } from '../types';
import type { Contract } from '../../contracts/types';

/**
 * Both of a contract's own stored dates -- `startDate` and `endDate`
 * (`endDate` is optional; a contract may have no defined end). Unlike
 * `contractNotifications.ts` (which only ever surfaces `endDate`, since
 * only expiry is actionable), the Calendar is a timeline of real
 * contractual dates, and `startDate` is an "other existing contractual
 * date" just as real as `endDate` -- never fabricated, both already
 * required/stored fields on every Contract.
 */
export function buildContractCalendarEvents(contracts: Contract[], rangeStart: string, rangeEnd: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const contract of contracts) {
    const route = `/contracts/${contract.id}`;

    if (contract.startDate >= rangeStart && contract.startDate <= rangeEnd) {
      events.push({
        id: `contracts:${contract.id}:start`,
        category: 'contracts',
        sourceId: contract.id,
        date: contract.startDate,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventContractStartTitle',
        titleParams: { title: contract.title },
      });
    }

    if (contract.endDate && contract.endDate >= rangeStart && contract.endDate <= rangeEnd) {
      events.push({
        id: `contracts:${contract.id}:end`,
        category: 'contracts',
        sourceId: contract.id,
        date: contract.endDate,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventContractEndTitle',
        titleParams: { title: contract.title },
      });
    }
  }

  return events;
}
