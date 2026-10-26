/**
 * Implémentation ArchiveStore via @op-engineering/op-sqlite + SQLCipher.
 * SEUL fichier qui importe op-sqlite (hors tests/mocks).
 */
import {open, type DB} from '@op-engineering/op-sqlite';
import {getOrCreateArchiveKey} from '../storage/secureStorage';
import type {ArchiveStore} from './ArchiveStore';

const DB_NAME = 'botgram_archive.db';

let db: DB | null = null;

async function ensureOpen(): Promise<DB> {
  if (db) return db;
  const key = await getOrCreateArchiveKey();
  db = open({
    name: DB_NAME,
    encryptionKey: key,
  });
  await db.execute(
    `CREATE TABLE IF NOT EXISTS archive_proof (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );`,
  );
  return db;
}

export function createOpSqliteArchiveStore(): ArchiveStore {
  return {
    async open() {
      await ensureOpen();
    },

    async close() {
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
      const row = res.rows[0];
      const c = row?.c;
      return typeof c === 'number' ? c : Number(c) || 0;
    },

    async clearAll() {
      const conn = await ensureOpen();
      await conn.execute('DELETE FROM archive_proof;');
      // lots suivants : DROP / DELETE toutes les tables métier
    },
  };
}
