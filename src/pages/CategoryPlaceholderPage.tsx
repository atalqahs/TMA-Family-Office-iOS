import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import type { CategoryDefinition } from '../features/categories/categories';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './CategoryPlaceholderPage.css';

interface CategoryPlaceholderPageProps {
  category: CategoryDefinition;
}

export function CategoryPlaceholderPage({ category }: CategoryPlaceholderPageProps) {
  const { t } = useLanguage();
  const title = useLocalizedText(category.title);
  const subtitle = useLocalizedText(category.subtitle);
  const emptyMessage = useLocalizedText(category.emptyMessage);
  const addLabel = useLocalizedText(category.addLabel);
  const notice = useDisclosure();
  const Icon = category.icon;

  return (
    <div className="category-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />
      <EmptyState
        title={emptyMessage}
        action={addLabel && <PrimaryButton onClick={notice.open}>{addLabel}</PrimaryButton>}
      />
      {addLabel && notice.isOpen && <p className="category-page__notice">{t('comingSoonNotice')}</p>}
    </div>
  );
}
