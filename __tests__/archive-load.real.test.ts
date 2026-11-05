/**
 * 6bis-e — charge : 20 000 messages, 40 conversations (vraie SQLite).
 * Les seuils sont larges (CI partagé) ; ils détectent un balayage complet
 * de table ou une régression d'ordre de grandeur, pas une performance fine.
 * La performance réelle (SQLCipher, téléphone) se mesure avec l'APK.
 */
import {openRealSqliteDb, type MinimalDb} from './helpers/realSqliteDb';
import {runMigrations} from '../src/core/archive/migrations';
import {upsertConversations} from '../src/core/archive/conversationsRepo';
import {
  upsertMessages,
  listMessagesForConversation,
} from '../src/core/archive/messagesRepo';
import {insertTombstone} from '../src/core/archive/tombstonesRepo';
import {ensureFts, searchMessagesInDb} from '../src/core/archive/ftsRepo';
import {enqueueWrite} from '../src/core/archive/writeQueue';
import type {Message} from '../src/core/realtime/messageTypes';

const CONVERSATIONS = 40;
const PER_CONVERSATION = 500;
const WORDS = [
  'bonjour', 'commande', 'paiement', 'livraison', 'merci', 'facture',
  'rendez-vous', 'photo', 'urgent', 'confirmé', 'retard', 'produit',
];

function makeMessage(conv: number, i: number): Message {
  const w = (k: number) => WORDS[(conv * 7 + i * 3 + k) % WORDS.length]!;
  const rare = conv === 13 && i === 321 ? ' zébulon' : '';
  return {
    id: `c${conv}-m${i}`,
    conversation_id: `c${conv}`,
    direction: i % 2 === 0 ? 'in' : 'out',
    kind: 'text',
    status: 'received',
    text: `${w(0)} ${w(1)} ${w(2)} numéro ${i}${rare}`,
    created_at: 1_700_000_000_000 + conv * 1_000_000 + i * 1000,
  };
}

async function elapsed(fn: () => Promise<unknown>): Promise<number> {
  const t0 = Date.now();
  await fn();
  return Date.now() - t0;
}

describe('archive sous charge (20 000 messages)', () => {
  let db: MinimalDb;

  beforeAll(async () => {
    db = openRealSqliteDb();
    await runMigrations(db as never);
    await ensureFts(db as never);
    await upsertConversations(
      db as never,
      Array.from({length: CONVERSATIONS}, (_, c) => ({
        id: `c${c}`,
        bot_id: 'b1',
        title: `Conversation ${c}`,
      })),
    );
    for (let c = 0; c < CONVERSATIONS; c += 1) {
      const batch = Array.from({length: PER_CONVERSATION}, (_, i) =>
        makeMessage(c, i),
      );
      for (let k = 0; k < batch.length; k += 100) {
        await upsertMessages(db as never, batch.slice(k, k + 100));
      }
    }
  }, 120_000);

  afterAll(() => db.close());

  it('tout est là', () => {
    const row = db.raw.prepare('SELECT count(*) AS n FROM messages').get() as {n: number};
    expect(row.n).toBe(CONVERSATIONS * PER_CONVERSATION);
    const fts = db.raw.prepare('SELECT count(*) AS n FROM messages_fts').get() as {n: number};
    expect(fts.n).toBe(CONVERSATIONS * PER_CONVERSATION);
  });

  it('mot rare : un seul résultat, rapide', async () => {
    let hits = 0;
    const ms = await elapsed(async () => {
      const res = await searchMessagesInDb(db as never, 'b1', 'zebulon', 50, true);
      hits = res.hits.length;
    });
    expect(hits).toBe(1);
    expect(ms).toBeLessThan(1000);
  });

  it('mot très fréquent : limité à 50, rapide, trié du plus récent', async () => {
    let res!: Awaited<ReturnType<typeof searchMessagesInDb>>;
    const ms = await elapsed(async () => {
      res = await searchMessagesInDb(db as never, 'b1', 'commande', 50, true);
    });
    expect(res.hits.length).toBe(50);
    const dates = res.hits.map(h => h.createdAt ?? 0);
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
    expect(ms).toBeLessThan(1500);
  });

  it('préfixe + deux mots, avec accents', async () => {
    const ms = await elapsed(async () => {
      const res = await searchMessagesInDb(db as never, 'b1', 'confirm retard', 50, true);
      expect(res.hits.length).toBeGreaterThan(0);
    });
    expect(ms).toBeLessThan(1500);
  });

  it('repli LIKE : même mot rare retrouvé, dans un délai raisonnable', async () => {
    let hits = 0;
    const ms = await elapsed(async () => {
      const res = await searchMessagesInDb(db as never, 'b1', 'zebulon', 50, false);
      hits = res.hits.length;
    });
    expect(hits).toBe(0); // LIKE ne retire pas les accents : « zébulon » ≠ « zebulon »
    expect(ms).toBeLessThan(3000);
    const accent = await searchMessagesInDb(db as never, 'b1', 'zébulon', 50, false);
    expect(accent.hits.length).toBe(1);
  });

  it('lecture du fil : 50 derniers messages d’une conversation, rapide', async () => {
    let n = 0;
    const ms = await elapsed(async () => {
      const list = await listMessagesForConversation(db as never, 'c13', 50);
      n = list.length;
    });
    expect(n).toBe(50);
    expect(ms).toBeLessThan(500);
  });

  it('écritures concurrentes sous charge : aucune perte', async () => {
    const before = (db.raw.prepare('SELECT count(*) AS n FROM messages').get() as {n: number}).n;
    await Promise.all(
      Array.from({length: 20}, (_, k) =>
        enqueueWrite(() =>
          upsertMessages(db as never, [
            {
              id: `conc-${k}`,
              conversation_id: 'c1',
              direction: 'in',
              kind: 'text',
              status: 'received',
              text: `concurrent ${k}`,
              created_at: 2_000_000_000_000 + k,
            },
          ]),
        ),
      ),
    );
    const after = (db.raw.prepare('SELECT count(*) AS n FROM messages').get() as {n: number}).n;
    expect(after - before).toBe(20);
    const res = await searchMessagesInDb(db as never, 'b1', 'concurrent', 50, true);
    expect(res.hits.length).toBe(20);
  });

  it('suppressions (tombstones) sous charge : exclues de la recherche', async () => {
    for (let c = 0; c < 10; c += 1) {
      await insertTombstone(db as never, 'conversation', `c${c}`, 'user_deleted');
    }
    const res = await searchMessagesInDb(db as never, 'b1', 'commande', 50, true);
    for (const hit of res.hits) {
      expect(Number(hit.conversationId.slice(1))).toBeGreaterThanOrEqual(10);
    }
  });
});
