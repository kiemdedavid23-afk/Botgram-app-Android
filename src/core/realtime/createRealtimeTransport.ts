/**
 * Gestionnaire temps réel (contrat v1.3.1 §7).
 */
import {AppState} from 'react-native';
import {requestWsTicket, type WsEndpoint} from '../api/endpoints/realtime';
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
import {eventId, type RealtimeEvent} from './events';
import {
  createConnectionRunner,
  TOO_MANY_WAIT_MS,
  REPLACED_WAIT_MS,
} from './connectionRunner';
import {RECONSIDER_MS, DEDUP_SIZE, computeWait} from './wsHelpers';
import {fireAndForget} from '../utils/fireAndForget';
import {
  type CatchUpState,
  runHelloCatchUp,
  runUpdatesOnce,
} from './catchUp';
import {
  bindLifecycle,
  unbindLifecycle,
  checkSessionAfter4001,
} from './lifecycle';

export type RealtimeDeps = {
  webSocketFactory?: WebSocketFactory;
  clock?: Clock;
  timers?: TimerApi;
};

export function createRealtimeTransport(
  deps: RealtimeDeps = {},
): RealtimeTransport {
  const wsFactory = deps.webSocketFactory ?? defaultWebSocketFactory;
  const clock = deps.clock ?? defaultClock;
  const timers = deps.timers ?? defaultTimerApi;

  let state: ConnectionState = 'idle';
  const handlers = new Set<RealtimeEventHandler>();
  let started = false;
  let foreground = true;
  let networkOk = true;
  let sessionActive = true;
  let gen = 0;
  let endpointIndex = 0;
  let endpoints: WsEndpoint[] = [];
  let pollFallbackS = 30;
  let reconnectAttempt = 0;
  let waitUntil = 0;
  let recentIds: string[] = [];
  const catchUp: CatchUpState = {lastServerTime: 0, busy: false};
  let reconnectT: ReturnType<typeof setTimeout> | null = null;
  let pollT: ReturnType<typeof setInterval> | null = null;
  let reconsiderT: ReturnType<typeof setTimeout> | null = null;
  const unsubs: Array<() => void> = [];

  function setState(n: ConnectionState): void {
    state = n;
  }

  function emit(ev: RealtimeEvent): void {
    const id = eventId(ev);
    if (id) {
      if (recentIds.includes(id)) return;
      recentIds.push(id);
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

  const runner = createConnectionRunner(wsFactory, timers, () => gen, {
    onHello: () => {
      setState('connected');
      fireAndForget(runHelloCatchUp(catchUp, timers, emit));
      if (endpointIndex > 0) scheduleReconsider();
    },
    onEvent: emit,
    onSessionRevoked: () => {
      sessionActive = false;
      stopInternal(false);
    },
    onNeedNextEndpoint: () => {
      fireAndForget(advanceOrPoll());
    },
    onClosedNormal: () => scheduleReconnect(),
    onClosedTooMany: () => {
      waitUntil = clock() + TOO_MANY_WAIT_MS;
      scheduleReconnect();
    },
    onClosedReplaced: () => {
      waitUntil = clock() + REPLACED_WAIT_MS;
      scheduleReconnect();
    },
    onClosedSessionEnded: () => {
      fireAndForget(handle4001());
    },
    onStable: () => {
      reconnectAttempt = 0;
    },
  });

  async function handle4001(): Promise<void> {
    const result = await checkSessionAfter4001();
    if (result === 'ended') {
      sessionActive = false;
      setState('disconnected');
      return;
    }
    if (shouldRun()) scheduleReconnect();
    else setState('disconnected');
  }

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
    if (state !== 'polling') setState('disconnected');
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
      if (shouldRun()) {
        fireAndForget(
          runUpdatesOnce(catchUp, timers, emit, {emitResyncOnHasMore: true}),
        );
      }
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

  function stopInternal(clearStarted: boolean): void {
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
    setState(clearStarted ? 'idle' : started ? 'disconnected' : 'idle');
  }

  function evaluate(): void {
    if (shouldRun()) {
      if (state === 'idle' || state === 'disconnected') {
        fireAndForget(connectSeries());
      }
    } else {
      stopInternal(false);
    }
  }

  function start(): void {
    if (started) return;
    started = true;
    sessionActive = true;
    foreground = AppState.currentState === 'active';
    const bound = bindLifecycle({
      setForeground: v => {
        foreground = v;
      },
      setNetworkOk: v => {
        networkOk = v;
      },
      onSessionEnded: () => {
        sessionActive = false;
        stopInternal(false);
      },
      evaluate,
    });
    unsubs.push(...bound);
    evaluate();
  }

  function stop(): void {
    started = false;
    stopInternal(true);
    unbindLifecycle(unsubs);
    setState('idle');
  }

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
