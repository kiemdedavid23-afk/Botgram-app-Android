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
import {
  doSend,
  doSendContact,
  doSendLocation,
  type LocationDraft,
  type ContactDraft,
  doRetry,
  doResendAsNew,
  doResendSameId,
  doMarkRead,
  upsertOutgoing,
} from './sendActions';
import {
  doSendMedia,
  doResendMediaAsNew,
  clearPendingMedia,
} from './sendMediaActions';
import type {PickedFile} from './sendMediaActions';
import {doDeleteOutgoing} from './messageActions';
import {reloadPage1Merge} from './reloadPage1';

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
  sending: boolean;
  sendError: string | null;
  lastReadMarked: boolean;
  send: (text: string) => Promise<void>;
  retry: (messageId: string) => Promise<void>;
  resendAsNew: (message: Message) => Promise<void>;
  resendSameId: (message: Message) => Promise<void>;
  markRead: () => Promise<void>;
  sendMedia: (files: PickedFile[], caption: string, signal?: AbortSignal) => Promise<void>;
  sendContact: (contact: ContactDraft) => Promise<void>;
  sendLocation: (loc: LocationDraft) => Promise<void>;
  resendMedia: (message: Message) => Promise<void>;
  deleteOutgoing: (message: Message) => Promise<void>;
};

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
  sending: false,
  sendError: null,
  lastReadMarked: false,

  open({conversationId, title, photoUrl, initials}) {
    clearPendingMedia();
    set({
      conversationId,
      title: title ?? '',
      photoUrl: photoUrl ?? null,
      initials: initials ?? null,
      items: [],
      nextCursor: null,
      error: null,
      offline: false,
      sending: false,
      sendError: null,
      lastReadMarked: false,
    });
    fireAndForget(get().load(true));
    fireAndForget(get().markRead());
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
        const msg = ev.message;
        set(s => ({
          items:
            msg.direction === 'out'
              ? upsertOutgoing(s.items, msg)
              : mergeMessages(s.items, [msg]),
        }));
        if (msg.direction === 'in') {
          set({lastReadMarked: false});
          fireAndForget(get().markRead());
        }
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
        const msg = ev.message;
        set(s => ({
          items:
            msg.direction === 'out'
              ? upsertOutgoing(s.items, msg)
              : mergeMessages(s.items, [msg]),
        }));
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

  async send(text: string) {
    await doSend(text, undefined, {get, set});
  },

  async retry(messageId: string) {
    await doRetry(messageId, {get, set});
  },

  async resendAsNew(message: Message) {
    await doResendAsNew(message, {get, set});
  },

  async resendSameId(message: Message) {
    await doResendSameId(message, {get, set});
  },

  async markRead() {
    await doMarkRead({get, set});
  },

  async sendLocation(loc: LocationDraft) {
    await doSendLocation(loc, undefined, {get, set});
  },

  async sendContact(contact: ContactDraft) {
    await doSendContact(contact, undefined, {get, set});
  },

  async sendMedia(files, caption, signal) {
    await doSendMedia(files, caption, {get, set}, signal);
  },

  async resendMedia(message: Message) {
    await doResendMediaAsNew(message, {get, set});
  },

  async deleteOutgoing(message: Message) {
    await doDeleteOutgoing(message, {get, set});
  },

  clear() {
    clearPendingMedia();
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
      sending: false,
      sendError: null,
      lastReadMarked: false,
    });
  },
}));

registerMemberDataCleaner(() => {
  useThreadStore.getState().clear();
});
