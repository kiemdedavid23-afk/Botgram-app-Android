/** Mock fs-only + actionViewIntent — jamais de réseau. */
const store = new Map<string, string>();
const dirsCreated = new Set<string>();

const fs = {
  dirs: {
    DocumentDir: '/mock/documents',
    CacheDir: '/mock/cache',
  },
  exists: jest.fn(async (path: string) => {
    if (dirsCreated.has(path)) return true;
    if (path.endsWith('botgram-media')) return dirsCreated.has(path);
    return store.has(path);
  }),
  mkdir: jest.fn(async (path: string) => {
    dirsCreated.add(path);
  }),
  writeFile: jest.fn(async (path: string, data: string) => {
    store.set(path, data);
  }),
  readFile: jest.fn(async (path: string) => {
    const v = store.get(path);
    if (v === undefined) throw new Error('ENOENT');
    return v;
  }),
  unlink: jest.fn(async (path: string) => {
    store.delete(path);
    dirsCreated.delete(path);
  }),
  stat: jest.fn(async (path: string) => ({
    size: (store.get(path) ?? '').length,
  })),
  ls: jest.fn(async (dir: string) => {
    const prefix = dir.endsWith('/') ? dir : `${dir}/`;
    return Array.from(store.keys())
      .filter(k => k.startsWith(prefix))
      .map(k => k.slice(prefix.length));
  }),
};

const ReactNativeBlobUtil = {
  fs,
  android: {
    actionViewIntent: jest.fn(async () => undefined),
  },
};

export default ReactNativeBlobUtil;

export function __resetMediaMockStore(): void {
  store.clear();
  dirsCreated.clear();
}
