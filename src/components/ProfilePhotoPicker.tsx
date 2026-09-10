import { useRef, type ChangeEvent } from 'react';
import { Avatar } from './Avatar';
import { SecondaryButton } from './SecondaryButton';
import { usePhotoPicker } from '../hooks/usePhotoPicker';
import { useLanguage } from '../hooks/useLanguage';
import './ProfilePhotoPicker.css';

interface ProfilePhotoPickerProps {
  name: string;
  photo?: Blob;
  onChange: (photo: Blob | undefined) => void;
}

/** Shared circular profile-photo picker for any entity with an Avatar (Family, Staff, ...). */
export function ProfilePhotoPicker({ name, photo, onChange }: ProfilePhotoPickerProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const { error, processing, handleFile } = usePhotoPicker(onChange);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void handleFile(file);
  };

  return (
    <div className="profile-photo-picker">
      <Avatar photo={photo} name={name} size="lg" />
      <div className="profile-photo-picker__actions">
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
        className="profile-photo-picker__input"
      />
      {processing && <p className="profile-photo-picker__status">{t('photoProcessingLabel')}</p>}
      {error && <p className="profile-photo-picker__error">{error}</p>}
    </div>
  );
}
