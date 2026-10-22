/**
 * Tests L4b - logique pure + store (scenarios qui echoueraient sur l'ancien code).
 */
import {validate} from '../src/features/botprofile/utils/validate';
import {completeness} from '../src/features/botprofile/utils/completeness';
import {buildChanges, hasChanges} from '../src/features/botprofile/utils/diff';
import {
  addLanguage,
  removeLanguage,
  setTextField,
} from '../src/features/botprofile/utils/edit';
import {
  DEFAULT_LANG,
  emptyRights,
  type BotProfile,
} from '../src/core/api/endpoints/botProfile.types';
import {buildBotPhotoSource, getBotProfile} from '../src/core/api/endpoints/botProfile';
import * as storage from '../src/core/storage';
import {useBotProfileStore} from '../src/features/botprofile/store/botProfileStore';
import {http} from '../src/core/api/http';

jest.mock('../src/core/storage');
jest.mock('../src/core/api/http');
jest.mock('../src/core/config/env', () => ({
  env: {
    apiUrl: 'https://api.test/v1',
    appChannel: 'direct',
    appBuild: 1,
    appVersion: '1.0.0',
    platform: 'android',
  },
}));

const mockHttp = http as jest.MockedFunction<typeof http>;
const mockGetToken = storage.getAccessToken as jest.Mock;
const mockCacheDelete = storage.cacheDelete as jest.Mock;

function ok<T>(data: T, status = 200): Awaited<ReturnType<typeof http>> {
  return {
    ok: true,
    data,
    status,
    headers: new Headers(),
    requestId: null,
  };
}

function fail(
  status: number,
  code: string,
): Awaited<ReturnType<typeof http>> {
  return {
    ok: false,
    error: {code, message: '', details: undefined},
    status,
    headers: new Headers(),
    requestId: null,
  };
}

function profile(over: Partial<BotProfile> = {}): BotProfile {
  return {
    bot_id: 'b1',
    hasPhoto: false,
    texts: {
      [DEFAULT_LANG]: {
        name: 'Demo',
        description: '',
        short_description: '',
      },
    },
    commands: {},
    menu_button: {type: 'default'},
    admin_rights: {groups: emptyRights(), channels: emptyRights()},
    info: {id: '1', username: 'demo_bot'},
    synced_at: 1,
    ...over,
  };
}

/** Reponses minimales pour un getBotProfile complet (textes + paralleles). */
function mockFullProfileLoad(name = 'Demo') {
  // 1) default texts
  mockHttp.mockResolvedValueOnce(
    ok({name, description: '', short_description: ''}),
  );
  // 2-6) commands, menu, rights x2, photo
  mockHttp.mockResolvedValueOnce(ok({commands: []}));
  mockHttp.mockResolvedValueOnce(ok({menu_button: {type: 'default'}}));
  mockHttp.mockResolvedValueOnce(ok({rights: {}}));
  mockHttp.mockResolvedValueOnce(ok({rights: {}}));
  mockHttp.mockResolvedValueOnce(fail(404, 'NOT_FOUND')); // photo
  // probes: many - return same as default so no extra langs (or rate limit stop)
  mockHttp.mockResolvedValue(ok({name, description: '', short_description: ''}));
}

beforeEach(() => {
  jest.resetAllMocks();
  mockCacheDelete.mockResolvedValue(undefined);
  mockGetToken.mockResolvedValue('tok');
  mockHttp.mockReset();
  useBotProfileStore.getState().clear();
});

describe('1. load change de bot vide le draft', () => {
  it('charger A, editer, charger B -> draft null pendant chargement B', async () => {
    mockFullProfileLoad('BotA');
    await useBotProfileStore.getState().load('A', {name: 'BotA'});
    expect(useBotProfileStore.getState().draft?.bot_id).toBe('A');
    useBotProfileStore.getState().edit(d =>
      setTextField(d, DEFAULT_LANG, 'name', 'Edite'),
    );
    expect(useBotProfileStore.getState().draft?.texts.default?.name).toBe(
      'Edite',
    );

    // Demarre load B : doit vider avant reponse
    let resolveB!: (v: Awaited<ReturnType<typeof http>>) => void;
    const pending = new Promise<Awaited<ReturnType<typeof http>>>(r => {
      resolveB = r;
    });
    mockHttp.mockReset();
    mockHttp.mockImplementationOnce(() => pending); // default texts B hangs

    const loadPromise = useBotProfileStore.getState().load('B', {name: 'BotB'});
    expect(useBotProfileStore.getState().botId).toBe('B');
    expect(useBotProfileStore.getState().draft).toBeNull();
    expect(useBotProfileStore.getState().saved).toBeNull();
    // save sans effet
    await useBotProfileStore.getState().save();
    expect(mockHttp).toHaveBeenCalledTimes(1); // seulement le load en cours

    resolveB(ok({name: 'BotB', description: '', short_description: ''}));
    // finish remaining parallel calls
    mockHttp.mockResolvedValue(ok({commands: []}));
    mockHttp.mockResolvedValue(ok({menu_button: {type: 'default'}}));
    mockHttp.mockResolvedValue(ok({rights: {}}));
    mockHttp.mockResolvedValue(fail(404, 'NOT_FOUND'));
    await loadPromise;
  });
});

describe('2. save conserve le draft des echecs', () => {
  it('2 champs, 2e en 429 -> draft 2e conserve, saved 1er, report mixte', async () => {
    const saved = profile({
      texts: {
        default: {
          name: 'A',
          description: 'old',
          short_description: '',
        },
      },
    });
    const draft = setTextField(
      setTextField(saved, DEFAULT_LANG, 'name', 'B'),
      DEFAULT_LANG,
      'description',
      'new',
    );
    useBotProfileStore.setState({botId: 'b1', saved, draft, generation: 0});
    mockHttp
      .mockResolvedValueOnce(ok({updated: true}))
      .mockResolvedValueOnce(fail(429, 'RATE_LIMITED'));
    await useBotProfileStore.getState().save();
    const st = useBotProfileStore.getState();
    expect(st.saved?.texts.default?.name).toBe('B');
    expect(st.draft?.texts.default?.description).toBe('new');
    expect(st.saved?.texts.default?.description).toBe('old');
    expect(hasChanges(st.saved, st.draft)).toBe(true);
    const report = st.report;
    expect(report).not.toBeNull();
    if (!report) throw new Error('report');
    expect(report.some(r => r.ok)).toBe(true);
    expect(report.some(r => !r.ok)).toBe(true);
  });
});

describe('3. getBotProfile propage erreur textes defaut', () => {
  it('429 sur textes defaut -> loadError, pas de profil', async () => {
    mockHttp.mockResolvedValueOnce(fail(429, 'RATE_LIMITED'));
    const r = await useBotProfileStore
      .getState()
      .load('b1', {name: 'X'}, true);
    expect(r).toBe('error');
    expect(useBotProfileStore.getState().loadError).toBeTruthy();
    expect(useBotProfileStore.getState().draft).toBeNull();
  });

  it('getBotProfile reseau -> ok false', async () => {
    mockHttp.mockResolvedValueOnce(fail(0, 'network_error'));
    const res = await getBotProfile('b1', {name: 'X'});
    expect(res.ok).toBe(false);
  });
});

describe('5-6. langues add/remove + hasChanges', () => {
  it('addLanguage copie tous les textes', () => {
    const d = addLanguage(
      profile({
        texts: {
          default: {
            name: 'N',
            description: 'D',
            short_description: 'S',
          },
        },
      }),
      'fr',
    );
    expect(d.texts.fr).toEqual({
      name: 'N',
      description: 'D',
      short_description: 'S',
    });
  });

  it('removeLanguage retire commandes |lang et hasChanges false apres commit logique', () => {
    let d = profile({
      commands: {
        'default|fr': [{command: 'start', description: 'x'}],
      },
    });
    d = addLanguage(d, 'fr');
    d = removeLanguage(d, 'fr');
    expect(d.texts.fr).toBeUndefined();
    expect(d.commands['default|fr']).toBeUndefined();
    const saved = profile();
    const withFr = addLanguage(saved, 'fr');
    // apres retrait egal a saved
    const removed = removeLanguage(withFr, 'fr');
    expect(hasChanges(saved, removed)).toBe(false);
  });
});

describe('7. completeness site', () => {
  it('6 criteres poids egal', () => {
    const empty = profile();
    const c = completeness(empty);
    expect(c.pct).toBe(Math.round((1 / 6) * 100)); // nom seul
    expect(c.missing).toContain('une photo');
    expect(c.missing).toContain('des commandes');
  });
});

describe('8. validate site', () => {
  it('nom obligatoire seulement default', () => {
    const d = profile({
      texts: {
        default: {name: '', description: '', short_description: ''},
        fr: {name: '', description: '', short_description: ''},
      },
    });
    const e = validate(d);
    expect(e['text:default:name']).toBeTruthy();
    expect(e['text:fr:name']).toBeUndefined();
  });
});

describe('photo source', () => {
  it('uri + headers', async () => {
    const src = await buildBotPhotoSource('b1');
    expect(src).toEqual({
      uri: 'https://api.test/v1/bots/b1/photo',
      headers: {Authorization: 'Bearer tok'},
    });
  });
});
