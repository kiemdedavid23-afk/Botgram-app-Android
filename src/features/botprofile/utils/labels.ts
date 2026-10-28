/**
 * Libellés profil bot — site utils/labels.ts
 */
import type {BotStatus} from '../../../core/api/endpoints/bots';
import {texts} from '../texts';
import type {
  AdminRightKey,
  CommandScope,
  TextField,
} from '../../../core/api/endpoints/botProfile.types';

export const TEXT_LABELS: Record<TextField, string> = {
  name: 'Nom',
  description: 'Description',
  short_description: 'Description courte',
};

export const FIELD_LIMITS: Record<TextField, number> = {
  name: 64,
  description: 512,
  short_description: 120,
};

export const SCOPE_LABELS: Record<CommandScope, string> = {
  default: 'Par défaut',
  all_private_chats: 'Chats privés',
  all_group_chats: 'Groupes',
  all_chat_administrators: 'Admins de groupes',
};

export const RIGHT_LABELS: Record<AdminRightKey, string> = {
  is_anonymous: 'Rester anonyme',
  can_manage_chat: 'Gérer le chat',
  can_delete_messages: 'Supprimer des messages',
  can_manage_video_chats: 'Gérer les appels vidéo',
  can_restrict_members: 'Restreindre des membres',
  can_promote_members: 'Ajouter des administrateurs',
  can_change_info: 'Modifier les infos',
  can_invite_users: 'Inviter des utilisateurs',
  can_post_stories: 'Publier des stories',
  can_edit_stories: 'Modifier les stories',
  can_delete_stories: 'Supprimer des stories',
  can_post_messages: 'Publier des messages',
  can_edit_messages: 'Modifier les messages',
  can_pin_messages: 'Épingler des messages',
  can_manage_topics: 'Gérer les sujets',
};

/** Site labels.ts RIGHT_SCOPE */
export const RIGHT_SCOPE: Record<
  AdminRightKey,
  'both' | 'groups' | 'channels'
> = {
  is_anonymous: 'both',
  can_manage_chat: 'both',
  can_delete_messages: 'both',
  can_manage_video_chats: 'both',
  can_restrict_members: 'both',
  can_promote_members: 'both',
  can_change_info: 'both',
  can_invite_users: 'both',
  can_post_stories: 'both',
  can_edit_stories: 'both',
  can_delete_stories: 'both',
  can_post_messages: 'channels',
  can_edit_messages: 'channels',
  can_pin_messages: 'groups',
  can_manage_topics: 'groups',
};

/** Libellé d'état de connexion du bot (héros + onglet Infos). */
export const STATUS_LABELS: Record<BotStatus, string> = {
  connected: texts.statusConnected,
  pending: texts.statusPending,
  webhook_error: texts.statusWebhookError,
  token_invalid: texts.statusTokenInvalid,
  disconnected: texts.statusDisconnected,
};
