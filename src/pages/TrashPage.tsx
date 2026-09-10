import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { useLanguage } from '../hooks/useLanguage';
import './TrashPage.css';

export function TrashPage() {
  const { t } = useLanguage();

  return (
    <div className="trash-page">
      <PageHeader title={t('trashTitle')} />
      <EmptyState title={t('trashEmptyMessage')} />
    </div>
  );
}
