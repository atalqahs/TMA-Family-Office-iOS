import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CoverPhoto } from '../components/CoverPhoto';
import { DangerButton } from '../components/DangerButton';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { Sheet } from '../components/Sheet';
import { PropertyDocumentForm } from '../features/properties/components/PropertyDocumentForm';
import { PropertyDocumentsSection } from '../features/properties/components/PropertyDocumentsSection';
import { PropertyForm } from '../features/properties/components/PropertyForm';
import * as propertyService from '../features/properties/propertyService';
import { useProperty } from '../features/properties/hooks/useProperty';
import { PROPERTY_STATUSES, PROPERTY_TYPES, type PropertyStatus } from '../features/properties/types';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import './PropertyProfilePage.css';

const STATUS_VARIANT: Record<PropertyStatus, 'success' | 'accent' | 'warning' | 'neutral'> = {
  owned: 'success',
  rented: 'accent',
  underConstruction: 'warning',
  other: 'neutral',
};

export function PropertyProfilePage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { t, locale, dir } = useLanguage();
  const { property, documents, loading, refresh } = useProperty(propertyId);
  const editSheet = useDisclosure();
  const addDocSheet = useDisclosure();
  const deleteSheet = useDisclosure();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  if (loading) {
    return <p className="property-profile-page__status">{t('loadingLabel')}</p>;
  }

  if (!property) {
    return (
      <div className="property-profile-page">
        <EmptyState
          title={t('propertyNotFoundTitle')}
          action={<PrimaryButton onClick={() => navigate('/properties')}>{t('backToPropertiesLabel')}</PrimaryButton>}
        />
      </div>
    );
  }

  const typeLabel = PROPERTY_TYPES.find((option) => option.id === property.type)?.title[locale];
  const statusLabel = PROPERTY_STATUSES.find((option) => option.id === property.status)?.title[locale];

  // Only rows that actually have a value are shown — an empty optional
  // field is simply omitted rather than displayed as a "-" placeholder row.
  const locationRows: Array<[string, string]> = (
    [
      [t('fieldCountry'), property.country],
      [t('fieldCity'), property.city],
      [t('fieldArea'), property.area],
      [t('fieldBlock'), property.block],
      [t('fieldStreet'), property.street],
      [t('fieldAvenue'), property.avenue],
      [t('fieldHouseNumber'), property.houseNumber],
    ] as Array<[string, string | undefined]>
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const propertyInfoRows: Array<[string, string]> = (
    [[t('fieldPropertyNumber'), property.propertyNumber]] as Array<[string, string | undefined]>
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await propertyService.removeProperty(property.id);
      navigate('/properties');
    } catch (err) {
      console.error('Failed to delete property', err);
      setDeleteError(t('formSaveError'));
      setDeleting(false);
    }
  };

  return (
    <div className="property-profile-page">
      <div className="property-profile-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToPropertiesLabel')}
          onClick={() => navigate('/properties')}
        />
      </div>

      <div className="property-profile-page__cover">
        <CoverPhoto photo={property.coverPhoto} size="lg" />
      </div>

      <div className="property-profile-page__header">
        <h1 className="property-profile-page__name">{property.name}</h1>
        <p className="property-profile-page__subtitle">{typeLabel}</p>
        <StatusBadge variant={STATUS_VARIANT[property.status]}>{statusLabel}</StatusBadge>
        <div className="property-profile-page__header-actions">
          <SecondaryButton onClick={editSheet.open}>{t('profileEditAction')}</SecondaryButton>
        </div>
      </div>

      {locationRows.length > 0 && (
        <section className="property-profile-page__section">
          <h2 className="property-profile-page__section-title">{t('profileSectionLocation')}</h2>
          <dl className="property-profile-page__info-list">
            {locationRows.map(([label, value]) => (
              <div className="property-profile-page__info-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {propertyInfoRows.length > 0 && (
        <section className="property-profile-page__section">
          <h2 className="property-profile-page__section-title">{t('profileSectionPropertyInfo')}</h2>
          <dl className="property-profile-page__info-list">
            {propertyInfoRows.map(([label, value]) => (
              <div className="property-profile-page__info-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="property-profile-page__section">
        <h2 className="property-profile-page__section-title">{t('profileSectionDocuments')}</h2>
        <PropertyDocumentsSection documents={documents} onAdd={addDocSheet.open} onRefresh={refresh} />
      </section>

      <section className="property-profile-page__section">
        <h2 className="property-profile-page__section-title">{t('profileSectionNotes')}</h2>
        <p className="property-profile-page__notes">{property.notes || t('profileNotesEmpty')}</p>
      </section>

      <div className="property-profile-page__danger-zone">
        <DangerButton onClick={deleteSheet.open}>{t('propertyDeleteAction')}</DangerButton>
      </div>

      <Sheet
        open={editSheet.isOpen}
        onClose={editSheet.close}
        title={t('propertyFormEditTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <PropertyForm
          initialValue={property}
          onCancel={editSheet.close}
          onSubmit={async (values) => {
            await propertyService.updateProperty(property.id, values);
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
        <PropertyDocumentForm
          onCancel={addDocSheet.close}
          onSubmit={async (values) => {
            await propertyService.addPropertyDocument(property.id, values);
            await refresh();
            addDocSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={deleteSheet.isOpen}
        onClose={deleteSheet.close}
        title={t('propertyDeleteConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="property-profile-page__delete-body">{t('propertyDeleteConfirmBody')}</p>
        {deleteError && <p className="property-profile-page__delete-error">{deleteError}</p>}
        <div className="property-profile-page__delete-actions">
          <SecondaryButton onClick={deleteSheet.close} disabled={deleting}>
            {t('actionCancel')}
          </SecondaryButton>
          <DangerButton onClick={handleDelete} disabled={deleting}>
            {deleting ? t('formSaving') : t('propertyDeleteConfirmAction')}
          </DangerButton>
        </div>
      </Sheet>
    </div>
  );
}
