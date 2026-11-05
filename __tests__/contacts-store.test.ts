/**
 * Étape 7 — store des contacts : pagination, recherche, hors ligne, effacement.
 */
import {useContactsStore, appendUnique} from '../src/features/contacts/store/contactsStore';
import {listContacts, searchContacts} from '../src/core/api/endpoints/contacts';
import {
  cacheGetString,
  cacheSetString,
  cacheDeleteByPrefix,
} from '../src/core/storage';
import type {Contact} from '../src/core/api/endpoints/contacts';

jest.mock('../src/core/api/endpoints/contacts', () => ({
  listContacts: jest.fn(),
  searchContacts: jest.fn(),
}));

jest.mock('../src/core/storage', () => ({
  cacheGetString: jest.fn(),
  cacheSetString: jest.fn(async () => undefined),
  cacheDeleteByPrefix: jest.fn(async () => undefined),
}));

const mockList = listContacts as unknown as jest.Mock;
const mockSearch = searchContacts as unknown as jest.Mock;
const mockCacheGet = cacheGetString as unknown as jest.Mock;
const mockCacheSet = cacheSetString as unknown as jest.Mock;
const mockCacheDel = cacheDeleteByPrefix as unknown as jest.Mock;

function contact(id: string, first = id): Contact {
  return {id, bot_id: 'b1', first_name: first};
}

const ok = <T>(data: T) => ({ok: true, status: 200, data});
const fail = (status: number) => ({
  ok: false,
  status,
  error: {code: 'ERR', message: 'échec'},
});

const flush = () => new Promise<void>(resolve => setImmediate(resolve));

function store() {
  return useContactsStore.getState();
}

describe('contactsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store().clear();
    jest.clearAllMocks();
  });

  it('appendUnique : pas de doublon, ordre conservé', () => {
    const out = appendUnique([contact('a'), contact('b')], [contact('b'), contact('c')]);
    expect(out.map(c => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('setBotId charge la première page et la met en cache', async () => {
    mockList.mockResolvedValue(ok({items: [contact('a'), contact('b')], next_cursor: 'n1'}));
    store().setBotId('b1');
    await flush();
    expect(mockList).toHaveBeenCalledWith('b1', {limit: 50});
    expect(store().items.map(c => c.id)).toEqual(['a', 'b']);
    expect(store().nextCursor).toBe('n1');
    expect(store().loading).toBe(false);
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
  });

  it('loadMore ajoute la page suivante sans doublon', async () => {
    mockList.mockResolvedValueOnce(ok({items: [contact('a')], next_cursor: 'n1'}));
    store().setBotId('b1');
    await flush();
    mockList.mockResolvedValueOnce(
      ok({items: [contact('a'), contact('b')], next_cursor: null}),
    );
    await store().loadMore();
    expect(mockList).toHaveBeenLastCalledWith('b1', {limit: 50, cursor: 'n1'});
    expect(store().items.map(c => c.id)).toEqual(['a', 'b']);
    expect(store().nextCursor).toBeNull();
    await store().loadMore();
    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it('échec réseau avec cache : liste du cache, hors ligne, pas d’erreur', async () => {
    mockCacheGet.mockResolvedValue(JSON.stringify([contact('x')]));
    mockList.mockResolvedValue(fail(0));
    store().setBotId('b1');
    await flush();
    expect(store().items.map(c => c.id)).toEqual(['x']);
    expect(store().offline).toBe(true);
    expect(store().error).toBeNull();
  });

  it('échec sans cache : message d’erreur', async () => {
    mockCacheGet.mockResolvedValue(undefined);
    mockList.mockResolvedValue(fail(500));
    store().setBotId('b1');
    await flush();
    expect(store().items).toEqual([]);
    expect(store().error).toBe('échec');
    expect(store().offline).toBe(false);
  });

  it('réponse périmée (bot changé entre-temps) ignorée', async () => {
    let resolveFirst!: (v: unknown) => void;
    mockList.mockReturnValueOnce(new Promise(r => (resolveFirst = r)));
    store().setBotId('b1');
    mockList.mockResolvedValueOnce(ok({items: [contact('z')], next_cursor: null}));
    store().setBotId('b2');
    await flush();
    resolveFirst(ok({items: [contact('old')], next_cursor: null}));
    await flush();
    expect(store().botId).toBe('b2');
    expect(store().items.map(c => c.id)).toEqual(['z']);
  });

  it('recherche : résultats, requête vide vide la liste, échec → vide', async () => {
    mockList.mockResolvedValue(ok({items: [], next_cursor: null}));
    store().setBotId('b1');
    await flush();
    mockSearch.mockResolvedValueOnce(ok({items: [contact('s1')], next_cursor: null}));
    await store().search('  awa ');
    expect(mockSearch).toHaveBeenCalledWith('b1', 'awa', 30);
    expect(store().searchItems.map(c => c.id)).toEqual(['s1']);
    await store().search('   ');
    expect(store().searchItems).toEqual([]);
    mockSearch.mockResolvedValueOnce(fail(500));
    await store().search('x');
    expect(store().searchItems).toEqual([]);
    expect(store().searching).toBe(false);
  });

  it('clear : tout est vidé et le cache effacé', async () => {
    mockList.mockResolvedValue(ok({items: [contact('a')], next_cursor: null}));
    store().setBotId('b1');
    await flush();
    store().clear();
    expect(store().botId).toBeNull();
    expect(store().items).toEqual([]);
    expect(mockCacheDel).toHaveBeenCalledWith('contacts.page1.');
  });
});
