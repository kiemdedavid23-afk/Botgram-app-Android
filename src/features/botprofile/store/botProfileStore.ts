/**
 * Store profil bot — draft / saved (site botProfileStore).
 */
import {create} from 'zustand';
import {
  getBotProfile,
} from '../../../core/api/endpoints/botProfile';
import type {
  BotProfile,
  ProfileSeed,
} from '../../../core/api/endpoints/botProfile.types';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {buildChanges} from '../utils/diff';
import {texts as T} from '../texts';

export type ReportItem = {
  id: string;
  label: string;
  ok: boolean;
  message: string;
};

type BotProfileStore = {
  botId: string | null;
  saved: BotProfile | null;
  draft: BotProfile | null;
  loading: boolean;
  saving: boolean;
  loadError: string | null;
  report: ReportItem[] | null;
  generation: number;
  load: (botId: string, seed: ProfileSeed, force?: boolean) => Promise<'ok' | 'error'>;
  edit: (recipe: (draft: BotProfile) => BotProfile) => void;
  discard: () => void;
  save: () => Promise<void>;
  dismissReport: () => void;
  clear: () => void;
};

function mapErr(code: string | undefined): string {
  if (code === 'RATE_LIMITED' || code === 'TOO_MANY_REQUESTS') {
    return T.error429;
  }
  return T.errorGeneric;
}

export const useBotProfileStore = create<BotProfileStore>((set, get) => ({
  botId: null,
  saved: null,
  draft: null,
  loading: false,
  saving: false,
  loadError: null,
  report: null,
  generation: 0,

  load: async (botId, seed, force = false) => {
    const state = get();
    if (!force && state.botId === botId && state.saved) return 'ok';
    const gen = state.generation;
    set({botId, loading: true, loadError: null, report: null});
    const res = await getBotProfile(botId, seed);
    if (get().generation !== gen || get().botId !== botId) return 'error';
    if (!res.ok) {
      set({loading: false, loadError: mapErr(res.error.code)});
      return 'error';
    }
    set({saved: res.data, draft: res.data, loading: false});
    return 'ok';
  },

  edit: recipe => {
    const draft = get().draft;
    if (draft) set({draft: recipe(draft)});
  },

  discard: () => {
    const saved = get().saved;
    if (saved) set({draft: JSON.parse(JSON.stringify(saved)), report: null});
  },

  save: async () => {
    const {botId, saved, draft} = get();
    if (!botId || !saved || !draft) return;
    const changes = buildChanges(saved, draft);
    if (changes.length === 0) return;

    set({saving: true, report: null});
    let current = saved;
    const report: ReportItem[] = [];

    for (const change of changes) {
      const res = await change.run(botId);
      if (res.ok) {
        current = change.commit(current, draft);
        report.push({
          id: change.id,
          label: change.label,
          ok: true,
          message: T.reportOk,
        });
      } else {
        report.push({
          id: change.id,
          label: change.label,
          ok: false,
          message: mapErr(res.error.code),
        });
      }
    }

    set({
      saved: current,
      draft: {...current, texts: {...current.texts, ...draft.texts}},
      saving: false,
      report,
    });
    // Align draft fields that succeeded with saved
    set({draft: current, saved: current});
  },

  dismissReport: () => set({report: null}),

  clear: () =>
    set(s => ({
      botId: null,
      saved: null,
      draft: null,
      loading: false,
      saving: false,
      loadError: null,
      report: null,
      generation: s.generation + 1,
    })),
}));

registerMemberDataCleaner(() => {
  useBotProfileStore.getState().clear();
});
