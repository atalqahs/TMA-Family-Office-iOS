const MAX_DIMENSION = 640;
const JPEG_QUALITY = 0.82;

/**
 * Resizes and re-encodes a picked image to a bounded JPEG before it is
 * persisted, so a full-resolution iPhone photo doesn't consume excessive
 * IndexedDB storage. Quality is kept high enough for a profile-photo-sized
 * display.
 */
export async function compressImageToBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) {
      throw new Error('Image encoding failed');
    }
    return blob;
  } finally {
    bitmap.close();
  }
}
