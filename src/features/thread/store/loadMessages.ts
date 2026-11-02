/**
 * Chargement page 1 du fil : archive → réseau → upsert (6bis-b).
 */
import {listMessages} from '../../../core/api/endpoints/messages';
import type {Message} from '../../../core/realtime/events';
import {cacheGetString, cacheSetString} from '../../../core/storage';
import {
  archiveListMessages,
  archiveUpsertMessages,
} from '../../../core/archive/hydrate';
import {mergeMessages, sortMessagesAsc} from './mergeMessages';
import {threadTexts} from '../texts';
import {threadMetrics} from '../../../shared/theme/threadMetrics';

const CACHE_PREFIX = 'thread.messages.';
const cacheKey = (id: string) => `${CACHE_PREFIX}${id}`;

type LoadCtx = {
  conversationId: string;
  getConversationId: () => string | null;
  set: (partial: Record<string, unknown>) => void;
  getItems: () => Message[];
};

export async function loadThreadMessages(
  force: boolean,
  loading: boolean,
  ctx: LoadCtx,
): Promise<void> {
  const cid = ctx.conversationId;
  if (!cid) return;
  if (loading && !force) return;
  ctx.set({loading: true, error: null});

  const local = await archiveListMessages(cid, threadMetrics.cacheLimit);
  if (ctx.getConversationId() !== cid) return;
  if (local && local.length > 0) {
    ctx.set({items: sortMessagesAsc(local), offline: false});
  } else {
    const cached = await cacheGetString(cacheKey(cid));
    if (ctx.getConversationId() !== cid) return;
    if (cached) {
      try {
        const items = sortMessagesAsc(JSON.parse(cached) as Message[]);
        ctx.set({items, offline: false});
      } catch {
        /* */
      }
    }
  }

  const res = await listMessages(cid, {limit: threadMetrics.pageSize});
  if (ctx.getConversationId() !== cid) return;
  if (!res.ok) {
    ctx.set({
      loading: false,
      offline: res.status === 0,
      error:
        ctx.getItems().length === 0
          ? res.error.message || threadTexts.loadError
          : null,
    });
    return;
  }
  const items = sortMessagesAsc(res.data.items);
  await archiveUpsertMessages(items);
  const toCache = items.slice(-threadMetrics.cacheLimit);
  await cacheSetString(cacheKey(cid), JSON.stringify(toCache));
  if (ctx.getConversationId() !== cid) return;
  const merged =
    local && local.length > 0
      ? sortMessagesAsc(mergeMessages(local, items))
      : items;
  ctx.set({
    items: merged,
    nextCursor: res.data.next_cursor,
    loading: false,
    offline: false,
    error: null,
  });
}
