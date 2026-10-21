/**
 * Tests étape 3 — logique membre / bots / quota / associate / effacement.
 * fetch et stockage mockés.
 */
import {http} from '../src/core/api/http';
import * as storage from '../src/core/storage';
import type {Bot} from '../src/core/api/endpoints/bots';
import {useBotsStore} from '../src/features/bots/store/botsStore';
import {useAssociateStore} from '../src/features/bots/store/associateStore';
import {useQuotaStore} from '../src/features/member/store/quotaStore';
import {useMemberStore} from '../src/features/member/store/memberStore';
import {useAuthStore, applySignedOut} from '../src/features/auth/store/authStore';
import {clearMemberData} from '../src/core/utils/memberData';

jest.mock('../src/core/storage');
jest.mock('../src/core/api/http');

const mockHttp = http as jest.MockedFunction<typeof http>;
const mockCacheGet = storage.cacheGetString as jest.Mock;
const mockCacheSet = storage.cacheSetString as jest.Mock;
const mockCacheDelete = storage.cacheDelete as jest.Mock;
const mockClearTokens = storage.clearTokens as jest.Mock;
const mockGetRefresh = storage.getRefreshToken as jest.Mock;

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
  details?: unknown,
): Awaited<ReturnType<typeof http>> {
  return {
    ok: false,
    error: {code, message: '', details},
    status,
    headers: new Headers(),
    requestId: null,
  };
}

const sampleBot = (over: Partial<Bot> = {}): Bot => ({
  id: 'b1',
  telegram_bot_id: 123,
  username: 'mybot',
  name: 'My Bot',
  status: 'connected',
  selected: true,
  muted: false,
  created_at: 1,
  connected_at: 2,
  disconnected_at: null,
  ...over,
});

beforeEach(() => {
  jest.resetAllMocks();
  mockCacheGet.mockResolvedValue(undefined);
  mockCacheSet.mockResolvedValue(undefined);
  mockCacheDelete.mockResolvedValue(undefined);
  mockClearTokens.mockResolvedValue(undefined);
  mockGetRefresh.mockResolvedValue(null);
  mockHttp.mockReset();
  useBotsStore.getState().clear();
  useQuotaStore.getState().clear();
  useMemberStore.getState().clear();
  useAssociateStore.getState().reset();
});

describe('listBots / statuts', () => {
  it('charge la liste et respecte les statuts', async () => {
    const bots = [
      sampleBot({id: '1', status: 'connected'}),
      sampleBot({id: '2', status: 'disconnected', selected: false}),
      sampleBot({id: '3', status: 'webhook_error', selected: false}),
    ];
    mockHttp.mockResolvedValueOnce(ok({bots}));
    await useBotsStore.getState().load(true);
    expect(useBotsStore.getState().bots).toHaveLength(3);
    expect(useBotsStore.getState().bots.map(b => b.status)).toEqual([
      'connected',
      'disconnected',
      'webhook_error',
    ]);
    expect(mockCacheSet).toHaveBeenCalled();
  });

  it('ignore un cache JSON invalide', async () => {
    mockCacheGet.mockResolvedValueOnce('{not-json');
    mockHttp.mockResolvedValueOnce(ok({bots: [sampleBot()]}));
    await useBotsStore.getState().load(true);
    expect(useBotsStore.getState().bots).toHaveLength(1);
  });
});

describe('botsStore single-flight / TTL / remplacement', () => {
  it('single-flight : deux load parallèles → un seul GET', async () => {
    let calls = 0;
    mockHttp.mockImplementation(async () => {
      calls += 1;
      await new Promise<void>(r => setTimeout(r, 20));
      return ok({bots: [sampleBot()]});
    });
    await Promise.all([
      useBotsStore.getState().load(true),
      useBotsStore.getState().load(true),
    ]);
    expect(calls).toBe(1);
  });

  it('TTL : second load sans force ne rappelle pas le réseau', async () => {
    mockHttp.mockResolvedValueOnce(ok({bots: [sampleBot()]}));
    await useBotsStore.getState().load(true);
    mockHttp.mockClear();
    await useBotsStore.getState().load(false);
    expect(mockHttp).not.toHaveBeenCalled();
  });

  it('setMuted remplace la fiche par la réponse Worker', async () => {
    useBotsStore.setState({
      bots: [sampleBot({muted: false})],
      lastFetch: Date.now(),
    });
    const updated = sampleBot({muted: true, name: 'From Worker'});
    mockHttp.mockResolvedValueOnce(ok({bot: updated}));
    const res = await useBotsStore.getState().setMuted('b1', true);
    expect(res.ok).toBe(true);
    expect(useBotsStore.getState().bots[0]?.muted).toBe(true);
    expect(useBotsStore.getState().bots[0]?.name).toBe('From Worker');
  });

  it('disconnect puis delete', async () => {
    useBotsStore.setState({
      bots: [sampleBot({status: 'connected'})],
      lastFetch: Date.now(),
    });
    mockHttp.mockResolvedValueOnce(
      ok({bot: sampleBot({status: 'disconnected'})}),
    );
    const d = await useBotsStore.getState().disconnect('b1');
    expect(d.ok).toBe(true);
    expect(useBotsStore.getState().bots[0]?.status).toBe('disconnected');

    mockHttp.mockResolvedValueOnce(ok({deleted: true}));
    const del = await useBotsStore.getState().deleteBot('b1');
    expect(del.ok).toBe(true);
    expect(useBotsStore.getState().bots).toHaveLength(0);
  });

  it('BOT_NOT_DISCONNECTED sur delete', async () => {
    useBotsStore.setState({
      bots: [sampleBot({status: 'connected'})],
      lastFetch: Date.now(),
    });
    mockHttp.mockResolvedValueOnce(fail(409, 'BOT_NOT_DISCONNECTED'));
    const res = await useBotsStore.getState().deleteBot('b1');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('BOT_NOT_DISCONNECTED');
    }
    expect(useBotsStore.getState().bots).toHaveLength(1);
  });

  it('hors ligne : status 0 → offline', async () => {
    mockHttp.mockResolvedValueOnce(fail(0, 'network_error'));
    await useBotsStore.getState().load(true);
    expect(useBotsStore.getState().offline).toBe(true);
  });
});

describe('associateStore', () => {
  it('verify ok', async () => {
    useAssociateStore.getState().setToken('123:ABC');
    mockHttp.mockResolvedValueOnce(
      ok({
        telegram_bot_id: 1,
        username: 'x',
        name: 'X',
        webhook_set: false,
        webhook_is_botgram: false,
        replace_required: false,
        already_linked: false,
      }),
    );
    expect(await useAssociateStore.getState().verify()).toBe('ok');
  });

  it('verify already_linked lu avant limit', async () => {
    useAssociateStore.getState().setToken('123:ABC');
    mockHttp.mockResolvedValueOnce(
      ok({
        telegram_bot_id: 1,
        username: 'x',
        name: 'X',
        webhook_set: true,
        webhook_is_botgram: false,
        replace_required: false,
        already_linked: true,
      }),
    );
    expect(await useAssociateStore.getState().verify()).toBe('already_linked');
  });

  it('verify replace_required', async () => {
    useAssociateStore.getState().setToken('123:ABC');
    mockHttp.mockResolvedValueOnce(
      ok({
        telegram_bot_id: 1,
        username: 'x',
        name: 'X',
        webhook_set: true,
        webhook_is_botgram: false,
        replace_required: true,
        already_linked: false,
      }),
    );
    expect(await useAssociateStore.getState().verify()).toBe('replace_required');
  });

  it.each([
    ['TOKEN_INVALID', 'invalid'],
    ['VALIDATION_ERROR', 'validation'],
    ['BOT_ALREADY_LINKED', 'already_linked'],
    ['BOT_LIMIT_REACHED', 'limit'],
    ['EMAIL_NOT_VERIFIED', 'email_not_verified'],
    ['RATE_LIMITED', 'rate_limited'],
    ['network_error', 'network'],
  ] as const)('verify erreur %s → %s', async (code, expected) => {
    useAssociateStore.getState().setToken('123:ABC');
    mockHttp.mockResolvedValueOnce(fail(code === 'network_error' ? 0 : 400, code));
    expect(await useAssociateStore.getState().verify()).toBe(expected);
  });

  it('confirm succès efface le jeton', async () => {
    useAssociateStore.getState().setToken('123:ABC');
    mockHttp.mockResolvedValueOnce(ok({bot: sampleBot()}, 201));
    const res = await useAssociateStore.getState().confirm();
    expect(res.ok).toBe(true);
    expect(useAssociateStore.getState().token).toBeNull();
  });

  it('confirm WEBHOOK_REPLACE_REQUIRED', async () => {
    useAssociateStore.getState().setToken('123:ABC');
    mockHttp.mockResolvedValueOnce(fail(409, 'WEBHOOK_REPLACE_REQUIRED'));
    const res = await useAssociateStore.getState().confirm();
    expect(res).toEqual({ok: false, reason: 'replace_required'});
  });

  it('double soumission impossible', async () => {
    useAssociateStore.getState().setToken('123:ABC');
    let resolveHttp!: (v: Awaited<ReturnType<typeof http>>) => void;
    const deferred = new Promise<Awaited<ReturnType<typeof http>>>(resolve => {
      resolveHttp = resolve;
    });
    mockHttp.mockImplementation(() => deferred);
    const p1 = useAssociateStore.getState().confirm();
    // laisser le microtask de confirm() démarrer et poser confirming=true
    await Promise.resolve();
    const p2 = useAssociateStore.getState().confirm();
    await Promise.resolve();
    expect(mockHttp).toHaveBeenCalledTimes(1);
    resolveHttp(ok({bot: sampleBot()}, 201));
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.ok || r2.ok).toBe(true);
    expect(
      (!r1.ok && r1.reason === 'duplicate') ||
        (!r2.ok && r2.reason === 'duplicate'),
    ).toBe(true);
  });

  it('jeton jamais écrit en cache ni Keychain', async () => {
    useAssociateStore.getState().setToken('SECRET-TOKEN');
    mockHttp.mockResolvedValueOnce(
      ok({
        telegram_bot_id: 1,
        username: 'x',
        name: 'X',
        webhook_set: false,
        webhook_is_botgram: false,
        replace_required: false,
        already_linked: false,
      }),
    );
    await useAssociateStore.getState().verify();
    expect(mockCacheSet).not.toHaveBeenCalled();
    // body de preview ne doit pas être loggé ; on vérifie juste qu'aucune écriture storage
    const setCalls = mockCacheSet.mock.calls.map(c => String(c));
    expect(setCalls.join('')).not.toContain('SECRET-TOKEN');
  });
});

describe('quotaStore', () => {
  it('charge et usageRatio sans division par zéro', async () => {
    mockHttp.mockResolvedValueOnce(
      ok({day: '2026-01-01', limit: 0, used: 0, remaining: 0, resets_at: 0}),
    );
    await useQuotaStore.getState().load(true);
    expect(useQuotaStore.getState().usageRatio()).toBe(0);

    mockHttp.mockResolvedValueOnce(
      ok({day: '2026-01-01', limit: 165, used: 33, remaining: 132, resets_at: 1}),
    );
    await useQuotaStore.getState().load(true);
    expect(useQuotaStore.getState().usageRatio()).toBeCloseTo(33 / 165);
  });
});

describe('memberStore', () => {
  it('PATCH ok met à jour le membre', async () => {
    mockHttp.mockResolvedValueOnce(
      ok({
        member: {
          id: '1',
          email: 'a@b.c',
          email_verified: true,
          display_name: 'Nouveau',
          role: 'member',
          status: 'active',
          country: 'FR',
          usage: 'perso',
          phone: null,
          organization: '',
          selected_bot_id: null,
          created_at: 0,
        },
      }),
    );
    const r = await useMemberStore.getState().updateProfile({
      display_name: 'Nouveau',
      organization: '',
    });
    expect(r).toBe('ok');
    expect(useMemberStore.getState().member?.display_name).toBe('Nouveau');
  });

  it('VALIDATION_ERROR par champ', async () => {
    mockHttp.mockResolvedValueOnce(
      fail(400, 'VALIDATION_ERROR', {
        fields: {display_name: 'too_short', phone: 'invalid'},
      }),
    );
    const r = await useMemberStore.getState().updateProfile({display_name: 'x'});
    expect(r).toBe('validation');
    expect(useMemberStore.getState().fieldErrors.display_name).toBe('too_short');
  });

  it('suppression en deux temps + ACCOUNT_CLEANUP_PENDING', async () => {
    mockHttp.mockResolvedValueOnce(
      ok({requested: true, expires_in: 600, code_length: 6}, 202),
    );
    expect(await useMemberStore.getState().requestAccountDelete()).toBe('ok');
    expect(useMemberStore.getState().deletePhase).toBe('code_sent');

    mockHttp.mockResolvedValueOnce(fail(409, 'ACCOUNT_CLEANUP_PENDING'));
    expect(await useMemberStore.getState().confirmAccountDelete('123456')).toBe(
      'cleanup_pending',
    );
    // phase reste code_sent pour réessayer le même code
    expect(useMemberStore.getState().deletePhase).toBe('code_sent');

    mockHttp.mockResolvedValueOnce(ok({deleted: true}));
    expect(await useMemberStore.getState().confirmAccountDelete('123456')).toBe(
      'ok',
    );
    expect(mockClearTokens).toHaveBeenCalled();
  });
});

describe('effacement membre', () => {
  it('clearMemberData vide bots, quota, member, associate', async () => {
    useBotsStore.setState({bots: [sampleBot()], lastFetch: 1});
    useQuotaStore.setState({
      quota: {day: 'd', limit: 1, used: 0, remaining: 1, resets_at: 0},
      lastFetch: 1,
    });
    useMemberStore.setState({
      member: {
        id: '1',
        email: 'a@b.c',
        email_verified: true,
        display_name: 'A',
        role: 'member',
        status: 'active',
        country: null,
        usage: null,
        phone: null,
        organization: null,
        selected_bot_id: null,
        created_at: 0,
      },
    });
    useAssociateStore.getState().setToken('tok');

    await clearMemberData();

    expect(useBotsStore.getState().bots).toEqual([]);
    expect(useQuotaStore.getState().quota).toBeNull();
    expect(useMemberStore.getState().member).toBeNull();
    expect(useAssociateStore.getState().token).toBeNull();
  });

  it('signOut appelle clearMemberData', async () => {
    useBotsStore.setState({bots: [sampleBot()], lastFetch: 1});
    mockHttp.mockResolvedValueOnce(ok(null));
    await useAuthStore.getState().signOut();
    expect(useBotsStore.getState().bots).toEqual([]);
  });
});


describe('génération anti-fuite', () => {
  it('load bots après clear ignore la réponse et n\'écrit pas le cache', async () => {
    let resolveHttp!: (v: Awaited<ReturnType<typeof http>>) => void;
    const deferred = new Promise<Awaited<ReturnType<typeof http>>>(resolve => {
      resolveHttp = resolve;
    });
    mockHttp.mockImplementation(() => deferred);
    const loadP = useBotsStore.getState().load(true);
    await Promise.resolve();
    useBotsStore.getState().clear();
    expect(useBotsStore.getState().bots).toEqual([]);
    resolveHttp(
      ok({
        bots: [
          {
            id: 'late',
            telegram_bot_id: 1,
            username: 'late',
            name: 'Late',
            status: 'connected',
            selected: false,
            muted: false,
            created_at: 1,
            connected_at: 2,
            disconnected_at: null,
          },
        ],
      }),
    );
    await loadP;
    expect(useBotsStore.getState().bots).toEqual([]);
    // aucun cacheSet après clear (les appels antérieurs éventuels exclus)
    const setsAfter = mockCacheSet.mock.calls.length;
    // clear may have triggered delete only; load must not set
    expect(
      mockCacheSet.mock.calls.every(
        c => !(typeof c[1] === 'string' && c[1].includes('"late"')),
      ),
    ).toBe(true);
    expect(setsAfter === mockCacheSet.mock.calls.length).toBe(true);
  });

  it('load quota après clear ignore la réponse', async () => {
    let resolveHttp!: (v: Awaited<ReturnType<typeof http>>) => void;
    const deferred = new Promise<Awaited<ReturnType<typeof http>>>(resolve => {
      resolveHttp = resolve;
    });
    mockHttp.mockImplementation(() => deferred);
    const loadP = useQuotaStore.getState().load(true);
    await Promise.resolve();
    useQuotaStore.getState().clear();
    resolveHttp(
      ok({day: 'd', limit: 165, used: 1, remaining: 164, resets_at: 0}),
    );
    await loadP;
    expect(useQuotaStore.getState().quota).toBeNull();
  });
});

describe('setMuted single-flight par valeur', () => {
  it('true puis false : deux requêtes, état final false', async () => {
    useBotsStore.setState({
      bots: [
        {
          id: 'b1',
          telegram_bot_id: 1,
          username: 'x',
          name: 'X',
          status: 'connected',
          selected: true,
          muted: false,
          created_at: 1,
          connected_at: 2,
          disconnected_at: null,
        },
      ],
      lastFetch: Date.now(),
    });
    const calls: boolean[] = [];
    mockHttp.mockImplementation(async opts => {
      const muted = (opts.body as {muted?: boolean})?.muted;
      if (typeof muted === 'boolean') calls.push(muted);
      await new Promise<void>(r => setTimeout(r, 15));
      return ok({
        bot: {
          id: 'b1',
          telegram_bot_id: 1,
          username: 'x',
          name: 'X',
          status: 'connected',
          selected: true,
          muted: !!muted,
          created_at: 1,
          connected_at: 2,
          disconnected_at: null,
        },
      });
    });
    const pTrue = useBotsStore.getState().setMuted('b1', true);
    const pFalse = useBotsStore.getState().setMuted('b1', false);
    await Promise.all([pTrue, pFalse]);
    expect(calls).toEqual([true, false]);
    expect(useBotsStore.getState().bots[0]?.muted).toBe(false);
  });
});

describe('source unique du membre + applySignedOut', () => {
  it('updateProfile synchronise authStore.member', async () => {
    const member = {
      id: '1',
      email: 'a@b.c',
      email_verified: true,
      display_name: 'Old',
      role: 'member',
      status: 'active',
      country: null,
      usage: null,
      phone: null,
      organization: null,
      selected_bot_id: null,
      created_at: 0,
    };
    useAuthStore.setState({state: 'signedIn', member});
    useMemberStore.getState().setMember(member);
    mockHttp.mockResolvedValueOnce(
      ok({
        member: {...member, display_name: 'New'},
      }),
    );
    await useMemberStore.getState().updateProfile({display_name: 'New'});
    expect(useMemberStore.getState().member?.display_name).toBe('New');
    expect(useAuthStore.getState().member?.display_name).toBe('New');
  });

  it('confirmAccountDelete succès → signedOut via applySignedOut', async () => {
    useAuthStore.setState({state: 'signedIn', member: null});
    useBotsStore.setState({
      bots: [
        {
          id: 'b1',
          telegram_bot_id: 1,
          username: 'x',
          name: 'X',
          status: 'connected',
          selected: true,
          muted: false,
          created_at: 1,
          connected_at: 2,
          disconnected_at: null,
        },
      ],
      lastFetch: 1,
    });
    mockHttp
      .mockResolvedValueOnce(
        ok({requested: true, expires_in: 600, code_length: 6}, 202),
      )
      .mockResolvedValueOnce(ok({deleted: true}));
    await useMemberStore.getState().requestAccountDelete();
    const r = await useMemberStore.getState().confirmAccountDelete('123456');
    expect(r).toBe('ok');
    expect(useAuthStore.getState().state).toBe('signedOut');
    expect(useBotsStore.getState().bots).toEqual([]);
    expect(mockClearTokens).toHaveBeenCalled();
  });
});

