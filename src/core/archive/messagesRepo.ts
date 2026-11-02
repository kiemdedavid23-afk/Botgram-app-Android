/**
 * Upsert / lecture messages + album_items (archive locale).
 * N'efface jamais une ligne absente du serveur (13.11).
 */
import type {DB} from '@op-engineering/op-sqlite';
import type {AlbumItem, Message} from '../realtime/messageTypes';

type Row = Record<string, unknown>;

function jsonStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  return JSON.stringify(v);
}

function parseJson<T>(raw: unknown): T | null {
  if (raw == null || raw === '') return null;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return null;
  }
}

function rowToMessage(row: Row, album: AlbumItem[] | null): Message {
  return {
    id: String(row.id),
    conversation_id: String(row.conversation_id),
    direction: row.direction === 'out' ? 'out' : 'in',
    kind: String(row.kind ?? 'text'),
    status: row.status != null ? String(row.status) : undefined,
    text: row.text != null ? String(row.text) : null,
    parse_mode: row.parse_mode != null ? String(row.parse_mode) : null,
    buttons: parseJson(row.buttons_json),
    callback: parseJson(row.callback_json),
    attachment: parseJson(row.attachment_json),
    contact: parseJson(row.contact_json),
    location: parseJson(row.location_json),
    created_at: row.created_at != null ? Number(row.created_at) : undefined,
    sent_at: row.sent_at != null ? Number(row.sent_at) : null,
    edited_at: row.edited_at != null ? Number(row.edited_at) : null,
    telegram_message_id:
      row.telegram_message_id != null ? Number(row.telegram_message_id) : null,
    error_code: row.error_code != null ? String(row.error_code) : null,
    retryable: row.retryable != null ? Number(row.retryable) === 1 : undefined,
    retry_at: row.retry_at != null ? Number(row.retry_at) : null,
    client_message_id:
      row.client_message_id != null ? String(row.client_message_id) : null,
    album,
  };
}

async function replaceAlbumItems(
  db: DB,
  albumMessageId: string,
  items: AlbumItem[],
): Promise<void> {
  await db.execute('DELETE FROM album_items WHERE album_message_id = ?;', [
    albumMessageId,
  ]);
  for (const it of items) {
    await db.execute(
      `INSERT OR REPLACE INTO album_items (
        id, album_message_id, kind, text, telegram_message_id,
        attachment_json, created_at, expires_at
      ) VALUES (?,?,?,?,?,?,?,?);`,
      [
        it.id,
        albumMessageId,
        it.kind ?? null,
        it.text ?? null,
        it.telegram_message_id ?? null,
        jsonStr(it.attachment),
        it.created_at ?? null,
        it.expires_at ?? null,
      ],
    );
  }
}

export async function upsertMessages(db: DB, items: Message[]): Promise<void> {
  const now = Date.now();
  for (const m of items) {
    await db.execute(
      `INSERT INTO messages (
        id, conversation_id, direction, kind, status, text, parse_mode,
        buttons_json, callback_json, attachment_json, contact_json, location_json,
        created_at, sent_at, edited_at, telegram_message_id, error_code,
        retryable, retry_at, client_message_id, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        conversation_id=excluded.conversation_id,
        direction=excluded.direction,
        kind=excluded.kind,
        status=excluded.status,
        text=excluded.text,
        parse_mode=excluded.parse_mode,
        buttons_json=excluded.buttons_json,
        callback_json=excluded.callback_json,
        attachment_json=excluded.attachment_json,
        contact_json=excluded.contact_json,
        location_json=excluded.location_json,
        created_at=excluded.created_at,
        sent_at=excluded.sent_at,
        edited_at=excluded.edited_at,
        telegram_message_id=excluded.telegram_message_id,
        error_code=excluded.error_code,
        retryable=excluded.retryable,
        retry_at=excluded.retry_at,
        client_message_id=excluded.client_message_id,
        updated_at=excluded.updated_at;`,
      [
        m.id,
        m.conversation_id,
        m.direction,
        m.kind,
        m.status ?? null,
        m.text ?? null,
        m.parse_mode ?? null,
        jsonStr(m.buttons),
        jsonStr(m.callback),
        jsonStr(m.attachment),
        jsonStr(m.contact),
        jsonStr(m.location),
        m.created_at ?? null,
        m.sent_at ?? null,
        m.edited_at ?? null,
        m.telegram_message_id ?? null,
        m.error_code ?? null,
        m.retryable ? 1 : m.retryable === false ? 0 : null,
        m.retry_at ?? null,
        m.client_message_id ?? null,
        now,
      ],
    );
    if (m.album && m.album.length > 0) {
      await replaceAlbumItems(db, m.id, m.album);
    }
  }
}

async function loadAlbum(db: DB, albumMessageId: string): Promise<AlbumItem[]> {
  const res = await db.execute(
    `SELECT * FROM album_items WHERE album_message_id = ? ORDER BY created_at ASC, rowid ASC;`,
    [albumMessageId],
  );
  return (res.rows as Row[]).map(r => ({
    id: String(r.id),
    kind: String(r.kind ?? ''),
    text: r.text != null ? String(r.text) : null,
    telegram_message_id:
      r.telegram_message_id != null ? Number(r.telegram_message_id) : null,
    attachment: parseJson(r.attachment_json),
    created_at: r.created_at != null ? Number(r.created_at) : undefined,
    expires_at: r.expires_at != null ? Number(r.expires_at) : null,
  }));
}

/**
 * Messages d'une conversation, hors tombstones message.
 * Renvoie les `limit` messages les PLUS RÉCENTS, en ordre chronologique
 * croissant (fil).
 */
export async function listMessagesForConversation(
  db: DB,
  conversationId: string,
  limit: number,
): Promise<Message[]> {
  const res = await db.execute(
    `SELECT * FROM (
       SELECT m.* FROM messages m
       WHERE m.conversation_id = ?
         AND NOT EXISTS (
           SELECT 1 FROM tombstones t
           WHERE t.entity_type = 'message' AND t.entity_id = m.id
         )
       ORDER BY m.created_at DESC, m.rowid DESC
       LIMIT ?
     ) ORDER BY created_at ASC, id ASC;`,
    [conversationId, limit],
  );
  const out: Message[] = [];
  for (const row of res.rows as Row[]) {
    const kind = String(row.kind ?? '');
    let album: AlbumItem[] | null = null;
    if (kind === 'album') {
      album = await loadAlbum(db, String(row.id));
    }
    out.push(rowToMessage(row, album));
  }
  return out;
}