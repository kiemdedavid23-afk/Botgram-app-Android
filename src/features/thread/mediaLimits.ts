/** Limites Worker v15.5 — envoi médias (décisions étape 6). */
export const MEDIA_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MEDIA_MAX_BODY_BYTES = 10 * 1024 * 1024;
export const MEDIA_CAPTION_MAX = 1024;
export const ALBUM_MIN = 2;
export const ALBUM_MAX = 10;

const PHOTO_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Formats que Telegram accepte comme vidéo / audio / vocal ; le reste part en document. */
const VIDEO_MIMES = new Set(['video/mp4']);
const AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
]);
const VOICE_MIMES = new Set(['audio/ogg', 'audio/opus', 'application/ogg']);

export type SendKind = 'photo' | 'video' | 'audio' | 'voice' | 'document';

export function kindFromMime(mime: string | null | undefined): SendKind {
  const m = (mime ?? '').toLowerCase();
  if (PHOTO_MIMES.has(m)) return 'photo';
  if (VIDEO_MIMES.has(m)) return 'video';
  if (AUDIO_MIMES.has(m)) return 'audio';
  if (VOICE_MIMES.has(m)) return 'voice';
  return 'document';
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
  return `${Math.max(1, Math.round(n / 1024))} Ko`;
}

export function isAlbumEligibleMime(mime: string | null | undefined): boolean {
  const m = (mime ?? '').toLowerCase();
  return m.startsWith('image/') || m.startsWith('video/');
}

export function albumKindFromMime(mime: string | null | undefined): 'photo' | 'video' {
  const m = (mime ?? '').toLowerCase();
  if (m.startsWith('image/')) return 'photo';
  return 'video';
}
