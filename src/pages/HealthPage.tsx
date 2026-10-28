import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { HealthProfileCreateForm } from '../features/health/components/HealthProfileCreateForm';
import { HealthProfileCard } from '../features/health/components/HealthProfileCard';
import * as healthService from '../features/health/healthService';
import { useHealthProfiles } from '../features/health/hooks/useHealthProfiles';
import { useFamilyMembers } from '../features/family/hooks/useFamilyMembers';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './HealthPage.css';

const HEALTH_CATEGORY = CATEGORIES.find((category) => category.id === 'health')!;

export function HealthPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { entries, loading, error } = useHealthProfiles();
  const { members: familyMembers } = useFamilyMembers();
  const addSheet = useDisclosure();

  const title = useLocalizedText(HEALTH_CATEGORY.title);
  const subtitle = useLocalizedText(HEALTH_CATEGORY.subtitle);
  const emptyMessage = useLocalizedText(HEALTH_CATEGORY.emptyMessage);
  const addLabel = useLocalizedText(HEALTH_CATEGORY.addLabel);
  const Icon = HEALTH_CATEGORY.icon;

  return (
    <div className="health-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />

      {loading && <p className="health-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="health-page__status">{t('formSaveError')}</p>}

      {!loading && !error && entries.length === 0 && (
        <EmptyState title={emptyMessage} action={<PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>} />
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          <div className="health-page__grid">
            {entries.map(({ profile, familyMember }) => (
              <HealthProfileCard
                key={profile.id}
                profile={profile}
                familyMember={familyMember}
                onClick={() => navigate(`/health/${profile.id}`)}
              />
            ))}
          </div>
          <div className="health-page__add-action">
            <PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>
          </div>
        </>
      )}

      <Sheet
        open={addSheet.isOpen}
        onClose={addSheet.close}
        title={t('healthFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <HealthProfileCreateForm
          familyMembers={familyMembers}
          onSubmit={async (familyMemberId, values) => {
            try {
              const profile = await healthService.createHealthProfile(familyMemberId, values);
              addSheet.close();
              navigate(`/health/${profile.id}`);
            } catch (err) {
              if (err instanceof healthService.DuplicateHealthProfileError) {
                addSheet.close();
                navigate(`/health/${err.existingProfileId}`);
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
