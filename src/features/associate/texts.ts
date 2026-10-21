/** Textes du parcours d'association. */
export const texts = {
  // Shell / navigation
  associate: 'Associer un bot existant',
  // Intro
  introTitle: 'Avant d’associer',
  introWelcome: 'Bienvenue',
  introCardTitle: 'À retenir',
  point1: 'BotFather sert à créer un bot Telegram et à obtenir son jeton.',
  point2:
    'Le jeton est nécessaire pour associer le bot à Botgram. Il doit rester secret.',
  point3: 'L’association relie le bot existant à votre compte Botgram.',
  point4:
    'Vérifiez le bot avant de confirmer, et ne partagez jamais le jeton.',
  guideLink: 'Consulter le guide complet →',
  acknowledge:
    'J’ai pris connaissance des consignes et je souhaite continuer.',
  acknowledgeOk:
    'Merci, vous pouvez poursuivre l’association de votre bot.',
  continue: 'Continuer',
  // Ready
  readyTitle: 'Êtes-vous prêt ?',
  readyCardTitle: 'Avant de coller le jeton',
  readyBody:
    'Ouvrez BotFather, récupérez le jeton de votre bot, puis revenez ici pour le coller. Le jeton ne quitte jamais cet appareil en clair hors de la session.',
  readyGuide: 'Où trouver le jeton ?',
  // Token
  tokenTitle: 'Saisir le jeton',
  tokenCardTitle: 'Jeton du bot',
  tokenHelp:
    'Collez ici le jeton reçu de BotFather. Il reste uniquement dans cette session.',
  tokenLabel: 'Jeton',
  tokenPlaceholder: '123456789:AA…',
  tokenPaste: 'Coller le jeton ici',
  showToken: 'Afficher',
  hideToken: 'Masquer',
  verify: 'Vérifier le jeton',
  verifying: 'Vérification…',
  // Verify
  verifyTitle: 'Résultat',
  verifyOk: 'Bot trouvé',
  verifyReplace:
    'Un webhook est déjà configuré sur ce bot. Vous devrez confirmer son remplacement.',
  verifyAlready: 'Ce bot est déjà associé à un compte Botgram.',
  verifyInvalid: 'Jeton invalide ou mal formé.',
  verifyLimit: 'Limite de bots atteinte pour votre compte.',
  verifyEmail: 'Vérifiez votre e-mail avant d’associer un bot.',
  verifyNetwork: 'Connexion impossible. Réessayez.',
  verifyRate: 'Trop de tentatives. Réessayez dans un instant.',
  verifyError: 'Impossible de vérifier ce jeton.',
  verifyValidation: 'Données invalides.',
  nextConfirm: 'Continuer vers la confirmation',
  backToken: 'Modifier le jeton',
  // Confirm
  confirmTitle: 'Confirmer',
  confirmBody:
    'Vous allez associer ce bot à votre compte Botgram. Botgram configurera son webhook pour recevoir ses messages.',
  confirmReplace:
    'Je confirme le remplacement du webhook actuel de ce bot.',
  confirmBtn: 'Confirmer l’association',
  confirming: 'Association…',
  // Done
  doneTitle: 'Bot associé',
  doneBody:
    'Votre bot est maintenant lié à Botgram. Vous pouvez le gérer depuis le tableau de bord.',
  doneHome: 'Retour au tableau de bord',
  // Errors (confirm)
  emailNotVerified: 'E-mail non vérifié.',
  tokenInvalid: 'Jeton invalide.',
  alreadyLinked: 'Ce bot est déjà associé.',
  limitReached: 'Limite de bots atteinte.',
  replaceRequired: 'Un webhook existant doit être remplacé.',
  networkError: 'Erreur réseau.',
  genericError: 'Une erreur est survenue.',
} as const;

export function stepLabel(step: number, total: number): string {
  return `Étape ${step}/${total}`;
}

export function verifyMessage(
  result:
    | 'ok'
    | 'replace_required'
    | 'already_linked'
    | 'invalid'
    | 'limit'
    | 'email_not_verified'
    | 'validation'
    | 'network'
    | 'rate_limited'
    | 'error'
    | 'duplicate',
): string {
  switch (result) {
    case 'ok':
      return texts.verifyOk;
    case 'replace_required':
      return texts.verifyReplace;
    case 'already_linked':
      return texts.verifyAlready;
    case 'invalid':
      return texts.verifyInvalid;
    case 'limit':
      return texts.verifyLimit;
    case 'email_not_verified':
      return texts.verifyEmail;
    case 'validation':
      return texts.verifyValidation;
    case 'network':
      return texts.verifyNetwork;
    case 'rate_limited':
      return texts.verifyRate;
    default:
      return texts.verifyError;
  }
}

export function confirmError(
  reason: string,
): string {
  switch (reason) {
    case 'email_not_verified':
      return texts.emailNotVerified;
    case 'invalid':
      return texts.tokenInvalid;
    case 'already_linked':
      return texts.alreadyLinked;
    case 'limit':
      return texts.limitReached;
    case 'replace_required':
      return texts.replaceRequired;
    case 'network':
      return texts.networkError;
    default:
      return texts.genericError;
  }
}
