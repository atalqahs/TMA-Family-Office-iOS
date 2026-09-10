import { useRef, useState, type ChangeEvent } from 'react';
import { Avatar } from '../../../components/Avatar';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { compressImageToBlob } from '../../../utils/image';
import './ProfilePhotoPicker.css';

interface ProfilePhotoPickerProps {
  name: string;
  photo?: Blob;
  onChange: (photo: Blob | undefined) => void;
}

const MAX_SOURCE_FILE_SIZE = 20 * 1024 * 1024;

export function ProfilePhotoPicker({ name, photo, onChange }: ProfilePhotoPickerProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('validationFileTypeUnsupported'));
      return;
    }
    if (file.size > MAX_SOURCE_FILE_SIZE) {
      setError(t('validationFileTooLarge'));
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      const compressed = await compressImageToBlob(file);
      onChange(compressed);
    } catch (err) {
      console.error('Failed to process profile photo', err);
      setError(t('photoProcessingError'));
    } finally {
      setProcessing(false);
    }
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
