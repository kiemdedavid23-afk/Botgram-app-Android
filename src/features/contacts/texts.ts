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
} as const;

export type ContactsTextKey = keyof typeof contactsTexts;
