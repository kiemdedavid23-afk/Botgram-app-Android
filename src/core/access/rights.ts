/**
 * Droits de la personne connectée, lisibles par les couches basses (stores, actions).
 * Alimenté par `features/accounts/rightsSync` ; permissif par défaut (rien n'est bloqué
 * avant que le rôle soit connu : le Worker reste l'arbitre final).
 * Sert à ne pas envoyer de requêtes que le Worker refuserait (403 FORBIDDEN).
 */
import type {WorkspaceRole} from '../api/endpoints/workspaces';
import type {Message} from '../realtime/messageTypes';

export type Rights = {
  /** Envoyer, répondre, marquer lu, épingler. */
  canWrite: boolean;
  /** Actions réservées au propriétaire : suppression de conversation, profil du bot. */
  canOwn: boolean;
  role: WorkspaceRole;
  /** Identifiant de la personne connectée (pour reconnaître ses propres messages). */
  memberId: string | null;
};

const DEFAULT: Rights = {
  canWrite: true,
  canOwn: true,
  role: 'owner',
  memberId: null,
};

let current: Rights = DEFAULT;

export function getRights(): Rights {
  return current;
}

export function setRights(next: Partial<Rights>): void {
  const merged: Rights = {...DEFAULT, ...next};
  if (
    merged.canWrite === current.canWrite &&
    merged.canOwn === current.canOwn &&
    merged.role === current.role &&
    merged.memberId === current.memberId
  ) {
    return;
  }
  current = merged;
}

/**
 * Supprimer un message sortant : le propriétaire supprime tout ; un agent seulement
 * les siens (un message sans auteur connu n'est pas « le sien ») ; un lecteur rien.
 * Un message local non encore envoyé (« local: ») est toujours le sien.
 */
export function canDeleteMessage(
  message: Pick<Message, 'id' | 'direction' | 'sent_by'>,
  rights: Rights = current,
): boolean {
  if (message.direction !== 'out') return false;
  if (rights.role === 'viewer') return false;
  if (message.id.startsWith('local:')) return true;
  if (rights.role === 'owner') return true;
  return !!rights.memberId && message.sent_by?.id === rights.memberId;
}

export const READ_ONLY_MESSAGE = 'Votre rôle ne permet pas cette action.';
export const OWNER_ONLY_MESSAGE =
  'Cette action est réservée au propriétaire de l’entreprise.';
export const OWN_MESSAGES_ONLY_MESSAGE =
  'Vous ne pouvez supprimer que vos propres messages.';
