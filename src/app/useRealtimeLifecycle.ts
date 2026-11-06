/**
 * Cycle de vie temps réel + conversations + fil (Partie 0 / L5b / L5c).
 */
import {useEffect, useRef} from 'react';
import {
  getRealtimeTransport,
  type RealtimeEvent,
} from '../core/realtime';
import {useAuthStore, applySignedOut} from '../features/auth/store/authStore';
import {useBotsStore} from '../features/bots/store/botsStore';
import {useConversationsStore} from '../features/conversations/store/conversationsStore';
import {useThreadStore} from '../features/thread/store/threadStore';
import {fireAndForget} from '../core/utils/fireAndForget';
import {me} from '../core/api/endpoints/auth';
import {
  accountTypeOf,
  isAccessLost,
  useWorkspaceStore,
} from '../features/accounts';

async function refreshMember(): Promise<void> {
  const res = await me();
  if (res.ok) useAuthStore.setState({member: res.data.member});
}

export function useRealtimeLifecycle(): void {
  const authState = useAuthStore(s => s.state);
  const bots = useBotsStore(s => s.bots);
  const member = useAuthStore(s => s.member);
  const workspaces = useWorkspaceStore(s => s.workspaces);
  const serverLoaded = useWorkspaceStore(s => s.serverLoaded);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (authState !== 'signedIn') return;
    const selected = bots.find(b => b.selected) ?? bots[0] ?? null;
    useConversationsStore.getState().setBotId(selected?.id ?? null);
  }, [authState, bots]);

  // Espaces : cache puis réseau dès la connexion.
  useEffect(() => {
    if (authState !== 'signedIn') return;
    const ws = useWorkspaceStore.getState();
    fireAndForget(ws.hydrate().then(() => ws.load()));
  }, [authState]);

  // Invité retiré de l'entreprise : son compte n'existe plus, retour à la connexion.
  useEffect(() => {
    if (authState !== 'signedIn') return;
    if (isAccessLost(accountTypeOf(member), workspaces, serverLoaded)) {
      fireAndForget(applySignedOut('access_removed'));
    }
  }, [authState, member, workspaces, serverLoaded]);

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
            fireAndForget(useWorkspaceStore.getState().load(true));
          }
          if (ev.type === 'workspace.changed') {
            fireAndForget(useWorkspaceStore.getState().load(true));
            fireAndForget(useBotsStore.getState().load(true));
            if (
              ev.reason === 'ownership_transferred' ||
              ev.reason === 'role_changed'
            ) {
              // Le type de compte peut avoir changé (ancien propriétaire → invité).
              fireAndForget(refreshMember());
            }
          }
          useConversationsStore.getState().applyRealtimeEvent(ev);
          useThreadStore.getState().applyRealtimeEvent(ev);
        });
      }
    } else {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      transport.stop();
      useConversationsStore.getState().setBotId(null);
      useThreadStore.getState().close();
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
