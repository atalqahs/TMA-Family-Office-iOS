import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { CATEGORIES } from '../features/categories/categories';
import { NotificationCard } from '../features/notifications/components/NotificationCard';
import { useNotifications } from '../features/notifications/hooks/useNotifications';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './NotificationsPage.css';

const NOTIFICATIONS_CATEGORY = CATEGORIES.find((category) => category.id === 'notifications')!;

/**
 * A plain attention list -- never a complex inbox: no read/unread,
 * dismiss, snooze, or history (Phase 9B is derived-only, see
 * notificationService.ts). Every row is recomputed from current source
 * state on each load, so a resolved condition simply stops appearing.
 */
export function NotificationsPage() {
  const { t } = useLanguage();
  const { items, loading, error } = useNotifications();

  const title = useLocalizedText(NOTIFICATIONS_CATEGORY.title);
  const subtitle = useLocalizedText(NOTIFICATIONS_CATEGORY.subtitle);
  const Icon = NOTIFICATIONS_CATEGORY.icon;

  return (
    <div className="notifications-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />

      {loading && <p className="notifications-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="notifications-page__status">{t('formSaveError')}</p>}

      {!loading && !error && items.length === 0 && <EmptyState title={t('notificationsEmptyStateTitle')} />}

      {!loading && !error && items.length > 0 && (
        <div className="notifications-page__list">
          {items.map((item) => (
            <NotificationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
