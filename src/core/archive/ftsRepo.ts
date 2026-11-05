/**
 * Recherche plein texte locale (6bis-e) : FTS5 si la build SQLite l'offre,
 * sinon repli LIKE (plus lent, mêmes résultats hors accents).
 * Les tombstones (messages et conversations supprimés) sont toujours exclus.
 */
import type {DB} from '@op-engineering/op-sqlite';
import {
  buildSnippet,
  parseQuery,
  parseQueryKeepAccents,
  toLikePattern,
  toMatchExpression,
  type SnippetSegment,
} from './searchQuery';

export type MessageSearchHit = {
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  direction: 'in' | 'out';
  createdAt: number | null;
  segments: SnippetSegment[];
};

export type MessageSearchResult = {mode: 'fts' | 'like'; hits: MessageSearchHit[]};

const FTS_TABLE = `CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts
  USING fts5(text, tokenize = 'unicode61 remove_diacritics 2')`;

const FTS_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS messages_fts_ai AFTER INSERT ON messages BEGIN
     INSERT INTO messages_fts(rowid, text) VALUES (new.rowid, COALESCE(new.text, ''));
   END`,
  `CREATE TRIGGER IF NOT EXISTS messages_fts_au AFTER UPDATE OF text ON messages BEGIN
     DELETE FROM messages_fts WHERE rowid = old.rowid;
     INSERT INTO messages_fts(rowid, text) VALUES (new.rowid, COALESCE(new.text, ''));
   END`,
  `CREATE TRIGGER IF NOT EXISTS messages_fts_ad AFTER DELETE ON messages BEGIN
     DELETE FROM messages_fts WHERE rowid = old.rowid;
   END`,
];

const FTS_BACKFILL = `INSERT INTO messages_fts(rowid, text)
  SELECT rowid, COALESCE(text, '') FROM messages`;

async function ftsTableExists(db: DB): Promise<boolean> {
  const res = await db.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'messages_fts';",
  );
  return res.rows.length > 0;
}

async function createFts(db: DB): Promise<void> {
  await db.execute('BEGIN;');
  try {
    await db.execute(`${FTS_TABLE};`);
    for (const trigger of FTS_TRIGGERS) {
      await db.execute(`${trigger};`);
    }
    await db.execute(`${FTS_BACKFILL};`);
    await db.execute('COMMIT;');
  } catch (e) {
    try {
      await db.execute('ROLLBACK;');
    } catch {
      /* transaction déjà terminée */
    }
    throw e;
  }
}

/**
 * Prépare l'index plein texte. Renvoie false si FTS5 est indisponible
 * (l'archive reste pleinement utilisable, la recherche passe en repli LIKE).
 */
export async function ensureFts(db: DB): Promise<boolean> {
  try {
    if (await ftsTableExists(db)) {
      return true;
    }
    await createFts(db);
    return true;
  } catch {
    return false;
  }
}

type Row = {
  id: string;
  conversation_id: string;
  direction: string;
  created_at: number | null;
  text: string | null;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

const SELECT_HITS = `SELECT m.id AS id, m.conversation_id AS conversation_id,
    m.direction AS direction, m.created_at AS created_at, m.text AS text,
    c.title AS title, c.first_name AS first_name, c.last_name AS last_name,
    c.username AS username`;

const FILTERS = `c.bot_id = ?
  AND NOT EXISTS (SELECT 1 FROM tombstones t
    WHERE t.entity_type = 'message' AND t.entity_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM tombstones t
    WHERE t.entity_type = 'conversation' AND t.entity_id = m.conversation_id)`;

function titleOf(r: Row): string {
  if (r.title) return r.title;
  const name = [r.first_name, r.last_name].filter(Boolean).join(' ');
  if (name) return name;
  return r.username ? `@${r.username}` : r.conversation_id;
}

function toHit(r: Row, tokens: string[]): MessageSearchHit {
  return {
    messageId: r.id,
    conversationId: r.conversation_id,
    conversationTitle: titleOf(r),
    direction: r.direction === 'out' ? 'out' : 'in',
    createdAt: r.created_at,
    segments: buildSnippet(r.text ?? '', tokens),
  };
}

/**
 * CROSS JOIN : fixe l'ordre des jointures (index plein texte d'abord).
 * Sans lui, selon la version de SQLite, le planificateur peut parcourir tous
 * les messages et interroger l'index ligne par ligne (secondes sur 20 000).
 */
async function runFts(db: DB, botId: string, tokens: string[], limit: number) {
  return db.execute(
    `${SELECT_HITS}
     FROM messages_fts
     CROSS JOIN messages m ON m.rowid = messages_fts.rowid
     CROSS JOIN conversations c ON c.id = m.conversation_id
     WHERE messages_fts MATCH ? AND ${FILTERS}
     ORDER BY m.created_at DESC, m.rowid DESC LIMIT ?;`,
    [toMatchExpression(tokens), botId, limit],
  );
}

async function runLike(db: DB, botId: string, query: string, limit: number) {
  const tokens = parseQueryKeepAccents(query);
  const likes = tokens.map(() => "m.text LIKE ? ESCAPE '\\'").join(' AND ');
  return db.execute(
    `${SELECT_HITS}
     FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE ${likes} AND ${FILTERS}
     ORDER BY m.created_at DESC, m.rowid DESC LIMIT ?;`,
    [...tokens.map(toLikePattern), botId, limit],
  );
}

export async function searchMessagesInDb(
  db: DB,
  botId: string,
  query: string,
  limit: number,
  ftsReady: boolean,
): Promise<MessageSearchResult> {
  const tokens = parseQuery(query);
  if (tokens.length === 0) {
    return {mode: ftsReady ? 'fts' : 'like', hits: []};
  }
  const res = ftsReady
    ? await runFts(db, botId, tokens, limit)
    : await runLike(db, botId, query, limit);
  const rows = res.rows as Row[];
  return {
    mode: ftsReady ? 'fts' : 'like',
    hits: rows.map(r => toHit(r, tokens)),
  };
}
