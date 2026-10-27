/**
 * Archive locale des conversations (masquage liste principale).
 * Pas d'API serveur — dossier spécial « Archive ».
 */
import {create} from 'zustand';
import {
  cacheGetString,
  cacheSetString,
  cacheDelete,
} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {fireAndForget} from '../../../core/utils/fireAndForget';

const STORAGE_KEY = 'conversations.archived.ids';

type ArchiveStore = {
  /** ids archivés */
  ids: Record<string, true>;
  /** incrémenté à chaque mutation (force re-render listes) */
  revision: number;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isArchived: (id: string) => boolean;
  archive: (id: string) => void;
  unarchive: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
};

function persist(ids: Record<string, true>): void {
  fireAndForget(
    cacheSetString(STORAGE_KEY, JSON.stringify(Object.keys(ids))).catch(
      () => undefined,
    ),
  );
}

export const useArchiveStore = create<ArchiveStore>((set, get) => ({
  ids: {},
  revision: 0,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await cacheGetString(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw) as string[];
        const ids: Record<string, true> = {};
        for (const id of list) {
          if (typeof id === 'string' && id.length > 0) ids[id] = true;
        }
        set({ids, hydrated: true, revision: get().revision + 1});
        return;
      }
    } catch {
      // ignore
    }
    set({hydrated: true});
  },

  isArchived: (id: string) => !!get().ids[id],

  archive: (id: string) => {
    if (get().ids[id]) return;
    const ids = {...get().ids, [id]: true as const};
    set({ids, revision: get().revision + 1});
    persist(ids);
  },

  unarchive: (id: string) => {
    if (!get().ids[id]) return;
    const ids = {...get().ids};
    delete ids[id];
    set({ids, revision: get().revision + 1});
    persist(ids);
  },

  toggle: (id: string) => {
    if (get().ids[id]) get().unarchive(id);
    else get().archive(id);
  },

  clear: () => {
    set({ids: {}, revision: get().revision + 1});
    fireAndForget(cacheDelete(STORAGE_KEY).catch(() => undefined));
  },
}));

registerMemberDataCleaner(() => {
  useArchiveStore.getState().clear();
});
