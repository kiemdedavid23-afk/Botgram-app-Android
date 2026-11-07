/**
 * Actions groupées sur plusieurs échanges (sélection, menu ⋮).
 * S'appuient sur les actions unitaires existantes : même comportement qu'une par une.
 */
import {getRights} from '../../../core/access/rights';
import {markConversationRead} from '../../../core/api/endpoints/messages';
import {useConversationsStore} from './conversationsStore';
import {useArchiveStore} from './archiveStore';

const PARALLEL = 4;

/** Marque comme lus les échanges ayant des messages non lus (par lots de 4). */
export async function markConversationsRead(ids: string[]): Promise<void> {
  const store = useConversationsStore.getState();
  const targets = ids.filter(
    id => (store.items.find(c => c.id === id)?.unread_count ?? 0) > 0,
  );
  for (let i = 0; i < targets.length; i += PARALLEL) {
    const chunk = targets.slice(i, i + PARALLEL);
    await Promise.all(
      chunk.map(async id => {
        if (!getRights().canWrite) return;
        const res = await markConversationRead(id);
        if (!res.ok) return;
        useConversationsStore.getState().applyRealtimeEvent({
          type: 'conversation.read',
          id: `local-read-${id}`,
          at: Date.now(),
          conversation_id: id,
        });
      }),
    );
  }
}

/** « Tout marquer comme lu » : tous les échanges visibles (hors archivés). */
export async function markAllConversationsRead(): Promise<void> {
  const archived = useArchiveStore.getState().ids;
  const ids = useConversationsStore
    .getState()
    .items.filter(c => !archived[c.id])
    .map(c => c.id);
  await markConversationsRead(ids);
}

export async function pinConversations(
  ids: string[],
  pinned: boolean,
): Promise<void> {
  for (const id of ids) {
    const current = useConversationsStore
      .getState()
      .items.find(c => c.id === id);
    if (!current || !!current.pinned === pinned) continue;
    await useConversationsStore.getState().pinConversation(id, pinned);
  }
}

export function archiveConversations(ids: string[], archive: boolean): void {
  const store = useArchiveStore.getState();
  for (const id of ids) {
    if (archive) store.archive(id);
    else store.unarchive(id);
  }
}

export async function deleteConversations(ids: string[]): Promise<void> {
  for (const id of ids) {
    await useConversationsStore.getState().deleteConversation(id);
  }
}
