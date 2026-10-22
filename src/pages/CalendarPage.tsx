import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../components/IconButton';
import { PageHeader } from '../components/PageHeader';
import { CalendarEventList } from '../features/calendar/components/CalendarEventList';
import { CalendarMonthGrid } from '../features/calendar/components/CalendarMonthGrid';
import { getDayIndicator, groupCalendarEventsByDate } from '../features/calendar/calendarGrouping';
import { useCalendarEvents } from '../features/calendar/hooks/useCalendarEvents';
import { useLanguage } from '../hooks/useLanguage';
import { getLocalToday, getLocalYearMonth, parseLocalDate } from '../utils/localDate';
import { shiftYearMonth } from '../utils/monthGrid';
import './CalendarPage.css';

/**
 * The expanded, full-page General Calendar -- month/year navigation plus
 * tap-any-date-to-see-events-below, sharing its data loading
 * (`useCalendarEvents`) and rendering components (`CalendarMonthGrid`,
 * `CalendarEventList`) with the Dashboard's `CompactCalendar` widget, so
 * the two surfaces can never show different events for the same day.
 */
export function CalendarPage() {
  const { t, locale, dir } = useLanguage();
  const navigate = useNavigate();
  const today = getLocalToday();
  const [yearMonth, setYearMonth] = useState(() => getLocalYearMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const { events, loading } = useCalendarEvents(yearMonth);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const eventsByDate = useMemo(() => groupCalendarEventsByDate(events), [events]);
  const dayIndicators = useMemo(() => {
    const indicators = new Map<string, ReturnType<typeof getDayIndicator>>();
    for (const [date, dateEvents] of eventsByDate) {
      indicators.set(date, getDayIndicator(dateEvents));
    }
    return indicators;
  }, [eventsByDate]);
  const selectedDateEvents = eventsByDate.get(selectedDate) ?? [];

  const monthLabel = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    parseLocalDate(`${yearMonth}-01`),
  );

  return (
    <div className="calendar-page">
      <div className="calendar-page__topbar">
        <IconButton icon={<BackIcon size={22} strokeWidth={1.75} />} label={t('backToDashboardLabel')} onClick={() => navigate('/')} />
      </div>

      <PageHeader title={t('generalCalendarTitle')} subtitle={t('generalCalendarSubtitle')} />

      <div className="calendar-page__nav">
        <IconButton
          icon={<PrevIcon size={20} strokeWidth={1.75} />}
          label={t('calendarPrevMonthLabel')}
          onClick={() => setYearMonth((value) => shiftYearMonth(value, -1))}
        />
        <span className="calendar-page__month-label">{monthLabel}</span>
        <IconButton
          icon={<NextIcon size={20} strokeWidth={1.75} />}
          label={t('calendarNextMonthLabel')}
          onClick={() => setYearMonth((value) => shiftYearMonth(value, 1))}
        />
      </div>

      {loading ? (
        <p className="calendar-page__status">{t('loadingLabel')}</p>
      ) : (
        <>
          <div className="calendar-page__grid-wrap">
            <CalendarMonthGrid
              yearMonth={yearMonth}
              today={today}
              selectedDate={selectedDate}
              dayIndicators={dayIndicators}
              onSelectDate={setSelectedDate}
              locale={locale}
            />
          </div>

          <section className="calendar-page__selected">
            <h2 className="calendar-page__selected-title">
              {new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(
                parseLocalDate(selectedDate),
              )}
            </h2>
            <CalendarEventList
              events={selectedDateEvents}
              onSelectEvent={(event) => navigate(event.route)}
              emptyMessage={t('generalCalendarNoEventsForDate')}
            />
          </section>
        </>
      )}
    </div>
  );
}
