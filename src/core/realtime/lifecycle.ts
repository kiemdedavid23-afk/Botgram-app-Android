/**
 * Abonnements AppState / NetInfo / session (posés à start, retirés à stop).
 */
import {AppState, type AppStateStatus} from 'react-native';
import NetInfo, {type NetInfoState} from '@react-native-community/netinfo';
import {onSessionEvent} from '../api/session';
import {me} from '../api/endpoints/auth';

export type LifecycleHooks = {
  setForeground: (v: boolean) => void;
  setNetworkOk: (v: boolean) => void;
  onSessionEnded: () => void;
  evaluate: () => void;
};

export function bindLifecycle(hooks: LifecycleHooks): Array<() => void> {
  const unsubs: Array<() => void> = [];
  const appSub = AppState.addEventListener('change', (n: AppStateStatus) => {
    hooks.setForeground(n === 'active');
    hooks.evaluate();
  });
  unsubs.push(() => appSub.remove());

  const netUnsub = NetInfo.addEventListener((s: NetInfoState) => {
    hooks.setNetworkOk(s.isConnected !== false);
    hooks.evaluate();
  });
  unsubs.push(netUnsub);

  const sessUnsub = onSessionEvent(ev => {
    if (ev.type === 'ended') hooks.onSessionEnded();
  });
  unsubs.push(sessUnsub);
  return unsubs;
}

export function unbindLifecycle(unsubs: Array<() => void>): void {
  for (const u of unsubs) u();
  unsubs.length = 0;
}

/** Contrôle session après fermeture 4001 (contrat 7.5). */
export async function checkSessionAfter4001(): Promise<
  'ended' | 'alive'
> {
  const res = await me();
  if (!res.ok && res.status === 401) {
    const reason = (res.error.details as {reason?: string} | undefined)
      ?.reason;
    if (
      reason === 'revoked' ||
      reason === 'session_expired' ||
      reason === 'invalid' ||
      reason === 'refresh_reuse'
    ) {
      return 'ended';
    }
  }
  return 'alive';
}
