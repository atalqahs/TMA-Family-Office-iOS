import { useEffect, useState } from 'react';
import { CategoryCard } from '../components/CategoryCard';
import { PageHeader } from '../components/PageHeader';
import { CATEGORIES, type CategoryDefinition } from '../features/categories/categories';
import { getOverdueTaskCount } from '../features/tasks/taskService';
import { useCategoryCount } from '../hooks/useCategoryCount';
import { useLanguage } from '../hooks/useLanguage';
import './DashboardPage.css';

/**
 * A small, additive "needs attention" indicator for the Tasks category
 * card only -- appended to its existing count text rather than any new
 * visual element on CategoryCard itself, so the shared Dashboard grid
 * stays exactly as it was for every other category (per Phase 8 scope:
 * no Dashboard redesign).
 */
function useOverdueTaskCount(categoryId: string): number {
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    if (categoryId !== 'tasks') return;
    let cancelled = false;
    getOverdueTaskCount()
      .then((value) => {
        if (!cancelled) setOverdueCount(value);
      })
      .catch((error) => {
        console.error('Failed to load overdue task count', error);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return overdueCount;
}

function DashboardCategoryCard({ category }: { category: CategoryDefinition }) {
  const { t, locale } = useLanguage();
  const count = useCategoryCount(category.id);
  const overdueCount = useOverdueTaskCount(category.id);

  const meta =
    category.id === 'tasks' && overdueCount > 0
      ? `${count} ${category.countUnit[locale]} · ${overdueCount} ${t('taskFilterOverdue')}`
      : `${count} ${category.countUnit[locale]}`;

  return <CategoryCard variant="grid" path={category.path} icon={category.icon} title={category.title[locale]} meta={meta} />;
}

export function DashboardPage() {
  const { t } = useLanguage();

  return (
    <div className="dashboard-page">
      <PageHeader title={t('dashboardTitle')} subtitle={t('dashboardSubtitle')} />
      <div className="dashboard-page__grid">
        {CATEGORIES.map((category) => (
          <DashboardCategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
