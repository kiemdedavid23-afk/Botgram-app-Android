import {
  loadAttachmentToStorage,
  inflightCountForTests,
} from '../src/core/media/loadAttachment';
import * as MessagesApi from '../src/core/api/endpoints/messages';
import {
  getMediaStorage,
  setMediaStorageForTests,
  resetMediaStorageForTests,
} from '../src/core/media/MediaStorage';
import {clearMemberData} from '../src/core/utils/memberData';
import {registerMediaStorageCleaner} from '../src/core/media/registerMediaCleaner';

jest.mock('../src/core/api/endpoints/messages', () => ({
  fetchAttachment: jest.fn(),
}));

const mockFetch = MessagesApi.fetchAttachment as jest.MockedFunction<
  typeof MessagesApi.fetchAttachment
>;

describe('loadAttachment inflight + clear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMediaStorageForTests();
    const mem = new Map<string, string>();
    setMediaStorageForTests({
      exists: async id => mem.has(id),
      writeBase64: async (id, b64) => {
        mem.set(id, b64);
        return `/mem/${id}`;
      },
      readBase64: async id => mem.get(id) ?? null,
      delete: async id => {
        mem.delete(id);
      },
      sizeOf: async id => (mem.get(id) ?? '').length,
      totalSize: async () =>
        Array.from(mem.values()).reduce((a, b) => a + b.length, 0),
      clearAll: async () => {
        mem.clear();
      },
      localPath: id => `/mem/${id}`,
    });
  });

  it('deux demandes simultanées = un seul fetchAttachment', async () => {
    let resolve!: (v: {
      ok: true;
      data: ArrayBuffer;
      status: number;
      headers: Headers;
      requestId: null;
    }) => void;
    const deferred = new Promise<Parameters<typeof resolve>[0]>(r => {
      resolve = r;
    });
    mockFetch.mockReturnValueOnce(deferred as never);
    const p1 = loadAttachmentToStorage('m1');
    const p2 = loadAttachmentToStorage('m1');
    expect(inflightCountForTests()).toBe(1);
    resolve({
      ok: true,
      data: new Uint8Array([1, 2, 3]).buffer,
      status: 200,
      headers: new Headers(),
      requestId: null,
    });
    const [a, b] = await Promise.all([p1, p2]);
    expect(a.ok && b.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('clearMemberData vide les médias', async () => {
    registerMediaStorageCleaner();
    await getMediaStorage().writeBase64('x', 'YWJj');
    expect(await getMediaStorage().exists('x')).toBe(true);
    await clearMemberData();
    expect(await getMediaStorage().exists('x')).toBe(false);
  });
});
