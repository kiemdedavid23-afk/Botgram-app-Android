/**
 * Étape 7 — endpoints contacts : chemins, bornes de limite, encodage de la recherche.
 */
import {listContacts, searchContacts} from '../src/core/api/endpoints/contacts';
import {authedHttp} from '../src/core/api/session';

jest.mock('../src/core/api/session', () => ({
  authedHttp: jest.fn(async () => ({
    ok: true,
    status: 200,
    data: {items: [], next_cursor: null},
  })),
}));

const mockHttp = authedHttp as unknown as jest.Mock;

function lastPath(): string {
  const call = mockHttp.mock.calls[mockHttp.mock.calls.length - 1]![0] as {
    method: string;
    path: string;
  };
  expect(call.method).toBe('GET');
  return call.path;
}

describe('listContacts', () => {
  beforeEach(() => mockHttp.mockClear());

  it('limite par défaut 20, sans curseur', async () => {
    await listContacts('b1');
    expect(lastPath()).toBe('/bots/b1/contacts?limit=20');
  });

  it('curseur transmis', async () => {
    await listContacts('b1', {limit: 50, cursor: 'abc'});
    expect(lastPath()).toBe('/bots/b1/contacts?limit=50&cursor=abc');
  });

  it('limite bornée à 1..50', async () => {
    await listContacts('b1', {limit: 500});
    expect(lastPath()).toBe('/bots/b1/contacts?limit=50');
    await listContacts('b1', {limit: 0});
    expect(lastPath()).toBe('/bots/b1/contacts?limit=1');
  });
});

describe('searchContacts', () => {
  beforeEach(() => mockHttp.mockClear());

  it('terme encodé, limite par défaut', async () => {
    await searchContacts('b1', 'é &x');
    const q = new URLSearchParams({q: 'é &x', limit: '20'}).toString();
    expect(lastPath()).toBe(`/bots/b1/search/contacts?${q}`);
  });
});
