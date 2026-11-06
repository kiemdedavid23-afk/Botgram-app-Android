/**
 * Droits de la personne, calculés à partir de son type de compte et de son rôle
 * dans l'espace (docs : carte d'accès, §1.7 du rapport). Fonction pure : l'app ne
 * lance que les requêtes que le Worker acceptera.
 */
import type {AccountType} from '../../core/api/endpoints/auth';
import type {
  Workspace,
  WorkspaceRole,
} from '../../core/api/endpoints/workspaces';

export type Access = {
  role: WorkspaceRole;
  /** Faux tant que les espaces ne sont pas connus : rôle déduit du type de compte. */
  roleKnown: boolean;
  /** Envoyer, répondre, marquer lu, épingler (agent et propriétaire). */
  canWrite: boolean;
  /** Réglages du bot, déconnexion, suppression de conversation (propriétaire). */
  canOwn: boolean;
  /** Lier ou demander un bot : propriétaire, jamais un invité. */
  canLinkBot: boolean;
  /** Inviter, rôles, retrait, entreprise, transfert. */
  canManageTeam: boolean;
  /** Voir la liste des personnes (entreprise et invité). */
  canSeeTeam: boolean;
  /** Quitter l'entreprise (invité) ; le propriétaire doit d'abord transférer. */
  canLeave: boolean;
};

/**
 * Sans espace connu : un particulier ou une entreprise sont propriétaires,
 * un invité est traité en lecture seule (prudence : on n'écrit pas dans le doute).
 */
function fallbackRole(type: AccountType): WorkspaceRole {
  return type === 'invited' ? 'viewer' : 'owner';
}

export function computeAccess(
  type: AccountType,
  role: WorkspaceRole | null,
): Access {
  const r = role ?? fallbackRole(type);
  return {
    role: r,
    roleKnown: role !== null,
    canWrite: r === 'owner' || r === 'agent',
    canOwn: r === 'owner',
    canLinkBot: r === 'owner' && type !== 'invited',
    canManageTeam: r === 'owner' && type === 'company',
    canSeeTeam: type !== 'personal',
    canLeave: type === 'invited' && r !== 'owner',
  };
}

/**
 * Accès perdu : le Worker a répondu (liste lue en ligne) et la personne n'a plus
 * d'espace — un invité retiré, dont le compte est supprimé.
 * Un particulier a toujours son espace personnel : on ne le déconnecte jamais ici.
 */
export function isAccessLost(
  type: AccountType,
  workspaces: readonly Workspace[],
  serverLoaded: boolean,
): boolean {
  return serverLoaded && type !== 'personal' && workspaces.length === 0;
}
