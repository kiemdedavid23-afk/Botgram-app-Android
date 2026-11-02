/**
 * Adaptateur better-sqlite3 → interface minimale DB des dépôts archive.
 * UNIQUEMENT pour les tests (__tests__/). Production = op-sqlite + SQLCipher.
 */
import Database from 'better-sqlite3';

export type SqlParam = string | number | null;
export type SqlRow = Record<string, unknown>;

export type MinimalDb = {
  execute: (
    sql: string,
    params?: SqlParam[],
  ) => Promise<{rows: SqlRow[]; rowsAffected: number}>;
  close: () => void;
  delete: () => void;
  /** Accès natif pour transactions de test / setup. */
  raw: Database.Database;
};

/**
 * Base SQLite en mémoire (vraie exécution SQL, sans SQLCipher).
 */
export function openRealSqliteDb(): MinimalDb {
  const raw = new Database(':memory:');
  // FTS5 disponible dans la compilation standard de better-sqlite3
  raw.pragma('journal_mode = MEMORY');

  return {
    raw,
    async execute(sql: string, params: SqlParam[] = []) {
      const trimmed = sql.trim();
      const upper = trimmed.toUpperCase();
      if (
        upper.startsWith('SELECT') ||
        upper.startsWith('WITH') ||
        upper.startsWith('PRAGMA')
      ) {
        const rows = raw.prepare(trimmed).all(...params) as SqlRow[];
        return {rows, rowsAffected: 0};
      }
      const info = raw.prepare(trimmed).run(...params);
      return {rows: [], rowsAffected: info.changes};
    },
    close() {
      raw.close();
    },
    delete() {
      // :memory: — rien à supprimer sur disque
      try {
        raw.close();
      } catch {
        // déjà fermée
      }
    },
  };
}

/** Exécute plusieurs statements séparés par `;` (migrations). */
export async function execScript(
  db: MinimalDb,
  script: string,
): Promise<void> {
  const parts = script
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  for (const part of parts) {
    await db.execute(`${part};`);
  }
}
