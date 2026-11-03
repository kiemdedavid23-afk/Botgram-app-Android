/**
 * 6bis-c — vraie SQLite (better-sqlite3). SQLCipher non testé ici.
 */
import {openRealSqliteDb, type MinimalDb} from './helpers/realSqliteDb';
import {runMigrations} from '../src/core/archive/migrations';
import {
  upsertConversations,
  listConversationsForBot,
} from '../src/core/archive/conversationsRepo';
import {
  upsertMessages,
  listMessagesForConversation,
} from '../src/core/archive/messagesRepo';
import {insertTombstone} from '../src/core/archive/tombstonesRepo';
import {enqueueWrite} from '../src/core/archive/writeQueue';
import {
  isTransientOpenError,
  isUnreadableDbError,
} from '../src/core/archive/openErrors';
import type {Message} from '../src/core/realtime/messageTypes';

async function migrate(db: MinimalDb): Promise<void> {
  await runMigrations(db as never);
}

describe('openErrors classification (M1)', () => {
  it('illisible → reset autorisé', () => {
    expect(isUnreadableDbError('file is not a database')).toBe(true);
    expect(isUnreadableDbError('database disk image is malformed')).toBe(true);
    expect(isUnreadableDbError('file is encrypted or is not a database')).toBe(
      true,
    );
    expect(isUnreadableDbError('bad key or corrupt')).toBe(true);
  });

  it('busy/locked → pas de reset', () => {
    expect(isTransientOpenError('database is locked')).toBe(true);
    expect(isUnreadableDbError('database is locked')).toBe(false);
    expect(isTransientOpenError('SQLITE_BUSY')).toBe(true);
    expect(isUnreadableDbError('SQLITE_FULL disk full')).toBe(false);
    expect(isTransientOpenError('SQLITE_FULL')).toBe(true);
  });

  it('erreur migration inconnue → pas de reset', () => {
    expect(isUnreadableDbError('no such table: foo')).toBe(false);
    expect(isTransientOpenError('no such table: foo')).toBe(false);
  });
});

describe('archive SQL réel', () => {
  let db: MinimalDb;

  beforeEach(async () => {
    db = openRealSqliteDb();
    await migrate(db);
  });

  afterEach(() => {
    db.close();
  });

  it('listMessages : N plus récents, tie-break rowid, ordre croissant id', async () => {
    const items: Message[] = [];
    for (let i = 1; i <= 5; i += 1) {
      items.push({
        id: `m${i}`,
        conversation_id: 'c1',
        direction: 'in',
        kind: 'text',
        text: `t${i}`,
        created_at: 1000,
      });
    }
    await upsertMessages(db as never, items);
    const page = await listMessagesForConversation(db as never, 'c1', 3);
    expect(page).toHaveLength(3);
    // les 3 rowid les plus élevés avec même created_at, puis ASC id
    expect(page.map(m => m.id)).toEqual(['m3', 'm4', 'm5']);
  });

  it('INSERT sans unread_count → 0 ; partiel ne touche pas title', async () => {
    await upsertConversations(db as never, [
      {
        id: 'c10',
        bot_id: 'b1',
        title: 'SansUnread',
        photo_url: 'https://example.invalid/a.png',
        pinned: false,
        last_message_at: 1,
      },
    ]);
    await upsertConversations(db as never, [
      {
        id: 'c10',
        bot_id: 'b1',
        title: null,
        photo_url: null,
        pinned: false,
        last_message_at: 2,
      },
    ]);
    const row = (await listConversationsForBot(db as never, 'b1')).find(
      c => c.id === 'c10',
    );
    expect(row?.unread_count).toBe(0);
    expect(row?.title).toBe('SansUnread');
    expect(row?.photo_url).toBe('https://example.invalid/a.png');
  });

  it('M2 état : error_code/retryable effacés après succès', async () => {
    await upsertMessages(db as never, [
      {
        id: 'me1',
        conversation_id: 'c1',
        direction: 'out',
        kind: 'text',
        text: 'x',
        created_at: 1,
        error_code: 'NETWORK',
        retryable: true,
        retry_at: 99,
      },
    ]);
    await upsertMessages(db as never, [
      {
        id: 'me1',
        conversation_id: 'c1',
        direction: 'out',
        kind: 'text',
        text: 'x',
        created_at: 1,
        error_code: null,
        retryable: false,
        retry_at: null,
        status: 'sent',
      },
    ]);
    const page = await listMessagesForConversation(db as never, 'c1', 10);
    const m = page.find(x => x.id === 'me1');
    expect(m?.error_code).toBeNull();
    expect(m?.retryable).toBe(false);
    expect(m?.retry_at).toBeNull();
  });

  it('M2 état : désépinglage met pinned_at à NULL', async () => {
    await upsertConversations(db as never, [
      {
        id: 'cp',
        bot_id: 'b1',
        title: 'P',
        pinned: true,
        pinned_at: 12345,
        last_message_at: 1,
      },
    ]);
    await upsertConversations(db as never, [
      {
        id: 'cp',
        bot_id: 'b1',
        title: 'P',
        pinned: false,
        pinned_at: null,
        last_message_at: 1,
      },
    ]);
    const row = (await listConversationsForBot(db as never, 'b1')).find(
      c => c.id === 'cp',
    );
    expect(row?.pinned).toBe(false);
    expect(row?.pinned_at).toBeNull();
  });

  it('B1 : Promise.all ≥5 upserts via file → toutes les lignes', async () => {
    const jobs = [];
    for (let i = 0; i < 5; i += 1) {
      const idx = i;
      jobs.push(
        enqueueWrite(async () => {
          await upsertConversations(db as never, [
            {
              id: `cc${idx}`,
              bot_id: 'b1',
              title: `T${idx}`,
              pinned: false,
              last_message_at: idx,
            },
          ]);
          await upsertMessages(db as never, [
            {
              id: `mm${idx}`,
              conversation_id: `cc${idx}`,
              direction: 'in',
              kind: 'text',
              text: `m${idx}`,
              created_at: idx,
            },
          ]);
        }),
      );
    }
    await Promise.all(jobs);
    const convs = await listConversationsForBot(db as never, 'b1');
    expect(convs.length).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < 5; i += 1) {
      const msgs = await listMessagesForConversation(db as never, `cc${i}`, 10);
      expect(msgs.some(m => m.id === `mm${i}`)).toBe(true);
    }
  });

  it('B1 : concurrent BEGIN sans file → erreur within a transaction', async () => {
    const boom = async () => {
      await db.execute('BEGIN;');
      await db.execute(
        `INSERT INTO conversations (
          id, bot_id, pinned, has_photo, unread_count, updated_at
        ) VALUES (?, 'b1', 0, 0, 0, ?);`,
        [`tx${Math.random()}`, Date.now()],
      );
      await db.execute('COMMIT;');
    };
    await expect(Promise.all([boom(), boom(), boom()])).rejects.toBeTruthy();
  });

  it('M3 : tombstone message → exclu de la liste ; upsert ne ressuscite pas', async () => {
    await upsertMessages(db as never, [
      {
        id: 'dead',
        conversation_id: 'c1',
        direction: 'in',
        kind: 'text',
        text: 'x',
        created_at: 1,
      },
    ]);
    await insertTombstone(db as never, 'message', 'dead', 'message_deleted');
    expect(
      (await listMessagesForConversation(db as never, 'c1', 50)).map(m => m.id),
    ).not.toContain('dead');
    await upsertMessages(db as never, [
      {
        id: 'dead',
        conversation_id: 'c1',
        direction: 'in',
        kind: 'text',
        text: 'back',
        created_at: 2,
      },
    ]);
    expect(
      (await listMessagesForConversation(db as never, 'c1', 50)).map(m => m.id),
    ).not.toContain('dead');
  });

  it('M3 : tombstone conversation → exclue ; absence REST sans tombstone', async () => {
    await upsertConversations(db as never, [
      {
        id: 'c1',
        bot_id: 'b1',
        title: 'A',
        pinned: false,
        last_message_at: 1,
      },
      {
        id: 'c2',
        bot_id: 'b1',
        title: 'B',
        pinned: false,
        last_message_at: 2,
      },
    ]);
    // REST ne renvoie que c2 → upsert seulement c2, pas de tombstone c1
    await upsertConversations(db as never, [
      {
        id: 'c2',
        bot_id: 'b1',
        title: 'B2',
        pinned: false,
        last_message_at: 3,
      },
    ]);
    let list = await listConversationsForBot(db as never, 'b1');
    expect(list.map(c => c.id).sort()).toEqual(['c1', 'c2']);

    await insertTombstone(db as never, 'conversation', 'c1', 'server_removed');
    list = await listConversationsForBot(db as never, 'b1');
    expect(list.map(c => c.id)).toEqual(['c2']);
  });
});
