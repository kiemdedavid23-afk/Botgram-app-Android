/**
 * cacheDeleteByPrefix — suppression durable des clés par préfixe (13.5).
 */
const mockStore = new Map<string, string>();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: (k: string, v: string) => {
      mockStore.set(k, v);
    },
    getString: (k: string) => mockStore.get(k),
    getNumber: () => undefined,
    getBoolean: () => undefined,
    delete: (k: string) => {
      mockStore.delete(k);
    },
    clearAll: () => {
      mockStore.clear();
    },
    getAllKeys: () => Array.from(mockStore.keys()),
  })),
}));

jest.mock('../src/core/storage/secureStorage', () => ({
  getOrCreateMmkvKey: jest.fn(() =>
    Promise.resolve('test-key-32chars-padding!!'),
  ),
}));

import {
  cacheSetString,
  cacheGetString,
  cacheDeleteByPrefix,
} from '../src/core/storage/cache';

describe('cacheDeleteByPrefix', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('supprime conversations.page1.* sans toucher appearance', async () => {
    await cacheSetString('conversations.page1.a', 'A');
    await cacheSetString('conversations.page1.b', 'B');
    await cacheSetString('appearance', 'keep');
    await cacheDeleteByPrefix('conversations.page1.');
    expect(await cacheGetString('conversations.page1.a')).toBeUndefined();
    expect(await cacheGetString('conversations.page1.b')).toBeUndefined();
    expect(await cacheGetString('appearance')).toBe('keep');
  });
});
