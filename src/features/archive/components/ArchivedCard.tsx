import { useState } from 'react';
import { DangerButton } from '../../../components/DangerButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { CATEGORIES } from '../../categories/categories';
import { getTaskGroupDisplayName } from '../../tasks/taskGroupDisplay';
import { MIGRATION_GENERAL_GROUP_ID } from '../../tasks/types';
import type { ArchivedCardItem, ArchiveSourceType } from '../types';
import './ArchivedCard.css';

const SOURCE_CATEGORY_ID: Record<ArchiveSourceType, string> = {
  family: 'family',
  staff: 'staff',
  properties: 'properties',
  vehicles: 'vehicles',
  contracts: 'contracts',
  tasks: 'tasks',
};

interface ArchivedCardProps {
  item: ArchivedCardItem;
  onUnarchive: () => Promise<void>;
  onDeleteCard: () => Promise<void>;
}

/**
 * The Phase 10 hard rule (Section O): an archived card is NOT opened for
 * viewing/editing here -- tapping it does nothing. Only two actions exist:
 * Unarchive and Delete Card. Follows the same premium card visual
 * language as every other list card (icon/title/meta), just with these
 * two actions instead of a tap-to-open body.
 */
export function ArchivedCard({ item, onUnarchive, onDeleteCard }: ArchivedCardProps) {
  const { t, locale } = useLanguage();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const category = CATEGORIES.find((entry) => entry.id === SOURCE_CATEGORY_ID[item.sourceType]);
  const Icon = category?.icon;
  const title = item.sourceType === 'tasks' && item.id === MIGRATION_GENERAL_GROUP_ID ? getTaskGroupDisplayName({ id: item.id, name: item.title }, t) : item.title;
  // `archivedAt` is a full ISO instant (same convention as createdAt/updatedAt
  // elsewhere), so it's parsed directly -- never treated as a bare local
  // date string (which is the actual source of the UTC-shift bug this app
  // is careful about, see utils/localDate.ts's own doc comment).
  const archivedOnText = t('archivedOnLabel').replace(
    '{date}',
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(item.archivedAt)),
  );

  const handleUnarchive = async () => {
    setBusy(true);
    setError(false);
    try {
      await onUnarchive();
    } catch (err) {
      console.error('Failed to unarchive card', err);
      setError(true);
      setBusy(false);
    }
  };

  const handleDeleteCard = async () => {
    setBusy(true);
    setError(false);
    try {
      await onDeleteCard();
    } catch (err) {
      console.error('Failed to delete card', err);
      setError(true);
      setBusy(false);
    }
  };

  return (
    <div className="archived-card">
      {Icon && (
        <span className="archived-card__icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.75} />
        </span>
      )}
      <div className="archived-card__body">
        <span className="archived-card__title">{title}</span>
        <span className="archived-card__meta">{archivedOnText}</span>
        {confirmingDelete && <span className="archived-card__confirm-text">{t('deleteCardConfirmBody')}</span>}
        {error && <span className="archived-card__error">{t('formSaveError')}</span>}
      </div>
      <div className="archived-card__actions">
        {confirmingDelete ? (
          <>
            <SecondaryButton onClick={() => setConfirmingDelete(false)} disabled={busy}>
              {t('actionCancel')}
            </SecondaryButton>
            <DangerButton onClick={handleDeleteCard} disabled={busy}>
              {busy ? t('formSaving') : t('deleteCardAction')}
            </DangerButton>
          </>
        ) : (
          <>
            <SecondaryButton onClick={handleUnarchive} disabled={busy}>
              {busy ? t('formSaving') : t('unarchiveAction')}
            </SecondaryButton>
            <DangerButton onClick={() => setConfirmingDelete(true)} disabled={busy}>
              {t('deleteCardAction')}
            </DangerButton>
          </>
        )}
      </div>
    </div>
  );
}
