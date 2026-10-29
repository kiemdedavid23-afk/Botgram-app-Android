/**
 * Textes français — profil contact (conversation / interlocuteur bot).
 */
export const contactsTexts = {
  title: 'Profil',
  sectionInfo: 'Informations',
  labelUsername: 'Identifiant Telegram',
  labelFirstName: 'Prénom',
  labelLastName: 'Nom',
  labelChatType: 'Type de discussion',
  labelContactId: 'ID contact',
  labelConversationId: 'ID conversation',
  emptyValue: '—',
  chatTypePrivate: 'Privé',
  chatTypeGroup: 'Groupe',
  chatTypeSupergroup: 'Super-groupe',
  chatTypeChannel: 'Canal',
  chatTypeUnknown: 'Inconnu',
  back: 'Retour',
  // Boutons d'action
  actionMessage: 'Message',
  actionPin: 'Épingler',
  actionUnpin: 'Désépingler',
  // Partagés
  tabMedia: 'Médias',
  tabDocs: 'Documents',
  tabLinks: 'Liens',
  emptyMedia: 'Aucune photo ni vidéo échangée.',
  emptyDocs: 'Aucun document échangé.',
  emptyLinks: 'Aucun lien partagé.',
  sharedNote: 'Seuls les derniers messages enregistrés sur ce téléphone sont pris en compte.',
  docFallbackName: 'Document',
  offline: 'Indisponible hors ligne',
  tooLarge: 'Fichier trop volumineux (max. 20 Mo)',
  loadError: 'Chargement impossible',
  noHandler: 'Aucune application pour ouvrir ce fichier',
  // Informations
  labelFullName: 'Nom',
} as const;

export type ContactsTextKey = keyof typeof contactsTexts;
