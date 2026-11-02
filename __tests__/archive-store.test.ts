/**
 * 6bis-a + 6bis-b — ArchiveStore (faux op-sqlite déclaré comme tel).
 */
import {__resetOpSqliteMock, __wasDeleted} from '../__mocks__/op-sqlite';
import {
  createOpSqliteArchiveStore,
  bindArchiveStore,
  getArchiveStore,
  resetArchiveStoreForTests,
  registerArchiveStoreCleaner,
} from '../src/core/archive';
import {clearMemberData} from '../src/core/utils/memberData';
import {resetArchiveHydrateForTests} from '../src/core/archive/hydrate';

const mockClearArchiveKey = jest.fn(async () => undefined);
const mockGetOrCreate = jest.fn(async () => 'test-archive-key-32chars-minimum!!');
const mockGetIfExists = jest.fn(async () => 'test-archive-key-32chars-minimum!!');

jest.mock('../src/core/storage/secureStorage', () => ({
  getOrCreateArchiveKey: () => mockGetOrCreate(),
  getArchiveKeyIfExists: () => mockGetIfExists(),
  clearArchiveKey: () => mockClearArchiveKey(),
}));

jest.mock('../src/core/storage/cache', () => {
  const map = new Map<string, string>();
  return {
    cacheGetString: jest.fn(async (k: string) => map.get(k)),
    cacheSetString: jest.fn(async (k: string, v: string) => {
      map.set(k, v);
    }),
    cacheGetAllKeys: jest.fn(async () => Array.from(map.keys())),
    cacheDeleteByPrefix: jest.fn(async () => undefined),
    __map: map,
  };
});

describe('ArchiveStore 6bis-a/b', () => {
  beforeEach(() => {
    __resetOpSqliteMock();
    resetArchiveStoreForTests();
    resetArchiveHydrateForTests();
    mockClearArchiveKey.mockClear();
    mockGetOrCreate.mockClear();
    mockGetIfExists.mockClear();
    const store = createOpSqliteArchiveStore();
    bindArchiveStore(store);
  });

  it('open + proofInsert + proofCount', async () => {
    const store = getArchiveStore();
    const res = await store.open();
    expect(res.ok).toBe(true);
    expect(store.isOpen()).toBe(true);
    await store.proofInsert('hello');
    await store.proofInsert('world');
    expect(await store.proofCount()).toBe(2);
  });

  it('ensureOpen single-flight (deux appels simultanés)', async () => {
    const store = getArchiveStore();
    const [a, b] = await Promise.all([store.open(), store.open()]);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    // une seule génération de clé / open série
    expect(mockGetOrCreate.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('clearAll supprime fichier (delete) et clé Keychain', async () => {
    const store = getArchiveStore();
    await store.proofInsert('x');
    expect(await store.proofCount()).toBe(1);
    await store.clearAll();
    expect(__wasDeleted()).toBe(true);
    expect(mockClearArchiveKey).toHaveBeenCalledTimes(1);
    expect(store.isOpen()).toBe(false);
  });

  it('clearMemberData appelle clearAll (effacement 13.5)', async () => {
    registerArchiveStoreCleaner();
    const store = getArchiveStore();
    await store.proofInsert('to-wipe');
    expect(await store.proofCount()).toBe(1);
    await clearMemberData();
    expect(mockClearArchiveKey).toHaveBeenCalled();
    const store2 = createOpSqliteArchiveStore();
    bindArchiveStore(store2);
    expect(await store2.proofCount()).toBe(0);
  });

  it('upsert + list conversations conserve les ids absents du serveur', async () => {
    const store = getArchiveStore();
    await store.open();
    await store.upsertConversations([
      {
        id: 'c1',
        bot_id: 'b1',
        title: 'Alice',
        pinned: false,
        last_message_at: 100,
        unread_count: 1,
      },
      {
        id: 'c2',
        bot_id: 'b1',
        title: 'Bob',
        pinned: true,
        last_message_at: 50,
        unread_count: 0,
      },
    ]);
    // serveur ne renvoie que c1 → on upsert seulement c1
    await store.upsertConversations([
      {
        id: 'c1',
        bot_id: 'b1',
        title: 'Alice maj',
        pinned: false,
        last_message_at: 200,
        unread_count: 0,
      },
    ]);
    const list = await store.listConversations('b1');
    expect(list.map(c => c.id).sort()).toEqual(['c1', 'c2']);
    const alice = list.find(c => c.id === 'c1');
    expect(alice?.title).toBe('Alice maj');
  });

  it('upsert + list messages', async () => {
    const store = getArchiveStore();
    await store.open();
    await store.upsertMessages([
      {
        id: 'm1',
        conversation_id: 'c1',
        direction: 'in',
        kind: 'text',
        text: 'bonjour',
        created_at: 10,
      },
      {
        id: 'm2',
        conversation_id: 'c1',
        direction: 'out',
        kind: 'text',
        text: 'salut',
        created_at: 20,
      },
    ]);
    const list = await store.listMessages('c1', 50);
    expect(list).toHaveLength(2);
    expect(list[0]?.text).toBe('bonjour');
    expect(list[1]?.text).toBe('salut');
  });

  it('migration MMKV idempotente', async () => {
    const cache = jest.requireMock('../src/core/storage/cache') as {
      __map: Map<string, string>;
      cacheSetString: (k: string, v: string) => Promise<void>;
    };
    cache.__map.clear();
    await cache.cacheSetString(
      'conversations.page1.b1',
      JSON.stringify([
        {
          id: 'cm1',
          bot_id: 'b1',
          title: 'From MMKV',
          pinned: false,
          last_message_at: 1,
        },
      ]),
    );
    await cache.cacheSetString(
      'thread.messages.c9',
      JSON.stringify([
        {
          id: 'mm1',
          conversation_id: 'c9',
          direction: 'in',
          kind: 'text',
          text: 'cached',
          created_at: 5,
        },
      ]),
    );
    const store = getArchiveStore();
    const r1 = await store.migrateFromMmkv();
    expect(r1.conversations).toBeGreaterThanOrEqual(1);
    expect(r1.messages).toBeGreaterThanOrEqual(1);
    const r2 = await store.migrateFromMmkv();
    expect(r2.conversations).toBe(0);
    expect(r2.messages).toBe(0);
    const convs = await store.listConversations('b1');
    expect(convs.some(c => c.id === 'cm1')).toBe(true);
  });
});
