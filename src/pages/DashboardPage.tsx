import { CategoryCard } from '../components/CategoryCard';
import { PageHeader } from '../components/PageHeader';
import { CATEGORIES, type CategoryDefinition } from '../features/categories/categories';
import { useCategoryCount } from '../hooks/useCategoryCount';
import { useLanguage } from '../hooks/useLanguage';
import './DashboardPage.css';

function DashboardCategoryCard({ category }: { category: CategoryDefinition }) {
  const { locale } = useLanguage();
  const count = useCategoryCount(category.id);

  return (
    <CategoryCard
      variant="grid"
      path={category.path}
      icon={category.icon}
      title={category.title[locale]}
      meta={`${count} ${category.countUnit[locale]}`}
    />
  );
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
