import { FolderKanban } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { parseLocalDate } from '../../../utils/localDate';
import { getTaskGroupDisplayName } from '../taskGroupDisplay';
import type { TaskGroupStats } from '../taskGroupStats';
import type { TaskGroup } from '../types';
import './TaskGroupCard.css';

interface TaskGroupCardProps {
  group: TaskGroup;
  stats: TaskGroupStats;
  onClick: () => void;
}

export function TaskGroupCard({ group, stats, onClick }: TaskGroupCardProps) {
  const { t, locale } = useLanguage();

  const metaParts = [`${stats.totalCount} ${t('taskGroupTaskCountUnit')}`];
  if (stats.overdueCount > 0) {
    metaParts.push(`${stats.overdueCount} ${t('taskFilterOverdue')}`);
  }
  if (stats.nearestUpcomingDate) {
    metaParts.push(`${t('taskGroupNextLabel')}: ${new Intl.DateTimeFormat(locale).format(parseLocalDate(stats.nearestUpcomingDate))}`);
  }

  return (
    <button type="button" className="task-group-card" onClick={onClick}>
      <span className="task-group-card__icon" aria-hidden="true">
        <FolderKanban size={20} strokeWidth={1.75} />
      </span>
      <div className="task-group-card__body">
        <span className="task-group-card__title">{getTaskGroupDisplayName(group, t)}</span>
        <span className="task-group-card__meta">{metaParts.join(' · ')}</span>
      </div>
    </button>
  );
}
