/**
 * Implémentation ArchiveStore via @op-engineering/op-sqlite + SQLCipher.
 * SEUL fichier qui importe op-sqlite (hors tests/mocks).
 * 6bis-b : ensureOpen single-flight, clearAll fichier+clé, schéma métier.
 */
import {open, type DB} from '@op-engineering/op-sqlite';
import {
  getOrCreateArchiveKey,
  getArchiveKeyIfExists,
  clearArchiveKey,
} from '../storage/secureStorage';
import {cacheGetAllKeys} from '../storage/cache';
import type {ArchiveOpenResult, ArchiveStore} from './ArchiveStore';
import {ARCHIVE_DB_NAME} from './schema';
import {runMigrations} from './migrations';
import {
  upsertConversations as repoUpsertConversations,
  listConversationsForBot,
} from './conversationsRepo';
import {
  upsertMessages as repoUpsertMessages,
  listMessagesForConversation,
} from './messagesRepo';
import {migrateMmkvToArchive} from './migrateFromMmkv';
import type {ConversationSummary} from '../realtime/events';
import type {Message} from '../realtime/messageTypes';

let db: DB | null = null;
/** Promesse d'ouverture en cours — un seul open concurrent. */
let openPromise: Promise<DB> | null = null;
let lastOpenError: ArchiveOpenResult | null = null;

async function openConnection(): Promise<DB> {
  const key = await getOrCreateArchiveKey();
  const conn = open({
    name: ARCHIVE_DB_NAME,
    encryptionKey: key,
  });
  // table de preuve 6bis-a conservée
  await conn.execute(
    `CREATE TABLE IF NOT EXISTS archive_proof (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );`,
  );
  await runMigrations(conn);
  return conn;
}

/**
 * Une seule connexion ; appels simultanés partagent la même promesse.
 * En cas d'échec (clé/base illisible), lastOpenError est renseigné.
 */
async function ensureOpen(): Promise<DB> {
  if (db) return db;
  if (openPromise) return openPromise;
  openPromise = (async () => {
    try {
      const conn = await openConnection();
      db = conn;
      lastOpenError = null;
      return conn;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'open_failed';
      lastOpenError = {ok: false, reason: 'unreadable', message};
      openPromise = null;
      throw e;
    }
  })();
  return openPromise;
}

export function createOpSqliteArchiveStore(): ArchiveStore {
  return {
    async open(): Promise<ArchiveOpenResult> {
      try {
        await ensureOpen();
        return {ok: true};
      } catch (e) {
        if (lastOpenError) return lastOpenError;
        const message = e instanceof Error ? e.message : 'open_failed';
        return {ok: false, reason: 'error', message};
      }
    },

    async close() {
      openPromise = null;
      if (db) {
        db.close();
        db = null;
      }
    },

    isOpen() {
      return db !== null;
    },

    async proofInsert(label: string) {
      const conn = await ensureOpen();
      await conn.execute(
        'INSERT INTO archive_proof (label, created_at) VALUES (?, ?);',
        [label, Date.now()],
      );
    },

    async proofCount() {
      const conn = await ensureOpen();
      const res = await conn.execute(
        'SELECT COUNT(*) AS c FROM archive_proof;',
      );
      const row = res.rows[0] as {c?: number} | undefined;
      const c = row?.c;
      return typeof c === 'number' ? c : Number(c) || 0;
    },

    async clearAll() {
      // 1. Fermer la connexion courante
      openPromise = null;
      const existing = db;
      db = null;
      if (existing) {
        try {
          existing.close();
        } catch {
          // fermeture best-effort avant delete
        }
        try {
          // op-sqlite : delete() après close supprime le fichier
          existing.delete();
        } catch (e) {
          // si delete indisponible sur le mock, on continue vers la clé
          if (typeof (existing as {delete?: () => void}).delete !== 'function') {
            // mock jest : pas de fichier réel
          } else {
            throw e;
          }
        }
      } else {
        // Pas de connexion : ouvrir pour pouvoir delete le fichier s'il existe
        const key = await getArchiveKeyIfExists();
        if (key) {
          try {
            const tmp = open({name: ARCHIVE_DB_NAME, encryptionKey: key});
            tmp.close();
            tmp.delete();
          } catch {
            // fichier absent ou illisible : on efface quand même la clé
          }
        }
      }
      // 2. Effacer la clé Keychain (obligatoire 13.5)
      await clearArchiveKey();
      lastOpenError = null;
    },

    async migrateFromMmkv() {
      const conn = await ensureOpen();
      return migrateMmkvToArchive(conn, cacheGetAllKeys);
    },

    async upsertConversations(items: ConversationSummary[]) {
      if (items.length === 0) return;
      const conn = await ensureOpen();
      await repoUpsertConversations(conn, items);
    },

    async listConversations(botId: string) {
      const conn = await ensureOpen();
      return listConversationsForBot(conn, botId);
    },

    async upsertMessages(items: Message[]) {
      if (items.length === 0) return;
      const conn = await ensureOpen();
      await repoUpsertMessages(conn, items);
    },

    async listMessages(conversationId: string, limit: number) {
      const conn = await ensureOpen();
      return listMessagesForConversation(conn, conversationId, limit);
    },
  };
}
