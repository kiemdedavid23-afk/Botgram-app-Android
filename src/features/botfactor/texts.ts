/** Textes FR — Botfactor (R8). */
export const botfactorTexts = {
  title: 'Botfactor',
  subtitle: 'Assistant de gestion du bot',
  rowPreview: 'Modifiez le nom, la description et les commandes de votre bot',
  placeholder: 'Écrire à Botfactor…',
  back: 'Retour',
  send: 'Envoyer',
  profileCta: 'Modifier avec Botfactor',
  empty: 'Laisser vide',
  welcome:
    'Bonjour ! Je suis Botfactor.\n\nJe vous aide à gérer le profil Telegram de votre bot, pas à pas.\n\nCe que je peux faire :\n• Nom, description et texte « À propos »\n• Commandes proposées avec « / »\n• Bouton de menu\n• Droits d’administrateur proposés\n\nCe qui reste dans @BotFather : pseudo, jeton, mode inline.\n\nChoisissez une action ci-dessous.',
  menu: 'Que souhaitez-vous faire ?',
  targetPrefix: 'Bot ciblé : ',
  noTarget: 'Aucun bot sélectionné.',
  noBots:
    'Aucun bot n’est connecté.\n\nAjoutez un bot depuis l’espace membre, puis revenez ici.',
  myBots: 'Vos bots :',
  pickBot: 'Choisissez celui que vous voulez gérer.',
  unknown:
    'Je n’ai pas compris.\n\nTouchez une action ci-dessous ou écrivez « menu ».',
  cancelled: 'Opération annulée.\n\nVous pouvez choisir une autre action.',
  unknownCommand: 'Commande inconnue.',
  needBot:
    'Aucun bot ciblé.\n\nChoisissez d’abord « Changer de bot » dans le menu.',
  success:
    '✅ Modification envoyée à Telegram.\n\nLe profil du bot a été actualisé dans Botgram.',
  failure: 'Telegram n’a pas pu appliquer cette modification.',
  failureNote: 'Rien n’a été changé. Vous pouvez réessayer.',
  offline: 'Vous êtes hors ligne. Réessayez dès que le réseau revient.',
  busy: 'Envoi en cours…',
  helpTitle: 'Aide Botfactor',
  help:
    '• Menu — revenir aux actions\n• Changer de bot — choisir le bot à gérer\n• Nom du bot — titre affiché\n• Description — texte du chat vide\n• Texte « À propos » — phrase de la fiche\n• Menu des commandes — la liste « / »\n• Bouton du menu — bouton à côté du champ de saisie\n• Droits d’administrateur — droits proposés aux groupes et canaux\n\nDescription = texte du chat vide (« Que peut faire ce bot ? »).\nÀ propos = phrase courte sur la fiche du bot.\n\nPhoto, pseudo et jeton restent dans @BotFather.',
  explain: 'Expliquer',
  start: 'Commencer',
  next: 'Continuer',
  confirm: 'Confirmer',
  cancel: 'Annuler',
  backToMenu: 'Retour au menu',
  menuHelp: 'Aide',
  menuMyBots: 'Mes bots',
} as const;
export const texts = botfactorTexts;
