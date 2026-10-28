import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PageHeader } from '../components/PageHeader';
import { CATEGORIES } from '../features/categories/categories';
import { ArchivedCard } from '../features/archive/components/ArchivedCard';
import { useArchivedCards } from '../features/archive/hooks/useArchivedCards';
import type { ArchiveSourceType } from '../features/archive/types';
import * as contractService from '../features/contracts/contractService';
import * as educationService from '../features/education/educationService';
import * as familyService from '../features/family/familyService';
import * as healthService from '../features/health/healthService';
import * as propertyService from '../features/properties/propertyService';
import * as staffService from '../features/staff/staffService';
import * as taskService from '../features/tasks/taskService';
import * as vehicleService from '../features/vehicles/vehicleService';
import { useLanguage } from '../hooks/useLanguage';
import './ArchiveCategoryPage.css';

const SOURCE_CATEGORY_ID: Record<ArchiveSourceType, string> = {
  family: 'family',
  staff: 'staff',
  properties: 'properties',
  vehicles: 'vehicles',
  contracts: 'contracts',
  tasks: 'tasks',
  health: 'health',
  education: 'education',
};

const VALID_SOURCE_TYPES = new Set<string>(Object.keys(SOURCE_CATEGORY_ID));

/**
 * Unarchive/Delete handlers per source -- each delegating straight to that
 * domain's own service (Archive never owns this logic, never touches
 * IndexedDB itself). Delete now means REAL PERMANENT deletion (Phase 11 --
 * Trash was cancelled): the exact same `removeX` cascade-delete function
 * used by that domain's own profile page, never a separate soft-delete
 * path. For `tasks`, `removeTaskGroup` preserves the established
 * empty-only hard-delete guard and can reject with `GroupNotEmptyError`,
 * which `ArchivedCard` surfaces as a specific message rather than the
 * generic failure one.
 */
const SOURCE_ACTIONS: Record<ArchiveSourceType, { unarchive: (id: string) => Promise<void>; deleteCard: (id: string) => Promise<void> }> = {
  family: { unarchive: familyService.unarchiveFamilyMember, deleteCard: familyService.removeFamilyMember },
  staff: { unarchive: staffService.unarchiveStaffMember, deleteCard: staffService.removeStaffMember },
  properties: { unarchive: propertyService.unarchiveProperty, deleteCard: propertyService.removeProperty },
  vehicles: { unarchive: vehicleService.unarchiveVehicle, deleteCard: vehicleService.removeVehicle },
  contracts: { unarchive: contractService.unarchiveContract, deleteCard: contractService.removeContract },
  tasks: { unarchive: taskService.unarchiveTaskGroup, deleteCard: taskService.removeTaskGroup },
  health: { unarchive: healthService.unarchiveHealthProfile, deleteCard: healthService.removeHealthProfile },
  education: { unarchive: educationService.unarchiveEducationProfile, deleteCard: educationService.removeEducationProfile },
};

export function ArchiveCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, dir, locale } = useLanguage();
  const navigate = useNavigate();

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const sourceType = categoryId && VALID_SOURCE_TYPES.has(categoryId) ? (categoryId as ArchiveSourceType) : undefined;

  const category = sourceType ? CATEGORIES.find((entry) => entry.id === SOURCE_CATEGORY_ID[sourceType]) : undefined;
  const { cards, loading, error, refresh } = useArchivedCards(sourceType ?? 'family');

  if (!sourceType || !category) {
    return (
      <div className="archive-category-page">
        <EmptyState title={t('archiveEmptyStateTitle')} />
      </div>
    );
  }

  const Icon = category.icon;
  const actions = SOURCE_ACTIONS[sourceType];

  return (
    <div className="archive-category-page">
      <div className="archive-category-page__topbar">
        <IconButton icon={<BackIcon size={22} strokeWidth={1.75} />} label={t('backToArchiveLabel')} onClick={() => navigate('/archive')} />
      </div>

      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={category.title[locale]} />

      {loading && <p className="archive-category-page__status">{t('loadingLabel')}</p>}
      {!loading && error && <p className="archive-category-page__status">{t('formSaveError')}</p>}
      {!loading && !error && cards.length === 0 && <EmptyState title={t('archiveEmptyStateTitle')} />}

      {!loading && !error && cards.length > 0 && (
        <div className="archive-category-page__list">
          {cards.map((item) => (
            <ArchivedCard
              key={item.id}
              item={item}
              onUnarchive={async () => {
                await actions.unarchive(item.id);
                await refresh();
              }}
              onDeleteCard={async () => {
                try {
                  await actions.deleteCard(item.id);
                } catch (err) {
                  if (sourceType === 'tasks' && err instanceof taskService.GroupNotEmptyError) {
                    throw new Error(t('taskGroupNotEmptyError'));
                  }
                  throw err;
                }
                await refresh();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
