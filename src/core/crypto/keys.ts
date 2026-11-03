/**
 * Clé maîtresse Keychain + dérivation HKDF (fichiers media).
 * La clé SQLCipher archive existante reste INCHANGÉE (pas de migration base).
 * On dérive uniquement la clé fichiers à partir d'une clé maîtresse dédiée
 * `botgram.master.key` (distincte de archive.db.key et mmkv).
 */
import {
  getOrCreateMasterKey,
} from '../storage/secureStorage';
import {getCryptoProvider} from './provider';

const INFO_MEDIA = new TextEncoder().encode('botgram-media-files-v1');
const SALT_MEDIA = new TextEncoder().encode('botgram-hkdf-salt-media-v1');

/** Dérive 32 octets pour AES-256 fichiers. Déterministe pour un même maître. */
export async function deriveMediaFileKey(): Promise<Uint8Array> {
  const master = await getOrCreateMasterKey();
  const ikm = new TextEncoder().encode(master);
  const crypto = getCryptoProvider();
  return crypto.hkdfSync(ikm, SALT_MEDIA, INFO_MEDIA, 32);
}

/** Exposé tests : même dérivation pure. */
export function deriveMediaFileKeyFromMaster(master: string): Uint8Array {
  const ikm = new TextEncoder().encode(master);
  return getCryptoProvider().hkdfSync(ikm, SALT_MEDIA, INFO_MEDIA, 32);
}
