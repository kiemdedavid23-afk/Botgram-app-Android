/**
 * Équipe d'une entreprise (rapport « compte entreprise », §3.5).
 * Toutes ces routes demandent la session ; le rôle requis est « owner »
 * sauf lecture des personnes et de l'entreprise (tout membre).
 */
import {authedHttp, type HttpResult} from '../session';
import type {Workspace} from './workspaces';

export type TeamRole = 'owner' | 'agent' | 'viewer';
export type InviteRole = 'agent' | 'viewer';

export type TeamMember = {
  member_id: string;
  display_name: string;
  role: TeamRole;
  joined_at: number;
};

export type Invite = {
  id: string;
  email: string;
  role: InviteRole;
  status: string;
  expires_at: number;
  created_at: number;
};

export type InviteMailResult = {sent: boolean; reason?: string};

export type CreatedInvite = {
  invite: Invite;
  /** Visible une seule fois, dans cette réponse. */
  code: string;
  email?: InviteMailResult;
};

export type WorkspacePatch = {
  name?: string;
  country?: string;
  sector?: string;
  phone?: string;
};

const base = (id: string): string => `/workspaces/${encodeURIComponent(id)}`;

export function listMembers(
  workspaceId: string,
): Promise<HttpResult<{members: TeamMember[]}>> {
  return authedHttp({method: 'GET', path: `${base(workspaceId)}/members`});
}

export function setMemberRole(
  workspaceId: string,
  memberId: string,
  role: InviteRole,
): Promise<HttpResult<{member_id: string; role: TeamRole}>> {
  return authedHttp({
    method: 'PATCH',
    path: `${base(workspaceId)}/members/${encodeURIComponent(memberId)}`,
    body: {role},
  });
}

export function removeMember(
  workspaceId: string,
  memberId: string,
): Promise<HttpResult<{removed: boolean; account_deleted: boolean}>> {
  return authedHttp({
    method: 'DELETE',
    path: `${base(workspaceId)}/members/${encodeURIComponent(memberId)}`,
  });
}

export function transferOwnership(
  workspaceId: string,
  memberId: string,
): Promise<HttpResult<{workspace: Workspace}>> {
  return authedHttp({
    method: 'POST',
    path: `${base(workspaceId)}/transfer`,
    body: {member_id: memberId},
  });
}

export function createInvite(
  workspaceId: string,
  params: {email: string; role: InviteRole; send_email: boolean},
): Promise<HttpResult<CreatedInvite>> {
  return authedHttp({
    method: 'POST',
    path: `${base(workspaceId)}/invites`,
    body: {
      email: params.email,
      role: params.role,
      send_email: params.send_email,
      ui_language: 'fr',
    },
  });
}

export function listInvites(
  workspaceId: string,
): Promise<HttpResult<{invites: Invite[]}>> {
  return authedHttp({method: 'GET', path: `${base(workspaceId)}/invites`});
}

export function revokeInvite(
  workspaceId: string,
  inviteId: string,
): Promise<HttpResult<{revoked: boolean}>> {
  return authedHttp({
    method: 'DELETE',
    path: `${base(workspaceId)}/invites/${encodeURIComponent(inviteId)}`,
  });
}

export function patchWorkspace(
  workspaceId: string,
  patch: WorkspacePatch,
): Promise<HttpResult<{workspace: Workspace}>> {
  const body: Record<string, string> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.country !== undefined) body.country = patch.country;
  if (patch.sector !== undefined) body.sector = patch.sector;
  if (patch.phone !== undefined) body.phone = patch.phone;
  return authedHttp({method: 'PATCH', path: base(workspaceId), body});
}
