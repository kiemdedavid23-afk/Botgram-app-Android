import {registerMemberDataCleaner} from '../utils/memberData';
import {getArchiveStore} from './ArchiveStore';

let done = false;

/**
 * Effacement archive dans le point unique 13.5.
 * Les erreurs de clearAll sont propagées (pas de catch vide).
 */
export function registerArchiveStoreCleaner(): void {
  if (done) return;
  done = true;
  registerMemberDataCleaner(async () => {
    const store = getArchiveStore();
    await store.clearAll();
    await store.close();
  });
}
