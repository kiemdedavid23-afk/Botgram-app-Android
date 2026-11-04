import {registerMemberDataCleaner} from '../utils/memberData';
import {getMediaStorage} from './MediaStorage';
import {
  mediaTempClearAll,
  setMediaPlainResolver,
} from '../storage/mediaFiles';
import {clearMasterKey} from '../storage/secureStorage';
import {materializeTempPlain} from '../crypto/mediaCipher';

let done = false;

/** Boot : médias + dossier temp (13.5) + résolveur d'ouverture déchiffrée. */
export function registerMediaStorageCleaner(): void {
  if (done) {
    return;
  }
  done = true;
  setMediaPlainResolver(materializeTempPlain);
  registerMemberDataCleaner(async () => {
    await getMediaStorage().clearAll();
  });
  registerMemberDataCleaner(async () => {
    await mediaTempClearAll();
  });
  registerMemberDataCleaner(async () => {
    await clearMasterKey();
  });
}

/** Purge temp au démarrage (appelé depuis App). */
export async function purgeMediaTempOnBoot(): Promise<void> {
  await mediaTempClearAll();
}
