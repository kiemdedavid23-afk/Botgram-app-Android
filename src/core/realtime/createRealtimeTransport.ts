/**
 * Gestionnaire temps réel : choisit WebSocket ou sondage (contrat §7).
 * Cycle de vie : premier plan + session + réseau. Une seule socket.
 */
import {AppState, type AppStateStatus} from 'react-native';
import NetInfo, {type NetInfoState} from '@react-native-community/netinfo';
import {onSessionEvent} from '../api/session';
import {listBots} from '../api/endpoints/bots';
import {
  requestWsTicket,
  fetchUpdates,
  type WsEndpoint,
} from '../api/endpoints/realtime';
import {
  type ConnectionState,
  type RealtimeTransport,
  type RealtimeEventHandler,
  type WebSocketFactory,
  type Clock,
  type TimerApi,
  defaultWebSocketFactory,
  defaultClock,
  defaultTimerApi,
} from './RealtimeTransport';
import type {RealtimeEvent} from './events';
import {
  createConnectionRunner,
  TOO_MANY_WAIT_MS,
  REPLACED_WAIT_MS,
} from './connectionRunner';
import {RECONSIDER_MS, DEDUP_SIZE, computeWait} from './wsHelpers';
import {fireAndForget} from '../utils/fireAndForget';

export type RealtimeDeps = {
  webSocketFactory?: WebSocketFactory;
  clock?: Clock;
  timers?: TimerApi;
  onAfterHello?: () => Promise<void>;
};

export function createRealtimeTransport(
  deps: RealtimeDeps = {},
): RealtimeTransport {
  const wsFactory = deps.webSocketFactory ?? defaultWebSocketFactory;
  const clock = deps.clock ?? defaultClock;
  const timers = deps.timers ?? defaultTimerApi;
  const onAfterHello = deps.onAfterHello;

  let state: ConnectionState = 'idle';
  const handlers = new Set<RealtimeEventHandler>();
  let started = false;
  let foreground = AppState.currentState === 'active';
  let networkOk = true;
  let sessionActive = true;

  let gen = 0;
  let endpointIndex = 0;
  let endpoints: WsEndpoint[] = [];
  let pollFallbackS = 30;
  let lastServerTime = 0;
  let updatesBusy = false;
  let reconnectAttempt = 0;
  let waitUntil = 0;
  let recentIds: string[] = [];

  let reconnectT: ReturnType<typeof setTimeout> | null = null;
  let pollT: ReturnType<typeof setInterval> | null = null;
  let reconsiderT: ReturnType<typeof setTimeout> | null = null;

  const unsubs: Array<() => void> = [];

  function setState(n: ConnectionState): void {
    state = n;
  }

  function emit(ev: RealtimeEvent): void {
    if (ev.id) {
      if (recentIds.includes(ev.id)) return;
      recentIds.push(ev.id);
      if (recentIds.length > DEDUP_SIZE) {
        recentIds = recentIds.slice(-DEDUP_SIZE);
      }
    }
    for (const h of handlers) {
      try {
        h(ev);
      } catch {
        /* */
      }
    }
  }

  function shouldRun(): boolean {
    return started && foreground && networkOk && sessionActive;
  }

  async function catchUp(): Promise<void> {
    if (updatesBusy) return;
    updatesBusy = true;
    try {
      let since = lastServerTime;
      let more = true;
      let n = 0;
      while (more && n < 5) {
        n += 1;
        const res = await fetchUpdates(since);
        if (!res.ok) {
          const ra = Number(res.headers.get('retry-after') ?? 0);
          if (ra > 0) {
            await new Promise<void>(r => {
              timers.setTimeout(() => r(), Math.min(ra, 30) * 1000);
            });
            continue;
          }
          break;
        }
        lastServerTime = res.data.server_time;
        since = res.data.server_time;
        more = res.data.has_more === true;
      }
      await listBots();
      if (onAfterHello) await onAfterHello();
    } finally {
      updatesBusy = false;
    }
  }

  const runner = createConnectionRunner(
    wsFactory,
    clock,
    timers,
    () => gen,
    {
      onHello: () => {
        setState('connected');
        reconnectAttempt = 0;
        fireAndForget(catchUp());
        if (endpointIndex > 0) scheduleReconsider();
      },
      onEvent: emit,
      onSessionRevoked: () => {
        sessionActive = false;
        stopInternal();
      },
      onNeedNextEndpoint: () => {
        fireAndForget(advanceOrPoll());
      },
      onClosedNormal: () => {
        scheduleReconnect();
      },
      onClosedTooMany: () => {
        waitUntil = clock() + TOO_MANY_WAIT_MS;
        scheduleReconnect();
      },
      onClosedReplaced: () => {
        waitUntil = clock() + REPLACED_WAIT_MS;
        scheduleReconnect();
      },
      onClosedSessionEnded: () => {
        sessionActive = false;
        setState('disconnected');
      },
    },
  );

  function openAt(index: number): void {
    if (!shouldRun()) return;
    if (index >= endpoints.length) {
      startPolling();
      return;
    }
    const ep = endpoints[index];
    if (!ep) {
      startPolling();
      return;
    }
    endpointIndex = index;
    gen += 1;
    setState('connecting');
    runner.open(ep, gen);
  }

  async function advanceOrPoll(): Promise<void> {
    if (!shouldRun()) return;
    const next = endpointIndex + 1;
    if (next < endpoints.length) {
      openAt(next);
      return;
    }
    const tr = await requestWsTicket();
    if (tr.ok && tr.data.endpoints.length > 0) {
      endpoints = tr.data.endpoints;
      pollFallbackS = tr.data.poll_fallback_s || 30;
      endpointIndex = 0;
      openAt(0);
      return;
    }
    startPolling();
  }

  function scheduleReconnect(): void {
    if (!shouldRun()) {
      setState('disconnected');
      return;
    }
    if (reconnectT) return;
    const delay = computeWait(clock, waitUntil, reconnectAttempt);
    reconnectAttempt += 1;
    // Ne pas écraser 'polling' : le sondage reste actif pendant les
    // tentatives WebSocket en arrière-plan (contrat 7.7 / 7.8).
    if (state !== 'polling') {
      setState('disconnected');
    }
    reconnectT = timers.setTimeout(() => {
      reconnectT = null;
      fireAndForget(connectSeries());
    }, delay);
  }

  function scheduleReconsider(): void {
    if (reconsiderT) timers.clearTimeout(reconsiderT);
    reconsiderT = timers.setTimeout(() => {
      reconsiderT = null;
      if (!shouldRun() || endpointIndex === 0) return;
      fireAndForget(
        (async () => {
          const tr = await requestWsTicket();
          if (!tr.ok || tr.data.endpoints.length === 0) return;
          endpoints = tr.data.endpoints;
          pollFallbackS = tr.data.poll_fallback_s || pollFallbackS;
          openAt(0);
        })(),
      );
    }, RECONSIDER_MS);
  }

  function startPolling(): void {
    if (pollT) return;
    setState('polling');
    const tick = () => {
      if (shouldRun()) fireAndForget(catchUp());
    };
    tick();
    pollT = timers.setInterval(tick, pollFallbackS * 1000);
    scheduleReconnect();
  }

  async function connectSeries(): Promise<void> {
    if (!shouldRun()) return;
    if (pollT) {
      timers.clearInterval(pollT);
      pollT = null;
    }
    setState('connecting');
    const tr = await requestWsTicket();
    if (!tr.ok || tr.data.endpoints.length === 0) {
      startPolling();
      return;
    }
    endpoints = tr.data.endpoints;
    pollFallbackS = tr.data.poll_fallback_s || 30;
    endpointIndex = 0;
    openAt(0);
  }

  function stopInternal(): void {
    if (reconnectT) {
      timers.clearTimeout(reconnectT);
      reconnectT = null;
    }
    if (pollT) {
      timers.clearInterval(pollT);
      pollT = null;
    }
    if (reconsiderT) {
      timers.clearTimeout(reconsiderT);
      reconsiderT = null;
    }
    runner.clearTimers();
    runner.close(gen);
    gen += 1;
    setState(started ? 'disconnected' : 'idle');
  }

  function evaluate(): void {
    if (shouldRun()) {
      if (state === 'idle' || state === 'disconnected') {
        fireAndForget(connectSeries());
      }
    } else {
      stopInternal();
    }
  }

  function start(): void {
    if (started) return;
    started = true;
    sessionActive = true;
    evaluate();
  }

  function stop(): void {
    started = false;
    stopInternal();
    setState('idle');
    for (const u of unsubs) u();
    unsubs.length = 0;
  }

  const appSub = AppState.addEventListener('change', (n: AppStateStatus) => {
    foreground = n === 'active';
    evaluate();
  });
  unsubs.push(() => appSub.remove());

  const netUnsub = NetInfo.addEventListener((s: NetInfoState) => {
    networkOk = s.isConnected !== false;
    evaluate();
  });
  unsubs.push(netUnsub);

  const sessUnsub = onSessionEvent(ev => {
    if (ev.type === 'ended') {
      sessionActive = false;
      stopInternal();
    }
  });
  unsubs.push(sessUnsub);

  return {
    start,
    stop,
    subscribe(h) {
      handlers.add(h);
      return () => {
        handlers.delete(h);
      };
    },
    getConnectionState: () => state,
  };
}
