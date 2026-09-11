import { CategoryCard } from '../components/CategoryCard';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { CATEGORIES } from '../features/categories/categories';
import { useArchiveCategories } from '../features/archive/hooks/useArchiveCategories';
import type { ArchiveSourceType } from '../features/archive/types';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './ArchivePage.css';

const ARCHIVE_CATEGORY = CATEGORIES.find((category) => category.id === 'archive')!;

const SOURCE_CATEGORY_ID: Record<ArchiveSourceType, string> = {
  family: 'family',
  staff: 'staff',
  properties: 'properties',
  vehicles: 'vehicles',
  contracts: 'contracts',
  tasks: 'tasks',
};

/**
 * Extremely simple by design (Phase 10 Section L): only categories that
 * currently contain at least one archived card ever appear here, and only
 * as a plain category card (icon, name, archived count) -- never an empty
 * placeholder for a category with nothing archived. Fully dynamic: this
 * recomputes on every load, nothing about which categories appear is ever
 * persisted.
 */
export function ArchivePage() {
  const { t, locale } = useLanguage();
  const { categories, loading, error } = useArchiveCategories();

  const title = useLocalizedText(ARCHIVE_CATEGORY.title);
  const subtitle = useLocalizedText(ARCHIVE_CATEGORY.subtitle);
  const Icon = ARCHIVE_CATEGORY.icon;

  return (
    <div className="archive-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />

      {loading && <p className="archive-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="archive-page__status">{t('formSaveError')}</p>}

      {!loading && !error && categories.length === 0 && <EmptyState title={t('archiveEmptyStateTitle')} />}

      {!loading && !error && categories.length > 0 && (
        <div className="archive-page__grid">
          {categories.map((summary) => {
            const category = CATEGORIES.find((entry) => entry.id === SOURCE_CATEGORY_ID[summary.sourceType]);
            if (!category) return null;
            return (
              <CategoryCard
                key={summary.sourceType}
                path={`/archive/${summary.sourceType}`}
                icon={category.icon}
                title={category.title[locale]}
                meta={String(summary.count)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
