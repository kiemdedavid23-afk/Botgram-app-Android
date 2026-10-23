/**
 * Interface du transport temps réel (section 7 du contrat).
 * Seul core/realtime connaît /updates, /ws/ticket et /ws (R6).
 * Une seule dépendance du reste de l'application.
 */

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'polling'
  | 'disconnected';

/** Handler d'événements normalisés (types dans events.ts). */
export type RealtimeEventHandler = (
  event: import('./events').RealtimeEvent,
) => void;

export type RealtimeTransport = {
  start: () => void;
  stop: () => void;
  subscribe: (handler: RealtimeEventHandler) => () => void;
  getConnectionState: () => ConnectionState;
};

/**
 * Fabrique injectable de WebSocket (un seul `new WebSocket` dans le dépôt).
 */
export type WebSocketFactory = (url: string) => WebSocket;

/**
 * Horloge injectable (ms depuis epoch).
 */
export type Clock = () => number;

/**
 * Minuterie injectable.
 */
export type TimerApi = {
  setTimeout: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (id: ReturnType<typeof setTimeout>) => void;
  setInterval: (fn: () => void, ms: number) => ReturnType<typeof setInterval>;
  clearInterval: (id: ReturnType<typeof setInterval>) => void;
};

export const defaultWebSocketFactory: WebSocketFactory = (url: string) =>
  new WebSocket(url);

export const defaultClock: Clock = () => Date.now();

export const defaultTimerApi: TimerApi = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: id => clearTimeout(id),
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: id => clearInterval(id),
};
