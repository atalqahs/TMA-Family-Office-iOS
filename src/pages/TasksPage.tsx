import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { TaskGroupCard } from '../features/tasks/components/TaskGroupCard';
import { TaskGroupForm } from '../features/tasks/components/TaskGroupForm';
import { useTaskGroups } from '../features/tasks/hooks/useTaskGroups';
import { useTasks } from '../features/tasks/hooks/useTasks';
import * as taskService from '../features/tasks/taskService';
import { computeTaskGroupStats } from '../features/tasks/taskGroupStats';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './TasksPage.css';

const TASKS_CATEGORY = CATEGORIES.find((category) => category.id === 'tasks')!;

/**
 * Top-level Tasks page: shows the user's GROUPS (internal organizational
 * folders like "Vehicle Reminders" or "Home"), never a mixed list of every
 * task across all groups. Tapping a group opens TaskGroupDetailPage, which
 * retains the Overdue/Today/Upcoming/Completed organization scoped to
 * just that group.
 */
export function TasksPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { groups, loading, error, refresh } = useTaskGroups();
  const { tasks, completions } = useTasks();
  const addGroupSheet = useDisclosure();

  const title = useLocalizedText(TASKS_CATEGORY.title);
  const subtitle = useLocalizedText(TASKS_CATEGORY.subtitle);
  const Icon = TASKS_CATEGORY.icon;

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

      {!loading && !error && groups.length === 0 && (
        <EmptyState
          title={t('taskGroupsEmptyMessage')}
          action={<PrimaryButton onClick={addGroupSheet.open}>{t('addGroupAction')}</PrimaryButton>}
        />
      )}

      {!loading && !error && groups.length > 0 && (
        <>
          <div className="tasks-page__grid">
            {groups.map((group) => (
              <TaskGroupCard
                key={group.id}
                group={group}
                stats={computeTaskGroupStats(group.id, tasks, completions)}
                onClick={() => navigate(`/tasks/group/${group.id}`)}
              />
            ))}
          </div>
          <div className="tasks-page__add-action">
            <PrimaryButton onClick={addGroupSheet.open}>{t('addGroupAction')}</PrimaryButton>
          </div>
        </>
      )}

      <Sheet
        open={addGroupSheet.isOpen}
        onClose={addGroupSheet.close}
        title={t('taskGroupFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <TaskGroupForm
          onCancel={addGroupSheet.close}
          onSubmit={async (values) => {
            await taskService.createTaskGroup(values);
            await refresh();
            addGroupSheet.close();
          }}
        />
      </Sheet>
    </div>
  );
}
