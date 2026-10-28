import { buildMonthGrid } from '../../../utils/monthGrid';
import type { DayIndicator } from '../calendarGrouping';
import type { Locale } from '../../../localization/translations';
import './CalendarMonthGrid.css';

/** Jan 1 2023 was a Sunday -- a fixed reference week purely to derive locale-correct short weekday names in Sunday-first order, matching `buildMonthGrid`'s own week layout (same technique as TaskCalendarPage, duplicated rather than shared since it's a 4-line presentational detail, not a dependency worth coupling the two calendars over). */
const WEEKDAY_REFERENCE = new Date(2023, 0, 1);

interface CalendarMonthGridProps {
  yearMonth: string;
  today: string;
  selectedDate: string;
  dayIndicators: Map<string, DayIndicator>;
  onSelectDate: (date: string) => void;
  locale: Locale;
  /** Smaller cells/dots for the Dashboard widget -- same markup and data, just visually tighter so the widget stays non-overwhelming. */
  compact?: boolean;
}

export function CalendarMonthGrid({
  yearMonth,
  today,
  selectedDate,
  dayIndicators,
  onSelectDate,
  locale,
  compact = false,
}: CalendarMonthGridProps) {
  const grid = buildMonthGrid(yearMonth);
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(WEEKDAY_REFERENCE);
    d.setDate(d.getDate() + i);
    return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d);
  });

  return (
    <div className={['calendar-month-grid', compact && 'calendar-month-grid--compact'].filter(Boolean).join(' ')}>
      <div className="calendar-month-grid__weekdays">
        {weekdayLabels.map((label, i) => (
          <span key={i} className="calendar-month-grid__weekday">
            {label}
          </span>
        ))}
      </div>
      <div className="calendar-month-grid__days">
        {grid.map((cell) => {
          const indicator = dayIndicators.get(cell.date);
          const isSelected = cell.date === selectedDate;
          const isToday = cell.date === today;
          return (
            <button
              key={cell.date}
              type="button"
              className={[
                'calendar-month-grid__day',
                !cell.inCurrentMonth && 'calendar-month-grid__day--outside',
                isSelected && 'calendar-month-grid__day--selected',
                isToday && 'calendar-month-grid__day--today',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(cell.date)}
            >
              <span className="calendar-month-grid__day-number">{Number(cell.date.slice(8, 10))}</span>
              {indicator && indicator.colors.length > 0 && (
                <span className="calendar-month-grid__day-dots" aria-hidden="true">
                  {indicator.colors.map((color, i) => (
                    <span key={i} className="calendar-month-grid__day-dot" style={{ backgroundColor: color }} />
                  ))}
                  {indicator.overflowCount > 0 && (
                    <span className="calendar-month-grid__day-overflow">+{indicator.overflowCount}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
