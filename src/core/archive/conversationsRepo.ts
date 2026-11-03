/**
 * Upsert / lecture conversations.
 * INSERT NOT NULL → défauts 0 ; jamais NULL sur pinned/has_photo/unread_count.
 * UPDATE :
 *  - métadonnées (title, photo, noms…) : COALESCE — absent/null n'écrase pas
 *  - état (pinned, pinned_at, has_photo, unread_count, last_message_text) :
 *    l'enregistrement entrant fait foi, NULL inclus
 */
import type {DB} from '@op-engineering/op-sqlite';
import type {ConversationSummary} from '../realtime/events';

type Row = Record<string, unknown>;

function rowToConversation(row: Row): ConversationSummary {
  return {
    id: String(row.id),
    bot_id: String(row.bot_id),
    chat_type: row.chat_type != null ? String(row.chat_type) : undefined,
    title: row.title != null ? String(row.title) : null,
    username: row.username != null ? String(row.username) : null,
    first_name: row.first_name != null ? String(row.first_name) : null,
    last_name: row.last_name != null ? String(row.last_name) : null,
    contact_id: row.contact_id != null ? String(row.contact_id) : null,
    pinned: Number(row.pinned) === 1,
    pinned_at: row.pinned_at != null ? Number(row.pinned_at) : null,
    has_photo: Number(row.has_photo) === 1,
    photo_url: row.photo_url != null ? String(row.photo_url) : null,
    initials: row.initials != null ? String(row.initials) : null,
    last_message_at:
      row.last_message_at != null ? Number(row.last_message_at) : undefined,
    created_at: row.created_at != null ? Number(row.created_at) : undefined,
    unread_count: row.unread_count != null ? Number(row.unread_count) : 0,
    last_message_text:
      row.last_message_text != null ? String(row.last_message_text) : null,
  };
}

function pinIns(v: boolean | undefined | null): number {
  return v === true ? 1 : 0;
}

function unreadIns(v: number | undefined | null): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export async function upsertConversations(
  db: DB,
  items: ConversationSummary[],
): Promise<void> {
  if (items.length === 0) return;
  try {
    await db.execute('BEGIN;');
    const now = Date.now();
    for (const c of items) {
      const pinI = pinIns(c.pinned);
      const photoI = pinIns(c.has_photo);
      const unreadI = unreadIns(c.unread_count ?? null);

      await db.execute(
        `INSERT INTO conversations (
          id, bot_id, chat_type, title, username, first_name, last_name,
          contact_id, pinned, pinned_at, has_photo, photo_url, initials,
          last_message_at, created_at, unread_count, last_message_text, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
          bot_id=excluded.bot_id,
          chat_type=COALESCE(excluded.chat_type, conversations.chat_type),
          title=COALESCE(excluded.title, conversations.title),
          username=COALESCE(excluded.username, conversations.username),
          first_name=COALESCE(excluded.first_name, conversations.first_name),
          last_name=COALESCE(excluded.last_name, conversations.last_name),
          contact_id=COALESCE(excluded.contact_id, conversations.contact_id),
          pinned=excluded.pinned,
          pinned_at=excluded.pinned_at,
          has_photo=excluded.has_photo,
          photo_url=COALESCE(excluded.photo_url, conversations.photo_url),
          initials=COALESCE(excluded.initials, conversations.initials),
          last_message_at=COALESCE(excluded.last_message_at, conversations.last_message_at),
          created_at=COALESCE(excluded.created_at, conversations.created_at),
          unread_count=excluded.unread_count,
          last_message_text=excluded.last_message_text,
          updated_at=excluded.updated_at;`,
        [
          c.id,
          c.bot_id,
          c.chat_type ?? null,
          c.title ?? null,
          c.username ?? null,
          c.first_name ?? null,
          c.last_name ?? null,
          c.contact_id ?? null,
          pinI,
          c.pinned_at ?? null,
          photoI,
          c.photo_url ?? null,
          c.initials ?? null,
          c.last_message_at ?? null,
          c.created_at ?? null,
          unreadI,
          c.last_message_text ?? null,
          now,
        ],
      );
    }
    await db.execute('COMMIT;');
  } catch (e) {
    try {
      await db.execute('ROLLBACK;');
    } catch {
      /* best-effort */
    }
    throw e;
  }
}

export async function listConversationsForBot(
  db: DB,
  botId: string,
): Promise<ConversationSummary[]> {
  const res = await db.execute(
    `SELECT c.* FROM conversations c
     WHERE c.bot_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM tombstones t
         WHERE t.entity_type = 'conversation' AND t.entity_id = c.id
       )
     ORDER BY c.pinned DESC, c.last_message_at DESC;`,
    [botId],
  );
  return (res.rows as Row[]).map(rowToConversation);
}
