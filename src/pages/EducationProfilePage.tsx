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
import { EducationDocumentForm } from '../features/education/components/EducationDocumentForm';
import { EducationDocumentsSection } from '../features/education/components/EducationDocumentsSection';
import { EducationProfileEditForm } from '../features/education/components/EducationProfileEditForm';
import * as educationService from '../features/education/educationService';
import { useEducationProfile } from '../features/education/hooks/useEducationProfile';
import { EDUCATION_STATUSES } from '../features/education/types';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import './EducationProfilePage.css';

export function EducationProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { t, locale, dir } = useLanguage();
  const { profile, familyMember, documents, loading, refresh } = useEducationProfile(profileId);
  const editSheet = useDisclosure();
  const addDocSheet = useDisclosure();
  const deleteSheet = useDisclosure();
  const archiveSheet = useDisclosure();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  if (loading) {
    return <p className="education-profile-page__status">{t('loadingLabel')}</p>;
  }

  if (!profile) {
    return (
      <div className="education-profile-page">
        <EmptyState
          title={t('educationProfileNotFoundTitle')}
          action={<PrimaryButton onClick={() => navigate('/education')}>{t('backToEducationLabel')}</PrimaryButton>}
        />
      </div>
    );
  }

  if (profile.archivedAt) {
    return (
      <div className="education-profile-page">
        <div className="education-profile-page__topbar">
          <IconButton
            icon={<BackIcon size={22} strokeWidth={1.75} />}
            label={t('backToEducationLabel')}
            onClick={() => navigate('/education')}
          />
        </div>
        <ArchivedNotice
          onUnarchive={async () => {
            await educationService.unarchiveEducationProfile(profile.id);
            await refresh();
          }}
        />
      </div>
    );
  }

  const statusLabel = EDUCATION_STATUSES.find((status) => status.id === profile.educationStatus)?.title[locale];

  const identityRows: Array<[string, string | undefined]> = [
    [t('fieldNationality'), familyMember?.nationality],
    [t('fieldCivilId'), familyMember?.civilId],
    [t('fieldPhone'), familyMember?.phone],
    [t('fieldEmail'), familyMember?.email],
  ];

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await educationService.removeEducationProfile(profile.id);
      navigate('/education');
    } catch (err) {
      console.error('Failed to delete education profile', err);
      setDeleteError(t('formSaveError'));
      setDeleting(false);
    }
  };

  return (
    <div className="education-profile-page">
      <div className="education-profile-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToEducationLabel')}
          onClick={() => navigate('/education')}
        />
      </div>

      <div className="education-profile-page__header">
        <Avatar photo={familyMember?.profilePhoto} name={familyMember?.fullName ?? ''} size="lg" />
        <h1 className="education-profile-page__name">{familyMember?.fullName ?? t('fieldNotProvided')}</h1>
        <p className="education-profile-page__subtitle">
          {profile.educationStage}
          {profile.institution && ` · ${profile.institution}`}
        </p>
        <div className="education-profile-page__header-actions">
          <SecondaryButton onClick={editSheet.open}>{t('profileEditAction')}</SecondaryButton>
          <SecondaryButton onClick={archiveSheet.open}>{t('archiveAction')}</SecondaryButton>
        </div>
      </div>

      <section className="education-profile-page__section">
        <h2 className="education-profile-page__section-title">{t('healthSectionFamilyIdentity')}</h2>
        <dl className="education-profile-page__info-list">
          {identityRows.map(([label, value]) => (
            <div className="education-profile-page__info-row" key={label}>
              <dt>{label}</dt>
              <dd>{value || t('fieldNotProvided')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="education-profile-page__section">
        <h2 className="education-profile-page__section-title">{t('healthSectionDetails')}</h2>
        <dl className="education-profile-page__info-list">
          <div className="education-profile-page__info-row">
            <dt>{t('fieldGradeOrYear')}</dt>
            <dd>{profile.gradeOrYear || t('fieldNotProvided')}</dd>
          </div>
          <div className="education-profile-page__info-row">
            <dt>{t('fieldSpecialization')}</dt>
            <dd>{profile.specialization || t('fieldNotProvided')}</dd>
          </div>
          <div className="education-profile-page__info-row">
            <dt>{t('fieldEducationStatus')}</dt>
            <dd>{statusLabel}</dd>
          </div>
        </dl>
      </section>

      <section className="education-profile-page__section">
        <h2 className="education-profile-page__section-title">{t('profileSectionNotes')}</h2>
        <p className="education-profile-page__notes">{profile.notes || t('profileNotesEmpty')}</p>
      </section>

      <section className="education-profile-page__section">
        <h2 className="education-profile-page__section-title">{t('profileSectionDocuments')}</h2>
        <EducationDocumentsSection documents={documents} onAdd={addDocSheet.open} onRefresh={refresh} />
      </section>

      <div className="education-profile-page__danger-zone">
        <DangerButton onClick={deleteSheet.open}>{t('educationDeleteAction')}</DangerButton>
      </div>

      <Sheet open={editSheet.isOpen} onClose={editSheet.close} title={t('formEditTitle')} closeLabel={t('menuCloseLabel')}>
        <EducationProfileEditForm
          initialValue={profile}
          onCancel={editSheet.close}
          onSubmit={async (values) => {
            await educationService.updateEducationProfile(profile.id, values);
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
        <EducationDocumentForm
          onCancel={addDocSheet.close}
          onSubmit={async (values) => {
            await educationService.addEducationDocument(profile.id, values);
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
        <p className="education-profile-page__delete-body">{t('educationDeleteConfirmBody')}</p>
        {deleteError && <p className="education-profile-page__delete-error">{deleteError}</p>}
        <div className="education-profile-page__delete-actions">
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
        <p className="education-profile-page__delete-body">{t('archiveConfirmBody')}</p>
        <div className="education-profile-page__delete-actions">
          <SecondaryButton onClick={archiveSheet.close} disabled={archiving}>
            {t('actionCancel')}
          </SecondaryButton>
          <PrimaryButton
            onClick={async () => {
              setArchiving(true);
              try {
                await educationService.archiveEducationProfile(profile.id);
                navigate('/education');
              } catch (err) {
                console.error('Failed to archive education profile', err);
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
