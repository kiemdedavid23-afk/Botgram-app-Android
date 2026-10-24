/**
 * Store conversations par bot actif (L5b).
 * Fusion par id, événements realtime, cache page 1 chiffré.
 */
import {create} from 'zustand';
import {
  listConversations,
  searchConversations,
  type ConversationSummary,
} from '../../../core/api/endpoints/conversations';
import {
  cacheGetString,
  cacheSetString,
  cacheDeleteByPrefix,
} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {RealtimeEvent} from '../../../core/realtime';
import {sortItems, mergeById, displayTitle} from './merge';
import type {FolderId} from './filters';
import {conversationsTexts} from '../texts';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';

/** Délai de fraîcheur avant rechargement auto (ms). */
const FRESH_MS = cm.listFreshMs;
import {applyRealtimeEventToStore} from './applyEvent';

const CACHE_PREFIX = 'conversations.page1.';
const cacheKey = (botId: string) => `${CACHE_PREFIX}${botId}`;

type ConversationsStore = {
  botId: string | null;
  items: ConversationSummary[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  offline: boolean;
  searchQuery: string;
  searchItems: ConversationSummary[];
  searching: boolean;
  folder: FolderId;
  unreadTotal: number;
  lastLoadedAt: number;
  setBotId: (id: string | null) => void;
  setFolder: (f: FolderId) => void;
  setSearchQuery: (q: string) => void;
  load: (force?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  search: (q: string) => Promise<void>;
  clearSearch: () => void;
  applyRealtimeEvent: (ev: RealtimeEvent) => void;
  clear: () => void;
};

export function conversationTitle(c: ConversationSummary): string {
  return displayTitle(c);
}

export const useConversationsStore = create<ConversationsStore>((set, get) => ({
  botId: null,
  items: [],
  nextCursor: null,
  loading: false,
  loadingMore: false,
  error: null,
  offline: false,
  searchQuery: '',
  searchItems: [],
  searching: false,
  folder: 'all',
  unreadTotal: 0,
  lastLoadedAt: 0,

  setBotId(id) {
    if (get().botId === id) return;
    set({
      botId: id,
      items: [],
      nextCursor: null,
      error: null,
      searchQuery: '',
      searchItems: [],
      unreadTotal: 0,
      lastLoadedAt: 0,
    });
    if (id) fireAndForget(get().load(true));
  },

  setFolder(f) {
    set({folder: f});
  },

  setSearchQuery(q) {
    set({searchQuery: q});
  },

  async load(force = false) {
    const botId = get().botId;
    if (!botId) return;
    if (get().loading && !force) return;
    // Données fraîches (< 30 s) : pas de rechargement inutile
    if (
      !force &&
      get().lastLoadedAt > 0 &&
      Date.now() - get().lastLoadedAt < FRESH_MS &&
      get().items.length > 0
    ) {
      return;
    }
    set({loading: true, error: null});
    const res = await listConversations(botId, {limit: 50});
    if (get().botId !== botId) return;
    if (!res.ok) {
      const key = cacheKey(botId);
      const cached = await cacheGetString(key);
      if (get().botId !== botId) return;
      if (cached) {
        try {
          const items = JSON.parse(cached) as ConversationSummary[];
          set({
            items: sortItems(items),
            loading: false,
            offline: res.status === 0,
            error: null,
          });
          return;
        } catch {
          /* */
        }
      }
      set({
        loading: false,
        error: res.error.message || conversationsTexts.loadError,
        offline: res.status === 0,
      });
      return;
    }
    const items = sortItems(res.data.items);
    const key = cacheKey(botId);
    await cacheSetString(key, JSON.stringify(items));
    if (get().botId !== botId) return;
    set({
      items,
      nextCursor: res.data.next_cursor,
      loading: false,
      offline: false,
      error: null,
      lastLoadedAt: Date.now(),
    });
  },

  async loadMore() {
    const {botId, nextCursor, loadingMore, items} = get();
    if (!botId || !nextCursor || loadingMore) return;
    set({loadingMore: true});
    const res = await listConversations(botId, {
      limit: 50,
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
      items: mergeById(items, res.data.items),
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
    const res = await searchConversations(botId, query, 30);
    if (get().botId !== botId) {
      set({searching: false});
      return;
    }
    if (get().searchQuery.trim() !== query) {
      set({searching: false});
      return;
    }
    if (!res.ok) {
      set({searching: false, searchItems: []});
      return;
    }
    set({
      searching: false,
      searchItems: res.data.items.map(i => ({
        ...i,
        unread_count: 0,
        last_message_text: i.last_message_text ?? null,
      })),
    });
  },

  clearSearch() {
    set({searchQuery: '', searchItems: [], searching: false});
  },

  applyRealtimeEvent(ev) {
    applyRealtimeEventToStore(ev, {
      get,
      set,
      load: (force?: boolean) => get().load(force),
    });
  },

  clear() {
    fireAndForget(cacheDeleteByPrefix(CACHE_PREFIX));
    set({
      botId: null,
      items: [],
      nextCursor: null,
      loading: false,
      loadingMore: false,
      error: null,
      offline: false,
      searchQuery: '',
      searchItems: [],
      searching: false,
      folder: 'all',
      unreadTotal: 0,
      lastLoadedAt: 0,
    });
  },
}));

registerMemberDataCleaner(() => {
  useConversationsStore.getState().clear();
});

export {selectFilteredItems, folderCounts} from './filters';
export type {FolderId} from './filters';
