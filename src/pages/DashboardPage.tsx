import { EmptyState } from '../components/EmptyState';
import { useLanguage } from '../hooks/useLanguage';
import './DashboardPage.css';

export function DashboardPage() {
  const { t } = useLanguage();

  return (
    <main className="dashboard-page">
      <h1 className="dashboard-page__title">{t('dashboardTitle')}</h1>
      <EmptyState title={t('dashboardEmptyTitle')} hint={t('dashboardEmptyHint')} />
    </main>
  );
}
