/**
 * Actions conversation L6d — pin / delete + tombstone archive (6bis-c).
 */
import {getRights, OWNER_ONLY_MESSAGE, READ_ONLY_MESSAGE} from '../../../core/access/rights';
import {
  pinConversation,
  deleteConversation,
  assignConversation,
  unassignConversation,
  getConversation,
} from '../../../core/api/endpoints/conversations';
import type {ConversationSummary} from '../../../core/realtime/events';
import {archiveTombstone, archiveUpsertConversations} from '../../../core/archive/hydrate';
import {fireAndForget} from '../../../core/utils/fireAndForget';
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
  fireAndForget(archiveTombstone('conversation', id, 'user_deleted'));
  return items.filter(c => c.id !== id);
}

export function removeConversationFromEvent(
  items: ConversationSummary[],
  id: string,
): ConversationSummary[] {
  fireAndForget(archiveTombstone('conversation', id, 'server_removed'));
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
  if (!getRights().canWrite) {
    ctx.set({error: READ_ONLY_MESSAGE});
    return;
  }
  const res = await pinConversation(id, pinned);
  if (!res.ok) {
    ctx.set({
      error: res.status === 0 ? texts.errorNetwork : texts.errorGeneric,
    });
    return;
  }
  const updated = res.data.conversation;
  fireAndForget(archiveUpsertConversations([updated]));
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
  if (!getRights().canOwn) {
    ctx.set({error: OWNER_ONLY_MESSAGE});
    return false;
  }
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

/**
 * Assigne (memberId) ou libère (null) une conversation d'entreprise.
 * Le Worker décrit l'état final : on relit la conversation plutôt que de le deviner.
 */
export async function doAssignConversation(
  id: string,
  memberId: string | null,
  ctx: Ctx,
): Promise<boolean> {
  if (!getRights().canWrite) {
    ctx.set({error: READ_ONLY_MESSAGE});
    return false;
  }
  const res =
    memberId === null
      ? await unassignConversation(id)
      : await assignConversation(id, memberId);
  if (!res.ok) {
    ctx.set({
      error:
        res.status === 0
          ? texts.errorNetwork
          : res.error.code === 'FORBIDDEN'
            ? READ_ONLY_MESSAGE
            : texts.errorGeneric,
    });
    return false;
  }
  const fresh = await getConversation(id);
  if (fresh.ok) {
    const updated = fresh.data.conversation;
    fireAndForget(archiveUpsertConversations([updated]));
    ctx.set(s => ({
      items: sortConversations(
        s.items.map(c => (c.id === id ? {...c, ...updated} : c)),
      ),
      error: null,
    }));
  }
  return true;
}
