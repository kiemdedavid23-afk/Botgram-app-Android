/**
 * Actions conversation L6d — pin / delete.
 * removeConversationLocally : branche archive 6 bis.
 */
import {
  pinConversation,
  deleteConversation,
} from '../../../core/api/endpoints/conversations';
import type {ConversationSummary} from '../../../core/realtime/events';
import {conversationsTexts as texts} from '../texts';

type Slice = {
  items: ConversationSummary[];
  error: string | null;
};

type Ctx = {
  get: () => Slice;
  set: (
    p: Partial<Slice> | ((s: Slice) => Partial<Slice>),
  ) => void;
};

export function removeConversationLocally(
  items: ConversationSummary[],
  id: string,
): ConversationSummary[] {
  return items.filter(c => c.id !== id);
}

export function applyPinnedLocally(
  items: ConversationSummary[],
  id: string,
  pinned: boolean,
): ConversationSummary[] {
  return items.map(c =>
    c.id === id ? {...c, pinned, pinned_at: pinned ? Date.now() : null} : c,
  );
}

/** Tri épinglées d'abord puis last_message_at desc. */
export function sortConversations(
  items: ConversationSummary[],
): ConversationSummary[] {
  return [...items].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return (b.last_message_at ?? 0) - (a.last_message_at ?? 0);
  });
}

export async function doPinConversation(
  id: string,
  pinned: boolean,
  ctx: Ctx,
): Promise<void> {
  const res = await pinConversation(id, pinned);
  if (!res.ok) {
    ctx.set({
      error: res.status === 0 ? texts.errorNetwork : texts.errorGeneric,
    });
    return;
  }
  const updated = res.data.conversation;
  ctx.set(s => ({
    items: sortConversations(
      s.items.map(c => (c.id === id ? {...c, ...updated} : c)),
    ),
    error: null,
  }));
}

export async function doDeleteConversation(
  id: string,
  ctx: Ctx,
): Promise<boolean> {
  const res = await deleteConversation(id);
  if (!res.ok) {
    ctx.set({
      error: res.status === 0 ? texts.errorNetwork : texts.errorGeneric,
    });
    return false;
  }
  if (res.data.deleted) {
    ctx.set(s => ({
      items: removeConversationLocally(s.items, id),
      error: null,
    }));
    return true;
  }
  return false;
}
