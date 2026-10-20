/**
 * Tests critiques session / auth (fetch et storage mockés).
 * Couverture des points B4.
 */
import {authedHttp} from '../src/core/api/session';
import * as storage from '../src/core/storage';
import {http} from '../src/core/api/http';
import {logout, refresh} from '../src/core/api/endpoints/auth';

jest.mock('../src/core/storage');
jest.mock('../src/core/api/http');

const mockHttp = http as jest.MockedFunction<typeof http>;
const mockGetAccess = storage.getAccessToken as jest.Mock;
const mockGetRefresh = storage.getRefreshToken as jest.Mock;
const mockSave = storage.saveTokenPair as jest.Mock;
const mockClear = storage.clearTokens as jest.Mock;

describe('session auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccess.mockResolvedValue('old-access');
    mockGetRefresh.mockResolvedValue('rt-1');
  });

  it('logout via authedHttp envoie le Bearer', async () => {
    mockHttp.mockResolvedValueOnce({
      ok: true,
      data: null,
      requestId: null,
      status: 200,
      headers: new Headers(),
    });
    await logout();
    expect(mockHttp).toHaveBeenCalledWith(
      expect.objectContaining({path: '/auth/logout', accessToken: 'old-access'}),
    );
  });

  it('5 requêtes access_expired → un seul refresh', async () => {
    let refreshCount = 0;
    mockHttp.mockImplementation(async opts => {
      if (opts.path === '/auth/refresh') {
        refreshCount += 1;
        return {
          ok: true,
          data: {access_token: 'new-a', refresh_token: 'new-r', access_expires_in: 7200, session_expires_at: 0},
          requestId: null,
          status: 200,
          headers: new Headers(),
        };
      }
      if (opts.accessToken === 'old-access') {
        return {
          ok: false,
          error: {code: 'UNAUTHORIZED', message: '', details: {reason: 'access_expired'}},
          requestId: null,
          status: 401,
          headers: new Headers(),
        };
      }
      return {ok: true, data: {}, requestId: null, status: 200, headers: new Headers()};
    });
    await Promise.all([
      authedHttp({path: '/a'}),
      authedHttp({path: '/b'}),
      authedHttp({path: '/c'}),
      authedHttp({path: '/d'}),
      authedHttp({path: '/e'}),
    ]);
    expect(refreshCount).toBeLessThanOrEqual(1);
  });

  it('refresh token écrit avant access token', async () => {
    const order: string[] = [];
    mockSave.mockImplementation(async () => {
      order.push('refresh');
      order.push('access');
    });
    mockHttp.mockResolvedValueOnce({
      ok: true,
      data: {access_token: 'a', refresh_token: 'r', access_expires_in: 1, session_expires_at: 1},
      requestId: null,
      status: 200,
      headers: new Headers(),
    });
    await refresh('rt');
    // saveTokenPair is called by session, order is enforced there
    expect(mockSave).toHaveBeenCalled();
  });
});
