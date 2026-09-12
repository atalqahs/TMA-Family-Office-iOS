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
import { FamilyMemberForm } from '../features/family/components/FamilyMemberForm';
import { MemberDocumentForm } from '../features/family/components/MemberDocumentForm';
import { MemberDocumentsSection } from '../features/family/components/MemberDocumentsSection';
import * as familyService from '../features/family/familyService';
import { useFamilyMember } from '../features/family/hooks/useFamilyMember';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { calculateAge } from '../utils/age';
import './FamilyMemberProfilePage.css';

export function FamilyMemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { t, locale, dir } = useLanguage();
  const { member, documents, loading, refresh } = useFamilyMember(memberId);
  const editSheet = useDisclosure();
  const addDocSheet = useDisclosure();
  const deleteSheet = useDisclosure();
  const archiveSheet = useDisclosure();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  if (loading) {
    return <p className="family-profile-page__status">{t('loadingLabel')}</p>;
  }

  if (!member) {
    return (
      <div className="family-profile-page">
        <EmptyState
          title={t('memberNotFoundTitle')}
          action={<PrimaryButton onClick={() => navigate('/family')}>{t('backToFamilyLabel')}</PrimaryButton>}
        />
      </div>
    );
  }

  // Hard Phase 10 rule: an archived card is never opened for viewing/
  // editing directly -- Unarchive is the only way back to the full profile.
  if (member.archivedAt) {
    return (
      <div className="family-profile-page">
        <div className="family-profile-page__topbar">
          <IconButton
            icon={<BackIcon size={22} strokeWidth={1.75} />}
            label={t('backToFamilyLabel')}
            onClick={() => navigate('/family')}
          />
        </div>
        <ArchivedNotice
          onUnarchive={async () => {
            await familyService.unarchiveFamilyMember(member.id);
            await refresh();
          }}
        />
      </div>
    );
  }

  const age = calculateAge(member.dateOfBirth);

  const infoRows: Array<[string, string | undefined]> = [
    [
      t('fieldDateOfBirth'),
      member.dateOfBirth ? new Intl.DateTimeFormat(locale).format(new Date(member.dateOfBirth)) : undefined,
    ],
    [t('fieldNationality'), member.nationality],
    [t('fieldCivilId'), member.civilId],
    [
      t('fieldCivilIdExpiryDate'),
      member.civilIdExpiryDate ? new Intl.DateTimeFormat(locale).format(new Date(member.civilIdExpiryDate)) : undefined,
    ],
    [
      t('fieldPassportExpiryDate'),
      member.passportExpiryDate ? new Intl.DateTimeFormat(locale).format(new Date(member.passportExpiryDate)) : undefined,
    ],
    [t('fieldPhone'), member.phone],
    [t('fieldEmail'), member.email],
    [t('fieldBloodType'), member.bloodType],
  ];

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await familyService.removeFamilyMember(member.id);
      navigate('/family');
    } catch (err) {
      console.error('Failed to delete family member', err);
      setDeleteError(t('formSaveError'));
      setDeleting(false);
    }
  };

  return (
    <div className="family-profile-page">
      <div className="family-profile-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToFamilyLabel')}
          onClick={() => navigate('/family')}
        />
      </div>

      <div className="family-profile-page__header">
        <Avatar photo={member.profilePhoto} name={member.fullName} size="lg" />
        <h1 className="family-profile-page__name">{member.fullName}</h1>
        <p className="family-profile-page__subtitle">
          {member.relationship || t('fieldNotProvided')}
          {age !== null && ` · ${age} ${t('ageUnitLabel')}`}
        </p>
        <div className="family-profile-page__header-actions">
          <SecondaryButton onClick={editSheet.open}>{t('profileEditAction')}</SecondaryButton>
          <SecondaryButton onClick={archiveSheet.open}>{t('archiveAction')}</SecondaryButton>
        </div>
      </div>

      <section className="family-profile-page__section">
        <h2 className="family-profile-page__section-title">{t('profileSectionPersonalInfo')}</h2>
        <dl className="family-profile-page__info-list">
          {infoRows.map(([label, value]) => (
            <div className="family-profile-page__info-row" key={label}>
              <dt>{label}</dt>
              <dd>{value || t('fieldNotProvided')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="family-profile-page__section">
        <h2 className="family-profile-page__section-title">{t('profileSectionNotes')}</h2>
        <p className="family-profile-page__notes">{member.notes || t('profileNotesEmpty')}</p>
      </section>

      <section className="family-profile-page__section">
        <h2 className="family-profile-page__section-title">{t('profileSectionDocuments')}</h2>
        <MemberDocumentsSection documents={documents} onAdd={addDocSheet.open} onRefresh={refresh} />
      </section>

      <div className="family-profile-page__danger-zone">
        <DangerButton onClick={deleteSheet.open}>{t('profileDeleteAction')}</DangerButton>
      </div>

      <Sheet open={editSheet.isOpen} onClose={editSheet.close} title={t('formEditTitle')} closeLabel={t('menuCloseLabel')}>
        <FamilyMemberForm
          initialValue={member}
          onCancel={editSheet.close}
          onSubmit={async (values) => {
            await familyService.updateFamilyMember(member.id, values);
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
        <MemberDocumentForm
          onCancel={addDocSheet.close}
          onSubmit={async (values) => {
            await familyService.addFamilyMemberDocument(member.id, values);
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
        <p className="family-profile-page__delete-body">{t('profileDeleteConfirmBody')}</p>
        {deleteError && <p className="family-profile-page__delete-error">{deleteError}</p>}
        <div className="family-profile-page__delete-actions">
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
        <p className="family-profile-page__delete-body">{t('archiveConfirmBody')}</p>
        <div className="family-profile-page__delete-actions">
          <SecondaryButton onClick={archiveSheet.close} disabled={archiving}>
            {t('actionCancel')}
          </SecondaryButton>
          <PrimaryButton
            onClick={async () => {
              setArchiving(true);
              try {
                await familyService.archiveFamilyMember(member.id);
                navigate('/family');
              } catch (err) {
                console.error('Failed to archive family member', err);
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
