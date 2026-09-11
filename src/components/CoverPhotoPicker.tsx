import { useRef, type ChangeEvent } from 'react';
import { CoverPhoto } from './CoverPhoto';
import { SecondaryButton } from './SecondaryButton';
import { useLanguage } from '../hooks/useLanguage';
import { usePhotoPicker } from '../hooks/usePhotoPicker';
import './CoverPhotoPicker.css';

interface CoverPhotoPickerProps {
  photo?: Blob;
  onChange: (photo: Blob | undefined) => void;
  variant?: 'property' | 'vehicle';
}

/** Shared cover-photo picker for any entity with a rectangular cover photo (Properties, Vehicles, ...). */
export function CoverPhotoPicker({ photo, onChange, variant = 'property' }: CoverPhotoPickerProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const { error, processing, handleFile } = usePhotoPicker(onChange);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void handleFile(file);
  };

  return (
    <div className="cover-photo-picker">
      <CoverPhoto photo={photo} size="lg" variant={variant} />
      <div className="cover-photo-picker__actions">
        <SecondaryButton type="button" onClick={() => inputRef.current?.click()} disabled={processing}>
          {photo ? t('photoChangeLabel') : t('photoChooseLabel')}
        </SecondaryButton>
        {photo && (
          <SecondaryButton type="button" onClick={() => onChange(undefined)} disabled={processing}>
            {t('photoRemoveLabel')}
          </SecondaryButton>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="cover-photo-picker__input"
      />
      {processing && <p className="cover-photo-picker__status">{t('photoProcessingLabel')}</p>}
      {error && <p className="cover-photo-picker__error">{error}</p>}
    </div>
  );
}
