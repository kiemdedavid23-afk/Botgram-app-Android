import {registerMemberDataCleaner} from '../utils/memberData';
import {getMediaStorage} from './MediaStorage';
import {mediaTempClearAll} from '../storage/mediaFiles';
import {clearMasterKey} from '../storage/secureStorage';

let done = false;

/** Boot : médias + dossier temp (13.5). */
export function registerMediaStorageCleaner(): void {
  if (done) return;
  done = true;
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
