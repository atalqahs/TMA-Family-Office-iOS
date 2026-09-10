import { useState } from 'react';
import { compressImageToBlob } from '../utils/image';
import { useLanguage } from './useLanguage';

const MAX_SOURCE_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Shared logic behind every "pick a photo, validate, compress, store as a
 * Blob" flow (Family profile photos, Property cover photos, ...). Callers
 * own the file input and the preview; this just handles validation,
 * compression, and processing/error state.
 */
export function usePhotoPicker(onChange: (photo: Blob | undefined) => void) {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = async (file: File) => {
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
      console.error('Failed to process photo', err);
      setError(t('photoProcessingError'));
    } finally {
      setProcessing(false);
    }
  };

  return { error, processing, handleFile };
}
