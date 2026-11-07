/** Textes de rôle pour le compte invité (logique pure). */
import type {WorkspaceRole} from '../../../core/api/endpoints/workspaces';

export function inviteRoleLabel(role: WorkspaceRole | null): string {
  if (role === 'agent') return 'Agent';
  if (role === 'viewer') return 'Lecteur';
  if (role === 'owner') return 'Propriétaire';
  return '…';
}

export function inviteRoleHint(role: WorkspaceRole | null): string {
  if (role === 'viewer') {
    return 'Vous pouvez consulter les conversations de l’entreprise, sans écrire ni modifier.';
  }
  if (role === 'agent') {
    return 'Vous pouvez répondre aux clients avec les bots de l’entreprise. La gestion de l’équipe reste au responsable.';
  }
  return '';
}
