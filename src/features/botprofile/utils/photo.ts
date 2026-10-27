/** Contrôles locaux avant envoi d'une photo de bot. */
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export type PickedImage = {
  uri: string;
  name: string;
  mime: string;
  size: number;
};

export type PhotoValidationError = 'not_image' | 'too_large';

export function validatePhoto(file: PickedImage): PhotoValidationError | null {
  if (file.mime && !file.mime.startsWith('image/')) return 'not_image';
  if (file.size > PHOTO_MAX_BYTES) return 'too_large';
  return null;
}
