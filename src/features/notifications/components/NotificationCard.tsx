import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import { CATEGORIES } from '../../categories/categories';
import { getNotificationSeverityLabel, getNotificationSourceLabel, renderNotificationMessage, renderNotificationTitle } from '../notificationText';
import type { NotificationItem, NotificationSeverity, NotificationSourceType } from '../types';
import './NotificationCard.css';

const SOURCE_CATEGORY_ID: Record<NotificationSourceType, string> = {
  vehicle: 'vehicles',
  contract: 'contracts',
  staff: 'staff',
  task: 'tasks',
};

const SEVERITY_VARIANT: Record<NotificationSeverity, 'danger' | 'warning' | 'neutral'> = {
  critical: 'danger',
  warning: 'warning',
  info: 'neutral',
};

interface NotificationCardProps {
  item: NotificationItem;
}

/**
 * A single attention row -- source icon, title, short explanation
 * (already carries the relevant date/mileage context, see
 * notificationText.ts), and a severity badge that is always a real text
 * label (never color alone, per Phase 9B spec Section P). Tapping
 * navigates straight to the true source page; Notifications never
 * duplicates that page's own detail UI.
 */
export function NotificationCard({ item }: NotificationCardProps) {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const category = CATEGORIES.find((entry) => entry.id === SOURCE_CATEGORY_ID[item.sourceType]);
  const Icon = category?.icon;

  return (
    <button type="button" className="notification-card" onClick={() => navigate(item.route)}>
      {Icon && (
        <span className="notification-card__icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.75} />
        </span>
      )}
      <div className="notification-card__body">
        <span className="notification-card__source">{getNotificationSourceLabel(item.sourceType, t)}</span>
        <span className="notification-card__title">{renderNotificationTitle(item, t, locale)}</span>
        <span className="notification-card__message">{renderNotificationMessage(item, t, locale)}</span>
      </div>
      <StatusBadge variant={SEVERITY_VARIANT[item.severity]}>{getNotificationSeverityLabel(item.severity, t)}</StatusBadge>
    </button>
  );
}
