import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useLinkableEntities } from '../features/tasks/hooks/useLinkableEntities';
import { useTaskGroups } from '../features/tasks/hooks/useTaskGroups';
import { useTasks } from '../features/tasks/hooks/useTasks';
import { buildCalendarDayMap, getTasksForDate } from '../features/tasks/taskCalendar';
import { findLinkedEntity, getLinkedEntityLabel } from '../features/tasks/linkedEntity';
import { getTaskGroupDisplayName } from '../features/tasks/taskGroupDisplay';
import { buildMonthGrid, getMonthRange, shiftYearMonth } from '../features/tasks/monthGrid';
import { TASK_STATE_LABEL_KEY, TASK_STATE_VARIANT } from '../features/tasks/taskStatus';
import { useLanguage } from '../hooks/useLanguage';
import { getLocalToday, getLocalYearMonth, parseLocalDate } from '../utils/localDate';
import './TaskCalendarPage.css';

/** A fixed reference week (Jan 1 2023 was a Sunday) purely to derive locale-correct short weekday names in Sunday-first order, matching buildMonthGrid's own week layout. */
const WEEKDAY_REFERENCE = new Date(2023, 0, 1);

export function TaskCalendarPage() {
  const { t, locale, dir } = useLanguage();
  const navigate = useNavigate();
  const { tasks, completions, loading } = useTasks();
  const { entities: linkableEntities } = useLinkableEntities();
  const { groups } = useTaskGroups();
  const today = getLocalToday();
  const [yearMonth, setYearMonth] = useState(() => getLocalYearMonth());
  const [selectedDate, setSelectedDate] = useState(today);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const grid = useMemo(() => buildMonthGrid(yearMonth), [yearMonth]);
  const dayMap = useMemo(() => {
    const { start, end } = getMonthRange(yearMonth);
    return buildCalendarDayMap(tasks, completions, start, end, today);
  }, [tasks, completions, yearMonth, today]);
  const selectedDateEntries = useMemo(
    () => getTasksForDate(tasks, completions, selectedDate, today),
    [tasks, completions, selectedDate, today],
  );

  const monthLabel = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    parseLocalDate(`${yearMonth}-01`),
  );
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(WEEKDAY_REFERENCE);
    d.setDate(d.getDate() + i);
    return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d);
  });

  return (
    <div className="task-calendar-page">
      <div className="task-calendar-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToTasksLabel')}
          onClick={() => navigate('/tasks')}
        />
      </div>

      <PageHeader title={t('calendarViewAction')} />

      <div className="task-calendar-page__nav">
        <IconButton
          icon={<PrevIcon size={20} strokeWidth={1.75} />}
          label={t('calendarPrevMonthLabel')}
          onClick={() => setYearMonth((value) => shiftYearMonth(value, -1))}
        />
        <span className="task-calendar-page__month-label">{monthLabel}</span>
        <IconButton
          icon={<NextIcon size={20} strokeWidth={1.75} />}
          label={t('calendarNextMonthLabel')}
          onClick={() => setYearMonth((value) => shiftYearMonth(value, 1))}
        />
      </div>

      {loading ? (
        <p className="task-calendar-page__status">{t('loadingLabel')}</p>
      ) : (
        <>
          <div className="task-calendar-page__weekdays">
            {weekdayLabels.map((label, i) => (
              <span key={i} className="task-calendar-page__weekday">
                {label}
              </span>
            ))}
          </div>

          <div className="task-calendar-page__grid">
            {grid.map((cell) => {
              const dayInfo = dayMap.get(cell.date);
              const isSelected = cell.date === selectedDate;
              const isToday = cell.date === today;
              return (
                <button
                  key={cell.date}
                  type="button"
                  className={[
                    'task-calendar-page__day',
                    !cell.inCurrentMonth && 'task-calendar-page__day--outside',
                    isSelected && 'task-calendar-page__day--selected',
                    isToday && 'task-calendar-page__day--today',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedDate(cell.date)}
                >
                  <span className="task-calendar-page__day-number">{Number(cell.date.slice(8, 10))}</span>
                  {dayInfo && (
                    <span
                      className={`task-calendar-page__day-dot task-calendar-page__day-dot--${dayInfo.worstState}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <section className="task-calendar-page__selected">
            <h2 className="task-calendar-page__selected-title">
              {new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(
                parseLocalDate(selectedDate),
              )}
            </h2>
            {selectedDateEntries.length === 0 ? (
              <EmptyState title={t('calendarNoTasksForDate')} />
            ) : (
              <ul className="task-calendar-page__list">
                {selectedDateEntries.map(({ task, state }) => {
                  const linkedEntity =
                    task.linkedEntityType && task.linkedEntityId
                      ? findLinkedEntity(linkableEntities, task.linkedEntityType, task.linkedEntityId)
                      : undefined;
                  const group = groups.find((g) => g.id === task.groupId);
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        className="task-calendar-page__list-row"
                        onClick={() => navigate(`/tasks/task/${task.id}`)}
                      >
                        <span className="task-calendar-page__list-title">{task.title}</span>
                        {group && <span className="task-calendar-page__list-meta">{getTaskGroupDisplayName(group, t)}</span>}
                        {task.linkedEntityType && (
                          <span className="task-calendar-page__list-meta">
                            {linkedEntity ? getLinkedEntityLabel(task.linkedEntityType, linkedEntity) : t('linkedEntityUnavailableLabel')}
                          </span>
                        )}
                        <StatusBadge variant={TASK_STATE_VARIANT[state]}>{t(TASK_STATE_LABEL_KEY[state])}</StatusBadge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
