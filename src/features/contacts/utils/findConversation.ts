/**
 * Retrouve la conversation d'un contact : liste en mémoire, archive locale,
 * puis recherche serveur. Un contact n'a pas d'id de conversation propre.
 */
import type {Contact} from '../../../core/api/endpoints/contacts';
import {
  searchConversations,
  type ConversationSummary,
} from '../../../core/api/endpoints/conversations';
import {archiveListConversations} from '../../../core/archive/hydrate';
import {useConversationsStore} from '../../conversations/store/conversationsStore';

function normalizeUser(u: string | null | undefined): string {
  return (u ?? '').replace(/^@/, '').trim().toLowerCase();
}

/** Lien explicite (contact_id) ; à défaut, discussion privée de même pseudo. */
export function matchesContact(
  conv: ConversationSummary,
  contact: Contact,
): boolean {
  if (conv.contact_id && conv.contact_id === contact.id) return true;
  if (conv.contact_id) return false;
  const user = normalizeUser(contact.username);
  return (
    user.length > 0 &&
    (conv.chat_type ?? 'private') === 'private' &&
    normalizeUser(conv.username) === user
  );
}

function pick(
  list: ConversationSummary[],
  contact: Contact,
): ConversationSummary | null {
  return list.find(c => matchesContact(c, contact)) ?? null;
}

async function viaArchive(
  botId: string,
  contact: Contact,
): Promise<ConversationSummary | null> {
  const local = await archiveListConversations(botId);
  return local ? pick(local, contact) : null;
}

async function viaServer(
  botId: string,
  contact: Contact,
): Promise<ConversationSummary | null> {
  const term = contact.username?.replace(/^@/, '') || contact.first_name || '';
  if (!term) return null;
  const res = await searchConversations(botId, term, 30);
  return res.ok ? pick(res.data.items, contact) : null;
}

export async function findConversationForContact(
  botId: string,
  contact: Contact,
): Promise<ConversationSummary | null> {
  const loaded = pick(useConversationsStore.getState().items, contact);
  if (loaded) return loaded;
  const archived = await viaArchive(botId, contact);
  if (archived) return archived;
  return viaServer(botId, contact);
}
