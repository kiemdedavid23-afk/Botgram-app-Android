/**
 * Branche le transport temps réel au cycle de vie auth (Partie 0 / L5a).
 * start() si signedIn, stop() sinon.
 * session.revoked → applySignedOut('revoked') (13.5).
 */
import {useEffect, useRef} from 'react';
import {
  getRealtimeTransport,
  type RealtimeEvent,
} from '../core/realtime';
import {useAuthStore, applySignedOut} from '../features/auth/store/authStore';
import {fireAndForget} from '../core/utils/fireAndForget';

export function useRealtimeLifecycle(): void {
  const authState = useAuthStore(s => s.state);
  const unsubRevokedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const transport = getRealtimeTransport();

    if (authState === 'signedIn') {
      transport.start();
      if (!unsubRevokedRef.current) {
        unsubRevokedRef.current = transport.subscribe((ev: RealtimeEvent) => {
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
