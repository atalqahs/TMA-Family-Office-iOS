import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { TaskCard } from '../features/tasks/components/TaskCard';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { useLinkableEntities } from '../features/tasks/hooks/useLinkableEntities';
import { useTasks } from '../features/tasks/hooks/useTasks';
import * as taskService from '../features/tasks/taskService';
import {
  buildTaskListEntries,
  filterTaskListEntries,
  sortTaskListEntries,
  type TaskListFilter,
} from '../features/tasks/taskListOrdering';
import type { Task } from '../features/tasks/types';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import type { TranslationKey } from '../localization/translations';
import './TasksPage.css';

const TASKS_CATEGORY = CATEGORIES.find((category) => category.id === 'tasks')!;

const FILTERS: TaskListFilter[] = ['all', 'overdue', 'dueToday', 'upcoming', 'completed'];
const FILTER_LABEL_KEY: Record<TaskListFilter, TranslationKey> = {
  all: 'taskFilterAll',
  overdue: 'taskFilterOverdue',
  dueToday: 'taskFilterToday',
  upcoming: 'taskFilterUpcoming',
  completed: 'taskFilterCompleted',
};
const GROUP_ORDER: Exclude<TaskListFilter, 'all'>[] = ['overdue', 'dueToday', 'upcoming', 'completed'];
const GROUP_LABEL_KEY: Record<Exclude<TaskListFilter, 'all'>, TranslationKey> = {
  overdue: 'taskStateOverdue',
  dueToday: 'taskStateDueToday',
  upcoming: 'taskStateUpcoming',
  completed: 'taskStateCompleted',
};

export function TasksPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { tasks, completions, loading, error, refresh } = useTasks();
  const { entities: linkableEntities } = useLinkableEntities();
  const addSheet = useDisclosure();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskListFilter>('all');

  const title = useLocalizedText(TASKS_CATEGORY.title);
  const subtitle = useLocalizedText(TASKS_CATEGORY.subtitle);
  const emptyMessage = useLocalizedText(TASKS_CATEGORY.emptyMessage);
  const addLabel = useLocalizedText(TASKS_CATEGORY.addLabel);
  const Icon = TASKS_CATEGORY.icon;

  const sortedEntries = useMemo(
    () => sortTaskListEntries(buildTaskListEntries(tasks, completions)),
    [tasks, completions],
  );
  const visibleEntries = useMemo(() => filterTaskListEntries(sortedEntries, filter), [sortedEntries, filter]);

  const handleComplete = async (taskId: string, occurrenceDate: string) => {
    await taskService.completeTaskOccurrence(taskId, occurrenceDate);
    await refresh();
  };

  return (
    <div className="tasks-page">
      <div className="tasks-page__header-row">
        <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />
        <IconButton
          icon={<Calendar size={20} strokeWidth={1.75} />}
          label={t('calendarViewAction')}
          onClick={() => navigate('/tasks/calendar')}
        />
      </div>

      {loading && <p className="tasks-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="tasks-page__status">{t('formSaveError')}</p>}

      {!loading && !error && tasks.length === 0 && (
        <EmptyState title={emptyMessage} action={<PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>} />
      )}

      {!loading && !error && tasks.length > 0 && (
        <>
          <div className="tasks-page__filters">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                className={`tasks-page__filter${filter === option ? ' tasks-page__filter--active' : ''}`}
                onClick={() => setFilter(option)}
              >
                {t(FILTER_LABEL_KEY[option])}
              </button>
            ))}
          </div>

          {visibleEntries.length === 0 ? (
            <EmptyState title={t('taskFilterEmptyMessage')} />
          ) : filter === 'all' ? (
            <div className="tasks-page__groups">
              {GROUP_ORDER.map((state) => {
                const groupEntries = visibleEntries.filter((entry) => entry.state === state);
                if (groupEntries.length === 0) return null;
                return (
                  <section key={state} className="tasks-page__group">
                    <h2 className="tasks-page__group-title">{t(GROUP_LABEL_KEY[state])}</h2>
                    <div className="tasks-page__grid">
                      {groupEntries.map((entry) => (
                        <TaskCard
                          key={entry.task.id}
                          task={entry.task}
                          completions={completions.filter((c) => c.taskId === entry.task.id)}
                          linkableEntities={linkableEntities}
                          onOpen={() => navigate(`/tasks/${entry.task.id}`)}
                          onEdit={() => setEditingTask(entry.task)}
                          onComplete={(occurrenceDate) => handleComplete(entry.task.id, occurrenceDate)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="tasks-page__grid">
              {visibleEntries.map((entry) => (
                <TaskCard
                  key={entry.task.id}
                  task={entry.task}
                  completions={completions.filter((c) => c.taskId === entry.task.id)}
                  linkableEntities={linkableEntities}
                  onOpen={() => navigate(`/tasks/${entry.task.id}`)}
                  onEdit={() => setEditingTask(entry.task)}
                  onComplete={(occurrenceDate) => handleComplete(entry.task.id, occurrenceDate)}
                />
              ))}
            </div>
          )}

          <div className="tasks-page__add-action">
            <PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>
          </div>
        </>
      )}

      <Sheet open={addSheet.isOpen} onClose={addSheet.close} title={t('taskFormAddTitle')} closeLabel={t('menuCloseLabel')}>
        <TaskForm
          onCancel={addSheet.close}
          onSubmit={async (values) => {
            await taskService.createTask(values);
            await refresh();
            addSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        title={t('taskFormEditTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        {editingTask && (
          <TaskForm
            initialValue={editingTask}
            onCancel={() => setEditingTask(null)}
            onSubmit={async (values) => {
              await taskService.updateTask(editingTask.id, values);
              await refresh();
              setEditingTask(null);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}
