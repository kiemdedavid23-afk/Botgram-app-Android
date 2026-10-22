/**
 * Store profil bot - draft / saved (site botProfileStore).
 * load : vide draft/saved/report quand botId change AVANT le fetch.
 * save : ne met a jour que saved (commit) ; draft conserve les echecs.
 */
import {create} from 'zustand';
import {getBotProfile} from '../../../core/api/endpoints/botProfile';
import type {
  BotProfile,
  ProfileSeed,
} from '../../../core/api/endpoints/botProfile.types';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {buildChanges} from '../utils/diff';
import {mapProfileError} from '../utils/errors';
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
  load: (
    botId: string,
    seed: ProfileSeed,
    force?: boolean,
  ) => Promise<'ok' | 'error'>;
  edit: (recipe: (draft: BotProfile) => BotProfile) => void;
  setPhotoPresent: (present: boolean) => void;
  discard: () => void;
  save: () => Promise<void>;
  dismissReport: () => void;
  clear: () => void;
};

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

    const botChanged = state.botId !== botId;
    const gen = state.generation;

    // Vider AVANT le chargement si changement de bot (anti-fuite)
    if (botChanged) {
      set({
        botId,
        saved: null,
        draft: null,
        report: null,
        loadError: null,
        loading: true,
      });
    } else {
      set({botId, loading: true, loadError: null, report: null});
    }

    const res = await getBotProfile(botId, seed);
    if (get().generation !== gen || get().botId !== botId) return 'error';

    if (!res.ok) {
      set({
        loading: false,
        loadError: mapProfileError(res.error.code),
        saved: null,
        draft: null,
      });
      return 'error';
    }

    set({saved: res.data, draft: res.data, loading: false, loadError: null});
    return 'ok';
  },

  edit: recipe => {
    if (get().saving) return;
    const draft = get().draft;
    if (draft) set({draft: recipe(draft)});
  },

  setPhotoPresent: present => {
    const {draft, saved} = get();
    set({
      draft: draft ? {...draft, hasPhoto: present} : draft,
      saved: saved ? {...saved, hasPhoto: present} : saved,
    });
  },

  discard: () => {
    const saved = get().saved;
    if (saved) {
      set({
        draft: JSON.parse(JSON.stringify(saved)) as BotProfile,
        report: null,
      });
    }
  },

  save: async () => {
    const {botId, saved, draft} = get();
    if (!botId || !saved || !draft || get().saving) return;
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
          message: mapProfileError(res.error.code),
        });
      }
    }

    // Site : uniquement saved = current ; le draft garde les echecs
    set({saved: current, saving: false, report});
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
