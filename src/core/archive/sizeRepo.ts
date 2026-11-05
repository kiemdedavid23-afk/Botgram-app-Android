/** Taille de l'archive (pages SQLite × taille de page) — lecture seule. */
import type {DB} from '@op-engineering/op-sqlite';

async function readPragma(db: DB, pragma: string): Promise<number> {
  const res = await db.execute(`PRAGMA ${pragma};`);
  const row = res.rows[0] as Record<string, unknown> | undefined;
  return Number(row?.[pragma]) || 0;
}

export async function archiveSizeBytes(db: DB): Promise<number> {
  const pages = await readPragma(db, 'page_count');
  const pageSize = await readPragma(db, 'page_size');
  return pages * pageSize;
}
