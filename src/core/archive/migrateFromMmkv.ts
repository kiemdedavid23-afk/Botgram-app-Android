/**
 * Migration one-shot cache MMKV → archive SQL (6bis-b).
 * Idempotente via flag MMKV `archive.mmkv_migrated.v1`.
 * Un message reçu par le temps réel pendant la migration est upserté
 * ensuite par id (pas de perte).
 */
import {cacheGetString, cacheSetString} from '../storage/cache';
import type {ConversationSummary} from '../realtime/events';
import type {Message} from '../realtime/messageTypes';
import type {DB} from '@op-engineering/op-sqlite';
import {upsertConversations} from './conversationsRepo';
import {upsertMessages} from './messagesRepo';

const FLAG_KEY = 'archive.mmkv_migrated.v1';
const CONV_PREFIX = 'conversations.page1.';
const MSG_PREFIX = 'thread.messages.';

/**
 * Lit toutes les clés MMKV connues (page1 conversations + fils).
 * MMKV n'expose getAllKeys que via l'instance — on parcourt les préfixes
 * déjà utilisés par les stores (botIds / conversationIds non listables
 * exhaustivement sans getAllKeys). On utilise donc cacheDeleteByPrefix
 * après migration et on lit via une API dédiée.
 */
export async function migrateMmkvToArchive(
  db: DB,
  listKeys: () => Promise<string[]>,
): Promise<{conversations: number; messages: number}> {
  const already = await cacheGetString(FLAG_KEY);
  if (already === '1') {
    return {conversations: 0, messages: 0};
  }

  const keys = await listKeys();
  let convCount = 0;
  let msgCount = 0;

  for (const key of keys) {
    if (key.startsWith(CONV_PREFIX)) {
      const raw = await cacheGetString(key);
      if (!raw) continue;
      try {
        const items = JSON.parse(raw) as ConversationSummary[];
        if (Array.isArray(items) && items.length > 0) {
          await upsertConversations(db, items);
          convCount += items.length;
        }
      } catch {
        // cache corrompu : on ignore cette clé
      }
    } else if (key.startsWith(MSG_PREFIX)) {
      const raw = await cacheGetString(key);
      if (!raw) continue;
      try {
        const items = JSON.parse(raw) as Message[];
        if (Array.isArray(items) && items.length > 0) {
          await upsertMessages(db, items);
          msgCount += items.length;
        }
      } catch {
        // cache corrompu
      }
    }
  }

  await cacheSetString(FLAG_KEY, '1');
  // Les anciens caches page1/thread restent lisibles en secours jusqu'au
  // prochain clearMemberData ; on ne les efface pas ici pour éviter une
  // fenêtre vide si l'upsert a partiellement échoué.
  return {conversations: convCount, messages: msgCount};
}

export {FLAG_KEY as MMKV_MIGRATION_FLAG, CONV_PREFIX, MSG_PREFIX};
