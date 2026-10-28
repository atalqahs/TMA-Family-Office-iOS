import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../../../components/IconButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLocalToday, getLocalYearMonth, parseLocalDate } from '../../../utils/localDate';
import { shiftYearMonth } from '../../../utils/monthGrid';
import { groupCalendarEventsByDate, getDayIndicator } from '../calendarGrouping';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarEventList } from './CalendarEventList';
import './CompactCalendar.css';

/**
 * The Dashboard widget: browse months and select a date entirely in
 * place -- no navigation to the expanded `/calendar` page just to look at
 * a different day. Tapping an actual event still opens its own source
 * record (`onSelectEvent`), and the Tasks-only Calendar (`/tasks-calendar`)
 * is a separate page, untouched by this. Shares its event loading
 * (`useCalendarEvents`), grouping, and rendering components
 * (`CalendarMonthGrid`, `CalendarEventList`) with the expanded page, so
 * the two surfaces can never disagree about what a day contains.
 */
export function CompactCalendar() {
  const { t, locale, dir } = useLanguage();
  const navigate = useNavigate();
  const today = getLocalToday();
  const [yearMonth, setYearMonth] = useState(() => getLocalYearMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const { events, loading } = useCalendarEvents(yearMonth);

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

  // Changing months always leaves the old selected date behind (it's
  // never in the new month) -- land on today when browsing back to the
  // real current month, otherwise the 1st, the same "sensible default"
  // an Apple-style calendar lands on.
  const shiftMonth = (delta: number) => {
    const next = shiftYearMonth(yearMonth, delta);
    setYearMonth(next);
    setSelectedDate(next === getLocalYearMonth() ? today : `${next}-01`);
  };

  return (
    <section className="compact-calendar">
      <div className="compact-calendar__header">
        <h2 className="compact-calendar__title">{t('generalCalendarTitle')}</h2>
      </div>

      <div className="compact-calendar__nav">
        <IconButton
          icon={<PrevIcon size={18} strokeWidth={1.75} />}
          label={t('calendarPrevMonthLabel')}
          onClick={() => shiftMonth(-1)}
        />
        <span className="compact-calendar__month-label">{monthLabel}</span>
        <IconButton
          icon={<NextIcon size={18} strokeWidth={1.75} />}
          label={t('calendarNextMonthLabel')}
          onClick={() => shiftMonth(1)}
        />
      </div>

      {!loading && (
        <>
          <CalendarMonthGrid
            yearMonth={yearMonth}
            today={today}
            selectedDate={selectedDate}
            dayIndicators={dayIndicators}
            onSelectDate={setSelectedDate}
            locale={locale}
            compact
          />

          <div className="compact-calendar__today">
            <h3 className="compact-calendar__today-label">
              {new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(
                parseLocalDate(selectedDate),
              )}
            </h3>
            <CalendarEventList
              events={selectedDateEvents}
              onSelectEvent={(event) => navigate(event.route)}
              emptyMessage={t('generalCalendarNoEventsForDate')}
            />
          </div>
        </>
      )}
    </section>
  );
}
