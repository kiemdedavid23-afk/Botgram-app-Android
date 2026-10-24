/**
 * Cycle de vie temps réel + conversations (Partie 0 / L5b).
 * - transport start/stop selon auth
 * - session.revoked → applySignedOut
 * - abonnement unique aux événements → conversationsStore
 * - bot actif suivi hors écran (botsStore)
 * - resync bots → botsStore.load
 */
import {useEffect, useRef} from 'react';
import {
  getRealtimeTransport,
  type RealtimeEvent,
} from '../core/realtime';
import {useAuthStore, applySignedOut} from '../features/auth/store/authStore';
import {useBotsStore} from '../features/bots/store/botsStore';
import {useConversationsStore} from '../features/conversations/store/conversationsStore';
import {fireAndForget} from '../core/utils/fireAndForget';

export function useRealtimeLifecycle(): void {
  const authState = useAuthStore(s => s.state);
  const bots = useBotsStore(s => s.bots);
  const unsubRef = useRef<(() => void) | null>(null);

  // Bot actif hors écran
  useEffect(() => {
    if (authState !== 'signedIn') return;
    const selected = bots.find(b => b.selected) ?? bots[0] ?? null;
    useConversationsStore.getState().setBotId(selected?.id ?? null);
  }, [authState, bots]);

  // Transport + abonnement unique
  useEffect(() => {
    const transport = getRealtimeTransport();

    if (authState === 'signedIn') {
      transport.start();
      if (!unsubRef.current) {
        unsubRef.current = transport.subscribe((ev: RealtimeEvent) => {
          if (ev.type === 'session.revoked') {
            fireAndForget(applySignedOut('revoked'));
            return;
          }
          if (ev.type === 'resync' && ev.scopes.includes('bots')) {
            fireAndForget(useBotsStore.getState().load(true));
          }
          useConversationsStore.getState().applyRealtimeEvent(ev);
        });
      }
    } else {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      transport.stop();
      useConversationsStore.getState().setBotId(null);
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      transport.stop();
    };
  }, [authState]);
}
