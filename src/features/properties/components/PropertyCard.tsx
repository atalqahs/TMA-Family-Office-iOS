import { CoverPhoto } from '../../../components/CoverPhoto';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import { PROPERTY_STATUSES, PROPERTY_TYPES } from '../types';
import type { Property, PropertyStatus } from '../types';
import './PropertyCard.css';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

const STATUS_VARIANT: Record<PropertyStatus, 'success' | 'accent' | 'warning' | 'neutral'> = {
  owned: 'success',
  rented: 'accent',
  underConstruction: 'warning',
  other: 'neutral',
};

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const { locale } = useLanguage();

  const typeLabel = PROPERTY_TYPES.find((option) => option.id === property.type)?.title[locale];
  const statusLabel = PROPERTY_STATUSES.find((option) => option.id === property.status)?.title[locale];
  const listSeparator = locale === 'ar' ? '، ' : ', ';
  const locationParts = [property.city || property.area, property.country].filter(Boolean);
  const locationLabel = locationParts.join(listSeparator);

  return (
    <button type="button" className="property-card" onClick={onClick}>
      <CoverPhoto photo={property.coverPhoto} size="card" />
      <div className="property-card__body">
        <span className="property-card__name">{property.name}</span>
        <span className="property-card__meta">{[typeLabel, locationLabel].filter(Boolean).join(' · ')}</span>
        <StatusBadge variant={STATUS_VARIANT[property.status]}>{statusLabel}</StatusBadge>
      </div>
    </button>
  );
}
