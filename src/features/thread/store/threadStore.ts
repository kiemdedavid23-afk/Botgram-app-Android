/**
 * Store fil de messages (L5c) — conversation ouverte uniquement.
 */
import {create} from 'zustand';
import {listMessages} from '../../../core/api/endpoints/messages';
import type {Message} from '../../../core/realtime/events';
import type {RealtimeEvent} from '../../../core/realtime';
import {
  cacheGetString,
  cacheSetString,
  cacheDeleteByPrefix,
} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {mergeMessages, sortMessagesAsc} from './mergeMessages';
import {threadTexts} from '../texts';
import {threadMetrics} from '../../../shared/theme/threadMetrics';

const CACHE_PREFIX = 'thread.messages.';
const cacheKey = (id: string) => `${CACHE_PREFIX}${id}`;

type ThreadStore = {
  conversationId: string | null;
  title: string;
  photoUrl: string | null;
  initials: string | null;
  items: Message[];
  nextCursor: string | null;
  loading: boolean;
  loadingOlder: boolean;
  error: string | null;
  offline: boolean;
  open: (args: {
    conversationId: string;
    title?: string;
    photoUrl?: string | null;
    initials?: string | null;
  }) => void;
  close: () => void;
  load: (force?: boolean) => Promise<void>;
  loadOlder: () => Promise<void>;
  applyRealtimeEvent: (ev: RealtimeEvent) => void;
  clear: () => void;
};


/** Recharge page 1 et fusionne sans jeter les pages plus anciennes. */
async function reloadPage1Merge(
  get: () => {
    conversationId: string | null;
    items: Message[];
    nextCursor: string | null;
  },
  set: (
    partial:
      | Partial<{
          items: Message[];
          nextCursor: string | null;
          offline: boolean;
          error: string | null;
        }>
      | ((s: {
          items: Message[];
          nextCursor: string | null;
        }) => Partial<{
          items: Message[];
          nextCursor: string | null;
          offline: boolean;
          error: string | null;
        }>),
  ) => void,
): Promise<void> {
  const cid = get().conversationId;
  if (!cid) return;
  const res = await listMessages(cid, {limit: threadMetrics.pageSize});
  if (get().conversationId !== cid || !res.ok) return;
  const page1 = res.data.items;
  set(s => {
    const merged = mergeMessages(s.items, page1);
    const toCache = merged.slice(-threadMetrics.cacheLimit);
    fireAndForget(cacheSetString(cacheKey(cid), JSON.stringify(toCache)));
    const keepCursor =
      s.nextCursor !== null && s.items.length > page1.length
        ? s.nextCursor
        : res.data.next_cursor;
    return {
      items: merged,
      nextCursor: keepCursor,
      offline: false,
      error: null,
    };
  });
}

export const useThreadStore = create<ThreadStore>((set, get) => ({
  conversationId: null,
  title: '',
  photoUrl: null,
  initials: null,
  items: [],
  nextCursor: null,
  loading: false,
  loadingOlder: false,
  error: null,
  offline: false,

  open({conversationId, title, photoUrl, initials}) {
    set({
      conversationId,
      title: title ?? '',
      photoUrl: photoUrl ?? null,
      initials: initials ?? null,
      items: [],
      nextCursor: null,
      error: null,
      offline: false,
    });
    fireAndForget(get().load(true));
  },

  close() {
    set({
      conversationId: null,
      title: '',
      photoUrl: null,
      initials: null,
      items: [],
      nextCursor: null,
      loading: false,
      loadingOlder: false,
      error: null,
      offline: false,
    });
  },

  async load(force = false) {
    const cid = get().conversationId;
    if (!cid) return;
    if (get().loading && !force) return;
    set({loading: true, error: null});

    // Cache d'abord
    const cached = await cacheGetString(cacheKey(cid));
    if (get().conversationId !== cid) return;
    if (cached) {
      try {
        const items = sortMessagesAsc(JSON.parse(cached) as Message[]);
        set({items, offline: false});
      } catch {
        /* */
      }
    }

    const res = await listMessages(cid, {limit: threadMetrics.pageSize});
    if (get().conversationId !== cid) return;
    if (!res.ok) {
      set({
        loading: false,
        offline: res.status === 0,
        error:
          get().items.length === 0
            ? res.error.message || threadTexts.loadError
            : null,
      });
      return;
    }
    const items = sortMessagesAsc(res.data.items);
    const toCache = items.slice(-threadMetrics.cacheLimit);
    await cacheSetString(cacheKey(cid), JSON.stringify(toCache));
    if (get().conversationId !== cid) return;
    set({
      items,
      nextCursor: res.data.next_cursor,
      loading: false,
      offline: false,
      error: null,
    });
  },

  async loadOlder() {
    const {conversationId: cid, nextCursor, loadingOlder, items} = get();
    if (!cid || !nextCursor || loadingOlder) return;
    set({loadingOlder: true});
    const res = await listMessages(cid, {
      limit: threadMetrics.pageSize,
      cursor: nextCursor,
    });
    if (get().conversationId !== cid) {
      set({loadingOlder: false});
      return;
    }
    if (!res.ok) {
      set({loadingOlder: false});
      return;
    }
    set({
      items: mergeMessages(items, res.data.items),
      nextCursor: res.data.next_cursor,
      loadingOlder: false,
    });
  },

  applyRealtimeEvent(ev) {
    const cid = get().conversationId;
    if (!cid) return;

    if (ev.type === 'message.new') {
      if (ev.conversation_id !== cid) return;
      if (ev.message) {
        set(s => ({items: mergeMessages(s.items, [ev.message!])}));
      } else {
        fireAndForget(reloadPage1Merge(get, set));
      }
      return;
    }

    if (ev.type === 'message.updated') {
      if (ev.conversation_id !== cid) return;
      if (ev.reason === 'deleted' && !ev.message) {
        set(s => ({
          items: s.items.filter(m => m.id !== ev.message_id),
        }));
        return;
      }
      if (ev.message) {
        set(s => ({items: mergeMessages(s.items, [ev.message!])}));
      }
      return;
    }

    if (ev.type === 'updates') {
      const hit = ev.conversations.some(c => c.id === cid);
      if (!hit) return;
      fireAndForget(reloadPage1Merge(get, set));
      return;
    }

    if (ev.type === 'resync' && ev.scopes.includes('conversations')) {
      fireAndForget(reloadPage1Merge(get, set));
    }
  },

  clear() {
    fireAndForget(cacheDeleteByPrefix(CACHE_PREFIX));
    set({
      conversationId: null,
      title: '',
      photoUrl: null,
      initials: null,
      items: [],
      nextCursor: null,
      loading: false,
      loadingOlder: false,
      error: null,
      offline: false,
    });
  },
}));

registerMemberDataCleaner(() => {
  useThreadStore.getState().clear();
});
