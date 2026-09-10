import { Building2 } from 'lucide-react';
import { useObjectUrl } from '../hooks/useObjectUrl';
import './CoverPhoto.css';

interface CoverPhotoProps {
  photo?: Blob;
  /** 'card' fills its container edge-to-edge (the parent clips the corners). */
  size?: 'card' | 'md' | 'lg';
}

export function CoverPhoto({ photo, size = 'lg' }: CoverPhotoProps) {
  const url = useObjectUrl(photo);

  return (
    <div className={`cover-photo cover-photo--${size}`}>
      {url ? (
        <img src={url} alt="" className="cover-photo__image" />
      ) : (
        <Building2
          className="cover-photo__placeholder-icon"
          size={size === 'md' ? 24 : 40}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
