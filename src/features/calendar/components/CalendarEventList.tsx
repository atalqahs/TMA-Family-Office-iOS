import { EmptyState } from '../../../components/EmptyState';
import { CATEGORIES } from '../../categories/categories';
import { useLanguage } from '../../../hooks/useLanguage';
import { renderCalendarEventTitle } from '../calendarText';
import type { CalendarEvent } from '../types';
import './CalendarEventList.css';

interface CalendarEventListProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  emptyMessage: string;
}

/**
 * The event list for one already-selected date -- shared verbatim between
 * the compact Dashboard widget (today's events) and the expanded
 * CalendarPage (the tapped date's events), so the two surfaces can never
 * drift in how a day's events are rendered. Each row shows the event's
 * own color dot, its title (`renderCalendarEventTitle` resolves either a
 * translated template or raw free-text), and its originating category
 * label (looked up directly from `CATEGORIES`, the same single source of
 * truth the Dashboard grid itself uses) -- tapping a row navigates to
 * `event.route`, the real source record, never a duplicate detail view.
 */
export function CalendarEventList({ events, onSelectEvent, emptyMessage }: CalendarEventListProps) {
  const { t, locale } = useLanguage();

  if (events.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <ul className="calendar-event-list">
      {events.map((event) => {
        const category = CATEGORIES.find((c) => c.id === event.category);
        return (
          <li key={event.id}>
            <button type="button" className="calendar-event-list__row" onClick={() => onSelectEvent(event)}>
              <span className="calendar-event-list__dot" style={{ backgroundColor: event.color }} aria-hidden="true" />
              <span className="calendar-event-list__title">{renderCalendarEventTitle(event, t, locale)}</span>
              {category && <span className="calendar-event-list__category">{category.title[locale]}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
