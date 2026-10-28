import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ArchivedNotice } from '../components/ArchivedNotice';
import { Avatar } from '../components/Avatar';
import { DangerButton } from '../components/DangerButton';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { Sheet } from '../components/Sheet';
import { HealthDocumentForm } from '../features/health/components/HealthDocumentForm';
import { HealthDocumentsSection } from '../features/health/components/HealthDocumentsSection';
import { HealthProfileEditForm } from '../features/health/components/HealthProfileEditForm';
import * as healthService from '../features/health/healthService';
import { useHealthProfile } from '../features/health/hooks/useHealthProfile';
import { HEALTH_STATUSES } from '../features/health/types';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { calculateAge } from '../utils/age';
import './HealthProfilePage.css';

export function HealthProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { t, locale, dir } = useLanguage();
  const { profile, familyMember, documents, loading, refresh } = useHealthProfile(profileId);
  const editSheet = useDisclosure();
  const addDocSheet = useDisclosure();
  const deleteSheet = useDisclosure();
  const archiveSheet = useDisclosure();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  if (loading) {
    return <p className="health-profile-page__status">{t('loadingLabel')}</p>;
  }

  if (!profile) {
    return (
      <div className="health-profile-page">
        <EmptyState
          title={t('healthProfileNotFoundTitle')}
          action={<PrimaryButton onClick={() => navigate('/health')}>{t('backToHealthLabel')}</PrimaryButton>}
        />
      </div>
    );
  }

  if (profile.archivedAt) {
    return (
      <div className="health-profile-page">
        <div className="health-profile-page__topbar">
          <IconButton
            icon={<BackIcon size={22} strokeWidth={1.75} />}
            label={t('backToHealthLabel')}
            onClick={() => navigate('/health')}
          />
        </div>
        <ArchivedNotice
          onUnarchive={async () => {
            await healthService.unarchiveHealthProfile(profile.id);
            await refresh();
          }}
        />
      </div>
    );
  }

  const age = calculateAge(familyMember?.dateOfBirth);
  const statusLabel = HEALTH_STATUSES.find((status) => status.id === profile.healthStatus)?.title[locale];

  const identityRows: Array<[string, string | undefined]> = [
    [t('fieldNationality'), familyMember?.nationality],
    [t('fieldCivilId'), familyMember?.civilId],
    [t('fieldPhone'), familyMember?.phone],
    [t('fieldEmail'), familyMember?.email],
    [t('fieldBloodType'), familyMember?.bloodType],
  ];

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await healthService.removeHealthProfile(profile.id);
      navigate('/health');
    } catch (err) {
      console.error('Failed to delete health profile', err);
      setDeleteError(t('formSaveError'));
      setDeleting(false);
    }
  };

  return (
    <div className="health-profile-page">
      <div className="health-profile-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToHealthLabel')}
          onClick={() => navigate('/health')}
        />
      </div>

      <div className="health-profile-page__header">
        <Avatar photo={familyMember?.profilePhoto} name={familyMember?.fullName ?? ''} size="lg" />
        <h1 className="health-profile-page__name">{familyMember?.fullName ?? t('fieldNotProvided')}</h1>
        <p className="health-profile-page__subtitle">
          {age !== null && `${age} ${t('ageUnitLabel')} · `}
          {statusLabel}
        </p>
        <div className="health-profile-page__header-actions">
          <SecondaryButton onClick={editSheet.open}>{t('profileEditAction')}</SecondaryButton>
          <SecondaryButton onClick={archiveSheet.open}>{t('archiveAction')}</SecondaryButton>
        </div>
      </div>

      <section className="health-profile-page__section">
        <h2 className="health-profile-page__section-title">{t('healthSectionFamilyIdentity')}</h2>
        <dl className="health-profile-page__info-list">
          {identityRows.map(([label, value]) => (
            <div className="health-profile-page__info-row" key={label}>
              <dt>{label}</dt>
              <dd>{value || t('fieldNotProvided')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="health-profile-page__section">
        <h2 className="health-profile-page__section-title">{t('healthSectionDetails')}</h2>
        <dl className="health-profile-page__info-list">
          <div className="health-profile-page__info-row">
            <dt>{t('fieldHeight')}</dt>
            <dd>{profile.height ? `${profile.height} ${t('unitCm')}` : t('fieldNotProvided')}</dd>
          </div>
          <div className="health-profile-page__info-row">
            <dt>{t('fieldWeight')}</dt>
            <dd>{profile.weight ? `${profile.weight} ${t('unitKg')}` : t('fieldNotProvided')}</dd>
          </div>
          <div className="health-profile-page__info-row">
            <dt>{t('fieldAllergies')}</dt>
            <dd>{profile.allergies || t('fieldNotProvided')}</dd>
          </div>
        </dl>
      </section>

      <section className="health-profile-page__section">
        <h2 className="health-profile-page__section-title">{t('profileSectionNotes')}</h2>
        <p className="health-profile-page__notes">{profile.healthNotes || t('profileNotesEmpty')}</p>
      </section>

      <section className="health-profile-page__section">
        <h2 className="health-profile-page__section-title">{t('profileSectionDocuments')}</h2>
        <HealthDocumentsSection documents={documents} onAdd={addDocSheet.open} onRefresh={refresh} />
      </section>

      <div className="health-profile-page__danger-zone">
        <DangerButton onClick={deleteSheet.open}>{t('healthDeleteAction')}</DangerButton>
      </div>

      <Sheet open={editSheet.isOpen} onClose={editSheet.close} title={t('formEditTitle')} closeLabel={t('menuCloseLabel')}>
        <HealthProfileEditForm
          initialValue={profile}
          onCancel={editSheet.close}
          onSubmit={async (values) => {
            await healthService.updateHealthProfile(profile.id, values);
            await refresh();
            editSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={addDocSheet.isOpen}
        onClose={addDocSheet.close}
        title={t('documentFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <HealthDocumentForm
          onCancel={addDocSheet.close}
          onSubmit={async (values) => {
            await healthService.addHealthDocument(profile.id, values);
            await refresh();
            addDocSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={deleteSheet.isOpen}
        onClose={deleteSheet.close}
        title={t('profileDeleteConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="health-profile-page__delete-body">{t('healthDeleteConfirmBody')}</p>
        {deleteError && <p className="health-profile-page__delete-error">{deleteError}</p>}
        <div className="health-profile-page__delete-actions">
          <SecondaryButton onClick={deleteSheet.close} disabled={deleting}>
            {t('actionCancel')}
          </SecondaryButton>
          <DangerButton onClick={handleDelete} disabled={deleting}>
            {deleting ? t('formSaving') : t('profileDeleteConfirmAction')}
          </DangerButton>
        </div>
      </Sheet>

      <Sheet
        open={archiveSheet.isOpen}
        onClose={archiveSheet.close}
        title={t('archiveConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="health-profile-page__delete-body">{t('archiveConfirmBody')}</p>
        <div className="health-profile-page__delete-actions">
          <SecondaryButton onClick={archiveSheet.close} disabled={archiving}>
            {t('actionCancel')}
          </SecondaryButton>
          <PrimaryButton
            onClick={async () => {
              setArchiving(true);
              try {
                await healthService.archiveHealthProfile(profile.id);
                navigate('/health');
              } catch (err) {
                console.error('Failed to archive health profile', err);
                setArchiving(false);
              }
            }}
            disabled={archiving}
          >
            {archiving ? t('formSaving') : t('archiveConfirmAction')}
          </PrimaryButton>
        </div>
      </Sheet>
    </div>
  );
}
