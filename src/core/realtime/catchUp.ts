/**
 * Rattrapage GET /updates (contrat v1.3.1 §7.3 point 6, 7.7).
 * Émet updates / resync. N'appelle PAS GET /bots (R3).
 */
import {fetchUpdates} from '../api/endpoints/realtime';
import type {RealtimeEvent} from './events';
import type {TimerApi} from './RealtimeTransport';

export type CatchUpState = {
  lastServerTime: number;
  busy: boolean;
};

export type CatchUpEmit = (ev: RealtimeEvent) => void;

/**
 * Un seul appel /updates (tick de sondage ou rattrapage hello).
 * has_more → resync conversations, sans rappeler /updates avec since avancé.
 */
export async function runUpdatesOnce(
  state: CatchUpState,
  timers: TimerApi,
  emit: CatchUpEmit,
  options: {emitResyncOnHasMore: boolean},
): Promise<void> {
  if (state.busy) return;
  state.busy = true;
  try {
    const since = state.lastServerTime;
    const res = await fetchUpdates(since);
    if (!res.ok) {
      const ra = Number(res.headers.get('retry-after') ?? 0);
      if (ra > 0) {
        await new Promise<void>(r => {
          timers.setTimeout(() => r(), Math.min(ra, 30) * 1000);
        });
      }
      return;
    }
    state.lastServerTime = res.data.server_time;
    emit({
      type: 'updates',
      conversations: res.data.conversations,
      unread: res.data.unread,
      has_more: res.data.has_more === true,
    });
    if (res.data.has_more === true && options.emitResyncOnHasMore) {
      emit({type: 'resync', scopes: ['conversations']});
    }
  } finally {
    state.busy = false;
  }
}

/** Rattrapage à hello : un /updates + resync bots+conversations. */
export async function runHelloCatchUp(
  state: CatchUpState,
  timers: TimerApi,
  emit: CatchUpEmit,
): Promise<void> {
  await runUpdatesOnce(state, timers, emit, {emitResyncOnHasMore: true});
  emit({type: 'resync', scopes: ['bots', 'conversations']});
}
