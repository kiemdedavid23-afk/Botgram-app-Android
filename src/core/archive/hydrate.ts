/**
 * Helpers lecture/écriture archive pour les stores (6bis-b).
 * core n'importe pas features.
 */
import {getArchiveStore} from './ArchiveStore';
import type {ConversationSummary} from '../realtime/events';
import type {Message} from '../realtime/messageTypes';

let migrationStarted = false;

/** open + migration MMKV une fois (best-effort, pas de throw vers l'UI). */
export async function ensureArchiveReady(): Promise<boolean> {
  try {
    const store = getArchiveStore();
    const res = await store.open();
    if (!res.ok) return false;
    if (!migrationStarted) {
      migrationStarted = true;
      await store.migrateFromMmkv();
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
    // archive indisponible : le store garde la mémoire
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
    // ignore
  }
}

/** Tests uniquement. */
export function resetArchiveHydrateForTests(): void {
  migrationStarted = false;
}
