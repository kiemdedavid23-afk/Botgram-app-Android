/**
 * 6bis-e — recherche plein texte sur vraie SQLite (better-sqlite3, FTS5 inclus).
 * SQLCipher / FTS5 de la build Android : à vérifier sur téléphone.
 */
import {openRealSqliteDb, type MinimalDb} from './helpers/realSqliteDb';
import {runMigrations} from '../src/core/archive/migrations';
import {upsertConversations} from '../src/core/archive/conversationsRepo';
import {upsertMessages} from '../src/core/archive/messagesRepo';
import {insertTombstone} from '../src/core/archive/tombstonesRepo';
import {ensureFts, searchMessagesInDb} from '../src/core/archive/ftsRepo';
import type {Message} from '../src/core/realtime/messageTypes';

type Opts = {id: string; conv?: string; text: string | null; at?: number; dir?: 'in' | 'out'};

function msg(o: Opts): Message {
  return {
    id: o.id,
    conversation_id: o.conv ?? 'c1',
    direction: o.dir ?? 'in',
    kind: 'text',
    status: 'received',
    text: o.text,
    created_at: o.at ?? 1000,
  };
}

async function setup(): Promise<MinimalDb> {
  const db = openRealSqliteDb();
  await runMigrations(db as never);
  await upsertConversations(db as never, [
    {id: 'c1', bot_id: 'b1', title: 'Awa Traoré'},
    {id: 'c2', bot_id: 'b1', first_name: 'Ali', last_name: 'Koné'},
    {id: 'c3', bot_id: 'b2', title: 'Autre bot'},
  ]);
  return db;
}

async function search(db: MinimalDb, q: string, fts = true, botId = 'b1') {
  return searchMessagesInDb(db as never, botId, q, 50, fts);
}

describe('ensureFts', () => {
  it('crée l’index, rattrape les messages déjà présents, est idempotent', async () => {
    const db = await setup();
    await upsertMessages(db as never, [msg({id: 'm1', text: 'bonjour le monde'})]);
    expect(await ensureFts(db as never)).toBe(true);
    expect((await search(db, 'monde')).hits.map(h => h.messageId)).toEqual(['m1']);
    expect(await ensureFts(db as never)).toBe(true);
    expect((await search(db, 'monde')).hits.length).toBe(1);
  });

  it('FTS indisponible : renvoie false sans lever d’erreur', async () => {
    const db = await setup();
    const failing = {
      execute: async (sql: string) => {
        if (sql.includes('sqlite_master')) return {rows: []};
        throw new Error('no such module: fts5');
      },
    };
    expect(await ensureFts(failing as never)).toBe(false);
  });
});

describe('recherche FTS5', () => {
  let db: MinimalDb;
  beforeEach(async () => {
    db = await setup();
    await ensureFts(db as never);
  });
  afterEach(() => db.close());

  it('insensible aux accents et à la casse, préfixe accepté', async () => {
    await upsertMessages(db as never, [
      msg({id: 'm1', text: 'Merci pour la RÉPONSE rapide', at: 10}),
      msg({id: 'm2', text: 'rien à voir', at: 20}),
    ]);
    expect((await search(db, 'reponse')).hits.map(h => h.messageId)).toEqual(['m1']);
    expect((await search(db, 'répon')).hits.map(h => h.messageId)).toEqual(['m1']);
    expect((await search(db, 'MERCI')).hits.length).toBe(1);
  });

  it('plusieurs mots : tous requis', async () => {
    await upsertMessages(db as never, [
      msg({id: 'm1', text: 'commande livrée hier'}),
      msg({id: 'm2', text: 'commande annulée'}),
    ]);
    expect((await search(db, 'commande livrée')).hits.map(h => h.messageId)).toEqual([
      'm1',
    ]);
  });

  it('résultats les plus récents d’abord, titre de conversation', async () => {
    await upsertMessages(db as never, [
      msg({id: 'old', text: 'paiement reçu', at: 100}),
      msg({id: 'new', conv: 'c2', text: 'paiement envoyé', at: 200}),
    ]);
    const res = await search(db, 'paiement');
    expect(res.mode).toBe('fts');
    expect(res.hits.map(h => h.messageId)).toEqual(['new', 'old']);
    expect(res.hits.map(h => h.conversationTitle)).toEqual(['Ali Koné', 'Awa Traoré']);
  });

  it('limité au bot courant', async () => {
    await upsertMessages(db as never, [
      msg({id: 'm1', text: 'secret partagé'}),
      msg({id: 'm9', conv: 'c3', text: 'secret ailleurs'}),
    ]);
    expect((await search(db, 'secret', true, 'b1')).hits.map(h => h.messageId)).toEqual(['m1']);
    expect((await search(db, 'secret', true, 'b2')).hits.map(h => h.messageId)).toEqual(['m9']);
  });

  it('message tombstoné et conversation tombstonée exclus', async () => {
    await upsertMessages(db as never, [
      msg({id: 'm1', text: 'visible quand même'}),
      msg({id: 'm2', text: 'visible supprimé'}),
      msg({id: 'm3', conv: 'c2', text: 'visible conversation supprimée'}),
    ]);
    expect((await search(db, 'visible')).hits.length).toBe(3);
    await insertTombstone(db as never, 'message', 'm2', 'user_deleted');
    await insertTombstone(db as never, 'conversation', 'c2', 'user_deleted');
    expect((await search(db, 'visible')).hits.map(h => h.messageId)).toEqual(['m1']);
  });

  it('message modifié : l’index suit (ancien texte introuvable)', async () => {
    await upsertMessages(db as never, [msg({id: 'm1', text: 'ancien contenu'})]);
    await upsertMessages(db as never, [msg({id: 'm1', text: 'nouveau contenu'})]);
    expect((await search(db, 'ancien')).hits.length).toBe(0);
    expect((await search(db, 'nouveau')).hits.length).toBe(1);
  });

  it('message sans texte (média) : jamais trouvé, pas d’erreur', async () => {
    await upsertMessages(db as never, [msg({id: 'm1', text: null})]);
    expect((await search(db, 'texte')).hits.length).toBe(0);
  });

  it('requête piégée (opérateurs, guillemets) : aucune erreur SQL', async () => {
    await upsertMessages(db as never, [msg({id: 'm1', text: 'a b c'})]);
    for (const q of ['"', 'a OR', 'NEAR(', '*', 'a" AND "b', '-a', '(((']) {
      await expect(search(db, q)).resolves.toBeDefined();
    }
  });

  it('extrait avec mot en évidence', async () => {
    await upsertMessages(db as never, [msg({id: 'm1', text: 'Merci pour la Réponse'})]);
    const hit = (await search(db, 'reponse')).hits[0]!;
    expect(hit.segments.filter(s => s.hit).map(s => s.text)).toEqual(['Réponse']);
  });

  it('suppression physique du message : retiré de l’index', async () => {
    await upsertMessages(db as never, [msg({id: 'm1', text: 'éphémère'})]);
    db.raw.prepare("DELETE FROM messages WHERE id = 'm1'").run();
    const left = db.raw
      .prepare("SELECT count(*) AS n FROM messages_fts WHERE messages_fts MATCH 'ephemere'")
      .get() as {n: number};
    expect(left.n).toBe(0);
  });
});

describe('repli LIKE (sans FTS5)', () => {
  it('mêmes résultats que FTS pour des mots sans accent, mode « like »', async () => {
    const db = await setup();
    await upsertMessages(db as never, [
      msg({id: 'm1', text: 'commande livree hier', at: 10}),
      msg({id: 'm2', text: 'commande annulee', at: 20}),
      msg({id: 'm3', text: '100% garanti', at: 30}),
    ]);
    await ensureFts(db as never);
    for (const q of ['commande', 'commande livree', 'hier']) {
      const a = await search(db, q, true);
      const b = await search(db, q, false);
      expect(b.mode).toBe('like');
      expect(b.hits.map(h => h.messageId)).toEqual(a.hits.map(h => h.messageId));
    }
    expect((await search(db, '100', false)).hits.map(h => h.messageId)).toEqual(['m3']);
    db.close();
  });
});
