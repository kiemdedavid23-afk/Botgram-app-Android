export const texts = {
  offline: 'Hors ligne',
  sectionBots: 'Mes bots',
  sectionQuota: 'Quota quotidien',
  sectionAccount: 'Mon compte',
  addBot: 'Ajouter un bot',
  associateTitle: 'Associer un bot existant',
  associateDesc:
    'Vous avez déjà créé un bot avec BotFather et disposez de son jeton.',
  associateHelp:
    'Besoin d’aide pour récupérer un jeton ? Consultez le guide dans le parcours d’association.',
  addBotIntro:
    'Choisissez la méthode qui vous convient pour ajouter un bot à votre compte.',
  botActive: 'Actif',
  botInactive: 'Inactif',
  accountType: 'Type de compte',
  accountStandard: 'Standard',
  accountActive: 'Actif',
  memberSince: 'Membre depuis',
  botsLinked: 'Bots associés',
  usedToday: 'utilisés aujourd’hui',
  messagesUnit: 'messages',
  quotaLoading: 'Chargement du quota…',
  logout: 'Se déconnecter',
  wave: '👋',
} as const;

export function greetLine(word: string, name: string): string {
  if (name) return `${word}, ${name}`;
  return word;
}

export function heroSubZero(): string {
  return 'Votre espace est prêt. Connectez votre premier bot Telegram pour commencer.';
}

export function heroSubOne(): string {
  return 'Vous avez 1 bot actif. Tout se passe bien par ici.';
}

export function heroSubMany(n: number): string {
  return `Vos ${n} bots sont en place. Gérez-les depuis votre espace membre.`;
}

export function chipBots(n: number): string {
  return `${n} bots`;
}

export function chipRemaining(remaining: number | null): string {
  if (remaining === null) return '… messages restants';
  return `${remaining} messages restants`;
}

export function quotaHint(
  tone: 'loading' | 'green' | 'orange' | 'red',
  remaining: number | null,
): string {
  if (tone === 'loading') return texts.quotaLoading;
  if (tone === 'green') {
    return `Il vous reste ${remaining ?? '–'} messages pour aujourd’hui.`;
  }
  if (tone === 'orange') {
    return 'Vous approchez de votre limite quotidienne.';
  }
  return `Quota presque épuisé. Il vous reste ${remaining ?? '–'} messages.`;
}
