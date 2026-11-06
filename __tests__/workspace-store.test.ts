import {
  useWorkspaceStore,
  parseWorkspacesCache,
} from '../src/features/accounts/store/workspaceStore';
import {listWorkspaces} from '../src/core/api/endpoints/workspaces';
import * as storage from '../src/core/storage';

jest.mock('../src/core/storage');
jest.mock('../src/core/api/endpoints/workspaces', () => ({
  listWorkspaces: jest.fn(),
}));

const mockList = listWorkspaces as jest.Mock;
const mockCacheGet = storage.cacheGetString as jest.Mock;
const mockCacheSet = storage.cacheSetString as jest.Mock;

const WS = {
  id: 'c_1',
  kind: 'company',
  name: 'Acme',
  role: 'agent',
  owner: {id: 'o', display_name: 'Moussa'},
  members_count: 4,
  country: 'BF',
  sector: null,
  phone: null,
  created_at: 1,
};

const ok = (workspaces: unknown[]) => ({
  ok: true,
  status: 200,
  data: {workspaces},
  requestId: null,
  headers: new Headers(),
});
const fail = (status: number) => ({
  ok: false,
  status,
  error: {code: 'X', message: 'x'},
  requestId: null,
  headers: new Headers(),
});

describe('workspaceStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWorkspaceStore.getState().clear();
    mockCacheGet.mockResolvedValue(undefined);
  });

  it('charge les espaces, expose le rôle et met en cache', async () => {
    mockList.mockResolvedValue(ok([WS]));
    await useWorkspaceStore.getState().load();
    const s = useWorkspaceStore.getState();
    expect(s.serverLoaded).toBe(true);
    expect(s.current()?.role).toBe('agent');
    expect(mockCacheSet).toHaveBeenCalledWith('workspaces.list', JSON.stringify([WS]));
  });

  it('hydrate depuis le cache sans marquer « lu en ligne »', async () => {
    mockCacheGet.mockResolvedValue(JSON.stringify([WS]));
    await useWorkspaceStore.getState().hydrate();
    const s = useWorkspaceStore.getState();
    expect(s.workspaces).toHaveLength(1);
    expect(s.serverLoaded).toBe(false);
  });

  it('hors ligne : garde les espaces, serverLoaded reste faux', async () => {
    mockCacheGet.mockResolvedValue(JSON.stringify([WS]));
    await useWorkspaceStore.getState().hydrate();
    mockList.mockResolvedValue(fail(0));
    await useWorkspaceStore.getState().load();
    const s = useWorkspaceStore.getState();
    expect(s.offline).toBe(true);
    expect(s.serverLoaded).toBe(false);
    expect(s.workspaces).toHaveLength(1);
  });

  it('TTL : pas de nouvel appel dans les 3 minutes, sauf force', async () => {
    mockList.mockResolvedValue(ok([WS]));
    await useWorkspaceStore.getState().load();
    await useWorkspaceStore.getState().load();
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it('forcer deux fois de suite (rafale de 403) ne relit qu’une fois', async () => {
    mockList.mockResolvedValue(ok([WS]));
    await useWorkspaceStore.getState().load(true);
    await useWorkspaceStore.getState().load(true);
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it('single-flight : deux appels simultanés = une requête', async () => {
    mockList.mockResolvedValue(ok([WS]));
    await Promise.all([
      useWorkspaceStore.getState().load(),
      useWorkspaceStore.getState().load(),
    ]);
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it('clear vide tout et ignore une réponse en vol (génération)', async () => {
    let resolve: (v: unknown) => void = () => {};
    mockList.mockReturnValue(new Promise(r => (resolve = r)));
    const p = useWorkspaceStore.getState().load();
    useWorkspaceStore.getState().clear();
    resolve(ok([WS]));
    await p;
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(0);
    expect(useWorkspaceStore.getState().serverLoaded).toBe(false);
  });

  it('cache invalide ignoré', () => {
    expect(parseWorkspacesCache('pas du json')).toBeNull();
    expect(parseWorkspacesCache('{"a":1}')).toBeNull();
    expect(parseWorkspacesCache('[{"x":1}]')).toBeNull();
    expect(parseWorkspacesCache(undefined)).toBeNull();
  });
});
