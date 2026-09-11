import { useState } from 'react';
import { ListChecks, Pencil } from 'lucide-react';
import { DangerButton } from '../../../components/DangerButton';
import { IconButton } from '../../../components/IconButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import { parseLocalDate } from '../../../utils/localDate';
import { formatLocalTime } from '../../../utils/time';
import { computeTaskOccurrenceStatus, TASK_STATE_LABEL_KEY, TASK_STATE_VARIANT } from '../taskStatus';
import { TASK_PRIORITIES, TASK_RECURRENCE_UNITS } from '../types';
import type { Task, TaskCompletion } from '../types';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  completions: TaskCompletion[];
  onOpen: () => void;
  onEdit: () => void;
  onComplete: (occurrenceKey: string) => Promise<void>;
}

export function TaskCard({ task, completions, onOpen, onEdit, onComplete }: TaskCardProps) {
  const { t, locale } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { occurrenceKey, occurrenceDate, state } = computeTaskOccurrenceStatus(task, completions);
  const priorityLabel = TASK_PRIORITIES.find((option) => option.id === task.priority)?.title[locale];
  const recurrenceLabel =
    task.recurrenceUnit !== 'none'
      ? `${t('frequencyEveryLabel')} ${task.recurrenceInterval ?? 1} ${
          TASK_RECURRENCE_UNITS.find((option) => option.id === task.recurrenceUnit)?.title[locale]
        }`
      : undefined;

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);
    try {
      await onComplete(occurrenceKey);
      setConfirming(false);
    } catch (err) {
      console.error('Failed to complete task occurrence', err);
      setError(t('duplicateTaskCompletionError'));
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="task-card">
      <button type="button" className="task-card__main" onClick={onOpen}>
        <span className="task-card__icon" aria-hidden="true">
          <ListChecks size={20} strokeWidth={1.75} />
        </span>
        <div className="task-card__body">
          <span className="task-card__title">{task.title}</span>
          <span className="task-card__meta">
            {occurrenceDate
              ? new Intl.DateTimeFormat(locale).format(parseLocalDate(occurrenceDate))
              : t('taskStateNoDueDate')}
            {task.dueTime && ` · ${formatLocalTime(task.dueTime, locale)}`}
            {priorityLabel && ` · ${priorityLabel}`}
          </span>
          {recurrenceLabel && <span className="task-card__meta">{recurrenceLabel}</span>}
          {task.assignedToName && <span className="task-card__meta">{task.assignedToName}</span>}
          <StatusBadge variant={TASK_STATE_VARIANT[state]}>{t(TASK_STATE_LABEL_KEY[state])}</StatusBadge>
        </div>
      </button>
      <div className="task-card__actions">
        {error && <span className="task-card__error">{error}</span>}
        <IconButton icon={<Pencil size={18} strokeWidth={1.75} />} label={t('profileEditAction')} onClick={onEdit} />
        {state !== 'completed' &&
          (confirming ? (
            <SecondaryButton type="button" onClick={handleComplete} disabled={completing}>
              {completing ? t('formSaving') : t('actionConfirm')}
            </SecondaryButton>
          ) : (
            <SecondaryButton type="button" onClick={() => setConfirming(true)}>
              {t('taskCompleteAction')}
            </SecondaryButton>
          ))}
        {confirming && (
          <DangerButton type="button" onClick={() => setConfirming(false)} disabled={completing}>
            {t('actionCancel')}
          </DangerButton>
        )}
      </div>
    </div>
  );
}
