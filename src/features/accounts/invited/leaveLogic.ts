/** Départ de l'entreprise : textes et décision, sans React. */
export const LEAVE_TITLE = 'Quitter l’entreprise ?';

export function leaveWarning(companyName: string): string {
  return (
    `Vous quittez « ${companyName || 'l’entreprise'} ». ` +
    'Votre compte Botgram sera supprimé avec vos informations, vos appareils et vos sessions. ' +
    'Vos messages envoyés restent dans les conversations, sans votre nom. ' +
    'Cette action est définitive : pour revenir, il faudra une nouvelle invitation et une autre adresse e-mail.'
  );
}

export type LeaveFailure = 'forbidden' | 'network' | 'generic';

export function leaveFailureMessage(code: string | undefined, status: number): string {
  if (status === 0) return 'Pas de connexion : réessayez quand vous êtes en ligne.';
  if (code === 'WORKSPACE_HAS_MEMBERS' || code === 'FORBIDDEN') {
    return 'Vous ne pouvez pas quitter cette entreprise depuis ce compte.';
  }
  if (code === 'NOT_FOUND') return 'Vous ne faites déjà plus partie de cette entreprise.';
  return 'Une erreur est survenue. Réessayez dans un instant.';
}
