/**
 * Interface archive / cache médias (13.11) — fichiers .enc chiffrés.
 */
import {
  mediaFileExists,
  mediaFileDelete,
  mediaFileSize,
  mediaTotalSize,
  mediaClearAll,
  mediaFilePath,
} from '../storage/mediaFiles';
import {
  storeEncryptedMedia,
  loadDecryptedMedia,
} from '../crypto/mediaCipher';

function bytesToB64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let s = '';
  for (let i = 0; i < bytes.length; i += 1) {
    s += String.fromCharCode(bytes[i]!);
  }
  return btoa(s);
}

export type MediaStorage = {
  exists(messageId: string): Promise<boolean>;
  writeBase64(messageId: string, base64: string): Promise<string>;
  readBase64(messageId: string): Promise<string | null>;
  delete(messageId: string): Promise<void>;
  sizeOf(messageId: string): Promise<number>;
  totalSize(): Promise<number>;
  clearAll(): Promise<void>;
  localPath(messageId: string): string;
};

export const defaultMediaStorage: MediaStorage = {
  exists: mediaFileExists,
  async writeBase64(messageId, base64) {
    await storeEncryptedMedia(messageId, base64);
    return mediaFilePath(messageId);
  },
  async readBase64(messageId) {
    try {
      const plain = await loadDecryptedMedia(messageId);
      return bytesToB64(plain);
    } catch {
      return null;
    }
  },
  delete: mediaFileDelete,
  sizeOf: mediaFileSize,
  totalSize: mediaTotalSize,
  clearAll: mediaClearAll,
  localPath: mediaFilePath,
};

let active: MediaStorage = defaultMediaStorage;

export function getMediaStorage(): MediaStorage {
  return active;
}

export function setMediaStorageForTests(storage: MediaStorage): void {
  active = storage;
}

export function resetMediaStorageForTests(): void {
  active = defaultMediaStorage;
}
