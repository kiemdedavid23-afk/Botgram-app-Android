import {useAuthStore} from '../auth';
import {accountTypeOf} from './accountType';
import {computeAccess, type Access} from './access';
import {useWorkspaceStore} from './store/workspaceStore';

/** Droits de la personne connectée, à jour dès que ses espaces changent. */
export function useAccess(): Access {
  const member = useAuthStore(s => s.member);
  const role = useWorkspaceStore(s => s.workspaces[0]?.role ?? null);
  return computeAccess(accountTypeOf(member), role);
}
