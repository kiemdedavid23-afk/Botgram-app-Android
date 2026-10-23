/**
 * Ouverture WebSocket, hello, ping/pong, codes de fermeture (contrat §7.3–7.5).
 */
import type {WsEndpoint} from '../api/endpoints/realtime';
import type {WebSocketFactory, Clock, TimerApi} from './RealtimeTransport';
import {parseRealtimeEvent, type RealtimeEvent} from './events';
import {
  HELLO_TIMEOUT_MS,
  PONG_TIMEOUT_MS,
  STABLE_RESET_MS,
  TOO_MANY_WAIT_MS,
  REPLACED_WAIT_MS,
  buildWsUrl,
} from './wsHelpers';

export type ConnectionCallbacks = {
  onHello: (heartbeatS: number) => void;
  onEvent: (ev: RealtimeEvent) => void;
  onSessionRevoked: () => void;
  onNeedNextEndpoint: () => void;
  onClosedNormal: () => void;
  onClosedTooMany: () => void;
  onClosedReplaced: () => void;
  onClosedSessionEnded: () => void;
};

export type ConnectionHandle = {
  open: (ep: WsEndpoint, generation: number) => void;
  close: (generation: number) => void;
  clearTimers: () => void;
};

export function createConnectionRunner(
  wsFactory: WebSocketFactory,
  _clock: Clock,
  timers: TimerApi,
  getGeneration: () => number,
  cbs: ConnectionCallbacks,
): ConnectionHandle {
  let socket: WebSocket | null = null;
  let helloT: ReturnType<typeof setTimeout> | null = null;
  let pingT: ReturnType<typeof setInterval> | null = null;
  let pongT: ReturnType<typeof setTimeout> | null = null;
  let stableT: ReturnType<typeof setTimeout> | null = null;
  let heartbeatS = 25;

  function clearTimers(): void {
    if (helloT) {
      timers.clearTimeout(helloT);
      helloT = null;
    }
    if (pingT) {
      timers.clearInterval(pingT);
      pingT = null;
    }
    if (pongT) {
      timers.clearTimeout(pongT);
      pongT = null;
    }
    if (stableT) {
      timers.clearTimeout(stableT);
      stableT = null;
    }
  }

  function close(g: number): void {
    if (g !== getGeneration() || !socket) return;
    try {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    } catch {
      /* */
    }
    socket = null;
  }

  function startPing(g: number): void {
    if (pingT) timers.clearInterval(pingT);
    pingT = timers.setInterval(() => {
      if (g !== getGeneration() || !socket) return;
      try {
        socket.send('ping');
      } catch {
        /* */
      }
      if (pongT) timers.clearTimeout(pongT);
      pongT = timers.setTimeout(() => {
        if (g !== getGeneration()) return;
        close(g);
        cbs.onClosedNormal();
      }, PONG_TIMEOUT_MS);
    }, heartbeatS * 1000);
  }

  function onActivity(g: number): void {
    if (g !== getGeneration()) return;
    if (pongT) {
      timers.clearTimeout(pongT);
      pongT = null;
    }
  }

  function onMsg(g: number, data: string): void {
    if (g !== getGeneration()) return;
    if (data === 'pong') {
      onActivity(g);
      return;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(data) as unknown;
    } catch {
      return;
    }
    const ev = parseRealtimeEvent(raw);
    if (!ev) return;
    onActivity(g);
    if (ev.type === 'hello') {
      if (helloT) {
        timers.clearTimeout(helloT);
        helloT = null;
      }
      if (typeof ev.heartbeat_s === 'number' && ev.heartbeat_s > 0) {
        heartbeatS = ev.heartbeat_s;
      }
      if (stableT) timers.clearTimeout(stableT);
      stableT = timers.setTimeout(() => {
        /* reset attempt côté manager */
      }, STABLE_RESET_MS);
      startPing(g);
      cbs.onHello(heartbeatS);
      return;
    }
    if (ev.type === 'session.revoked') {
      cbs.onEvent(ev);
      cbs.onSessionRevoked();
      return;
    }
    cbs.onEvent(ev);
  }

  function open(ep: WsEndpoint, g: number): void {
    clearTimers();
    close(g);
    let ws: WebSocket;
    try {
      ws = wsFactory(buildWsUrl(ep.url, ep.ticket));
    } catch {
      cbs.onNeedNextEndpoint();
      return;
    }
    socket = ws;
    helloT = timers.setTimeout(() => {
      if (g !== getGeneration()) return;
      close(g);
      cbs.onNeedNextEndpoint();
    }, HELLO_TIMEOUT_MS);
    ws.onmessage = (e: WebSocketMessageEvent) => {
      onMsg(g, typeof e.data === 'string' ? e.data : String(e.data ?? ''));
    };
    ws.onclose = (e: WebSocketCloseEvent) => {
      if (g !== getGeneration()) return;
      socket = null;
      clearTimers();
      const code = e.code;
      if (code === 4001) {
        cbs.onClosedSessionEnded();
        return;
      }
      if (code === 4008) {
        cbs.onClosedTooMany();
        return;
      }
      if (code === 4009) {
        cbs.onClosedReplaced();
        return;
      }
      cbs.onClosedNormal();
    };
  }

  return {open, close, clearTimers};
}

export {TOO_MANY_WAIT_MS, REPLACED_WAIT_MS, STABLE_RESET_MS};
