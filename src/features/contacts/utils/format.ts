/**
 * Libellés profil contact à partir de ConversationSummary.
 */
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';
import {contactsTexts as t} from '../texts';

export function contactDisplayName(c: ConversationSummary): string {
  const full = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (c.title && c.title.trim()) return c.title.trim();
  if (c.username && c.username.trim()) return `@${c.username.replace(/^@/, '')}`;
  return t.emptyValue;
}

export function contactUsername(c: ConversationSummary): string | null {
  if (!c.username || !c.username.trim()) return null;
  const u = c.username.replace(/^@/, '').trim();
  return u ? `@${u}` : null;
}

export function chatTypeLabel(chatType: string | null | undefined): string {
  const key = (chatType ?? '').toLowerCase();
  if (key === 'private') return t.chatTypePrivate;
  if (key === 'group') return t.chatTypeGroup;
  if (key === 'supergroup') return t.chatTypeSupergroup;
  if (key === 'channel') return t.chatTypeChannel;
  if (key) return key;
  return t.chatTypeUnknown;
}
