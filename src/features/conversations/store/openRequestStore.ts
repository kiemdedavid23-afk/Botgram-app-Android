/**
 * Demande d'ouverture de la fiche d'un contact depuis un autre onglet
 * (Contacts). Consommée par BotChatsStack dès qu'il est affiché ; le bouton
 * « Message » de la fiche ouvre ensuite le fil.
 */
import {create} from 'zustand';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';

export type OpenThreadRequest = {
  conversation: ConversationSummary;
};

type OpenRequestStore = {
  pending: OpenThreadRequest | null;
  request: (r: OpenThreadRequest) => void;
  consume: () => OpenThreadRequest | null;
};

export const useOpenRequestStore = create<OpenRequestStore>((set, get) => ({
  pending: null,
  request(r) {
    set({pending: r});
  },
  consume() {
    const r = get().pending;
    if (r) set({pending: null});
    return r;
  },
}));
