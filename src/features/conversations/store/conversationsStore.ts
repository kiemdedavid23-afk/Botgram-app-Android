/**
 * Store conversations par bot actif (L5b).
 * Fusion par id, événements realtime, cache page 1 chiffré.
 */
import {create} from 'zustand';
import {
  listConversations,
  getConversation,
  searchConversations,
  type ConversationSummary,
} from '../../../core/api/endpoints/conversations';
import {
  cacheGetString,
  cacheSetString,
  cacheDelete,
} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {RealtimeEvent} from '../../../core/realtime';
import {sortItems, mergeById, displayTitle} from './merge';

const cacheKey = (botId: string) => `conversations.page1.${botId}`;

import type {FolderId} from './filters';
export type {FolderId} from './filters';

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
  /** Total non-lus bot actif (badge). */
  unreadTotal: number;
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
    set({loading: true, error: null});
    const res = await listConversations(botId, {limit: 50});
    if (!res.ok) {
      const cached = await cacheGetString(cacheKey(botId));
      if (cached) {
        try {
          const items = JSON.parse(cached) as ConversationSummary[];
          set({
            items: sortItems(items),
            loading: false,
            offline: true,
            error: null,
          });
          return;
        } catch {
          /* */
        }
      }
      set({
        loading: false,
        error: res.error.message || 'Erreur de chargement',
        offline: res.status === 0,
      });
      return;
    }
    const items = sortItems(res.data.items);
    await cacheSetString(cacheKey(botId), JSON.stringify(items));
    set({
      items,
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
    const res = await listConversations(botId, {
      limit: 50,
      cursor: nextCursor,
    });
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
    if (!botId || q.trim().length < 1) {
      set({searchItems: [], searching: false});
      return;
    }
    set({searching: true});
    const res = await searchConversations(botId, q.trim(), 30);
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
    const botId = get().botId;
    if (!botId) return;

    if (ev.type === 'updates') {
      const relevant = ev.conversations.filter(c => c.bot_id === botId);
      if (relevant.length > 0) {
        set(s => ({
          items: mergeById(s.items, relevant),
        }));
      }
      if (ev.unread[botId] !== undefined) {
        set({unreadTotal: ev.unread[botId] ?? 0});
      }
      return;
    }

    if (ev.type === 'message.new' || ev.type === 'message.updated') {
      if (ev.bot_id !== botId) return;
      if (ev.conversation) {
        const prev = get().items.find(i => i.id === ev.conversation!.id);
        const oldUnread = prev?.unread_count ?? 0;
        const newUnread = ev.conversation.unread_count ?? oldUnread;
        const delta = newUnread - oldUnread;
        set(s => ({
          items: mergeById(s.items, [ev.conversation!]),
          unreadTotal: Math.max(0, s.unreadTotal + delta),
        }));
      } else {
        fireAndForget(
          getConversation(ev.conversation_id).then(res => {
            if (!res.ok) return;
            const c = res.data.conversation;
            if (c.bot_id !== get().botId) return;
            set(s => ({
              items: mergeById(s.items, [c]),
            }));
          }),
        );
      }
      return;
    }

    if (ev.type === 'conversation.read') {
      set(s => {
        const prev = s.items.find(i => i.id === ev.conversation_id);
        const old = prev?.unread_count ?? 0;
        return {
          items: s.items.map(i =>
            i.id === ev.conversation_id ? {...i, unread_count: 0} : i,
          ),
          unreadTotal: Math.max(0, s.unreadTotal - old),
        };
      });
      return;
    }

    if (ev.type === 'conversation.changed') {
      if (ev.reason === 'removed') {
        set(s => ({
          items: s.items.filter(i => i.id !== ev.conversation_id),
        }));
        return;
      }
      if (ev.reason === 'pinned') {
        fireAndForget(
          getConversation(ev.conversation_id).then(res => {
            if (!res.ok) return;
            set(s => ({
              items: mergeById(s.items, [res.data.conversation], {
                bumpToTop: true,
              }),
            }));
          }),
        );
      }
      return;
    }

    if (ev.type === 'resync' && ev.scopes.includes('conversations')) {
      fireAndForget(get().load(true));
      return;
    }

    if (ev.type === 'bot.changed' && ev.bot_id === botId) {
      if (
        ev.reason === 'disconnected' ||
        ev.reason === 'deleted'
      ) {
        set({items: [], nextCursor: null, unreadTotal: 0});
      }
    }
  },

  clear() {
    const botId = get().botId;
    if (botId) fireAndForget(cacheDelete(cacheKey(botId)));
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
    });
  },
}));

registerMemberDataCleaner(() => {
  useConversationsStore.getState().clear();
});

export {selectFilteredItems, folderCounts} from './filters';
