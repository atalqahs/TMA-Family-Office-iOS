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
import * as familyService from '../features/family/familyService';
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
};

const VALID_SOURCE_TYPES = new Set<string>(Object.keys(SOURCE_CATEGORY_ID));

/** Unarchive/Delete Card handlers per source -- each delegating straight to that domain's own service (Archive never owns this logic, never touches IndexedDB itself). */
const SOURCE_ACTIONS: Record<ArchiveSourceType, { unarchive: (id: string) => Promise<void>; deleteCard: (id: string) => Promise<void> }> = {
  family: { unarchive: familyService.unarchiveFamilyMember, deleteCard: familyService.deleteFamilyMemberCard },
  staff: { unarchive: staffService.unarchiveStaffMember, deleteCard: staffService.deleteStaffMemberCard },
  properties: { unarchive: propertyService.unarchiveProperty, deleteCard: propertyService.deletePropertyCard },
  vehicles: { unarchive: vehicleService.unarchiveVehicle, deleteCard: vehicleService.deleteVehicleCard },
  contracts: { unarchive: contractService.unarchiveContract, deleteCard: contractService.deleteContractCard },
  tasks: { unarchive: taskService.unarchiveTaskGroup, deleteCard: taskService.deleteTaskGroupCard },
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
                await actions.deleteCard(item.id);
                await refresh();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
