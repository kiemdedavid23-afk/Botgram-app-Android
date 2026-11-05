/**
 * Interface archive / cache médias (13.11) — implémentation étape 6 via mediaFiles.
 */
import {
  mediaFileExists,
  mediaFileWrite,
  mediaFileReadBase64,
  mediaFileDelete,
  mediaFileSize,
  mediaTotalSize,
  mediaClearAll,
  mediaFilePath,
} from '../storage/mediaFiles';

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
  writeBase64: mediaFileWrite,
  readBase64: mediaFileReadBase64,
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

/** Tests uniquement. */
export function setMediaStorageForTests(storage: MediaStorage): void {
  active = storage;
}

export function resetMediaStorageForTests(): void {
  active = defaultMediaStorage;
}
