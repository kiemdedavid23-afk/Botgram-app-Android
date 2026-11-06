/**
 * Endpoints espaces (docs/API.md § Espaces). Un compte n'a qu'un seul espace :
 * son espace personnel, son entreprise, ou l'entreprise qui l'a invité.
 * Les routes d'équipe (membres, invitations, transfert) viennent au lot Équipe.
 */
import {authedHttp, type HttpResult} from '../session';

export type WorkspaceRole = 'owner' | 'agent' | 'viewer';
export type WorkspaceKind = 'personal' | 'company';

export type Workspace = {
  id: string;
  kind: WorkspaceKind;
  name: string;
  /** Rôle de la personne DANS l'espace (≠ member.role, rôle d'administration du service). */
  role: WorkspaceRole;
  owner: {id: string; display_name: string};
  members_count: number;
  country: string | null;
  sector: string | null;
  phone: string | null;
  created_at: number;
};

/** Référence portée par chaque bot de GET /bots. */
export type WorkspaceRef = {
  id: string;
  name: string;
  kind: WorkspaceKind;
};

export async function listWorkspaces(): Promise<
  HttpResult<{workspaces: Workspace[]}>
> {
  return authedHttp<{workspaces: Workspace[]}>({
    method: 'GET',
    path: '/workspaces',
  });
}
