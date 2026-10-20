/**
 * Store d'association. Jeton uniquement en mémoire.
 */
import {create} from 'zustand';
import {previewToken, createBot, type PreviewResponse, type Bot} from '../../../core/api/endpoints/bots';

type AssociateStore = {
  token: string | null;
  preview: PreviewResponse | null;
  step: 'intro' | 'ready' | 'token' | 'verify' | 'confirm' | 'done';
  setToken: (t: string) => void;
  verify: () => Promise<'ok' | 'replace' | 'already' | 'invalid' | 'limit' | 'error'>;
  confirm: (replace?: boolean) => Promise<Bot | null>;
  reset: () => void;
};

export const useAssociateStore = create<AssociateStore>((set, get) => ({
  token: null,
  preview: null,
  step: 'intro',

  setToken: t => set({token: t}),

  verify: async () => {
    const token = get().token;
    if (!token) return 'error';
    const res = await previewToken(token);
    if (!res.ok) {
      if (res.error.code === 'TOKEN_INVALID') return 'invalid';
      if (res.error.code === 'BOT_LIMIT_REACHED') return 'limit';
      return 'error';
    }
    set({preview: res.data});
    if (res.data.already_linked) return 'already';
    if (res.data.replace_required) return 'replace';
    return 'ok';
  },

  confirm: async (replace = false) => {
    const token = get().token;
    if (!token) return null;
    const res = await createBot({token, confirm_replace_webhook: replace || undefined});
    if (res.ok) {
      set({token: null, preview: null, step: 'done'});
      return res.data.bot;
    }
    return null;
  },

  reset: () => set({token: null, preview: null, step: 'intro'}),
}));
