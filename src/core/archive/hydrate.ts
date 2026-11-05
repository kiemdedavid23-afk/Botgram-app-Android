/**
 * Helpers lecture/écriture archive pour les stores (6bis-b/c).
 */
import {getArchiveStore} from './ArchiveStore';
import type {ConversationSummary} from '../realtime/events';
import type {Message} from '../realtime/messageTypes';
import type {MessageSearchResult} from './ftsRepo';
import type {
  TombstoneEntity,
  TombstoneReason,
} from './tombstonesRepo';

let migrationSucceeded = false;

export async function ensureArchiveReady(): Promise<boolean> {
  try {
    const store = getArchiveStore();
    const res = await store.open();
    if (!res.ok) return false;
    if (!migrationSucceeded) {
      try {
        await store.migrateFromMmkv();
        migrationSucceeded = true;
      } catch {
        // réessai au prochain démarrage / appel
        migrationSucceeded = false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function archiveListConversations(
  botId: string,
): Promise<ConversationSummary[] | null> {
  try {
    if (!(await ensureArchiveReady())) return null;
    return await getArchiveStore().listConversations(botId);
  } catch {
    return null;
  }
}

export async function archiveUpsertConversations(
  items: ConversationSummary[],
): Promise<void> {
  try {
    if (!(await ensureArchiveReady())) return;
    await getArchiveStore().upsertConversations(items);
  } catch {
    /* archive indisponible */
  }
}

export async function archiveListMessages(
  conversationId: string,
  limit: number,
): Promise<Message[] | null> {
  try {
    if (!(await ensureArchiveReady())) return null;
    return await getArchiveStore().listMessages(conversationId, limit);
  } catch {
    return null;
  }
}

export async function archiveUpsertMessages(items: Message[]): Promise<void> {
  try {
    if (!(await ensureArchiveReady())) return;
    await getArchiveStore().upsertMessages(items);
  } catch {
    /* */
  }
}

export async function archiveTombstone(
  entityType: TombstoneEntity,
  entityId: string,
  reason: TombstoneReason,
): Promise<void> {
  try {
    if (!(await ensureArchiveReady())) return;
    await getArchiveStore().tombstone(entityType, entityId, reason);
  } catch {
    /* */
  }
}

export function resetArchiveHydrateForTests(): void {
  migrationSucceeded = false;
}

/** Recherche plein texte locale ; null si l'archive n'est pas disponible. */
export async function archiveSearchMessages(
  botId: string,
  query: string,
  limit: number,
): Promise<MessageSearchResult | null> {
  try {
    if (!(await ensureArchiveReady())) return null;
    return await getArchiveStore().searchMessages(botId, query, limit);
  } catch {
    return null;
  }
}
