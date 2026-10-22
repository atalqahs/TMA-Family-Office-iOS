import type { CalendarEvent } from './types';

/** A day cell never shows more than this many dots -- beyond it, `overflowCount` communicates "more" instead of overcrowding the cell. */
export const MAX_DAY_INDICATOR_DOTS = 4;

export interface DayIndicator {
  /** Up to `MAX_DAY_INDICATOR_DOTS` distinct colors present on this day, in first-seen order. */
  colors: string[];
  /** How many additional distinct colors exist beyond what `colors` shows. */
  overflowCount: number;
}

/**
 * Buckets events by their own `date` field -- the one grouping key every
 * calendar view (compact widget, expanded grid, selected-day list) needs,
 * computed once per load rather than each component re-scanning the full
 * event list.
 */
export function groupCalendarEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const bucket = map.get(event.date);
    if (bucket) {
      bucket.push(event);
    } else {
      map.set(event.date, [event]);
    }
  }
  return map;
}

/**
 * The dot indicator for one day, grouped by DISTINCT COLOR rather than by
 * event count -- several non-Task events (which all share the one gray
 * `NON_TASK_EVENT_COLOR`) collapse into a single gray dot, while each
 * distinct Task Group color present gets its own dot, exactly per the
 * spec's multi-event-per-date rule. Order is first-seen within the day's
 * events, which are themselves produced in a stable category order by
 * `calendarService.loadCalendarEvents`.
 */
export function getDayIndicator(eventsForDate: CalendarEvent[], maxDots: number = MAX_DAY_INDICATOR_DOTS): DayIndicator {
  const distinctColors: string[] = [];
  for (const event of eventsForDate) {
    if (!distinctColors.includes(event.color)) {
      distinctColors.push(event.color);
    }
  }
  return {
    colors: distinctColors.slice(0, maxDots),
    overflowCount: Math.max(0, distinctColors.length - maxDots),
  };
}
