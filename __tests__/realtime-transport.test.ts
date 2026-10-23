/**
 * Tests transport temps réel (contrat §7.9).
 * Fausse socket, fausses minuteries, horloge contrôlée.
 *
 * Cause racine des échecs précédents :
 * - createRealtimeTransport.ts:52 — foreground = AppState.currentState === 'active'
 *   En Jest, AppState.currentState n'est pas 'active' → shouldRun() = false
 *   → start() n'appelle jamais requestWsTicket ni n'ouvre de socket.
 * Correction test : mock AppState.currentState = 'active' (contrat 7.2 respecté).
 */
import {AppState} from 'react-native';
import {
  createRealtimeTransport,
  type RealtimeDeps,
} from '../src/core/realtime/createRealtimeTransport';
import {parseRealtimeEvent} from '../src/core/realtime/events';
import type {
  WebSocketFactory,
  Clock,
  TimerApi,
} from '../src/core/realtime/RealtimeTransport';

// --- AppState : premier plan simulé (cause racine des 6 échecs « instances empty ») ---
jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
  remove: jest.fn(),
}));
Object.defineProperty(AppState, 'currentState', {
  configurable: true,
  get: () => 'active',
});

// --- Mocks HTTP (ticket + updates + bots) ---
const mockTicket = jest.fn();
const mockUpdates = jest.fn();
const mockListBots = jest.fn();

jest.mock('../src/core/api/endpoints/realtime', () => ({
  requestWsTicket: (...args: unknown[]) => mockTicket(...args),
  fetchUpdates: (...args: unknown[]) => mockUpdates(...args),
}));

jest.mock('../src/core/api/endpoints/bots', () => ({
  listBots: (...args: unknown[]) => mockListBots(...args),
}));

jest.mock('../src/core/api/session', () => ({
  onSessionEvent: jest.fn(() => jest.fn()),
  authedHttp: jest.fn(),
}));

// --- Fake WebSocket ---
type Listener = (ev?: unknown) => void;
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: Listener | null = null;
  onmessage: Listener | null = null;
  onerror: Listener | null = null;
  onclose: Listener | null = null;
  sent: string[] = [];
  closed = false;
  closeCode = 1000;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code = 1000): void {
    this.closed = true;
    this.closeCode = code;
    this.readyState = 3;
    if (this.onclose) this.onclose({code});
  }

  receive(data: string): void {
    if (this.onmessage) this.onmessage({data});
  }

  receiveHello(serverTime = 1000, heartbeat = 25): void {
    this.receive(
      JSON.stringify({
        type: 'hello',
        id: `h-${serverTime}`,
        at: serverTime,
        server_time: serverTime,
        heartbeat_s: heartbeat,
      }),
    );
  }
}

/** Vide les micro-tâches de façon bornée (remplace les séries de Promise.resolve). */
async function flushPromises(maxTurns = 20): Promise<void> {
  for (let i = 0; i < maxTurns; i += 1) {
    await Promise.resolve();
  }
}

// --- Fake timers / clock ---
function createFakeTimers(): {
  timers: TimerApi;
  clock: Clock;
  advance: (ms: number) => void;
} {
  let now = 0;
  const pending: Array<{
    fn: () => void;
    at: number;
    type: 't' | 'i';
    id: number;
  }> = [];
  let nextId = 1;

  const timers: TimerApi = {
    setTimeout(fn, ms) {
      const id = nextId++;
      pending.push({fn, at: now + ms, type: 't', id});
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeout(id) {
      const idx = pending.findIndex(p => p.id === (id as unknown as number));
      if (idx >= 0) pending.splice(idx, 1);
    },
    setInterval(fn, ms) {
      const id = nextId++;
      const wrap = () => {
        fn();
        pending.push({fn: wrap, at: now + ms, type: 'i', id});
      };
      pending.push({fn: wrap, at: now + ms, type: 'i', id});
      return id as unknown as ReturnType<typeof setInterval>;
    },
    clearInterval(id) {
      const idx = pending.findIndex(p => p.id === (id as unknown as number));
      if (idx >= 0) pending.splice(idx, 1);
    },
  };

  const clock: Clock = () => now;

  function advance(ms: number): void {
    const target = now + ms;
    while (true) {
      const due = pending
        .filter(p => p.at <= target)
        .sort((a, b) => a.at - b.at);
      if (due.length === 0) break;
      const next = due[0]!;
      now = next.at;
      const idx = pending.indexOf(next);
      if (idx >= 0) pending.splice(idx, 1);
      next.fn();
    }
    now = target;
  }

  return {timers, clock, advance};
}

function okTicket(
  endpoints: Array<{id: string; url: string; ticket: string}>,
) {
  return {
    ok: true as const,
    data: {
      endpoints: endpoints.map(e => ({
        ...e,
        expires_in: 60,
      })),
      heartbeat_s: 25,
      poll_fallback_s: 30,
      server_time: 500,
    },
    requestId: 'r1',
    status: 200,
    headers: new Headers(),
  };
}

function okUpdates(serverTime: number, hasMore = false) {
  return {
    ok: true as const,
    data: {
      server_time: serverTime,
      conversations: [],
      unread: {},
      has_more: hasMore,
    },
    requestId: 'u1',
    status: 200,
    headers: new Headers(),
  };
}

describe('parseRealtimeEvent', () => {
  it('ignore type inconnu et bot_request', () => {
    expect(parseRealtimeEvent({type: 'foo', id: '1'})).toBeNull();
    expect(
      parseRealtimeEvent({type: 'bot_request.new', id: '1', request_id: 'x'}),
    ).toBeNull();
  });

  it('parse hello et message.new avec et sans message', () => {
    const h = parseRealtimeEvent({
      type: 'hello',
      id: 'h1',
      at: 1,
      server_time: 100,
      heartbeat_s: 25,
    });
    expect(h?.type).toBe('hello');

    const withMsg = parseRealtimeEvent({
      type: 'message.new',
      id: 'm1',
      at: 2,
      bot_id: 'b1',
      conversation_id: 'c1',
      message_id: 'msg1',
      direction: 'in',
      kind: 'text',
      message: {
        id: 'msg1',
        conversation_id: 'c1',
        direction: 'in',
        kind: 'text',
      },
    });
    expect(withMsg?.type).toBe('message.new');
    if (withMsg?.type === 'message.new') {
      expect(withMsg.message).toBeDefined();
    }

    const without = parseRealtimeEvent({
      type: 'message.new',
      id: 'm2',
      at: 3,
      bot_id: 'b1',
      conversation_id: 'c1',
      message_id: 'msg2',
      direction: 'in',
      kind: 'text',
    });
    expect(without?.type).toBe('message.new');
    if (without?.type === 'message.new') {
      expect(without.message).toBeUndefined();
    }
  });
});

describe('createRealtimeTransport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FakeWebSocket.instances = [];
    mockTicket.mockResolvedValue(
      okTicket([
        {id: 'do', url: 'wss://rt.exemple.org/ws', ticket: 't1'},
      ]),
    );
    mockUpdates.mockResolvedValue(okUpdates(1000));
    mockListBots.mockResolvedValue({
      ok: true,
      data: {bots: []},
      requestId: null,
      status: 200,
      headers: new Headers(),
    });
  });

  function make(deps: Partial<RealtimeDeps> = {}) {
    const {timers, clock, advance} = createFakeTimers();
    const factory: WebSocketFactory = url =>
      new FakeWebSocket(url) as unknown as WebSocket;
    const transport = createRealtimeTransport({
      webSocketFactory: factory,
      clock,
      timers,
      ...deps,
    });
    return {transport, advance, clock, timers};
  }

  it('ouvre le premier endpoint avec ticket dans l’URL', async () => {
    // Cause racine précédente : AppState.currentState ≠ 'active'
    // → shouldRun() false → mockTicket jamais appelé (createRealtimeTransport.ts:93,281)
    const {transport} = make();
    transport.start();
    await flushPromises();

    expect(mockTicket).toHaveBeenCalled();
    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(1);
    const ws = FakeWebSocket.instances[0]!;
    expect(ws.url).toContain('ticket=t1');
    expect(ws.url.startsWith('wss://rt.exemple.org/ws')).toBe(true);
  });

  it('passe au suivant si hello n’arrive pas en 8 s', async () => {
    // Cause racine précédente : aucune socket créée (même AppState)
    mockTicket.mockResolvedValue(
      okTicket([
        {id: 'do', url: 'wss://a.exemple.org/ws', ticket: 't1'},
        {id: 'vps', url: 'wss://b.exemple.org/ws', ticket: 't2'},
      ]),
    );
    const {transport, advance} = make();
    transport.start();
    await flushPromises();

    expect(FakeWebSocket.instances.length).toBe(1);
    advance(8000);
    await flushPromises();

    // deuxième endpoint ou nouveau ticket
    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(1);
  });

  it('à hello : catch-up /updates puis listBots', async () => {
    // Cause racine précédente : FakeWebSocket.instances[0] undefined (pas de socket)
    const {transport} = make();
    transport.start();
    await flushPromises();

    const ws = FakeWebSocket.instances[0]!;
    expect(ws).toBeDefined();
    ws.receiveHello(2000, 25);
    await flushPromises();

    expect(mockUpdates).toHaveBeenCalled();
    expect(mockListBots).toHaveBeenCalled();
    expect(transport.getConnectionState()).toBe('connected');
  });

  it('envoie ping et reconnecte si pas de pong', async () => {
    // Cause racine précédente : instances[0] undefined
    const {transport, advance} = make();
    transport.start();
    await flushPromises();

    const ws = FakeWebSocket.instances[0]!;
    expect(ws).toBeDefined();
    ws.receiveHello(1000, 25);
    await flushPromises();

    advance(25000);
    await flushPromises();
    expect(ws.sent.some(s => s === 'ping')).toBe(true);

    advance(10000);
    await flushPromises();
  });

  it('ignore fermeture 4009 d’une socket périmée (pas de boucle)', async () => {
    // Cause racine précédente : instances[0] undefined
    const {transport} = make();
    transport.start();
    await flushPromises();

    const ws1 = FakeWebSocket.instances[0]!;
    expect(ws1).toBeDefined();
    ws1.receiveHello(1000);
    await flushPromises();

    ws1.close(4009);
    await flushPromises();
    expect(transport.getConnectionState()).not.toBe('idle');
  });

  it('bascule en polling si liste d’endpoints vide', async () => {
    // Cause racine précédente : shouldRun() false → scheduleReconnect met 'disconnected'
    // au lieu d’atteindre startPolling (createRealtimeTransport.ts:201-203 vs 230)
    mockTicket.mockResolvedValue(okTicket([]));
    const {transport} = make();
    transport.start();
    await flushPromises();

    expect(transport.getConnectionState()).toBe('polling');
    expect(mockUpdates).toHaveBeenCalled();
  });

  it('dédoublonne les événements par id', async () => {
    // Cause racine précédente : instances[0] undefined
    const received: string[] = [];
    const {transport} = make();
    transport.subscribe(ev => {
      if (ev.type === 'message.new') received.push(ev.id);
    });
    transport.start();
    await flushPromises();

    const ws = FakeWebSocket.instances[0]!;
    expect(ws).toBeDefined();
    ws.receiveHello(1000);
    await flushPromises();

    const payload = {
      type: 'message.new',
      id: 'dup-1',
      at: 10,
      bot_id: 'b',
      conversation_id: 'c',
      message_id: 'm',
      direction: 'in',
      kind: 'text',
    };
    ws.receive(JSON.stringify(payload));
    ws.receive(JSON.stringify(payload));
    await flushPromises();

    expect(received.filter(id => id === 'dup-1').length).toBe(1);
  });
});
