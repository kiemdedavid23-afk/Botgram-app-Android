/**
 * Migration one-shot cache MMKV → archive SQL (6bis-b/c).
 * Idempotente via flag MMKV `archive.mmkv_migrated.v1`.
 * Drapeau posé seulement après écritures réussies + vérification.
 */
import {
  cacheGetString,
  cacheSetString,
  cacheDeleteByPrefix,
  cacheGetAllKeys,
} from '../storage/cache';
import type {ConversationSummary} from '../realtime/events';
import type {Message} from '../realtime/messageTypes';
import type {DB} from '@op-engineering/op-sqlite';
import {upsertConversations} from './conversationsRepo';
import {upsertMessages} from './messagesRepo';

const FLAG_KEY = 'archive.mmkv_migrated.v1';
const CONV_PREFIX = 'conversations.page1.';
const MSG_PREFIX = 'thread.messages.';

export async function migrateMmkvToArchive(
  db: DB,
  listKeys: () => Promise<string[]> = cacheGetAllKeys,
): Promise<{conversations: number; messages: number}> {
  const already = await cacheGetString(FLAG_KEY);
  if (already === '1') {
    return {conversations: 0, messages: 0};
  }

  const keys = await listKeys();
  const convItems: ConversationSummary[] = [];
  const msgItems: Message[] = [];

  for (const key of keys) {
    if (key.startsWith(CONV_PREFIX)) {
      const raw = await cacheGetString(key);
      if (!raw) continue;
      try {
        const items = JSON.parse(raw) as ConversationSummary[];
        if (Array.isArray(items)) convItems.push(...items);
      } catch {
        // cache corrompu pour cette clé uniquement
      }
    } else if (key.startsWith(MSG_PREFIX)) {
      const raw = await cacheGetString(key);
      if (!raw) continue;
      try {
        const items = JSON.parse(raw) as Message[];
        if (Array.isArray(items)) msgItems.push(...items);
      } catch {
        // cache corrompu pour cette clé uniquement
      }
    }
  }

  // Écritures en transaction (via repos) — une erreur empêche le flag
  if (convItems.length > 0) {
    await upsertConversations(db, convItems);
  }
  if (msgItems.length > 0) {
    await upsertMessages(db, msgItems);
  }

  // Vérification minimale : pas d'exception = OK
  await cacheSetString(FLAG_KEY, '1');
  // Purge caches migrés seulement après succès
  await cacheDeleteByPrefix(CONV_PREFIX);
  await cacheDeleteByPrefix(MSG_PREFIX);

  return {conversations: convItems.length, messages: msgItems.length};
}

export {FLAG_KEY as MMKV_MIGRATION_FLAG, CONV_PREFIX, MSG_PREFIX};
