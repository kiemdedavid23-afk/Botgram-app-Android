/**
 * Contacts du bot courant : liste paginée, recherche, cache première page.
 * Effacé à la déconnexion / fin de session (13.5).
 */
import {create} from 'zustand';
import {
  listContacts,
  searchContacts,
  type Contact,
} from '../../../core/api/endpoints/contacts';
import {
  cacheGetString,
  cacheSetString,
  cacheDeleteByPrefix,
} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {contactsTexts} from '../texts';
import {contactsMetrics as cmx} from '../../../shared/theme/contactsMetrics';

const CACHE_PREFIX = 'contacts.page1.';
const cacheKey = (botId: string) => `${CACHE_PREFIX}${botId}`;

type ContactsStore = {
  botId: string | null;
  items: Contact[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  offline: boolean;
  searchItems: Contact[];
  searching: boolean;
  setBotId: (id: string | null) => void;
  load: () => Promise<void>;
  loadMore: () => Promise<void>;
  search: (q: string) => Promise<void>;
  clearSearch: () => void;
  clear: () => void;
};

/** Ajoute à `base` les contacts de `extra` dont l'id n'y est pas déjà. */
export function appendUnique(base: Contact[], extra: Contact[]): Contact[] {
  const seen = new Set(base.map(c => c.id));
  return [...base, ...extra.filter(c => !seen.has(c.id))];
}

async function readCache(botId: string): Promise<Contact[] | null> {
  const raw = await cacheGetString(cacheKey(botId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Contact[];
  } catch {
    return null;
  }
}

const EMPTY = {
  items: [] as Contact[],
  nextCursor: null,
  loading: false,
  loadingMore: false,
  error: null,
  offline: false,
  searchItems: [] as Contact[],
  searching: false,
};

export const useContactsStore = create<ContactsStore>((set, get) => ({
  botId: null,
  ...EMPTY,

  setBotId(id) {
    if (get().botId === id) return;
    set({botId: id, ...EMPTY});
    if (id) fireAndForget(get().load());
  },

  async load() {
    const botId = get().botId;
    if (!botId) return;
    set({loading: true, error: null});
    const res = await listContacts(botId, {limit: cmx.pageSize});
    if (get().botId !== botId) return;
    if (!res.ok) {
      const cached = get().items.length === 0 ? await readCache(botId) : null;
      if (get().botId !== botId) return;
      set({
        items: cached ?? get().items,
        loading: false,
        offline: res.status === 0,
        error:
          (cached ?? get().items).length === 0
            ? res.error.message || contactsTexts.loadError
            : null,
      });
      return;
    }
    fireAndForget(cacheSetString(cacheKey(botId), JSON.stringify(res.data.items)));
    set({
      items: res.data.items,
      nextCursor: res.data.next_cursor,
      loading: false,
      offline: false,
      error: null,
    });
  },

  async loadMore() {
    const {botId, nextCursor, loadingMore, items} = get();
    if (!botId || !nextCursor || loadingMore) return;
    set({loadingMore: true});
    const res = await listContacts(botId, {
      limit: cmx.pageSize,
      cursor: nextCursor,
    });
    if (get().botId !== botId) {
      set({loadingMore: false});
      return;
    }
    if (!res.ok) {
      set({loadingMore: false});
      return;
    }
    set({
      items: appendUnique(items, res.data.items),
      nextCursor: res.data.next_cursor,
      loadingMore: false,
    });
  },

  async search(q) {
    const botId = get().botId;
    const query = q.trim();
    if (!botId || query.length < 1) {
      set({searchItems: [], searching: false});
      return;
    }
    set({searching: true});
    const res = await searchContacts(botId, query, cmx.searchLimit);
    if (get().botId !== botId) return;
    if (!res.ok) {
      set({searching: false, searchItems: []});
      return;
    }
    set({searching: false, searchItems: res.data.items});
  },

  clearSearch() {
    set({searchItems: [], searching: false});
  },

  clear() {
    fireAndForget(cacheDeleteByPrefix(CACHE_PREFIX));
    set({botId: null, ...EMPTY});
  },
}));

registerMemberDataCleaner(() => {
  useContactsStore.getState().clear();
});
