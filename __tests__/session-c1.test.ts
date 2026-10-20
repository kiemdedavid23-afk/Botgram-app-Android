/**
 * Tests session et authStore (C1).
 */
import {authedHttp} from '../src/core/api/session';
import * as storage from '../src/core/storage';
import {http} from '../src/core/api/http';
import {verifyCode, refresh, requestCode} from '../src/core/api/endpoints/auth';

jest.mock('../src/core/storage');
jest.mock('../src/core/api/http');

const mockHttp = http as jest.MockedFunction<typeof http>;
const mockGetAccess = storage.getAccessToken as jest.Mock;
const mockGetRefresh = storage.getRefreshToken as jest.Mock;
const mockClear = storage.clearTokens as jest.Mock;

describe('session C1', () => {
  beforeEach(() => jest.clearAllMocks());

  it('refresh_race adopte token changé sans refresh', async () => {
    mockGetRefresh.mockResolvedValueOnce('rt-old').mockResolvedValueOnce('rt-new');
    mockHttp.mockResolvedValueOnce({
      ok: false,
      error: {code: 'UNAUTHORIZED', message: '', details: {reason: 'refresh_race'}},
      status: 401,
      headers: new Headers({'retry-after': '1'}),
      requestId: null,
    });
    await refresh('rt-old');
    expect(mockHttp).toHaveBeenCalledTimes(1);
  });

  it('session conservée sur 500 pendant refresh', async () => {
    mockGetAccess.mockResolvedValue('a');
    mockGetRefresh.mockResolvedValue('r');
    mockHttp
      .mockResolvedValueOnce({
        ok: false,
        error: {code: 'UNAUTHORIZED', message: '', details: {reason: 'access_expired'}},
        status: 401,
        headers: new Headers(),
        requestId: null,
      })
      .mockResolvedValueOnce({
        ok: false,
        error: {code: 'SERVER', message: ''},
        status: 500,
        headers: new Headers(),
        requestId: null,
      });
    const res = await authedHttp({path: '/x'});
    expect(res.ok).toBe(false);
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('X-Token-Mode body seulement sur verify et refresh', async () => {
    mockHttp.mockResolvedValue({ok: true, data: {}, status: 200, headers: new Headers(), requestId: null});
    await requestCode('a@b.c');
    await verifyCode({email: 'a@b.c', code: '123456'});
    await refresh('rt');
    const calls = mockHttp.mock.calls;
    expect(calls[0]?.[0]?.tokenModeBody).toBeUndefined();
    expect(calls[1]?.[0]?.tokenModeBody).toBe(true);
    expect(calls[2]?.[0]?.tokenModeBody).toBe(true);
  });
});
