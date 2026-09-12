import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { EducationProfileCreateForm } from '../features/education/components/EducationProfileCreateForm';
import { EducationProfileCard } from '../features/education/components/EducationProfileCard';
import * as educationService from '../features/education/educationService';
import { useEducationProfiles } from '../features/education/hooks/useEducationProfiles';
import { useFamilyMembers } from '../features/family/hooks/useFamilyMembers';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './EducationPage.css';

const EDUCATION_CATEGORY = CATEGORIES.find((category) => category.id === 'education')!;

export function EducationPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { entries, loading, error } = useEducationProfiles();
  const { members: familyMembers } = useFamilyMembers();
  const addSheet = useDisclosure();

  const title = useLocalizedText(EDUCATION_CATEGORY.title);
  const subtitle = useLocalizedText(EDUCATION_CATEGORY.subtitle);
  const emptyMessage = useLocalizedText(EDUCATION_CATEGORY.emptyMessage);
  const addLabel = useLocalizedText(EDUCATION_CATEGORY.addLabel);
  const Icon = EDUCATION_CATEGORY.icon;

  return (
    <div className="education-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />

      {loading && <p className="education-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="education-page__status">{t('formSaveError')}</p>}

      {!loading && !error && entries.length === 0 && (
        <EmptyState title={emptyMessage} action={<PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>} />
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          <div className="education-page__grid">
            {entries.map(({ profile, familyMember }) => (
              <EducationProfileCard
                key={profile.id}
                profile={profile}
                familyMember={familyMember}
                onClick={() => navigate(`/education/${profile.id}`)}
              />
            ))}
          </div>
          <div className="education-page__add-action">
            <PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>
          </div>
        </>
      )}

      <Sheet
        open={addSheet.isOpen}
        onClose={addSheet.close}
        title={t('educationFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <EducationProfileCreateForm
          familyMembers={familyMembers}
          onSubmit={async (familyMemberId, values) => {
            try {
              const profile = await educationService.createEducationProfile(familyMemberId, values);
              addSheet.close();
              navigate(`/education/${profile.id}`);
            } catch (err) {
              if (err instanceof educationService.DuplicateEducationProfileError) {
                addSheet.close();
                navigate(`/education/${err.existingProfileId}`);
                return;
              }
              throw err;
            }
          }}
          onCancel={addSheet.close}
        />
      </Sheet>
    </div>
  );
}
