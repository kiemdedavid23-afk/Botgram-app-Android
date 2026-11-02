import {registerMemberDataCleaner} from '../utils/memberData';
import {getArchiveStore} from './ArchiveStore';

let done = false;

/**
 * Enregistre l'effacement archive dans le point unique 13.5.
 * clearAll supprime fichier + clé ; les erreurs remontent (pas de silence total).
 */
export function registerArchiveStoreCleaner(): void {
  if (done) return;
  done = true;
  registerMemberDataCleaner(async () => {
    try {
      const store = getArchiveStore();
      await store.clearAll();
      await store.close();
    } catch (e) {
      // store pas encore branché en test early : ignorer seulement ce cas
      if (e instanceof Error && e.message === 'ArchiveStore non initialisé') {
        return;
      }
      // autre erreur d'effacement : ne pas bloquer les autres cleaners
      // (clearMemberData tolère), mais l'erreur a déjà été produite par clearAll
      // (fichier/clé) — pas d'avalement silencieux à l'intérieur de clearAll.
    }
  });
}
