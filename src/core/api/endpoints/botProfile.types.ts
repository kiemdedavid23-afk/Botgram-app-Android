/**
 * Types profil Telegram d'un bot — site botProfile.types.ts
 * Commandes / menu / droits inclus pour L4c (pas d'UI L4b).
 */
export const DEFAULT_LANG = 'default';

export type TextField = 'name' | 'description' | 'short_description';

export type LocalizedTexts = {
  name: string;
  description: string;
  short_description: string;
};

export type CommandScope =
  | 'default'
  | 'all_private_chats'
  | 'all_group_chats'
  | 'all_chat_administrators';

export const COMMAND_SCOPES: CommandScope[] = [
  'default',
  'all_private_chats',
  'all_group_chats',
  'all_chat_administrators',
];

export type BotCommandItem = {
  command: string;
  description: string;
};

export type MenuButton =
  | {type: 'default'}
  | {type: 'commands'}
  | {type: 'web_app'; text: string; url: string};

export const ADMIN_RIGHT_KEYS = [
  'is_anonymous',
  'can_manage_chat',
  'can_delete_messages',
  'can_manage_video_chats',
  'can_restrict_members',
  'can_promote_members',
  'can_change_info',
  'can_invite_users',
  'can_post_stories',
  'can_edit_stories',
  'can_delete_stories',
  'can_post_messages',
  'can_edit_messages',
  'can_pin_messages',
  'can_manage_topics',
] as const;

export type AdminRightKey = (typeof ADMIN_RIGHT_KEYS)[number];
export type AdminRights = Record<AdminRightKey, boolean>;

export type BotInfo = {
  id: string;
  username: string;
};

export type BotProfile = {
  bot_id: string;
  /** Présence photo (true si GET photo OK). Jamais d'URL Worker ici. */
  hasPhoto: boolean;
  texts: Record<string, LocalizedTexts>;
  commands: Record<string, BotCommandItem[]>;
  menu_button: MenuButton;
  admin_rights: {groups: AdminRights; channels: AdminRights};
  info: BotInfo;
  synced_at: number;
};

export type ProfileSeed = {
  name: string;
  username?: string;
  telegram_id?: string;
};

export function emptyRights(): AdminRights {
  const r = {} as AdminRights;
  for (const k of ADMIN_RIGHT_KEYS) r[k] = false;
  return r;
}

export function emptyTexts(): LocalizedTexts {
  return {name: '', description: '', short_description: ''};
}
