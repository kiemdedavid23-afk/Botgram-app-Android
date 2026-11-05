/**
 * Demandes d'ouverture adressées à BotChatsStack depuis l'extérieur :
 * - fiche d'un contact (onglet Contacts) ; le bouton « Message » ouvre le fil ;
 * - fil d'une conversation par identifiant (toucher sur une notification push).
 * Consommées dès que BotChatsStack est affiché.
 */
import {create} from 'zustand';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';

export type OpenThreadRequest = {
  conversation: ConversationSummary;
};

type OpenRequestStore = {
  pending: OpenThreadRequest | null;
  pendingThreadId: string | null;
  request: (r: OpenThreadRequest) => void;
  consume: () => OpenThreadRequest | null;
  requestThread: (conversationId: string) => void;
  consumeThread: () => string | null;
};

export const useOpenRequestStore = create<OpenRequestStore>((set, get) => ({
  pending: null,
  pendingThreadId: null,
  request(r) {
    set({pending: r});
  },
  consume() {
    const r = get().pending;
    if (r) set({pending: null});
    return r;
  },
  requestThread(conversationId) {
    set({pendingThreadId: conversationId});
  },
  consumeThread() {
    const id = get().pendingThreadId;
    if (id) set({pendingThreadId: null});
    return id;
  },
}));
