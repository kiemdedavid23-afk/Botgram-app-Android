/** Épinglage de Botfactor dans la liste Échanges (persisté localement). */
import {create} from 'zustand';
import {cacheGetString, cacheSetString} from '../../../core/storage';
import {fireAndForget} from '../../../core/utils/fireAndForget';

const STORAGE_KEY = 'botfactor.list.pinned';

type ListStore = {
  pinned: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPinned: (pinned: boolean) => void;
};

export const useBotfactorListStore = create<ListStore>((set, get) => ({
  // Par défaut épinglé : Botfactor reste en haut comme avant.
  pinned: true,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await cacheGetString(STORAGE_KEY);
      if (raw !== undefined) set({pinned: raw === '1'});
    } catch {
      // Lecture impossible : on garde la valeur par défaut.
    }
    set({hydrated: true});
  },
  setPinned: pinned => {
    set({pinned});
    fireAndForget(
      cacheSetString(STORAGE_KEY, pinned ? '1' : '0').catch(() => undefined),
    );
  },
}));
