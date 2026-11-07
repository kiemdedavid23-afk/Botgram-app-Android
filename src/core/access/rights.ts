/**
 * Droits de la personne connectée, lisibles par les couches basses (stores, actions).
 * Alimenté par `features/accounts/rightsSync` ; permissif par défaut (rien n'est bloqué
 * avant que le rôle soit connu : le Worker reste l'arbitre final).
 * Sert à ne pas envoyer de requêtes que le Worker refuserait (403 FORBIDDEN).
 */
export type Rights = {
  /** Envoyer, répondre, marquer lu, épingler, supprimer ses messages. */
  canWrite: boolean;
  /** Actions réservées au propriétaire : suppression de conversation, profil du bot. */
  canOwn: boolean;
};

let current: Rights = {canWrite: true, canOwn: true};

export function getRights(): Rights {
  return current;
}

export function setRights(next: Rights): void {
  if (next.canWrite === current.canWrite && next.canOwn === current.canOwn) {
    return;
  }
  current = {canWrite: next.canWrite, canOwn: next.canOwn};
}

export const READ_ONLY_MESSAGE = 'Votre rôle ne permet pas cette action.';
export const OWNER_ONLY_MESSAGE =
  'Cette action est réservée au propriétaire de l’entreprise.';
