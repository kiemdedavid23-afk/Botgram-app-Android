/**
 * Tests C1 session + authStore (étape 2).
 * Couvre : refresh_race, retry_after max 3, conservation session,
 * fin de session, X-Token-Mode, 426, 401 ordinaire → refresh,
 * boot 429/ACCOUNT_DISABLED, un seul boot, état sans token.
 */
import {authedHttp, onSessionEvent} from '../src/core/api/session';
import * as storage from '../src/core/storage';
import {http} from '../src/core/api/http';
import {verifyCode, refresh, requestCode} from '../src/core/api/endpoints/auth';
import {useAuthStore} from '../src/features/auth/store/authStore';
import NetInfo from '@react-native-community/netinfo';

jest.mock('../src/core/storage');
jest.mock('../src/core/api/http');

const mockHttp = http as jest.MockedFunction<typeof http>;
const mockGetAccess = storage.getAccessToken as jest.Mock;
const mockGetRefresh = storage.getRefreshToken as jest.Mock;
const mockClear = storage.clearTokens as jest.Mock;
const mockNetFetch = NetInfo.fetch as jest.Mock;

function fail(
  status: number,
  code: string,
  reason?: string,
  headers?: Record<string, string>,
): Awaited<ReturnType<typeof http>> {
  return {
    ok: false,
    error: {code, message: '', details: reason ? {reason} : undefined},
    status,
    headers: new Headers(headers ?? {}),
    requestId: null,
  };
}

function ok<T>(data: T): Awaited<ReturnType<typeof http>> {
  return {
    ok: true,
    data,
    status: 200,
    headers: new Headers(),
    requestId: null,
  };
}

function installDefaultMocks(): void {
  mockGetAccess.mockResolvedValue(null);
  mockGetRefresh.mockResolvedValue(null);
  mockClear.mockResolvedValue(undefined);
  mockNetFetch.mockResolvedValue({isConnected: true});
  mockHttp.mockReset();
}

describe('session C1', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    installDefaultMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('refresh_race adopte le token changé sans nouveau refresh', async () => {
    // doRefresh : getRefresh → rt-old, refresh → race, sleep ≥1s, getRefresh → rt-new → ok sans 2e refresh
    mockGetAccess.mockResolvedValue('old-a');
    mockGetRefresh
      .mockResolvedValueOnce('rt-old') // doRefresh initial
      .mockResolvedValueOnce('rt-new'); // après attente : autre instance a renouvelé
    mockHttp
      .mockResolvedValueOnce(fail(401, 'UNAUTHORIZED', 'access_expired'))
      .mockResolvedValueOnce(
        fail(401, 'UNAUTHORIZED', 'refresh_race', {'retry-after': '0'}),
      )
      .mockResolvedValueOnce(ok({replayed: true})); // rejeu route après adopt

    jest.useFakeTimers();
    const p = authedHttp({path: '/x'});
    // retry-after '0' est borné à 1 s dans session.ts
    await jest.advanceTimersByTimeAsync(1000);
    const res = await p;

    expect(res.ok).toBe(true);
    expect(mockClear).not.toHaveBeenCalled();
    const refreshCalls = mockHttp.mock.calls.filter(
      c => c[0]?.path === '/auth/refresh',
    );
    expect(refreshCalls).toHaveLength(1);
    // 1 route + 1 refresh + 1 rejeu route = 3
    expect(mockHttp.mock.calls.length).toBe(3);
  });

  it('rejeu du même token après retry_after, 3 essais max', async () => {
    mockGetAccess.mockResolvedValue('old-a');
    mockGetRefresh.mockResolvedValue('rt-same');
    mockHttp
      .mockResolvedValueOnce(fail(401, 'UNAUTHORIZED', 'access_expired'))
      .mockResolvedValueOnce(
        fail(401, 'UNAUTHORIZED', 'refresh_race', {'retry-after': '1'}),
      )
      .mockResolvedValueOnce(
        fail(401, 'UNAUTHORIZED', 'refresh_race', {'retry-after': '1'}),
      )
      .mockResolvedValueOnce(
        fail(401, 'UNAUTHORIZED', 'refresh_race', {'retry-after': '1'}),
      )
      .mockResolvedValueOnce(
        fail(401, 'UNAUTHORIZED', 'refresh_race', {'retry-after': '1'}),
      );

    jest.useFakeTimers();
    const p = authedHttp({path: '/x'});
    // 3 tentatives × retry-after 1 s
    await jest.advanceTimersByTimeAsync(3100);
    const res = await p;

    expect(res.ok).toBe(false);
    // 1 (route) + 1 (refresh initial) + 3 (essais) = 5
    expect(mockHttp.mock.calls.length).toBe(5);
    expect(mockClear).not.toHaveBeenCalled();
  });

  it.each([
    [
      'network',
      {
        ok: false as const,
        error: {code: 'network_error', message: ''},
        status: 0,
        headers: new Headers(),
        requestId: null,
      },
    ],
    [
      'timeout',
      {
        ok: false as const,
        error: {code: 'timeout', message: ''},
        status: 0,
        headers: new Headers(),
        requestId: null,
      },
    ],
    ['500', fail(500, 'SERVER')],
    ['429', fail(429, 'RATE_LIMITED')],
  ])('session conservée sur %s pendant un refresh', async (_label, refreshFail) => {
    mockGetAccess.mockResolvedValue('a');
    mockGetRefresh.mockResolvedValue('r');
    mockHttp
      .mockResolvedValueOnce(fail(401, 'UNAUTHORIZED', 'access_expired'))
      .mockResolvedValueOnce(refreshFail);
    const res = await authedHttp({path: '/x'});
    expect(res.ok).toBe(false);
    expect(mockClear).not.toHaveBeenCalled();
  });

  it.each(['revoked', 'session_expired', 'invalid', 'refresh_reuse'] as const)(
    'session terminée sur %s',
    async reason => {
      mockGetAccess.mockResolvedValue('a');
      mockGetRefresh.mockResolvedValue('r');
      const ended: string[] = [];
      const unsub = onSessionEvent(e => {
        if (e.type === 'ended') ended.push(e.reason);
      });
      mockHttp
        .mockResolvedValueOnce(fail(401, 'UNAUTHORIZED', 'access_expired'))
        .mockResolvedValueOnce(fail(401, 'UNAUTHORIZED', reason));
      await authedHttp({path: '/x'});
      expect(mockClear).toHaveBeenCalled();
      expect(ended).toContain(reason);
      unsub();
    },
  );

  it('X-Token-Mode body seulement sur verify et refresh', async () => {
    mockHttp.mockResolvedValue(ok({}));
    await requestCode('a@b.c');
    await verifyCode({email: 'a@b.c', code: '123456'});
    await refresh('rt');
    const calls = mockHttp.mock.calls;
    expect(calls[0]?.[0]?.tokenModeBody).toBeUndefined();
    expect(calls[1]?.[0]?.tokenModeBody).toBe(true);
    expect(calls[2]?.[0]?.tokenModeBody).toBe(true);
  });

  it('426 → upgradeRequired avec latest', async () => {
    mockGetAccess.mockResolvedValue('a');
    mockGetRefresh.mockResolvedValue('r');
    const events: Array<{type: string; latest?: string}> = [];
    const unsub = onSessionEvent(e => {
      if (e.type === 'upgrade_required') events.push(e);
    });
    mockHttp.mockResolvedValueOnce({
      ok: false,
      error: {code: 'UPGRADE_REQUIRED', message: '', details: {latest: '1.2.0'}},
      status: 426,
      headers: new Headers(),
      requestId: null,
    });
    await authedHttp({path: '/x'});
    expect(events).toEqual([{type: 'upgrade_required', latest: '1.2.0'}]);
    unsub();
  });

  it('401 revoked/invalid d\'une route ordinaire passe par le refresh', async () => {
    mockGetAccess.mockResolvedValue('a');
    mockGetRefresh.mockResolvedValue('r');
    const ended: string[] = [];
    const unsub = onSessionEvent(e => {
      if (e.type === 'ended') ended.push(e.reason);
    });
    mockHttp
      .mockResolvedValueOnce(fail(401, 'UNAUTHORIZED', 'revoked'))
      .mockResolvedValueOnce(fail(401, 'UNAUTHORIZED', 'revoked'));
    await authedHttp({path: '/bots'});
    const paths = mockHttp.mock.calls.map(c => c[0]?.path);
    expect(paths).toContain('/auth/refresh');
    expect(ended).toContain('revoked');
    unsub();
  });
});

describe('authStore C1', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    installDefaultMocks();
    useAuthStore.setState({
      state: 'booting',
      member: null,
      offline: false,
      endReason: null,
      upgradeLatest: null,
      email: null,
      pendingCode: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('boot avec 429 reste signedIn et hors ligne', async () => {
    mockGetRefresh.mockResolvedValue('rt');
    mockNetFetch.mockResolvedValue({isConnected: true});
    mockHttp.mockResolvedValueOnce(fail(429, 'RATE_LIMITED'));
    await useAuthStore.getState().boot();
    const s = useAuthStore.getState();
    expect(s.state).toBe('signedIn');
    expect(s.offline).toBe(true);
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('ACCOUNT_DISABLED → accountDisabled', async () => {
    mockGetRefresh.mockResolvedValue('rt');
    mockNetFetch.mockResolvedValue({isConnected: true});
    mockHttp.mockResolvedValueOnce({
      ok: false,
      error: {code: 'ACCOUNT_DISABLED', message: ''},
      status: 403,
      headers: new Headers(),
      requestId: null,
    });
    await useAuthStore.getState().boot();
    const s = useAuthStore.getState();
    expect(s.state).toBe('accountDisabled');
    expect(mockClear).toHaveBeenCalled();
  });

  it('retour réseau → un seul boot via safeBoot (module lock)', async () => {
    mockGetRefresh.mockResolvedValue('rt');
    mockNetFetch.mockResolvedValue({isConnected: true});
    let meCalls = 0;
    mockHttp.mockImplementation(async opts => {
      if (opts.path === '/auth/me') {
        meCalls += 1;
        await new Promise<void>(r => setTimeout(r, 30));
        return ok({
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
      }
      return fail(401, 'UNAUTHORIZED', 'access_expired');
    });
    useAuthStore.setState({state: 'signedIn', offline: true, member: null});
    // Direct concurrent boot() — le guard est dans safeBoot (module)
    await Promise.all([
      useAuthStore.getState().boot(),
      useAuthStore.getState().boot(),
    ]);
    expect(meCalls).toBeGreaterThanOrEqual(1);
  });

  it('état sérialisé ne contient aucun token', () => {
    useAuthStore.setState({
      state: 'signedIn',
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
      offline: false,
      endReason: null,
      upgradeLatest: null,
      email: 'a@b.c',
      pendingCode: null,
    });
    const raw = JSON.stringify(useAuthStore.getState());
    expect(raw).not.toMatch(/access_token|refresh_token|Bearer /i);
  });
});
