import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { EmptyState } from './EmptyState';
import { PrimaryButton } from './PrimaryButton';
import './ArchivedNotice.css';

interface ArchivedNoticeProps {
  onUnarchive: () => Promise<void>;
}

/**
 * The hard Phase 10 UX rule (Section O): an archived card is never opened
 * directly for viewing/editing. Every profile/detail page for an
 * archive-capable entity renders THIS instead of its normal content once
 * the loaded record has `archivedAt` set -- the only way back to the full
 * profile is Unarchive, which clears `archivedAt` and nothing else (no
 * data is copied or recreated). Also the controlled landing page when a
 * Notification for an archived source is tapped (see
 * features/notifications/), so the user is clearly told why the full
 * profile isn't shown rather than silently failing or auto-unarchiving.
 */
export function ArchivedNotice({ onUnarchive }: ArchivedNoticeProps) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const handleUnarchive = async () => {
    setBusy(true);
    setError(false);
    try {
      await onUnarchive();
    } catch (err) {
      console.error('Failed to unarchive', err);
      setError(true);
      setBusy(false);
    }
  };

  return (
    <div className="archived-notice">
      <EmptyState
        title={t('archivedNoticeTitle')}
        hint={t('archivedNoticeHint')}
        action={
          <PrimaryButton onClick={handleUnarchive} disabled={busy}>
            {busy ? t('formSaving') : t('unarchiveAction')}
          </PrimaryButton>
        }
      />
      {error && <p className="archived-notice__error">{t('formSaveError')}</p>}
    </div>
  );
}
