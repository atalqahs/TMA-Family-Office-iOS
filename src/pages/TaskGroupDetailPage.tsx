import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DangerButton } from '../components/DangerButton';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { TaskCard } from '../features/tasks/components/TaskCard';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { TaskGroupForm } from '../features/tasks/components/TaskGroupForm';
import { useTaskGroups } from '../features/tasks/hooks/useTaskGroups';
import { useTasks } from '../features/tasks/hooks/useTasks';
import * as taskService from '../features/tasks/taskService';
import { getTaskGroupDisplayName } from '../features/tasks/taskGroupDisplay';
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
import './TaskGroupDetailPage.css';

const TASKS_CATEGORY = CATEGORIES.find((category) => category.id === 'tasks')!;

const FILTERS: TaskListFilter[] = ['all', 'overdue', 'dueToday', 'upcoming', 'noDueDate', 'completed'];
const FILTER_LABEL_KEY: Record<TaskListFilter, TranslationKey> = {
  all: 'taskFilterAll',
  overdue: 'taskFilterOverdue',
  dueToday: 'taskFilterToday',
  upcoming: 'taskFilterUpcoming',
  noDueDate: 'taskFilterNoDueDate',
  completed: 'taskFilterCompleted',
};
const GROUP_ORDER: Exclude<TaskListFilter, 'all'>[] = ['overdue', 'dueToday', 'upcoming', 'noDueDate', 'completed'];
const GROUP_LABEL_KEY: Record<Exclude<TaskListFilter, 'all'>, TranslationKey> = {
  overdue: 'taskStateOverdue',
  dueToday: 'taskStateDueToday',
  upcoming: 'taskStateUpcoming',
  noDueDate: 'taskStateNoDueDate',
  completed: 'taskStateCompleted',
};

/**
 * The Overdue/Today/Upcoming/Completed task-state organization from the
 * original Phase 8 Tasks page -- unchanged in behavior, just scoped to a
 * single TaskGroup now that the top-level Tasks page shows groups instead
 * of one global mixed list (see TasksPage.tsx / TaskGroupCard).
 */
export function TaskGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const { tasks, completions, loading, error, refresh } = useTasks();
  const { groups, loading: groupsLoading, refresh: refreshGroups } = useTaskGroups();
  const addSheet = useDisclosure();
  const editGroupSheet = useDisclosure();
  const deleteGroupSheet = useDisclosure();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskListFilter>('all');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const addLabel = useLocalizedText(TASKS_CATEGORY.addLabel);
  const emptyMessage = useLocalizedText(TASKS_CATEGORY.emptyMessage);

  const group = groups.find((g) => g.id === groupId);
  const groupTasks = useMemo(() => tasks.filter((task) => task.groupId === groupId), [tasks, groupId]);
  const groupTaskIds = useMemo(() => new Set(groupTasks.map((task) => task.id)), [groupTasks]);
  const groupCompletions = useMemo(
    () => completions.filter((completion) => groupTaskIds.has(completion.taskId)),
    [completions, groupTaskIds],
  );

  const sortedEntries = useMemo(
    () => sortTaskListEntries(buildTaskListEntries(groupTasks, groupCompletions)),
    [groupTasks, groupCompletions],
  );
  const visibleEntries = useMemo(() => filterTaskListEntries(sortedEntries, filter), [sortedEntries, filter]);

  const handleComplete = async (taskId: string, occurrenceKey: string) => {
    await taskService.completeTaskOccurrence(taskId, occurrenceKey);
    await refresh();
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await taskService.removeTaskGroup(groupId);
      navigate('/tasks');
    } catch (err) {
      if (err instanceof taskService.GroupNotEmptyError) {
        setDeleteError(t('taskGroupNotEmptyError'));
      } else {
        console.error('Failed to delete task group', err);
        setDeleteError(t('formSaveError'));
      }
      setDeleting(false);
    }
  };

  if (loading || groupsLoading) {
    return <p className="task-group-detail-page__status">{t('loadingLabel')}</p>;
  }

  if (!group) {
    return (
      <div className="task-group-detail-page">
        <EmptyState
          title={t('taskGroupNotFoundTitle')}
          action={<PrimaryButton onClick={() => navigate('/tasks')}>{t('backToTasksLabel')}</PrimaryButton>}
        />
      </div>
    );
  }

  return (
    <div className="task-group-detail-page">
      <div className="task-group-detail-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToTasksLabel')}
          onClick={() => navigate('/tasks')}
        />
      </div>

      <div className="task-group-detail-page__header-row">
        <PageHeader title={getTaskGroupDisplayName(group, t)} />
        <div className="task-group-detail-page__header-actions">
          <SecondaryButton onClick={editGroupSheet.open}>{t('profileEditAction')}</SecondaryButton>
        </div>
      </div>

      {error && <p className="task-group-detail-page__status">{t('formSaveError')}</p>}

      {!error && groupTasks.length === 0 && (
        <EmptyState title={emptyMessage} action={<PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>} />
      )}

      {!error && groupTasks.length > 0 && (
        <>
          <div className="task-group-detail-page__filters">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                className={`task-group-detail-page__filter${filter === option ? ' task-group-detail-page__filter--active' : ''}`}
                onClick={() => setFilter(option)}
              >
                {t(FILTER_LABEL_KEY[option])}
              </button>
            ))}
          </div>

          {visibleEntries.length === 0 ? (
            <EmptyState title={t('taskFilterEmptyMessage')} />
          ) : filter === 'all' ? (
            <div className="task-group-detail-page__groups">
              {GROUP_ORDER.map((state) => {
                const stateEntries = visibleEntries.filter((entry) => entry.state === state);
                if (stateEntries.length === 0) return null;
                return (
                  <section key={state} className="task-group-detail-page__group">
                    <h2 className="task-group-detail-page__group-title">{t(GROUP_LABEL_KEY[state])}</h2>
                    <div className="task-group-detail-page__grid">
                      {stateEntries.map((entry) => (
                        <TaskCard
                          key={entry.task.id}
                          task={entry.task}
                          completions={completions.filter((c) => c.taskId === entry.task.id)}
                          onOpen={() => navigate(`/tasks/task/${entry.task.id}`)}
                          onEdit={() => setEditingTask(entry.task)}
                          onComplete={(occurrenceKey) => handleComplete(entry.task.id, occurrenceKey)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="task-group-detail-page__grid">
              {visibleEntries.map((entry) => (
                <TaskCard
                  key={entry.task.id}
                  task={entry.task}
                  completions={completions.filter((c) => c.taskId === entry.task.id)}
                  onOpen={() => navigate(`/tasks/task/${entry.task.id}`)}
                  onEdit={() => setEditingTask(entry.task)}
                  onComplete={(occurrenceKey) => handleComplete(entry.task.id, occurrenceKey)}
                />
              ))}
            </div>
          )}

          <div className="task-group-detail-page__add-action">
            <PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>
          </div>
        </>
      )}

      <div className="task-group-detail-page__danger-zone">
        <DangerButton onClick={deleteGroupSheet.open}>{t('taskGroupDeleteAction')}</DangerButton>
      </div>

      <Sheet open={addSheet.isOpen} onClose={addSheet.close} title={t('taskFormAddTitle')} closeLabel={t('menuCloseLabel')}>
        <TaskForm
          initialGroupId={groupId}
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

      <Sheet
        open={editGroupSheet.isOpen}
        onClose={editGroupSheet.close}
        title={t('taskGroupFormEditTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <TaskGroupForm
          initialValue={group}
          onCancel={editGroupSheet.close}
          onSubmit={async (values) => {
            await taskService.updateTaskGroup(group.id, values);
            await refreshGroups();
            editGroupSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={deleteGroupSheet.isOpen}
        onClose={deleteGroupSheet.close}
        title={t('taskGroupDeleteConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="task-group-detail-page__delete-body">{t('taskGroupDeleteConfirmBody')}</p>
        {deleteError && <p className="task-group-detail-page__delete-error">{deleteError}</p>}
        <div className="task-group-detail-page__delete-actions">
          <SecondaryButton onClick={deleteGroupSheet.close} disabled={deleting}>
            {t('actionCancel')}
          </SecondaryButton>
          <DangerButton onClick={handleDeleteGroup} disabled={deleting}>
            {deleting ? t('formSaving') : t('taskGroupDeleteConfirmAction')}
          </DangerButton>
        </div>
      </Sheet>
    </div>
  );
}
