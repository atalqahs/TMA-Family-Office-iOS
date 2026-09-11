import { Building2, Car } from 'lucide-react';
import { useObjectUrl } from '../hooks/useObjectUrl';
import './CoverPhoto.css';

/** Which entity this cover photo belongs to, so the empty-state placeholder icon matches (building for Properties, car for Vehicles) instead of a generic building icon everywhere. */
type CoverPhotoVariant = 'property' | 'vehicle';

const PLACEHOLDER_ICON: Record<CoverPhotoVariant, typeof Building2> = {
  property: Building2,
  vehicle: Car,
};

interface CoverPhotoProps {
  photo?: Blob;
  /** 'card' fills its container edge-to-edge (the parent clips the corners). */
  size?: 'card' | 'md' | 'lg';
  variant?: CoverPhotoVariant;
}

export function CoverPhoto({ photo, size = 'lg', variant = 'property' }: CoverPhotoProps) {
  const url = useObjectUrl(photo);
  const PlaceholderIcon = PLACEHOLDER_ICON[variant];

  return (
    <div className={`cover-photo cover-photo--${size}`}>
      {url ? (
        <img src={url} alt="" className="cover-photo__image" />
      ) : (
        <PlaceholderIcon
          className="cover-photo__placeholder-icon"
          size={size === 'md' ? 24 : 40}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
