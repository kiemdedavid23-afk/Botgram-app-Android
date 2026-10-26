import {registerMemberDataCleaner} from '../utils/memberData';
import {getArchiveStore} from './ArchiveStore';

let done = false;

/** Enregistre l'effacement archive dans le point unique 13.5. */
export function registerArchiveStoreCleaner(): void {
  if (done) return;
  done = true;
  registerMemberDataCleaner(async () => {
    try {
      const store = getArchiveStore();
      await store.clearAll();
      await store.close();
    } catch {
      // store pas encore branché en test
    }
  });
}
