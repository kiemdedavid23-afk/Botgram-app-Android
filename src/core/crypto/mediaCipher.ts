/**
 * Chiffrement / déchiffrement médias (fichiers .enc).
 */
import {deriveMediaFileKey} from './keys';
import {
  encryptAll,
  decryptAll,
  MediaDecryptError,
} from './aesGcmBlocks';
import {
  mediaFileWriteEnc,
  mediaFileReadEncBase64,
  mediaFileReadLegacyBase64,
  mediaFileDeleteLegacyPlain,
  mediaEncExists,
  mediaTempWrite,
  mediaTempDelete,
} from '../storage/mediaFiles';
import {getCryptoProvider} from './provider';

function b64ToBytes(b64: string): Uint8Array {
  // atob not always in RN tests — use Buffer if present
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let s = '';
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

/** Écrit un média chiffré (plain base64 → .enc). */
export async function storeEncryptedMedia(
  messageId: string,
  plainBase64: string,
): Promise<void> {
  const key = await deriveMediaFileKey();
  const plain = b64ToBytes(plainBase64);
  const {enc} = encryptAll(plain, key);
  await mediaFileWriteEnc(messageId, bytesToB64(enc));
}

/** Lit et déchiffre ; migre le clair legacy si besoin. */
export async function loadDecryptedMedia(
  messageId: string,
): Promise<Uint8Array> {
  const key = await deriveMediaFileKey();
  if (await mediaEncExists(messageId)) {
    const b64 = await mediaFileReadEncBase64(messageId);
    if (!b64) throw new MediaDecryptError('fichier manquant');
    return decryptAll(b64ToBytes(b64), key);
  }
  const legacy = await mediaFileReadLegacyBase64(messageId);
  if (!legacy) throw new MediaDecryptError('fichier manquant');
  // migration à la volée
  await storeEncryptedMedia(messageId, legacy);
  const check = await mediaFileReadEncBase64(messageId);
  if (!check) throw new MediaDecryptError('migration échouée');
  const plain = decryptAll(b64ToBytes(check), key);
  await mediaFileDeleteLegacyPlain(messageId);
  return plain;
}

/** Matérialise un fichier temp déchiffré (nom aléatoire). */
export async function materializeTempPlain(
  messageId: string,
): Promise<string> {
  const plain = await loadDecryptedMedia(messageId);
  const rnd = getCryptoProvider().randomBytes(16);
  let name = '';
  for (let i = 0; i < rnd.length; i += 1) {
    name += (rnd[i]! % 16).toString(16);
  }
  name = `t-${name}.bin`;
  return mediaTempWrite(name, bytesToB64(plain));
}

export async function releaseTempPlain(path: string): Promise<void> {
  await mediaTempDelete(path);
}

export {MediaDecryptError};
