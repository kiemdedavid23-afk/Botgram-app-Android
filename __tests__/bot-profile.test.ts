/**
 * Tests L4b + L4c patch 1 (logique commandes/menu/droits + erreurs lecture).
 * Logique pure + store uniquement (pas de composant UI / lucide).
 */
import {validate} from '../src/features/botprofile/utils/validate';
import {completeness} from '../src/features/botprofile/utils/completeness';
import {buildChanges, hasChanges} from '../src/features/botprofile/utils/diff';
import {
  addLanguage,
  removeLanguage,
  setTextField,
  setCommands,
  setMenuButton,
  setRight,
} from '../src/features/botprofile/utils/edit';
import {mapProfileError} from '../src/features/botprofile/utils/errors';
import {
  DEFAULT_LANG,
  emptyRights,
  type BotProfile,
  type BotCommandItem,
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

/**
 * Mock par chemin : chaque route a une réponse stable.
 * overrides : sous-chaîne de path → réponse (priorité).
 * Pas de mockResolvedValueOnce pour les lectures parallèles.
 */
function mockProfileHttp(
  overrides: Record<string, Awaited<ReturnType<typeof http>>> = {},
): void {
  mockHttp.mockImplementation(async opts => {
    const path = typeof opts === 'object' && opts && 'path' in opts
      ? String((opts as {path: string}).path)
      : '';
    for (const [key, val] of Object.entries(overrides)) {
      if (path.includes(key)) return val;
    }
    if (path.includes('/commands')) {
      return ok({
        commands: [{command: 'start', description: 'Start'}],
      });
    }
    if (path.includes('/menu-button')) {
      return ok({menu_button: {type: 'commands'}});
    }
    if (path.includes('/default-admin-rights')) {
      return ok({rights: {can_manage_chat: true}});
    }
    if (path.includes('/photo')) {
      return fail(404, 'NOT_FOUND');
    }
    // textes profil (base + ?language_code=)
    if (path.includes('/profile')) {
      return ok({name: 'Demo', description: '', short_description: ''});
    }
    return ok({});
  });
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
    mockProfileHttp({
      '/profile': ok({name: 'BotA', description: '', short_description: ''}),
    });
    await useBotProfileStore.getState().load('a', {name: 'BotA'}, true);
    useBotProfileStore.getState().edit(d =>
      setTextField(d, DEFAULT_LANG, 'name', 'EditA'),
    );
    expect(useBotProfileStore.getState().draft?.texts.default?.name).toBe(
      'EditA',
    );

    let resolveB: () => void = () => undefined;
    const pending = new Promise<Awaited<ReturnType<typeof http>>>(resolve => {
      resolveB = () =>
        resolve(ok({name: 'BotB', description: '', short_description: ''}));
    });
    mockHttp.mockImplementation(async opts => {
      const path = String((opts as {path: string}).path);
      if (path.includes('/profile') && !path.includes('/commands') && !path.includes('/menu') && !path.includes('/default-admin')) {
        return pending;
      }
      if (path.includes('/commands')) return ok({commands: []});
      if (path.includes('/menu-button')) return ok({menu_button: {type: 'default'}});
      if (path.includes('/default-admin-rights')) return ok({rights: {}});
      return ok({name: 'BotB', description: '', short_description: ''});
    });

    const loadPromise = useBotProfileStore
      .getState()
      .load('b', {name: 'BotB'}, true);
    expect(useBotProfileStore.getState().draft).toBeNull();
    resolveB();
    await loadPromise;
    expect(useBotProfileStore.getState().draft?.texts.default?.name).toBe(
      'BotB',
    );
  });
});

describe('2. save ne met a jour que saved ; draft conserve echecs', () => {
  it('echec partiel : saved mis a jour pour ok, draft garde le reste', async () => {
    const saved = profile({
      texts: {
        [DEFAULT_LANG]: {
          name: 'Old',
          description: 'D',
          short_description: 'S',
        },
      },
    });
    const draft = profile({
      texts: {
        [DEFAULT_LANG]: {
          name: 'New',
          description: 'D2',
          short_description: 'S',
        },
      },
    });
    useBotProfileStore.setState({
      botId: 'b1',
      saved,
      draft,
      saving: false,
      generation: 0,
    });

    let call = 0;
    mockHttp.mockImplementation(async () => {
      call += 1;
      if (call === 1) return ok({updated: true});
      return fail(429, 'RATE_LIMITED');
    });

    await useBotProfileStore.getState().save();
    const st = useBotProfileStore.getState();
    expect(st.saved?.texts.default?.name).toBe('New');
    expect(st.draft?.texts.default?.description).toBe('D2');
    expect(st.report?.some(r => !r.ok)).toBe(true);
  });
});

describe('3. getBotProfile propage erreur textes defaut', () => {
  it('textes defaut RATE_LIMITED -> loadError', async () => {
    mockProfileHttp({
      '/profile': fail(429, 'RATE_LIMITED'),
    });
    const r = await useBotProfileStore
      .getState()
      .load('b1', {name: 'X'}, true);
    expect(r).toBe('error');
    expect(useBotProfileStore.getState().loadError).toMatch(/Trop|demandes/i);
    expect(useBotProfileStore.getState().draft).toBeNull();
  });

  it('getBotProfile reseau -> ok false', async () => {
    mockProfileHttp({
      '/profile': fail(0, 'network_error'),
    });
    const res = await getBotProfile('b1', {name: 'X'});
    expect(res.ok).toBe(false);
  });

  it('getBotProfile renseigne commands menu admin_rights', async () => {
    mockProfileHttp();
    const res = await getBotProfile('b1', {
      name: 'Demo',
      username: 'demo_bot',
      telegram_id: '1',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error('expected ok');
    expect(res.data.commands['default|default']?.[0]?.command).toBe('start');
    expect(res.data.menu_button.type).toBe('commands');
    expect(res.data.admin_rights.groups.can_manage_chat).toBe(true);
    expect(res.data.hasPhoto).toBe(false);
  });
});

describe('4. lectures completes dans profil', () => {
  it('profile a texts commands menu admin_rights info', async () => {
    mockProfileHttp();
    const res = await getBotProfile('b1', {name: 'Demo', telegram_id: '99'});
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error('ok');
    expect(res.data.texts.default).toBeDefined();
    expect(res.data.menu_button).toBeDefined();
    expect(res.data.admin_rights.groups).toBeDefined();
    expect(res.data.admin_rights.channels).toBeDefined();
    expect(res.data.info.id).toBe('99');
  });
});

describe('5. diff commit et removeLanguage', () => {
  it('commit texte met a jour saved', () => {
    const saved = profile();
    const draft = setTextField(saved, DEFAULT_LANG, 'name', 'Nouveau');
    const changes = buildChanges(saved, draft);
    expect(changes.length).toBeGreaterThan(0);
    const committed = changes[0]!.commit(saved, draft);
    expect(committed.texts.default?.name).toBe('Nouveau');
  });

  it('removeLanguage retire commandes |lang', () => {
    const p = profile({
      texts: {
        [DEFAULT_LANG]: {name: 'D', description: '', short_description: ''},
        fr: {name: 'F', description: '', short_description: ''},
      },
      commands: {
        'default|default': [{command: 'start', description: 'S'}],
        'default|fr': [{command: 'aide', description: 'A'}],
      },
    });
    const next = removeLanguage(p, 'fr');
    expect(next.texts.fr).toBeUndefined();
    expect(next.commands['default|fr']).toBeUndefined();
    expect(next.commands['default|default']).toBeDefined();
  });
});

describe('6. addLanguage copie textes defaut', () => {
  it('ajoute fr avec copie du defaut', () => {
    const p = profile({
      texts: {
        [DEFAULT_LANG]: {
          name: 'Base',
          description: 'Desc',
          short_description: 'Short',
        },
      },
    });
    const next = addLanguage(p, 'fr');
    expect(next.texts.fr?.name).toBe('Base');
    expect(next.texts.fr?.description).toBe('Desc');
  });
});

describe('7. completeness 6 criteres', () => {
  it('pct et missing', () => {
    const empty = profile();
    const c = completeness(empty);
    expect(c.pct).toBeLessThan(100);
    expect(c.missing.length).toBeGreaterThan(0);

    const full = profile({
      hasPhoto: true,
      texts: {
        [DEFAULT_LANG]: {
          name: 'N',
          description: 'D',
          short_description: 'S',
        },
      },
      commands: {
        'default|default': [{command: 'start', description: 'Go'}],
      },
      menu_button: {type: 'commands'},
    });
    expect(completeness(full).pct).toBe(100);
  });
});

describe('8. validate textes', () => {
  it('nom obligatoire defaut, limites', () => {
    const bad = profile({
      texts: {
        [DEFAULT_LANG]: {name: '', description: '', short_description: ''},
      },
    });
    const e = validate(bad);
    expect(e['text:default:name']).toBeTruthy();
  });

  it('nom trop long', () => {
    const bad = profile({
      texts: {
        [DEFAULT_LANG]: {
          name: 'x'.repeat(65),
          description: '',
          short_description: '',
        },
      },
    });
    expect(validate(bad)['text:default:name']).toBeTruthy();
  });
});

describe('9. mapProfileError codes', () => {
  it('mappe email token reseau validation 429 serveur', () => {
    expect(mapProfileError('EMAIL_NOT_VERIFIED')).toMatch(/e-mail|email/i);
    expect(mapProfileError('TOKEN_INVALID')).toMatch(/jeton/i);
    // accent obligatoire (texte : « déconnecté »)
    expect(mapProfileError('BOT_DISCONNECTED')).toMatch(/déconnect/i);
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

// ─── L4c patch 1 — logique commandes / menu / droits / erreurs lecture ───

describe('L4c-1. validate commandes', () => {
  it('format invalide, doublon, description, max 100', () => {
    const list: BotCommandItem[] = [
      {command: 'Bad-Cmd', description: 'x'},
      {command: 'ok', description: ''},
      {command: 'ok', description: 'dup'},
    ];
    const p = profile({
      commands: {'default|default': list},
    });
    const e = validate(p);
    expect(e['cmd:default|default:0:command']).toBeTruthy();
    expect(e['cmd:default|default:1:description']).toBeTruthy();
    expect(e['cmd:default|default:2:command']).toMatch(/déjà|existe/i);

    const many: BotCommandItem[] = Array.from({length: 101}, (_, i) => ({
      command: `c${i}`,
      description: 'd',
    }));
    const e2 = validate(profile({commands: {'default|default': many}}));
    expect(e2['cmd:default|default:list']).toBeTruthy();
  });
});

describe('L4c-2. validate menu web_app', () => {
  it('texte vide et url non https', () => {
    const p = profile({
      menu_button: {type: 'web_app', text: '', url: 'http://x.com'},
    });
    const e = validate(p);
    expect(e['menu:text']).toBeTruthy();
    expect(e['menu:url']).toBeTruthy();
  });
});

describe('L4c-3. diff commandes liste vide = suppression', () => {
  it('liste vide produit change delete', () => {
    const saved = profile({
      commands: {
        'default|default': [{command: 'start', description: 'S'}],
      },
    });
    const draft = setCommands(saved, 'default|default', []);
    const changes = buildChanges(saved, draft);
    expect(changes.some(c => c.id === 'cmd:default|default')).toBe(true);
    const committed = changes
      .find(c => c.id === 'cmd:default|default')!
      .commit(saved, draft);
    expect(committed.commands['default|default']).toBeUndefined();
  });
});

describe('L4c-4. diff menu et droits', () => {
  it('menu change', () => {
    const saved = profile();
    const draft = setMenuButton(saved, {type: 'commands'});
    const changes = buildChanges(saved, draft);
    expect(changes.some(c => c.id === 'menu')).toBe(true);
  });

  it('droits groups seulement', () => {
    const saved = profile();
    const draft = setRight(saved, 'groups', 'can_manage_chat', true);
    const changes = buildChanges(saved, draft);
    expect(changes.some(c => c.id === 'rights:groups')).toBe(true);
    expect(changes.some(c => c.id === 'rights:channels')).toBe(false);
  });
});

describe('L4c-5. lecture en erreur remonte loadError', () => {
  it('erreur sur commands -> loadError, pas de profil', async () => {
    mockProfileHttp({
      '/commands': fail(500, 'INTERNAL'),
    });
    const r = await useBotProfileStore
      .getState()
      .load('b1', {name: 'X'}, true);
    expect(r).toBe('error');
    expect(useBotProfileStore.getState().loadError).toBeTruthy();
    expect(useBotProfileStore.getState().draft).toBeNull();
  });

  it('erreur sur menu -> loadError', async () => {
    mockProfileHttp({
      '/menu-button': fail(502, 'TELEGRAM_ERROR'),
    });
    const r = await useBotProfileStore
      .getState()
      .load('b1', {name: 'X'}, true);
    expect(r).toBe('error');
    expect(useBotProfileStore.getState().draft).toBeNull();
  });

  it('erreur sur rights groups -> loadError', async () => {
    mockProfileHttp({
      '/default-admin-rights': fail(429, 'RATE_LIMITED'),
    });
    const r = await useBotProfileStore
      .getState()
      .load('b1', {name: 'X'}, true);
    expect(r).toBe('error');
    expect(useBotProfileStore.getState().draft).toBeNull();
  });
});

describe('L4c-6. hasPhoto initial false (plus de readHasPhoto)', () => {
  it('getBotProfile hasPhoto false même si lectures ok', async () => {
    mockProfileHttp();
    const res = await getBotProfile('b1', {name: 'Demo'});
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error('ok');
    expect(res.data.hasPhoto).toBe(false);
  });
});
