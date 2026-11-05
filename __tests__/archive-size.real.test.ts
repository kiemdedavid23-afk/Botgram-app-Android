/**
 * Taille de l'archive — vraie SQLite (better-sqlite3). SQLCipher non testé ici.
 */
import {openRealSqliteDb} from './helpers/realSqliteDb';
import {runMigrations} from '../src/core/archive/migrations';
import {upsertMessages} from '../src/core/archive/messagesRepo';
import {archiveSizeBytes} from '../src/core/archive/sizeRepo';
import type {Message} from '../src/core/realtime/messageTypes';

function bigMessage(i: number): Message {
  return {
    id: `m${i}`,
    conversation_id: 'c1',
    direction: 'in',
    kind: 'text',
    status: 'received',
    text: 'x'.repeat(2000),
    created_at: 1000 + i,
  };
}

describe('archiveSizeBytes', () => {
  it('= pages × taille de page, et croît avec les données', async () => {
    const db = openRealSqliteDb();
    await runMigrations(db as never);
    const empty = await archiveSizeBytes(db as never);
    const pages = db.raw.pragma('page_count', {simple: true}) as number;
    const pageSize = db.raw.pragma('page_size', {simple: true}) as number;
    expect(empty).toBe(pages * pageSize);
    expect(empty).toBeGreaterThan(0);

    const items = Array.from({length: 100}, (_, i) => bigMessage(i));
    await upsertMessages(db as never, items);
    const filled = await archiveSizeBytes(db as never);
    expect(filled).toBeGreaterThan(empty);
    db.close();
  });
});
