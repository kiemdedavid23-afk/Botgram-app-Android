/**
 * 6bis-a — ArchiveStore (faux op-sqlite déclaré comme tel).
 */
import {__resetOpSqliteMock} from '../__mocks__/op-sqlite';
import {
  createOpSqliteArchiveStore,
  bindArchiveStore,
  getArchiveStore,
  resetArchiveStoreForTests,
  registerArchiveStoreCleaner,
} from '../src/core/archive';
import {clearMemberData} from '../src/core/utils/memberData';

jest.mock('../src/core/storage/secureStorage', () => ({
  getOrCreateArchiveKey: jest.fn(async () => 'test-archive-key-32chars-minimum!!'),
}));

describe('ArchiveStore 6bis-a', () => {
  beforeEach(() => {
    __resetOpSqliteMock();
    resetArchiveStoreForTests();
    const store = createOpSqliteArchiveStore();
    bindArchiveStore(store);
  });

  it('open + proofInsert + proofCount', async () => {
    const store = getArchiveStore();
    await store.open();
    expect(store.isOpen()).toBe(true);
    await store.proofInsert('hello');
    await store.proofInsert('world');
    expect(await store.proofCount()).toBe(2);
  });

  it('clearAll vide la table de preuve', async () => {
    const store = getArchiveStore();
    await store.proofInsert('x');
    expect(await store.proofCount()).toBe(1);
    await store.clearAll();
    expect(await store.proofCount()).toBe(0);
  });

  it('clearMemberData appelle clearAll (effacement 13.5)', async () => {
    registerArchiveStoreCleaner();
    const store = getArchiveStore();
    await store.proofInsert('to-wipe');
    expect(await store.proofCount()).toBe(1);
    await clearMemberData();
    // après clearAll + close, réouvrir pour compter
    const store2 = createOpSqliteArchiveStore();
    bindArchiveStore(store2);
    expect(await store2.proofCount()).toBe(0);
  });
});
