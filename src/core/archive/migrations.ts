/**
 * Exécuteur de migrations versionné (schema_version).
 */
import type {DB} from '@op-engineering/op-sqlite';
import {MIGRATION_V1, SCHEMA_VERSION, SQL_SCHEMA_VERSION} from './schema';

type ExecResult = {rows: Array<Record<string, unknown>>};

async function exec(db: DB, sql: string, params?: Array<string | number | null>) {
  return db.execute(sql, params) as Promise<ExecResult> | ExecResult;
}

async function readVersion(db: DB): Promise<number> {
  await exec(db, SQL_SCHEMA_VERSION);
  const res = await exec(db, 'SELECT version FROM schema_version LIMIT 1;');
  const row = res.rows[0];
  if (!row) return 0;
  const v = row.version;
  return typeof v === 'number' ? v : Number(v) || 0;
}

async function writeVersion(db: DB, version: number): Promise<void> {
  await exec(db, 'DELETE FROM schema_version;');
  await exec(db, 'INSERT INTO schema_version (version) VALUES (?);', [version]);
}

/**
 * Applique les migrations manquantes. Idempotent.
 * v0 → v1 : tables conversations, messages, album_items, tombstones.
 */
export async function runMigrations(db: DB): Promise<number> {
  let current = await readVersion(db);
  if (current < 1) {
    for (const stmt of MIGRATION_V1) {
      // op-sqlite execute one statement; split multi-statement blocks
      const parts = stmt
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const part of parts) {
        await exec(db, `${part};`);
      }
    }
    await writeVersion(db, 1);
    current = 1;
  }
  if (current > SCHEMA_VERSION) {
    // base plus récente que le code : on n'écrit pas ; lecture seule possible
    return current;
  }
  return current;
}
