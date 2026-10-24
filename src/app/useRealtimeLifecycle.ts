/**
 * Branche le transport temps réel au cycle de vie auth (Partie 0 / L5a).
 * start() si signedIn, stop() sinon.
 * session.revoked → applySignedOut('revoked') (13.5).
 * Ne vit que dans src/app (R3 : core n'importe pas features).
 */
import {useEffect, useRef} from 'react';
import {getRealtimeTransport} from '../core/realtime';
import {useAuthStore, applySignedOut} from '../features/auth/store/authStore';
import {fireAndForget} from '../core/utils/fireAndForget';

/**
 * Monté une seule fois dans App.
 * Observe useAuthStore.state et démarre / arrête le transport.
 */
export function useRealtimeLifecycle(): void {
  const authState = useAuthStore(s => s.state);
  const unsubRevokedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const transport = getRealtimeTransport();

    if (authState === 'signedIn') {
      transport.start();
      if (!unsubRevokedRef.current) {
        unsubRevokedRef.current = transport.subscribe(ev => {
          if (ev.type === 'session.revoked') {
            fireAndForget(applySignedOut('revoked'));
          }
        });
      }
    } else {
      if (unsubRevokedRef.current) {
        unsubRevokedRef.current();
        unsubRevokedRef.current = null;
      }
      transport.stop();
    }

    return () => {
      if (unsubRevokedRef.current) {
        unsubRevokedRef.current();
        unsubRevokedRef.current = null;
      }
      transport.stop();
    };
  }, [authState]);
}
