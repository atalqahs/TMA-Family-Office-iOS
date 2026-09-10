import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { PropertyCard } from '../features/properties/components/PropertyCard';
import { PropertyForm } from '../features/properties/components/PropertyForm';
import * as propertyService from '../features/properties/propertyService';
import { useProperties } from '../features/properties/hooks/useProperties';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './PropertiesPage.css';

const PROPERTIES_CATEGORY = CATEGORIES.find((category) => category.id === 'properties')!;

export function PropertiesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { properties, loading, error, refresh } = useProperties();
  const addSheet = useDisclosure();

  const title = useLocalizedText(PROPERTIES_CATEGORY.title);
  const subtitle = useLocalizedText(PROPERTIES_CATEGORY.subtitle);
  const emptyMessage = useLocalizedText(PROPERTIES_CATEGORY.emptyMessage);
  const addLabel = useLocalizedText(PROPERTIES_CATEGORY.addLabel);
  const Icon = PROPERTIES_CATEGORY.icon;

  return (
    <div className="properties-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />

      {loading && <p className="properties-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="properties-page__status">{t('formSaveError')}</p>}

      {!loading && !error && properties.length === 0 && (
        <EmptyState title={emptyMessage} action={<PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>} />
      )}

      {!loading && !error && properties.length > 0 && (
        <>
          <div className="properties-page__grid">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => navigate(`/properties/${property.id}`)}
              />
            ))}
          </div>
          <div className="properties-page__add-action">
            <PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>
          </div>
        </>
      )}

      <Sheet
        open={addSheet.isOpen}
        onClose={addSheet.close}
        title={t('propertyFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <PropertyForm
          onCancel={addSheet.close}
          onSubmit={async (values) => {
            await propertyService.createProperty(values);
            await refresh();
            addSheet.close();
          }}
        />
      </Sheet>
    </div>
  );
}
