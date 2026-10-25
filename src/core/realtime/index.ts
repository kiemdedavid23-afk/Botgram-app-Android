export type {
  ConnectionState,
  RealtimeEventHandler,
  RealtimeTransport,
  WebSocketFactory,
  Clock,
  TimerApi,
} from './RealtimeTransport';
export {
  defaultWebSocketFactory,
  defaultClock,
  defaultTimerApi,
} from './RealtimeTransport';
export type {
  RealtimeEvent,
  UpdatesEvent,
  ResyncEvent,
  ConversationSummary,
  Message,
  MessagePayload,
  InlineButton,
  AlbumItem,
} from './events';
export {parseRealtimeEvent, eventId} from './events';
export {createRealtimeTransport} from './createRealtimeTransport';
export type {RealtimeDeps} from './createRealtimeTransport';

import {createRealtimeTransport} from './createRealtimeTransport';
import type {RealtimeTransport} from './RealtimeTransport';

/** Instance unique (démarrée à l'auth, arrêtée à la déconnexion). */
let singleton: RealtimeTransport | null = null;

export function getRealtimeTransport(): RealtimeTransport {
  if (!singleton) {
    singleton = createRealtimeTransport();
  }
  return singleton;
}

/** Réinitialise le singleton (tests uniquement). */
export function resetRealtimeTransportForTests(): void {
  if (singleton) {
    singleton.stop();
    singleton = null;
  }
}
