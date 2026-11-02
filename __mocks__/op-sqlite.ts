/** Faux op-sqlite — déclaré comme tel (6bis-a/b). Pas de SQLCipher natif en jest. */
type Row = Record<string, string | number | null>;

const tables = new Map<string, Row[]>();
let deleted = false;

function table(name: string): Row[] {
  if (!tables.has(name)) tables.set(name, []);
  return tables.get(name)!;
}

function normalize(q: string): string {
  return q.replace(/\s+/g, ' ').trim();
}

const db = {
  execute: jest.fn(async (query: string, params?: Array<string | number | null>) => {
    const raw = normalize(query);
    const q = raw.toUpperCase();

    if (q === 'BEGIN;' || q === 'BEGIN' || q.startsWith('BEGIN')) {
      return {rowsAffected: 0, rows: []};
    }
    if (q === 'COMMIT;' || q === 'COMMIT' || q.startsWith('COMMIT')) {
      return {rowsAffected: 0, rows: []};
    }
    if (q === 'ROLLBACK;' || q === 'ROLLBACK' || q.startsWith('ROLLBACK')) {
      return {rowsAffected: 0, rows: []};
    }
    if (q.startsWith('CREATE TABLE') || q.startsWith('CREATE INDEX')) {
      // ensure known tables exist
      if (q.includes('ARCHIVE_PROOF')) table('archive_proof');
      if (q.includes('SCHEMA_VERSION')) table('schema_version');
      if (q.includes('CONVERSATIONS')) table('conversations');
      if (q.includes('MESSAGES') && !q.includes('ALBUM')) table('messages');
      if (q.includes('ALBUM_ITEMS')) table('album_items');
      if (q.includes('TOMBSTONES')) table('tombstones');
      return {rowsAffected: 0, rows: []};
    }

    if (q.startsWith('INSERT INTO ARCHIVE_PROOF')) {
      const rows = table('archive_proof');
      rows.push({
        id: rows.length + 1,
        label: String(params?.[0] ?? ''),
        created_at: Number(params?.[1] ?? 0),
      });
      return {rowsAffected: 1, rows: []};
    }

    if (q.includes('COUNT(*)') && q.includes('ARCHIVE_PROOF')) {
      return {rowsAffected: 0, rows: [{c: table('archive_proof').length}]};
    }

    if (q.startsWith('DELETE FROM ARCHIVE_PROOF')) {
      tables.set('archive_proof', []);
      return {rowsAffected: 0, rows: []};
    }

    if (q.startsWith('DELETE FROM SCHEMA_VERSION')) {
      tables.set('schema_version', []);
      return {rowsAffected: 0, rows: []};
    }

    if (q.startsWith('INSERT INTO SCHEMA_VERSION')) {
      table('schema_version').push({version: Number(params?.[0] ?? 0)});
      return {rowsAffected: 1, rows: []};
    }

    if (q.startsWith('SELECT VERSION FROM SCHEMA_VERSION')) {
      const rows = table('schema_version');
      return {rowsAffected: 0, rows: rows.length ? [rows[rows.length - 1]!] : []};
    }

    if (q.startsWith('INSERT INTO CONVERSATIONS') || q.startsWith('INSERT INTO MESSAGES')) {
      // simplistic upsert by id (first param)
      const name = q.includes('CONVERSATIONS') ? 'conversations' : 'messages';
      const rows = table(name);
      const id = String(params?.[0] ?? '');
      const existing = rows.findIndex(r => String(r.id) === id);
      const row: Row = {id};
      // store enough for list tests
      if (name === 'conversations') {
        row.bot_id = String(params?.[1] ?? '');
        row.title = params?.[3] != null ? String(params[3]) : null;
        row.pinned = Number(params?.[8] ?? 0);
        row.last_message_at = params?.[13] != null ? Number(params[13]) : null;
        row.unread_count = Number(params?.[15] ?? 0);
        row.last_message_text = params?.[16] != null ? String(params[16]) : null;
        row.has_photo = Number(params?.[10] ?? 0);
        row.updated_at = Number(params?.[17] ?? 0);
      } else {
        row.conversation_id = String(params?.[1] ?? '');
        row.direction = String(params?.[2] ?? 'in');
        row.kind = String(params?.[3] ?? 'text');
        row.text = params?.[5] != null ? String(params[5]) : null;
        row.created_at = params?.[12] != null ? Number(params[12]) : null;
        row.updated_at = Number(params?.[20] ?? 0);
      }
      if (existing >= 0) rows[existing] = {...rows[existing], ...row};
      else rows.push(row);
      return {rowsAffected: 1, rows: []};
    }

    if (q.includes('FROM CONVERSATIONS') && q.startsWith('SELECT')) {
      const botId = String(params?.[0] ?? '');
      const rows = table('conversations').filter(r => String(r.bot_id) === botId);
      const tombs = new Set(
        table('tombstones')
          .filter(t => t.entity_type === 'conversation')
          .map(t => String(t.entity_id)),
      );
      const filtered = rows.filter(r => !tombs.has(String(r.id)));
      filtered.sort((a, b) => {
        const ap = Number(a.pinned ?? 0);
        const bp = Number(b.pinned ?? 0);
        if (ap !== bp) return bp - ap;
        return Number(b.last_message_at ?? 0) - Number(a.last_message_at ?? 0);
      });
      return {rowsAffected: 0, rows: filtered};
    }

    if (q.includes('FROM MESSAGES') || (q.includes('AS RECENT') && q.includes('MESSAGES'))) {
      const cid = String(params?.[0] ?? '');
      const limit = Number(params?.[1] ?? 50);
      const tombs = new Set(
        table('tombstones')
          .filter(t => t.entity_type === 'message')
          .map(t => String(t.entity_id)),
      );
      const rows = table('messages')
        .filter(r => String(r.conversation_id) === cid && !tombs.has(String(r.id)))
        .sort((a, b) => Number(b.created_at ?? 0) - Number(a.created_at ?? 0))
        .slice(0, limit)
        .sort((a, b) => Number(a.created_at ?? 0) - Number(b.created_at ?? 0));
      return {rowsAffected: 0, rows};
    }

    if (q.startsWith('DELETE FROM ALBUM_ITEMS')) {
      const parent = String(params?.[0] ?? '');
      tables.set(
        'album_items',
        table('album_items').filter(r => String(r.album_message_id) !== parent),
      );
      return {rowsAffected: 0, rows: []};
    }

    if (q.startsWith('INSERT OR REPLACE INTO ALBUM_ITEMS') || q.startsWith('INSERT INTO ALBUM_ITEMS')) {
      table('album_items').push({
        id: String(params?.[0] ?? ''),
        album_message_id: String(params?.[1] ?? ''),
        kind: params?.[2] != null ? String(params[2]) : null,
        text: params?.[3] != null ? String(params[3]) : null,
      });
      return {rowsAffected: 1, rows: []};
    }

    if (q.includes('FROM ALBUM_ITEMS')) {
      const parent = String(params?.[0] ?? '');
      return {
        rowsAffected: 0,
        rows: table('album_items').filter(
          r => String(r.album_message_id) === parent,
        ),
      };
    }

    if (q.startsWith('INSERT INTO TOMBSTONES')) {
      table('tombstones').push({
        entity_type: String(params?.[0] ?? ''),
        entity_id: String(params?.[1] ?? ''),
        tombstoned_at: Number(params?.[2] ?? 0),
        reason: params?.[3] != null ? String(params[3]) : null,
      });
      return {rowsAffected: 1, rows: []};
    }
    if (q.includes('FROM TOMBSTONES') && q.startsWith('SELECT')) {
      const et = String(params?.[0] ?? '');
      const eid = String(params?.[1] ?? '');
      const hit = table('tombstones').filter(
        r => String(r.entity_type) === et && String(r.entity_id) === eid,
      );
      return {rowsAffected: 0, rows: hit.slice(0, 1).map(() => ({x: 1}))};
    }
    return {rowsAffected: 0, rows: []};
  }),
  close: jest.fn(() => undefined),
  closeAsync: jest.fn(async () => undefined),
  delete: jest.fn(() => {
    tables.clear();
    deleted = true;
  }),
};

export function open(_opts: {name: string; encryptionKey?: string}) {
  deleted = false;
  return db;
}

export function openAsync(opts: {name: string; encryptionKey?: string}) {
  return Promise.resolve(open(opts));
}

export function isSQLCipher() {
  return true;
}

export function __resetOpSqliteMock(): void {
  tables.clear();
  deleted = false;
  db.execute.mockClear();
  db.close.mockClear();
  db.delete.mockClear();
}

export function __wasDeleted(): boolean {
  return deleted;
}
