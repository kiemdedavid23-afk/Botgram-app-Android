/**
 * Tests L4a — webhookOf, actions bots, dates, sessions store.
 */
import {
  webhookOf,
  isBotConnected,
  botActionsAvailable,
  botStatusLabel,
} from '../src/features/bots/utils/webhook';
import type {Bot} from '../src/core/api/endpoints/bots';
import {timeAgo, shortDate, isMobileDevice} from '../src/features/gestion/utils/format';
import {http} from '../src/core/api/http';
import * as storage from '../src/core/storage';
import {useGestionStore} from '../src/features/gestion/store/gestionStore';
import {useBotsStore} from '../src/features/bots/store/botsStore';

jest.mock('../src/core/storage');
jest.mock('../src/core/api/http');

const mockHttp = http as jest.MockedFunction<typeof http>;

function ok<T>(data: T, status = 200): Awaited<ReturnType<typeof http>> {
  return {
    ok: true,
    data,
    status,
    headers: new Headers(),
    requestId: null,
  };
}

function fail(status: number, code: string): Awaited<ReturnType<typeof http>> {
  return {
    ok: false,
    error: {code, message: '', details: undefined},
    status,
    headers: new Headers(),
    requestId: null,
  };
}

const bot = (over: Partial<Bot> = {}): Bot => ({
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
  ...over,
});

beforeEach(() => {
  jest.resetAllMocks();
  mockHttp.mockReset();
  useGestionStore.getState().clear();
  useBotsStore.getState().clear();
  (storage.cacheGetString as jest.Mock).mockResolvedValue(undefined);
  (storage.cacheSetString as jest.Mock).mockResolvedValue(undefined);
  (storage.cacheDelete as jest.Mock).mockResolvedValue(undefined);
});

describe('webhookOf / actions', () => {
  it('connected → ok, resync only', () => {
    const b = bot({status: 'connected'});
    expect(webhookOf(b)).toBe('ok');
    expect(isBotConnected(b.status)).toBe(true);
    expect(botActionsAvailable(b)).toEqual({
      retry: false,
      resync: true,
      disconnect: true,
      delete: false,
    });
  });

  it('webhook_error → error, retry + disconnect', () => {
    const b = bot({status: 'webhook_error'});
    expect(webhookOf(b)).toBe('error');
    expect(botActionsAvailable(b).retry).toBe(true);
    expect(botActionsAvailable(b).delete).toBe(false);
  });

  it('disconnected → delete only', () => {
    const b = bot({status: 'disconnected'});
    expect(webhookOf(b)).toBe('none');
    expect(botActionsAvailable(b)).toEqual({
      retry: false,
      resync: false,
      disconnect: false,
      delete: true,
    });
  });

  it('botStatusLabel', () => {
    expect(botStatusLabel('token_invalid')).toBe('Jeton invalide');
  });
});

describe('format dates', () => {
  it('timeAgo / shortDate / isMobileDevice', () => {
    expect(timeAgo(Date.now() - 30_000)).toBe("à l'instant");
    expect(timeAgo(Date.now() - 10 * 60_000)).toMatch(/min/);
    expect(shortDate(Date.UTC(2025, 0, 15))).toMatch(/15/);
    expect(isMobileDevice('Chrome · Android')).toBe(true);
    expect(isMobileDevice('Firefox · Windows')).toBe(false);
  });
});

describe('gestionStore sessions', () => {
  it('loadSessions ok', async () => {
    mockHttp.mockResolvedValueOnce(
      ok({
        items: [
          {
            id: 's1',
            device: 'App · Android',
            created_at: 1,
            last_active_at: 2,
            current: true,
            app: null,
          },
        ],
      }),
    );
    const r = await useGestionStore.getState().loadSessions();
    expect(r).toBe('ok');
    expect(useGestionStore.getState().sessions).toHaveLength(1);
  });

  it('revokeSession filtre la liste', async () => {
    useGestionStore.setState({
      sessions: [
        {
          id: 's1',
          device: 'A',
          created_at: 1,
          last_active_at: 2,
          current: false,
          app: null,
        },
        {
          id: 's2',
          device: 'B',
          created_at: 1,
          last_active_at: 2,
          current: true,
          app: null,
        },
      ],
    });
    mockHttp.mockResolvedValueOnce(ok({revoked: true}));
    const r = await useGestionStore.getState().revokeSession('s1');
    expect(r).toBe('ok');
    expect(useGestionStore.getState().sessions.map(s => s.id)).toEqual(['s2']);
  });
});

describe('bots actions errors', () => {
  it('retry 429', async () => {
    useBotsStore.setState({
      bots: [bot()],
      lastFetch: 1,
    });
    mockHttp.mockResolvedValueOnce(fail(429, 'RATE_LIMITED'));
    const res = await useBotsStore.getState().retryWebhook('b1');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('RATE_LIMITED');
  });
});
