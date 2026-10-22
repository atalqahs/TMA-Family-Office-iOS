import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLocalToday, getLocalYearMonth, parseLocalDate } from '../../../utils/localDate';
import { groupCalendarEventsByDate, getDayIndicator } from '../calendarGrouping';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarEventList } from './CalendarEventList';
import './CompactCalendar.css';

/**
 * The Dashboard widget: the current month's grid at a glance plus today's
 * events, kept visually compact (smaller cells/dots, no month navigation)
 * so it never overwhelms the Dashboard -- past/future browsing and
 * tap-any-date selection live on the expanded `/calendar` page instead,
 * which this widget links to via "View Full Calendar". Shares its event
 * loading (`useCalendarEvents`), grouping, and rendering components
 * (`CalendarMonthGrid`, `CalendarEventList`) with that expanded page, so
 * the two surfaces can never disagree about what a day contains.
 */
export function CompactCalendar() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const today = getLocalToday();
  const yearMonth = getLocalYearMonth();
  const { events, loading } = useCalendarEvents(yearMonth);

  const dayIndicators = useMemo(() => {
    const byDate = groupCalendarEventsByDate(events);
    const indicators = new Map<string, ReturnType<typeof getDayIndicator>>();
    for (const [date, dateEvents] of byDate) {
      indicators.set(date, getDayIndicator(dateEvents));
    }
    return indicators;
  }, [events]);

  const todaysEvents = useMemo(() => events.filter((event) => event.date === today), [events, today]);

  return (
    <section className="compact-calendar">
      <div className="compact-calendar__header">
        <h2 className="compact-calendar__title">{t('generalCalendarTitle')}</h2>
        <button type="button" className="compact-calendar__expand" onClick={() => navigate('/calendar')}>
          <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
          {t('generalCalendarExpandAction')}
        </button>
      </div>

      {!loading && (
        <>
          <CalendarMonthGrid
            yearMonth={yearMonth}
            today={today}
            selectedDate={today}
            dayIndicators={dayIndicators}
            onSelectDate={() => navigate('/calendar')}
            locale={locale}
            compact
          />

          <div className="compact-calendar__today">
            <h3 className="compact-calendar__today-label">
              {new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(
                parseLocalDate(today),
              )}
            </h3>
            <CalendarEventList
              events={todaysEvents}
              onSelectEvent={(event) => navigate(event.route)}
              emptyMessage={t('generalCalendarNoEventsForDate')}
            />
          </div>
        </>
      )}
    </section>
  );
}
