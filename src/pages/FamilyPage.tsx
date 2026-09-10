import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { FamilyMemberCard } from '../features/family/components/FamilyMemberCard';
import { FamilyMemberForm } from '../features/family/components/FamilyMemberForm';
import * as familyService from '../features/family/familyService';
import { useFamilyMembers } from '../features/family/hooks/useFamilyMembers';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './FamilyPage.css';

const FAMILY_CATEGORY = CATEGORIES.find((category) => category.id === 'family')!;

export function FamilyPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { members, loading, error, refresh } = useFamilyMembers();
  const addSheet = useDisclosure();

  const title = useLocalizedText(FAMILY_CATEGORY.title);
  const subtitle = useLocalizedText(FAMILY_CATEGORY.subtitle);
  const emptyMessage = useLocalizedText(FAMILY_CATEGORY.emptyMessage);
  const addLabel = useLocalizedText(FAMILY_CATEGORY.addLabel);
  const Icon = FAMILY_CATEGORY.icon;

  return (
    <div className="family-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />

      {loading && <p className="family-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="family-page__status">{t('formSaveError')}</p>}

      {!loading && !error && members.length === 0 && (
        <EmptyState title={emptyMessage} action={<PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>} />
      )}

      {!loading && !error && members.length > 0 && (
        <>
          <div className="family-page__grid">
            {members.map((member) => (
              <FamilyMemberCard key={member.id} member={member} onClick={() => navigate(`/family/${member.id}`)} />
            ))}
          </div>
          <div className="family-page__add-action">
            <PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>
          </div>
        </>
      )}

      <Sheet open={addSheet.isOpen} onClose={addSheet.close} title={t('formAddTitle')} closeLabel={t('menuCloseLabel')}>
        <FamilyMemberForm
          onCancel={addSheet.close}
          onSubmit={async (values) => {
            await familyService.createFamilyMember(values);
            await refresh();
            addSheet.close();
          }}
        />
      </Sheet>
    </div>
  );
}
