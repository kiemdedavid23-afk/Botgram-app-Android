/** Botfactor vu comme une conversation dans la liste Échanges. */
import type {ConversationSummary} from '../../core/api/endpoints/conversations';
import {texts as T} from './texts';

export const BOTFACTOR_LIST_ID = 'botfactor:assistant';

export const isBotfactorListItem = (id: string): boolean =>
  id === BOTFACTOR_LIST_ID;

export function buildBotfactorListItem(o: {
  pinned: boolean;
  lastAt: number;
  lastText: string | null;
}): ConversationSummary {
  return {
    id: BOTFACTOR_LIST_ID,
    bot_id: '',
    chat_type: 'private',
    title: T.title,
    initials: 'BF',
    pinned: o.pinned,
    pinned_at: null,
    last_message_at: o.lastAt,
    last_message_text: o.lastText ?? T.rowPreview,
    unread_count: 0,
  };
}
