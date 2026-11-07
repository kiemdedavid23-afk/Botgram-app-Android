/** Recopie les droits calculés (type de compte + rôle) vers `core/access/rights`. */
import {setRights} from '../../core/access/rights';
import {useAuthStore} from '../auth/store/authStore';
import {computeAccess} from './access';
import {accountTypeOf} from './accountType';
import {useWorkspaceStore} from './store/workspaceStore';

function sync(): void {
  const type = accountTypeOf(useAuthStore.getState().member);
  const role = useWorkspaceStore.getState().workspaces[0]?.role ?? null;
  const a = computeAccess(type, role);
  setRights({canWrite: a.canWrite, canOwn: a.canOwn});
}

let started = false;

/** Idempotent : à appeler une fois au démarrage de l'application connectée. */
export function startRightsSync(): void {
  if (started) return;
  started = true;
  sync();
  useAuthStore.subscribe(sync);
  useWorkspaceStore.subscribe(sync);
}
