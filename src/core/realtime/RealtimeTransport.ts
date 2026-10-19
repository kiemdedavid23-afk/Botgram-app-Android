/**
 * Interface du transport temps réel (section 7).
 * Seul core/realtime connaît /updates (R6).
 * Implémentation PollingTransport livrée aux étapes suivantes.
 * Ne pas créer de WebSocket ici (interdit jusqu'à v1.2).
 */

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export type RealtimeEventHandler = (payload: unknown) => void;

export type RealtimeTransport = {
  start: () => void;
  stop: () => void;
  subscribe: (handler: RealtimeEventHandler) => () => void;
  getConnectionState: () => ConnectionState;
};

/**
 * Transport no-op pour le socle (étape 1).
 * Remplacé par PollingTransport dès l'étape 5.
 */
export function createNoopTransport(): RealtimeTransport {
  let state: ConnectionState = 'idle';
  const handlers = new Set<RealtimeEventHandler>();

  return {
    start() {
      state = 'connected';
    },
    stop() {
      state = 'idle';
      handlers.clear();
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    getConnectionState() {
      return state;
    },
  };
}
