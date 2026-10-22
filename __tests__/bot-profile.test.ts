/**
 * Tests L4b - logique pure + store (pas de composant UI / lucide).
 */
import {validateField} from '../src/features/botprofile/utils/validate';
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
import {buildBotPhotoSource} from '../src/core/api/endpoints/botProfile';
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

beforeEach(() => {
  jest.resetAllMocks();
  mockCacheDelete.mockResolvedValue(undefined);
  mockGetToken.mockResolvedValue('tok');
  mockHttp.mockReset();
  useBotProfileStore.getState().clear();
});

describe('validate / completeness', () => {
  it('name required', () => {
    expect(validateField('name', '')).toBeTruthy();
    expect(validateField('name', 'A')).toBeNull();
  });

  it('completeness scores', () => {
    const p = profile();
    expect(completeness(p)).toBe(35);
    expect(
      completeness(
        profile({
          hasPhoto: true,
          texts: {
            default: {
              name: 'X',
              description: 'd',
              short_description: 's',
            },
          },
        }),
      ),
    ).toBe(100);
  });
});

describe('edit / diff', () => {
  it('add/remove language', () => {
    let d = profile();
    d = addLanguage(d, 'fr');
    expect(d.texts.fr).toBeTruthy();
    d = removeLanguage(d, 'fr');
    expect(d.texts.fr).toBeUndefined();
    d = removeLanguage(d, DEFAULT_LANG);
    expect(d.texts[DEFAULT_LANG]).toBeTruthy();
  });

  it('buildChanges name only', () => {
    const saved = profile();
    const draft = setTextField(saved, DEFAULT_LANG, 'name', 'Nouveau');
    const ch = buildChanges(saved, draft);
    expect(ch).toHaveLength(1);
    const first = ch[0];
    expect(first).toBeDefined();
    if (first === undefined) {
      throw new Error('expected change');
    }
    expect(first.id).toContain('name');
    expect(hasChanges(saved, draft)).toBe(true);
  });
});

describe('store save via Worker', () => {
  it('enregistrement reussi', async () => {
    const saved = profile();
    const draft = setTextField(saved, DEFAULT_LANG, 'name', 'Nouveau');
    useBotProfileStore.setState({
      botId: 'b1',
      saved,
      draft,
      generation: 0,
    });
    mockHttp.mockResolvedValueOnce(ok({updated: true}));
    await useBotProfileStore.getState().save();
    expect(mockHttp).toHaveBeenCalled();
    const report = useBotProfileStore.getState().report;
    expect(report).not.toBeNull();
    if (report === null) {
      throw new Error('expected report');
    }
    expect(report).toHaveLength(1);
    const item = report[0];
    expect(item).toBeDefined();
    if (item === undefined) {
      throw new Error('expected report item');
    }
    expect(item.ok).toBe(true);
    const savedAfter = useBotProfileStore.getState().saved;
    expect(savedAfter).not.toBeNull();
    if (savedAfter === null) {
      throw new Error('expected saved profile');
    }
    const nameAfter = savedAfter.texts[DEFAULT_LANG]?.name;
    expect(nameAfter).toBe('Nouveau');
  });

  it('echec partiel 429', async () => {
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
    const report = useBotProfileStore.getState().report;
    expect(report).not.toBeNull();
    if (report === null) {
      throw new Error('expected report');
    }
    expect(report).toHaveLength(2);
    expect(report.some(r => r.ok)).toBe(true);
    expect(report.some(r => !r.ok)).toBe(true);
  });

  it('clear vide le brouillon', () => {
    useBotProfileStore.setState({
      botId: 'b1',
      saved: profile(),
      draft: profile(),
    });
    useBotProfileStore.getState().clear();
    expect(useBotProfileStore.getState().draft).toBeNull();
    expect(useBotProfileStore.getState().botId).toBeNull();
  });
});

describe('photo source', () => {
  it('construit uri + headers', async () => {
    const src = await buildBotPhotoSource('b1');
    expect(src).toEqual({
      uri: 'https://api.test/v1/bots/b1/photo',
      headers: {Authorization: 'Bearer tok'},
    });
  });

  it('sans jeton -> null', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    expect(await buildBotPhotoSource('b1')).toBeNull();
  });
});
