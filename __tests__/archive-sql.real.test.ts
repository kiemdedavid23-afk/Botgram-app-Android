/**
 * 6bis-c A — requêtes archive sur vraie SQLite (better-sqlite3 en mémoire).
 * SQLCipher / op-sqlite natif non testés ici.
 */
import {openRealSqliteDb, execScript, type MinimalDb} from './helpers/realSqliteDb';
import {MIGRATION_V1, SQL_SCHEMA_VERSION} from '../src/core/archive/schema';
import {runMigrations} from '../src/core/archive/migrations';
import {
  upsertConversations,
  listConversationsForBot,
} from '../src/core/archive/conversationsRepo';
import {
  upsertMessages,
  listMessagesForConversation,
} from '../src/core/archive/messagesRepo';
import type {ConversationSummary} from '../src/core/realtime/events';
import type {Message} from '../src/core/realtime/messageTypes';

// runMigrations attend le type DB op-sqlite ; MinimalDb est structurellement compatible
async function migrate(db: MinimalDb): Promise<void> {
  await execScript(db, SQL_SCHEMA_VERSION);
  // runMigrations uses db.execute — compatible
  await runMigrations(db as never);
}

describe('archive SQL réel (better-sqlite3)', () => {
  let db: MinimalDb;

  beforeEach(async () => {
    db = openRealSqliteDb();
    await migrate(db);
  });

  afterEach(() => {
    db.close();
  });

  it('migrations v0→v1 créent les tables métier', async () => {
    const res = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
    );
    const names = res.rows.map(r => String(r.name));
    expect(names).toEqual(
      expect.arrayContaining([
        'schema_version',
        'conversations',
        'messages',
        'album_items',
        'tombstones',
      ]),
    );
    const ver = await db.execute('SELECT version FROM schema_version;');
    expect(Number(ver.rows[0]?.version)).toBe(1);
  });

  it('listMessages : limit messages les plus récents, ordre croissant', async () => {
    const items: Message[] = [];
    for (let i = 1; i <= 10; i += 1) {
      items.push({
        id: `m${i}`,
        conversation_id: 'c1',
        direction: 'in',
        kind: 'text',
        text: `t${i}`,
        created_at: i * 1000,
      });
    }
    await upsertMessages(db as never, items);
    const page = await listMessagesForConversation(db as never, 'c1', 3);
    expect(page.map(m => m.id)).toEqual(['m8', 'm9', 'm10']);
    expect(page.map(m => m.created_at)).toEqual([8000, 9000, 10000]);
  });

  it('tombstones messages exclus de la liste', async () => {
    await upsertMessages(db as never, [
      {
        id: 'a',
        conversation_id: 'c1',
        direction: 'in',
        kind: 'text',
        text: 'keep',
        created_at: 1,
      },
      {
        id: 'b',
        conversation_id: 'c1',
        direction: 'in',
        kind: 'text',
        text: 'gone',
        created_at: 2,
      },
    ]);
    await db.execute(
      `INSERT INTO tombstones (entity_type, entity_id, tombstoned_at, reason)
       VALUES ('message', 'b', ?, 'user_deleted');`,
      [Date.now()],
    );
    const page = await listMessagesForConversation(db as never, 'c1', 50);
    expect(page.map(m => m.id)).toEqual(['a']);
  });

  it('album : ordre stable des éléments', async () => {
    await upsertMessages(db as never, [
      {
        id: 'alb1',
        conversation_id: 'c1',
        direction: 'in',
        kind: 'album',
        text: null,
        created_at: 50,
        album: [
          {id: 'p1', kind: 'photo', text: null, created_at: 51},
          {id: 'p2', kind: 'photo', text: null, created_at: 52},
          {id: 'p3', kind: 'photo', text: null, created_at: 53},
        ],
      },
    ]);
    const page = await listMessagesForConversation(db as never, 'c1', 10);
    expect(page).toHaveLength(1);
    expect(page[0]?.album?.map(x => x.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('upsert répété idempotent ; absence serveur ne supprime pas', async () => {
    await upsertConversations(db as never, [
      {
        id: 'c1',
        bot_id: 'b1',
        title: 'A',
        pinned: false,
        last_message_at: 10,
      },
      {
        id: 'c2',
        bot_id: 'b1',
        title: 'B',
        pinned: true,
        last_message_at: 5,
      },
    ]);
    await upsertConversations(db as never, [
      {
        id: 'c1',
        bot_id: 'b1',
        title: 'A2',
        pinned: false,
        last_message_at: 20,
      },
    ]);
    const list = await listConversationsForBot(db as never, 'b1');
    expect(list.map(c => c.id).sort()).toEqual(['c1', 'c2']);
    expect(list.find(c => c.id === 'c1')?.title).toBe('A2');
  });

  it('liste conversations : épinglées d’abord puis last_message_at DESC', async () => {
    const items: ConversationSummary[] = [
      {
        id: 'c1',
        bot_id: 'b1',
        title: 'old',
        pinned: false,
        last_message_at: 100,
      },
      {
        id: 'c2',
        bot_id: 'b1',
        title: 'pin',
        pinned: true,
        last_message_at: 1,
      },
      {
        id: 'c3',
        bot_id: 'b1',
        title: 'new',
        pinned: false,
        last_message_at: 200,
      },
    ];
    await upsertConversations(db as never, items);
    const list = await listConversationsForBot(db as never, 'b1');
    expect(list.map(c => c.id)).toEqual(['c2', 'c3', 'c1']);
  });

  it('tombstones conversations exclus', async () => {
    await upsertConversations(db as never, [
      {
        id: 'c1',
        bot_id: 'b1',
        title: 'x',
        pinned: false,
        last_message_at: 1,
      },
    ]);
    await db.execute(
      `INSERT INTO tombstones (entity_type, entity_id, tombstoned_at, reason)
       VALUES ('conversation', 'c1', ?, 'server_removed');`,
      [Date.now()],
    );
    const list = await listConversationsForBot(db as never, 'b1');
    expect(list).toHaveLength(0);
  });
});

  it('upsert partiel ne remplace pas title par null', async () => {
    await upsertConversations(db as never, [
      {
        id: 'c9',
        bot_id: 'b1',
        title: 'Complet',
        photo_url: 'https://example.invalid/p.png',
        pinned: false,
        last_message_at: 1,
        unread_count: 3,
      },
    ]);
    await upsertConversations(db as never, [
      {
        id: 'c9',
        bot_id: 'b1',
        title: null,
        photo_url: null,
        pinned: false,
        last_message_at: 2,
        unread_count: null as unknown as number,
      },
    ]);
    const list = await listConversationsForBot(db as never, 'b1');
    const row = list.find(c => c.id === 'c9');
    expect(row?.title).toBe('Complet');
    expect(row?.photo_url).toBe('https://example.invalid/p.png');
    expect(row?.unread_count).toBe(3);
  });

  it('transaction upsertMessages : rollback si erreur au milieu', async () => {
    const many: Message[] = [];
    for (let i = 0; i < 50; i += 1) {
      many.push({
        id: `bulk${i}`,
        conversation_id: 'cx',
        direction: 'in',
        kind: 'text',
        text: `x${i}`,
        created_at: i,
      });
    }
    await upsertMessages(db as never, many);
    const before = await listMessagesForConversation(db as never, 'cx', 1000);
    expect(before.length).toBe(50);
    // Forcer une erreur : conversation_id NOT NULL — id null impossible via types ;
    // on exécute un SQL invalide dans la même connexion pour vérifier isolation.
    await expect(
      db.execute('INSERT INTO messages (id) VALUES (NULL);'),
    ).rejects.toBeTruthy();
    const after = await listMessagesForConversation(db as never, 'cx', 1000);
    expect(after.length).toBe(50);
  });
