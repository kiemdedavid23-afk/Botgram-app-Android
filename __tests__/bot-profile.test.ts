/**
 * Tests L4b - un test par correction de contenu (1-10).
 * Logique pure + store uniquement (pas de composant UI / lucide).
 */
import {validate} from '../src/features/botprofile/utils/validate';
import {completeness} from '../src/features/botprofile/utils/completeness';
import {buildChanges, hasChanges} from '../src/features/botprofile/utils/diff';
import {
  addLanguage,
  removeLanguage,
  setTextField,
} from '../src/features/botprofile/utils/edit';
import {mapProfileError} from '../src/features/botprofile/utils/errors';
import {
  DEFAULT_LANG,
  emptyRights,
  type BotProfile,
} from '../src/core/api/endpoints/botProfile.types';
import {
  buildBotPhotoSource,
  getBotProfile,
} from '../src/core/api/endpoints/botProfile';
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

/** Reponses pour getBotProfile apres la lecture textes defaut. */
function mockParallelAfterTexts() {
  mockHttp.mockResolvedValueOnce(
    ok({
      commands: [{command: 'start', description: 'Start'}],
    }),
  );
  mockHttp.mockResolvedValueOnce(
    ok({menu_button: {type: 'commands'}}),
  );
  mockHttp.mockResolvedValueOnce(
    ok({rights: {can_manage_chat: true}}),
  );
  mockHttp.mockResolvedValueOnce(ok({rights: {}}));
  mockHttp.mockResolvedValueOnce(fail(404, 'NOT_FOUND')); // photo
  // probes: same as default -> ignore
  mockHttp.mockResolvedValue(
    ok({name: 'Demo', description: '', short_description: ''}),
  );
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
    mockHttp.mockResolvedValueOnce(
      ok({name: 'BotA', description: '', short_description: ''}),
    );
    mockParallelAfterTexts();
    await useBotProfileStore.getState().load('A', {name: 'BotA'});
    expect(useBotProfileStore.getState().draft?.bot_id).toBe('A');

    useBotProfileStore.getState().edit(d =>
      setTextField(d, DEFAULT_LANG, 'name', 'Edite'),
    );
    expect(useBotProfileStore.getState().draft?.texts.default?.name).toBe(
      'Edite',
    );

    let resolveB!: (v: Awaited<ReturnType<typeof http>>) => void;
    const pending = new Promise<Awaited<ReturnType<typeof http>>>(r => {
      resolveB = r;
    });
    mockHttp.mockReset();
    mockHttp.mockImplementationOnce(() => pending);

    const loadPromise = useBotProfileStore.getState().load('B', {name: 'BotB'});
    expect(useBotProfileStore.getState().botId).toBe('B');
    expect(useBotProfileStore.getState().draft).toBeNull();
    expect(useBotProfileStore.getState().saved).toBeNull();

    await useBotProfileStore.getState().save();
    expect(mockHttp).toHaveBeenCalledTimes(1);

    resolveB(ok({name: 'BotB', description: '', short_description: ''}));
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

describe('4. lecture complete commands menu rights', () => {
  it('getBotProfile renseigne commands menu admin_rights', async () => {
    mockHttp.mockResolvedValueOnce(
      ok({name: 'Demo', description: '', short_description: ''}),
    );
    mockParallelAfterTexts();
    const res = await getBotProfile('b1', {
      name: 'Demo',
      username: 'demo_bot',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error('expected ok');
    expect(res.data.commands['default|default']).toEqual([
      {command: 'start', description: 'Start'},
    ]);
    expect(res.data.menu_button.type).toBe('commands');
    expect(res.data.admin_rights.groups.can_manage_chat).toBe(true);
  });
});

describe('5. diff commit langue retiree', () => {
  it('langue absente du draft -> commit supprime l entree (gone)', () => {
    const saved = profile({
      texts: {
        default: {name: 'N', description: '', short_description: ''},
        fr: {name: 'N', description: 'd', short_description: ''},
      },
    });
    const draft = profile({
      texts: {
        default: {name: 'N', description: '', short_description: ''},
      },
    });
    const changes = buildChanges(saved, draft);
    expect(changes.length).toBeGreaterThan(0);
    let current = saved;
    for (const ch of changes) {
      current = ch.commit(current, draft);
    }
    expect(current.texts.fr).toBeUndefined();
    expect(hasChanges(current, draft)).toBe(false);
  });
});

describe('5b. removeLanguage retire commandes', () => {
  it('retire cles finissant par |lang', () => {
    let d = profile({
      commands: {
        'default|fr': [{command: 'start', description: 'x'}],
        'default|default': [{command: 'help', description: 'h'}],
      },
    });
    d = addLanguage(d, 'fr');
    d = removeLanguage(d, 'fr');
    expect(d.texts.fr).toBeUndefined();
    expect(d.commands['default|fr']).toBeUndefined();
    expect(d.commands['default|default']).toBeDefined();
  });
});

describe('6. addLanguage copie tous les textes', () => {
  it('copie name description short_description', () => {
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
});

describe('7. completeness 6 criteres', () => {
  it('poids egal et missing', () => {
    const empty = profile();
    const c = completeness(empty);
    expect(c.pct).toBe(Math.round((1 / 6) * 100));
    expect(c.missing).toContain('une photo');
    expect(c.missing).toContain('des commandes');
    expect(c.missing).toContain('un bouton de menu');
  });
});

describe('8. validate site', () => {
  it('nom obligatoire seulement default ; messages texts', () => {
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

describe('9. mapProfileError codes', () => {
  it('mappe email token reseau validation 429 serveur', () => {
    expect(mapProfileError('EMAIL_NOT_VERIFIED')).toMatch(/e-mail|email/i);
    expect(mapProfileError('TOKEN_INVALID')).toMatch(/jeton/i);
    expect(mapProfileError('BOT_DISCONNECTED')).toMatch(/deconnect/i);
    expect(mapProfileError('network_error')).toMatch(/[Rr]eseau|[Nn]etwork/);
    expect(mapProfileError('VALIDATION_ERROR')).toMatch(/invalide/i);
    expect(mapProfileError('RATE_LIMITED')).toMatch(/Trop|demandes/i);
    expect(mapProfileError('SERVICE_UNAVAILABLE')).toMatch(/indisponible/i);
  });
});

describe('10. edit bloque pendant saving', () => {
  it('edit ignore si saving true', () => {
    const saved = profile();
    useBotProfileStore.setState({
      botId: 'b1',
      saved,
      draft: saved,
      saving: true,
      generation: 0,
    });
    useBotProfileStore.getState().edit(d =>
      setTextField(d, DEFAULT_LANG, 'name', 'Bloque'),
    );
    expect(useBotProfileStore.getState().draft?.texts.default?.name).toBe(
      'Demo',
    );
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
