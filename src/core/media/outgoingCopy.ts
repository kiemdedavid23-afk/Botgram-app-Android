/**
 * Copie locale des médias ENVOYÉS : le fichier choisi est gardé sur le téléphone sous
 * l'identifiant du message, donc lisible tout de suite, hors ligne, sans dépendre du Worker.
 *  1. keepOutgoingCopy  : à l'envoi (message provisoire « local:… »).
 *  2. promoteOutgoingCopy : quand le serveur répond, la copie passe sous le vrai identifiant.
 * Sans module natif (tests), tout est ignoré sans erreur.
 */
import {getMediaStorage} from './MediaStorage';
import {copyLocalFile, isNativeDownloadAvailable} from './native/nativeMedia';

/** Copie `pickedUri` sous l'identifiant `localId`. false si impossible (l'envoi continue quand même). */
export async function keepOutgoingCopy(
  pickedUri: string,
  localId: string,
): Promise<boolean> {
  if (!isNativeDownloadAvailable()) return false;
  const storage = getMediaStorage();
  return copyLocalFile(pickedUri, storage.localPath(localId));
}

/** Déplace la copie de `localId` vers `serverId`. */
export async function promoteOutgoingCopy(
  localId: string,
  serverId: string,
): Promise<void> {
  if (!isNativeDownloadAvailable()) return;
  const storage = getMediaStorage();
  if (!(await storage.exists(localId))) return;
  const ok = await copyLocalFile(
    storage.localPath(localId),
    storage.localPath(serverId),
  );
  if (ok) await storage.delete(localId);
}

/** Supprime la copie provisoire (envoi annulé ou renvoyé comme nouveau message). */
export async function dropOutgoingCopy(localId: string): Promise<void> {
  try {
    await getMediaStorage().delete(localId);
  } catch {
    // déjà absente
  }
}
