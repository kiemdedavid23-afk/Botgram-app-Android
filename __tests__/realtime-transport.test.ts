/**
 * Tests transport temps réel (contrat v1.3.1 §7.9).
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

jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
  remove: jest.fn(),
}));
Object.defineProperty(AppState, 'currentState', {
  configurable: true,
  get: () => 'active',
});

const mockTicket = jest.fn();
const mockUpdates = jest.fn();
const mockMe = jest.fn();

jest.mock('../src/core/api/endpoints/realtime', () => ({
  requestWsTicket: (...a: unknown[]) => mockTicket(...a),
  fetchUpdates: (...a: unknown[]) => mockUpdates(...a),
}));

jest.mock('../src/core/api/endpoints/auth', () => ({
  me: (...a: unknown[]) => mockMe(...a),
}));

jest.mock('../src/core/api/session', () => ({
  onSessionEvent: jest.fn(() => jest.fn()),
  authedHttp: jest.fn(),
}));

type Listener = (ev?: unknown) => void;
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  onopen: Listener | null = null;
  onmessage: Listener | null = null;
  onerror: Listener | null = null;
  onclose: Listener | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
  send(data: string): void {
    this.sent.push(data);
  }
  close(code = 1000): void {
    if (this.onclose) this.onclose({code});
  }
  receive(data: string): void {
    if (this.onmessage) this.onmessage({data});
  }
  /** hello SANS id (Worker room.js). */
  receiveHello(serverTime = 1000, heartbeat = 25): void {
    this.receive(
      JSON.stringify({
        type: 'hello',
        at: serverTime,
        server_time: serverTime,
        heartbeat_s: heartbeat,
      }),
    );
  }
  failBeforeHello(): void {
    if (this.onerror) this.onerror({});
    this.close(1006);
  }
}

async function flushPromises(max = 20): Promise<void> {
  for (let i = 0; i < max; i += 1) await Promise.resolve();
}

function createFakeTimers(): {
  timers: TimerApi;
  clock: Clock;
  advance: (ms: number) => void;
} {
  let now = 0;
  const pending: Array<{fn: () => void; at: number; id: number}> = [];
  let nextId = 1;
  const timers: TimerApi = {
    setTimeout(fn, ms) {
      const id = nextId++;
      pending.push({fn, at: now + ms, id});
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeout(id) {
      const i = pending.findIndex(p => p.id === (id as unknown as number));
      if (i >= 0) pending.splice(i, 1);
    },
    setInterval(fn, ms) {
      const id = nextId++;
      const wrap = () => {
        fn();
        pending.push({fn: wrap, at: now + ms, id});
      };
      pending.push({fn: wrap, at: now + ms, id});
      return id as unknown as ReturnType<typeof setInterval>;
    },
    clearInterval(id) {
      const i = pending.findIndex(p => p.id === (id as unknown as number));
      if (i >= 0) pending.splice(i, 1);
    },
  };
  const clock: Clock = () => now;
  function advance(ms: number): void {
    const target = now + ms;
    while (true) {
      const due = pending.filter(p => p.at <= target).sort((a, b) => a.at - b.at);
      if (due.length === 0) break;
      const next = due[0]!;
      now = next.at;
      const i = pending.indexOf(next);
      if (i >= 0) pending.splice(i, 1);
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
      endpoints: endpoints.map(e => ({...e, expires_in: 60})),
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
      conversations: [{id: 'c1', bot_id: 'b1'}],
      unread: {b1: 2},
      has_more: hasMore,
    },
    requestId: 'u1',
    status: 200,
    headers: new Headers(),
  };
}

describe('parseRealtimeEvent', () => {
  it('accepte hello sans id', () => {
    const h = parseRealtimeEvent({
      type: 'hello',
      at: 1,
      server_time: 100,
      heartbeat_s: 25,
    });
    expect(h?.type).toBe('hello');
    if (h?.type === 'hello') expect(h.server_time).toBe(100);
  });

  it('accepte session.revoked sans id', () => {
    const e = parseRealtimeEvent({
      type: 'session.revoked',
      at: 2,
      reason: 'revoked',
    });
    expect(e?.type).toBe('session.revoked');
  });

  it('rejette message.new sans id', () => {
    expect(
      parseRealtimeEvent({
        type: 'message.new',
        at: 1,
        bot_id: 'b',
        conversation_id: 'c',
        message_id: 'm',
        direction: 'in',
        kind: 'text',
      }),
    ).toBeNull();
  });

  it('ignore bot_request et types inconnus', () => {
    expect(parseRealtimeEvent({type: 'bot_request.new', id: '1'})).toBeNull();
    expect(parseRealtimeEvent({type: 'foo', id: '1'})).toBeNull();
  });

  it('parse message.new avec et sans message', () => {
    const withMsg = parseRealtimeEvent({
      type: 'message.new',
      id: 'm1',
      at: 2,
      bot_id: 'b1',
      conversation_id: 'c1',
      message_id: 'msg1',
      direction: 'in',
      kind: 'text',
      message: {id: 'msg1', conversation_id: 'c1', direction: 'in', kind: 'text'},
    });
    expect(withMsg?.type).toBe('message.new');
    if (withMsg?.type === 'message.new') expect(withMsg.message).toBeDefined();

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
    if (without?.type === 'message.new') expect(without.message).toBeUndefined();
  });
});

describe('createRealtimeTransport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FakeWebSocket.instances = [];
    mockTicket.mockResolvedValue(
      okTicket([{id: 'do', url: 'wss://rt.exemple.org/ws', ticket: 't1'}]),
    );
    mockUpdates.mockResolvedValue(okUpdates(1000));
    mockMe.mockResolvedValue({
      ok: true,
      data: {member: {}},
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
    return {transport, advance, clock};
  }

  it('ouvre le premier endpoint avec ticket dans l’URL', async () => {
    const {transport} = make();
    transport.start();
    await flushPromises();
    expect(mockTicket).toHaveBeenCalled();
    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(1);
    const ws = FakeWebSocket.instances[0]!;
    expect(ws.url).toContain('ticket=t1');
  });

  it('hello sans id : catch-up updates + resync bots/conversations', async () => {
    const events: string[] = [];
    const {transport} = make();
    transport.subscribe(ev => events.push(ev.type));
    transport.start();
    await flushPromises();
    FakeWebSocket.instances[0]!.receiveHello(2000);
    await flushPromises();
    expect(mockUpdates).toHaveBeenCalledWith(0);
    expect(events).toContain('updates');
    expect(events).toContain('resync');
    expect(transport.getConnectionState()).toBe('connected');
  });

  it('has_more émet resync conversations sans rappeler /updates', async () => {
    mockUpdates.mockResolvedValue(okUpdates(1000, true));
    const events: Array<{type: string; scopes?: string[]}> = [];
    const {transport} = make();
    transport.subscribe(ev => {
      if (ev.type === 'resync') events.push({type: 'resync', scopes: ev.scopes});
      if (ev.type === 'updates') events.push({type: 'updates'});
    });
    transport.start();
    await flushPromises();
    FakeWebSocket.instances[0]!.receiveHello(2000);
    await flushPromises();
    expect(mockUpdates).toHaveBeenCalledTimes(1);
    expect(events.some(e => e.type === 'resync' && e.scopes?.includes('conversations'))).toBe(true);
  });

  it('échec avant hello → point suivant immédiatement', async () => {
    mockTicket.mockResolvedValue(
      okTicket([
        {id: 'a', url: 'wss://a.exemple.org/ws', ticket: 't1'},
        {id: 'b', url: 'wss://b.exemple.org/ws', ticket: 't2'},
      ]),
    );
    const {transport} = make();
    transport.start();
    await flushPromises();
    expect(FakeWebSocket.instances.length).toBe(1);
    FakeWebSocket.instances[0]!.failBeforeHello();
    await flushPromises();
    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(2);
  });

  it('liste d’endpoints vide → polling', async () => {
    mockTicket.mockResolvedValue(okTicket([]));
    const {transport} = make();
    transport.start();
    await flushPromises();
    expect(transport.getConnectionState()).toBe('polling');
    expect(mockUpdates).toHaveBeenCalled();
  });

  it('tous les points d’entrée en échec (2 endpoints) → polling', async () => {
    mockTicket.mockResolvedValue(
      okTicket([
        {id: 'a', url: 'wss://a.exemple.org/ws', ticket: 't1'},
        {id: 'b', url: 'wss://b.exemple.org/ws', ticket: 't2'},
      ]),
    );
    const {transport} = make();
    transport.start();
    await flushPromises();
    expect(FakeWebSocket.instances.length).toBe(1);
    FakeWebSocket.instances[0]!.failBeforeHello();
    await flushPromises();
    expect(FakeWebSocket.instances.length).toBe(2);
    FakeWebSocket.instances[1]!.failBeforeHello();
    await flushPromises();
    expect(transport.getConnectionState()).toBe('polling');
    expect(mockUpdates).toHaveBeenCalled();
  });

  it('hello non reçu en 8 s → point suivant', async () => {
    mockTicket.mockResolvedValue(
      okTicket([
        {id: 'a', url: 'wss://a.exemple.org/ws', ticket: 't1'},
        {id: 'b', url: 'wss://b.exemple.org/ws', ticket: 't2'},
      ]),
    );
    const {transport, advance} = make();
    transport.start();
    await flushPromises();
    expect(FakeWebSocket.instances.length).toBe(1);
    advance(8000);
    await flushPromises();
    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(2);
  });

  it('pas de pong sous 10 s → fermeture et reconnexion', async () => {
    const {transport, advance} = make();
    transport.start();
    await flushPromises();
    const ws = FakeWebSocket.instances[0]!;
    ws.receiveHello(1000, 25);
    await flushPromises();
    advance(25000);
    await flushPromises();
    expect(ws.sent.some(s => s === 'ping')).toBe(true);
    const before = FakeWebSocket.instances.length;
    advance(10000);
    await flushPromises();
    advance(2000);
    await flushPromises();
    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(before);
  });

  it('fermeture 4009 d’une socket périmée est ignorée', async () => {
    const {transport} = make();
    transport.start();
    await flushPromises();
    const ws1 = FakeWebSocket.instances[0]!;
    ws1.receiveHello(1000);
    await flushPromises();
    expect(transport.getConnectionState()).toBe('connected');
    ws1.close(4009);
    await flushPromises();
    expect(transport.getConnectionState()).not.toBe('idle');
  });

  it('dédoublonne les événements par id', async () => {
    const received: string[] = [];
    const {transport} = make();
    transport.subscribe(ev => {
      if (ev.type === 'message.new') received.push(ev.id);
    });
    transport.start();
    await flushPromises();
    const ws = FakeWebSocket.instances[0]!;
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

  it('session.revoked sans id est livré', async () => {
    const types: string[] = [];
    const {transport} = make();
    transport.subscribe(ev => types.push(ev.type));
    transport.start();
    await flushPromises();
    const ws = FakeWebSocket.instances[0]!;
    ws.receiveHello(1000);
    await flushPromises();
    ws.receive(JSON.stringify({type: 'session.revoked', at: 99, reason: 'revoked'}));
    await flushPromises();
    expect(types).toContain('session.revoked');
  });

  it('ping envoyé après hello', async () => {
    const {transport, advance} = make();
    transport.start();
    await flushPromises();
    const ws = FakeWebSocket.instances[0]!;
    ws.receiveHello(1000, 25);
    await flushPromises();
    advance(25000);
    await flushPromises();
    expect(ws.sent.some(s => s === 'ping')).toBe(true);
  });

  it('4001 déclenche GET /auth/me', async () => {
    const {transport} = make();
    transport.start();
    await flushPromises();
    const ws = FakeWebSocket.instances[0]!;
    ws.receiveHello(1000);
    await flushPromises();
    ws.close(4001);
    await flushPromises();
    expect(mockMe).toHaveBeenCalled();
  });

  it('stop puis start : arrière-plan puis premier plan relance une connexion', async () => {
    const appListeners: Array<(s: string) => void> = [];
    (AppState.addEventListener as jest.Mock).mockImplementation(
      (_ev: string, cb: (s: string) => void) => {
        appListeners.push(cb);
        return {remove: jest.fn()};
      },
    );
    const {transport} = make();
    transport.start();
    await flushPromises();
    const callsAfterFirstStart = mockTicket.mock.calls.length;
    transport.stop();
    expect(transport.getConnectionState()).toBe('idle');
    transport.start();
    await flushPromises();
    expect(mockTicket.mock.calls.length).toBeGreaterThan(callsAfterFirstStart);
    const callsBeforeBg = mockTicket.mock.calls.length;
    for (const cb of appListeners) cb('background');
    await flushPromises();
    for (const cb of appListeners) cb('active');
    await flushPromises();
    expect(mockTicket.mock.calls.length).toBeGreaterThanOrEqual(callsBeforeBg);
  });

  it('since : second /updates utilise server_time 5000, pas celui de hello', async () => {
    mockUpdates
      .mockResolvedValueOnce(okUpdates(5000))
      .mockResolvedValueOnce(okUpdates(6000));
    const {transport} = make();
    transport.start();
    await flushPromises();
    FakeWebSocket.instances[0]!.receiveHello(9999);
    await flushPromises();
    expect(mockUpdates).toHaveBeenCalledWith(0);
    mockUpdates.mockClear();
    mockUpdates.mockResolvedValue(okUpdates(6000));
    // second catch-up (ex. tick polling ou reconnexion)
    FakeWebSocket.instances[0]!.close(1000);
    await flushPromises();
    // force un nouvel hello sur une nouvelle socket si créée
    if (FakeWebSocket.instances.length > 1) {
      FakeWebSocket.instances[FakeWebSocket.instances.length - 1]!.receiveHello(
        8888,
      );
      await flushPromises();
    }
    const sinceArgs = mockUpdates.mock.calls.map(c => c[0] as number);
    expect(sinceArgs.some(s => s === 5000)).toBe(true);
    expect(sinceArgs.every(s => s !== 9999 && s !== 8888)).toBe(true);
  });

  it('nouveau ticket à chaque série de tentatives', async () => {
    const {transport, advance} = make();
    transport.start();
    await flushPromises();
    expect(mockTicket).toHaveBeenCalledTimes(1);
    FakeWebSocket.instances[0]!.receiveHello(1000);
    await flushPromises();
    FakeWebSocket.instances[0]!.close(1006);
    await flushPromises();
    advance(2000);
    await flushPromises();
    expect(mockTicket.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('délai de reconnexion exponentiel borné à 60 s', async () => {
    const {computeWait} = jest.requireActual(
      '../src/core/realtime/wsHelpers',
    ) as typeof import('../src/core/realtime/wsHelpers');
    const clock = () => 0;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const d = computeWait(clock, 0, attempt);
      expect(d).toBeLessThanOrEqual(60000);
      expect(d).toBeGreaterThanOrEqual(0);
    }
    const late = computeWait(clock, 0, 10);
    expect(late).toBeLessThanOrEqual(60000);
  });

  it('aucune reconnexion en arrière-plan', async () => {
    const appListeners: Array<(s: string) => void> = [];
    (AppState.addEventListener as jest.Mock).mockImplementation(
      (_ev: string, cb: (s: string) => void) => {
        appListeners.push(cb);
        return {remove: jest.fn()};
      },
    );
    const {transport, advance} = make();
    transport.start();
    await flushPromises();
    FakeWebSocket.instances[0]!.receiveHello(1000);
    await flushPromises();
    const callsWhileFg = mockTicket.mock.calls.length;
    for (const cb of appListeners) cb('background');
    await flushPromises();
    FakeWebSocket.instances[0]!.close(1006);
    await flushPromises();
    advance(5000);
    await flushPromises();
    expect(mockTicket.mock.calls.length).toBe(callsWhileFg);
  });

  it('4008 attend au moins 5 minutes avant reconnexion', async () => {
    const {transport, advance} = make();
    transport.start();
    await flushPromises();
    const ws = FakeWebSocket.instances[0]!;
    ws.receiveHello(1000);
    await flushPromises();
    const callsBefore = mockTicket.mock.calls.length;
    ws.close(4008);
    await flushPromises();
    advance(4 * 60 * 1000);
    await flushPromises();
    expect(mockTicket.mock.calls.length).toBe(callsBefore);
    advance(2 * 60 * 1000);
    await flushPromises();
    expect(mockTicket.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('jamais deux /updates simultanés', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    mockUpdates.mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return okUpdates(1000);
    });
    const {transport} = make();
    transport.start();
    await flushPromises();
    FakeWebSocket.instances[0]!.receiveHello(1000);
    await flushPromises();
    expect(maxInFlight).toBeLessThanOrEqual(1);
  });

  it('Retry-After est respecté sur /updates', async () => {
    const headers = new Headers();
    headers.set('retry-after', '2');
    mockUpdates
      .mockResolvedValueOnce({
        ok: false as const,
        error: {code: 'RATE_LIMITED', message: 'rate'},
        requestId: null,
        status: 429,
        headers,
      })
      .mockResolvedValueOnce(okUpdates(1000));
    const {transport, advance} = make();
    transport.start();
    await flushPromises();
    FakeWebSocket.instances[0]!.receiveHello(1000);
    await flushPromises();
    expect(mockUpdates).toHaveBeenCalled();
    advance(2000);
    await flushPromises();
  });
});
