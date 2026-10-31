/**
 * Pont JS vers le module natif BotgramAppUpdate (canal direct uniquement).
 * Sûr si le module est absent (tests, iOS) : isInstallerAvailable() = false.
 */
import {NativeEventEmitter, NativeModules} from 'react-native';

type NativeUpdater = {
  canInstall(): Promise<boolean>;
  openInstallSettings(): Promise<void>;
  download(url: string, sha256: string, size: number): Promise<string>;
  cancel(): Promise<void>;
  install(): Promise<void>;
  cleanup(): Promise<void>;
};

const native = NativeModules.BotgramAppUpdate as NativeUpdater | undefined;

export const isInstallerAvailable = (): boolean => native != null;

export async function canInstallApks(): Promise<boolean> {
  return native ? native.canInstall() : false;
}

export async function openInstallSettings(): Promise<void> {
  if (native) await native.openInstallSettings();
}

/** Télécharge et vérifie l'APK. `onProgress` reçoit une valeur 0..1 (0 si taille inconnue). */
export async function downloadApk(
  url: string,
  sha256: string,
  size: number,
  onProgress: (ratio: number) => void,
): Promise<void> {
  if (!native) throw Object.assign(new Error('unavailable'), {code: 'unavailable'});
  const em = new NativeEventEmitter(NativeModules.BotgramAppUpdate);
  const sub = em.addListener('BotgramAppUpdateProgress', (ev: unknown) => {
    const {received, total} = ev as {received: number; total: number};
    onProgress(total > 0 ? Math.min(received / total, 1) : 0);
  });
  try {
    await native.download(url, sha256, size);
  } finally {
    sub.remove();
  }
}

export async function installApk(): Promise<void> {
  if (native) await native.install();
}

export async function cancelDownload(): Promise<void> {
  if (native) await native.cancel();
}

export async function cleanupApk(): Promise<void> {
  if (native) await native.cleanup();
}
