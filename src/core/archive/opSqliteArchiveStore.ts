/**
 * Implémentation ArchiveStore via op-sqlite + SQLCipher.
 * SEUL fichier avec import d'exécution de @op-engineering/op-sqlite.
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
import {
  insertTombstone,
  type TombstoneEntity,
  type TombstoneReason,
} from './tombstonesRepo';
import {archiveTexts} from './texts';
import {enqueueWrite} from './writeQueue';
import {archiveSizeBytes} from './sizeRepo';
import {ensureFts, searchMessagesInDb} from './ftsRepo';
import {isTransientOpenError, isUnreadableDbError} from './openErrors';
import type {ConversationSummary} from '../realtime/events';
import type {Message} from '../realtime/messageTypes';

let db: DB | null = null;
let openPromise: Promise<DB> | null = null;
let pendingResetMessage: string | null = null;
let ftsReady = false;

async function deleteDbFile(): Promise<void> {
  const key = await getArchiveKeyIfExists();
  if (!key) return;
  const tmp = open({name: ARCHIVE_DB_NAME, encryptionKey: key});
  tmp.close();
  tmp.delete();
}

async function openFresh(): Promise<DB> {
  const key = await getOrCreateArchiveKey();
  const conn = open({name: ARCHIVE_DB_NAME, encryptionKey: key});
  await conn.execute(
    `CREATE TABLE IF NOT EXISTS archive_proof (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );`,
  );
  await runMigrations(conn);
  ftsReady = await ensureFts(conn);
  return conn;
}

async function openConnection(): Promise<DB> {
  try {
    return await openFresh();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'open_failed';
    if (isTransientOpenError(message)) {
      throw e;
    }
    if (!isUnreadableDbError(message)) {
      // Migration / erreur inconnue : ne rien supprimer
      throw e;
    }
    openPromise = null;
    if (db) {
      try {
        db.close();
      } catch {
        /* */
      }
      db = null;
    }
    try {
      await deleteDbFile();
    } catch {
      /* fichier absent */
    }
    await clearArchiveKey();
    const conn = await openFresh();
    pendingResetMessage = archiveTexts.resetUnreadable;
    return conn;
  }
}

async function ensureOpen(): Promise<DB> {
  if (db) return db;
  if (openPromise) return openPromise;
  openPromise = (async () => {
    try {
      const conn = await openConnection();
      db = conn;
      return conn;
    } catch (e) {
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
        const message = e instanceof Error ? e.message : 'open_failed';
        if (isTransientOpenError(message)) {
          return {ok: false, reason: 'transient', message};
        }
        if (isUnreadableDbError(message)) {
          return {ok: false, reason: 'unreadable', message};
        }
        return {ok: false, reason: 'error', message};
      }
    },

    consumeResetMessage() {
      const m = pendingResetMessage;
      pendingResetMessage = null;
      return m;
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
      return enqueueWrite(async () => {
        const conn = await ensureOpen();
        await conn.execute(
          'INSERT INTO archive_proof (label, created_at) VALUES (?, ?);',
          [label, Date.now()],
        );
      });
    },

    async proofCount() {
      const conn = await ensureOpen();
      const res = await conn.execute(
        'SELECT COUNT(*) AS c FROM archive_proof;',
      );
      const row = res.rows[0] as {c?: number} | undefined;
      return typeof row?.c === 'number' ? row.c : Number(row?.c) || 0;
    },

    async sizeBytes() {
      const conn = await ensureOpen();
      return archiveSizeBytes(conn);
    },

    async clearAll() {
      return enqueueWrite(async () => {
        openPromise = null;
        const existing = db;
        db = null;
        if (existing) {
          existing.close();
          existing.delete();
        } else {
          await deleteDbFile();
        }
        await clearArchiveKey();
        pendingResetMessage = null;
      });
    },

    async migrateFromMmkv() {
      return enqueueWrite(async () => {
        const conn = await ensureOpen();
        return migrateMmkvToArchive(conn, cacheGetAllKeys);
      });
    },

    async upsertConversations(items: ConversationSummary[]) {
      if (items.length === 0) return;
      return enqueueWrite(async () => {
        const conn = await ensureOpen();
        await repoUpsertConversations(conn, items);
      });
    },

    async listConversations(botId: string) {
      const conn = await ensureOpen();
      return listConversationsForBot(conn, botId);
    },

    async upsertMessages(items: Message[]) {
      if (items.length === 0) return;
      return enqueueWrite(async () => {
        const conn = await ensureOpen();
        await repoUpsertMessages(conn, items);
      });
    },

    async listMessages(conversationId: string, limit: number) {
      const conn = await ensureOpen();
      return listMessagesForConversation(conn, conversationId, limit);
    },

    async searchMessages(botId: string, query: string, limit: number) {
      const conn = await ensureOpen();
      return searchMessagesInDb(conn, botId, query, limit, ftsReady);
    },

    async tombstone(
      entityType: TombstoneEntity,
      entityId: string,
      reason: TombstoneReason,
    ) {
      return enqueueWrite(async () => {
        const conn = await ensureOpen();
        await insertTombstone(conn, entityType, entityId, reason);
      });
    },
  };
}
