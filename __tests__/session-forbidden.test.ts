import {authedHttp, onSessionEvent, type SessionEvent} from '../src/core/api/session';
import * as storage from '../src/core/storage';
import {http} from '../src/core/api/http';

jest.mock('../src/core/storage');
jest.mock('../src/core/api/http');

const mockHttp = http as jest.MockedFunction<typeof http>;

const res = (status: number, code: string) => ({
  ok: false as const,
  status,
  error: {code, message: 'x'},
  requestId: null,
  headers: new Headers(),
});

describe('403 FORBIDDEN', () => {
  const events: SessionEvent[] = [];
  let off: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    events.length = 0;
    (storage.getAccessToken as jest.Mock).mockResolvedValue('tok');
    off = onSessionEvent(e => events.push(e));
  });
  afterEach(() => off());

  it('émet « forbidden » et rend la réponse telle quelle', async () => {
    const r = res(403, 'FORBIDDEN');
    mockHttp.mockResolvedValueOnce(r);
    const out = await authedHttp({method: 'POST', path: '/bots/b1/messages'});
    expect(out).toBe(r);
    expect(events).toContainEqual({type: 'forbidden'});
  });

  it('un autre 403 (ACCOUNT_TYPE_NOT_ALLOWED) n’émet rien', async () => {
    mockHttp.mockResolvedValueOnce(res(403, 'ACCOUNT_TYPE_NOT_ALLOWED'));
    await authedHttp({method: 'POST', path: '/bots'});
    expect(events.find(e => e.type === 'forbidden')).toBeUndefined();
  });
});
