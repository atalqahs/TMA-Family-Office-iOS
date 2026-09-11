import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import { DangerButton } from '../components/DangerButton';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { Sheet } from '../components/Sheet';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { useTask } from '../features/tasks/hooks/useTask';
import { useTaskGroups } from '../features/tasks/hooks/useTaskGroups';
import * as taskService from '../features/tasks/taskService';
import { getTaskGroupDisplayName } from '../features/tasks/taskGroupDisplay';
import { computeTaskOccurrenceStatus, TASK_STATE_LABEL_KEY, TASK_STATE_VARIANT } from '../features/tasks/taskStatus';
import { UNSCHEDULED_OCCURRENCE_KEY, TASK_PRIORITIES, TASK_RECURRENCE_UNITS } from '../features/tasks/types';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { parseLocalDate } from '../utils/localDate';
import { formatLocalTime } from '../utils/time';
import './TaskProfilePage.css';

const RECENT_COMPLETIONS_LIMIT = 10;

export function TaskProfilePage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t, locale, dir } = useLanguage();
  const { task, completions, loading, refresh } = useTask(taskId);
  const { groups } = useTaskGroups();
  const editSheet = useDisclosure();
  const deleteSheet = useDisclosure();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  if (loading) {
    return <p className="task-profile-page__status">{t('loadingLabel')}</p>;
  }

  if (!task) {
    return (
      <div className="task-profile-page">
        <EmptyState
          title={t('taskNotFoundTitle')}
          action={<PrimaryButton onClick={() => navigate('/tasks')}>{t('backToTasksLabel')}</PrimaryButton>}
        />
      </div>
    );
  }

  const { occurrenceKey, occurrenceDate, state } = computeTaskOccurrenceStatus(task, completions);
  const group = groups.find((g) => g.id === task.groupId);
  const groupBackPath = `/tasks/group/${task.groupId}`;
  const priorityLabel = TASK_PRIORITIES.find((option) => option.id === task.priority)?.title[locale];
  const recurrenceLabel =
    task.recurrenceUnit === 'none'
      ? t('recurrenceNoneLabel')
      : `${t('frequencyEveryLabel')} ${task.recurrenceInterval ?? 1} ${
          TASK_RECURRENCE_UNITS.find((option) => option.id === task.recurrenceUnit)?.title[locale]
        }`;

  const taskInfoRows: Array<[string, string]> = (
    [
      [t('fieldTaskGroup'), group && getTaskGroupDisplayName(group, t)],
      [t('fieldDueDate'), occurrenceDate ? new Intl.DateTimeFormat(locale).format(parseLocalDate(occurrenceDate)) : t('taskStateNoDueDate')],
      [t('fieldDueTime'), task.dueTime ? formatLocalTime(task.dueTime, locale) : undefined],
      [t('fieldPriority'), priorityLabel],
      [t('fieldTaskRepeat'), recurrenceLabel],
      [t('fieldAssignedToName'), task.assignedToName],
    ] as Array<[string, string | undefined]>
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const recentCompletions = completions.slice(0, RECENT_COMPLETIONS_LIMIT);

  const handleComplete = async () => {
    setCompleting(true);
    setCompleteError(null);
    try {
      await taskService.completeTaskOccurrence(task.id, occurrenceKey);
      await refresh();
      setConfirmingComplete(false);
    } catch (err) {
      console.error('Failed to complete task occurrence', err);
      setCompleteError(t('duplicateTaskCompletionError'));
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await taskService.removeTask(task.id);
      navigate(groupBackPath);
    } catch (err) {
      console.error('Failed to delete task', err);
      setDeleteError(t('formSaveError'));
      setDeleting(false);
    }
  };

  return (
    <div className="task-profile-page">
      <div className="task-profile-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToTasksLabel')}
          onClick={() => navigate(groupBackPath)}
        />
      </div>

      <div className="task-profile-page__header">
        <span className="task-profile-page__icon" aria-hidden="true">
          <ListChecks size={28} strokeWidth={1.75} />
        </span>
        <h1 className="task-profile-page__title">{task.title}</h1>
        <StatusBadge variant={TASK_STATE_VARIANT[state]}>{t(TASK_STATE_LABEL_KEY[state])}</StatusBadge>
        <div className="task-profile-page__header-actions">
          {state !== 'completed' &&
            (confirmingComplete ? (
              <>
                <SecondaryButton onClick={() => setConfirmingComplete(false)} disabled={completing}>
                  {t('actionCancel')}
                </SecondaryButton>
                <PrimaryButton onClick={handleComplete} disabled={completing}>
                  {completing ? t('formSaving') : t('actionConfirm')}
                </PrimaryButton>
              </>
            ) : (
              <PrimaryButton onClick={() => setConfirmingComplete(true)}>
                {t('taskCompleteOccurrenceAction')}
              </PrimaryButton>
            ))}
          <SecondaryButton onClick={editSheet.open}>{t('profileEditAction')}</SecondaryButton>
        </div>
        {completeError && <p className="task-profile-page__complete-error">{completeError}</p>}
      </div>

      {task.description && (
        <section className="task-profile-page__section">
          <h2 className="task-profile-page__section-title">{t('fieldDescription')}</h2>
          <p className="task-profile-page__description">{task.description}</p>
        </section>
      )}

      {taskInfoRows.length > 0 && (
        <section className="task-profile-page__section">
          <h2 className="task-profile-page__section-title">{t('profileSectionTaskInfo')}</h2>
          <dl className="task-profile-page__info-list">
            {taskInfoRows.map(([label, value]) => (
              <div className="task-profile-page__info-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="task-profile-page__section">
        <h2 className="task-profile-page__section-title">{t('profileSectionCompletionHistory')}</h2>
        {recentCompletions.length === 0 ? (
          <p className="task-profile-page__completion-empty">{t('completionHistoryEmpty')}</p>
        ) : (
          <ul className="task-profile-page__completion-list">
            {recentCompletions.map((completion) => (
              <li key={completion.id} className="task-profile-page__completion-row">
                <span className="task-profile-page__completion-date">
                  {completion.occurrenceKey === UNSCHEDULED_OCCURRENCE_KEY
                    ? t('taskStateNoDueDate')
                    : new Intl.DateTimeFormat(locale).format(parseLocalDate(completion.occurrenceKey))}
                </span>
                <span className="task-profile-page__completion-meta">
                  {t('taskCompletedOnLabel')} {new Intl.DateTimeFormat(locale).format(new Date(completion.completedAt))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="task-profile-page__section">
        <h2 className="task-profile-page__section-title">{t('profileSectionNotes')}</h2>
        <p className="task-profile-page__notes">{task.notes || t('profileNotesEmpty')}</p>
      </section>

      <div className="task-profile-page__danger-zone">
        <DangerButton onClick={deleteSheet.open}>{t('taskDeleteAction')}</DangerButton>
      </div>

      <Sheet open={editSheet.isOpen} onClose={editSheet.close} title={t('taskFormEditTitle')} closeLabel={t('menuCloseLabel')}>
        <TaskForm
          initialValue={task}
          onCancel={editSheet.close}
          onSubmit={async (values) => {
            await taskService.updateTask(task.id, values);
            await refresh();
            editSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={deleteSheet.isOpen}
        onClose={deleteSheet.close}
        title={t('taskDeleteConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="task-profile-page__delete-body">{t('taskDeleteConfirmBody')}</p>
        {deleteError && <p className="task-profile-page__delete-error">{deleteError}</p>}
        <div className="task-profile-page__delete-actions">
          <SecondaryButton onClick={deleteSheet.close} disabled={deleting}>
            {t('actionCancel')}
          </SecondaryButton>
          <DangerButton onClick={handleDelete} disabled={deleting}>
            {deleting ? t('formSaving') : t('taskDeleteConfirmAction')}
          </DangerButton>
        </div>
      </Sheet>
    </div>
  );
}
