/**
 * Store profil bot - draft / saved (site botProfileStore).
 * load : vide draft/saved/report quand botId change AVANT le fetch.
 * save : ne met a jour que saved (commit) ; draft conserve les echecs.
 * Cache 2 jours (profileCache) : affichage immédiat, rafraîchissement en arrière-plan
 * si périmé. Les autres langues sont chargées à la demande (loadLanguages).
 */
import {create} from 'zustand';
import {
  getBotProfileCore,
  getBotLanguages,
} from '../../../core/api/endpoints/botProfile';
import type {
  BotProfile,
  ProfileSeed,
} from '../../../core/api/endpoints/botProfile.types';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {
  readProfileCache,
  writeProfileCache,
  clearProfileCache,
} from './profileCache';
import {buildChanges} from '../utils/diff';
import {mapProfileError} from '../utils/errors';
import {texts as T} from '../texts';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';

const DEFAULT_CMD_KEY = `default|${DEFAULT_LANG}`;

function clone(p: BotProfile): BotProfile {
  return JSON.parse(JSON.stringify(p)) as BotProfile;
}

/** Profil frais (socle) + langues supplémentaires déjà connues de l'ancien. */
function mergeCore(old: BotProfile, fresh: BotProfile): BotProfile {
  const texts = {...fresh.texts};
  for (const [k, v] of Object.entries(old.texts)) {
    if (k !== DEFAULT_LANG) texts[k] = v;
  }
  const commands = {...fresh.commands};
  for (const [k, v] of Object.entries(old.commands)) {
    if (k !== DEFAULT_CMD_KEY) commands[k] = v;
  }
  return {...fresh, hasPhoto: old.hasPhoto, texts, commands};
}

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
  /** true une fois les autres langues lues (sonde 7 langues). */
  languagesLoaded: boolean;
  langLoading: boolean;
  load: (
    botId: string,
    seed: ProfileSeed,
    force?: boolean,
  ) => Promise<'ok' | 'error'>;
  /** `refresh` : les valeurs relues remplacent celles déjà affichées (resync / mise à jour). */
  loadLanguages: (botId: string, refresh?: boolean) => Promise<void>;
  edit: (recipe: (draft: BotProfile) => BotProfile) => void;
  setPhotoPresent: (present: boolean) => void;
  discard: () => void;
  save: () => Promise<void>;
  dismissReport: () => void;
  clear: () => void;
};

/** Rafraîchit un profil périmé sans toucher à l'écran sauf si rien n'est en cours d'édition. */
async function refreshInBackground(
  botId: string,
  seed: ProfileSeed,
  languagesWereLoaded: boolean,
): Promise<void> {
  const gen = useBotProfileStore.getState().generation;
  const res = await getBotProfileCore(botId, seed);
  const st = useBotProfileStore.getState();
  if (!res.ok || st.generation !== gen || st.botId !== botId || !st.saved) {
    return; // échec silencieux : l'ancien profil reste affiché
  }
  const untouched =
    !st.draft || JSON.stringify(st.draft) === JSON.stringify(st.saved);
  if (!untouched || st.saving) return;
  const merged = mergeCore(st.saved, res.data);
  useBotProfileStore.setState({saved: merged, draft: clone(merged)});
  await writeProfileCache(botId, merged, st.languagesLoaded);
  if (languagesWereLoaded) {
    // On relit aussi les langues : on repart d'une liste à recharger.
    useBotProfileStore.setState({languagesLoaded: false});
    await useBotProfileStore.getState().loadLanguages(botId, true);
  }
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
  languagesLoaded: false,
  langLoading: false,

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
        languagesLoaded: false,
        langLoading: false,
      });
    } else {
      set({botId, loading: true, loadError: null, report: null});
    }
    const wasLanguagesLoaded = !botChanged && get().languagesLoaded;
    const stillCurrent = () =>
      get().generation === gen && get().botId === botId;

    // 1) Cache (2 jours) : affichage immédiat, sans attendre le réseau.
    if (!force) {
      const cached = await readProfileCache(botId);
      if (!stillCurrent()) return 'error';
      if (cached) {
        set({
          saved: cached.profile,
          draft: clone(cached.profile),
          loading: false,
          loadError: null,
          languagesLoaded: cached.languagesLoaded,
        });
        if (!cached.fresh) {
          // Périmé : on garde l'ancien à l'écran, mise à jour en arrière-plan.
          refreshInBackground(botId, seed, cached.languagesLoaded).catch(
            () => undefined,
          );
        }
        return 'ok';
      }
    }

    // 2) Pas de cache (ou resynchronisation demandée) : 2 requêtes seulement.
    const res = await getBotProfileCore(botId, seed);
    if (!stillCurrent()) return 'error';

    if (!res.ok) {
      set({
        loading: false,
        loadError: mapProfileError(res.error.code),
        saved: null,
        draft: null,
      });
      return 'error';
    }

    const current = get().saved;
    const profile = force && current ? mergeCore(current, res.data) : res.data;
    set({
      saved: profile,
      draft: clone(profile),
      loading: false,
      loadError: null,
      languagesLoaded: false,
    });
    await writeProfileCache(botId, profile, false);
    // Resynchronisation : les langues déjà chargées sont relues dans la foulée.
    if (force && wasLanguagesLoaded) {
      get().loadLanguages(botId, true).catch(() => undefined);
    }
    return 'ok';
  },

  loadLanguages: async (botId, refresh = false) => {
    const st = get();
    if (st.botId !== botId || !st.saved || st.languagesLoaded || st.langLoading) {
      return;
    }
    const gen = st.generation;
    set({langLoading: true});
    const defaults = st.saved.texts[DEFAULT_LANG];
    const found = await getBotLanguages(
      botId,
      defaults ?? {name: '', description: '', short_description: ''},
      st.saved.commands[DEFAULT_CMD_KEY] ?? [],
    );
    if (get().generation !== gen || get().botId !== botId) return;

    const now = get();
    if (!now.saved) {
      set({langLoading: false});
      return;
    }
    // Ce qui existe déjà (y compris les modifications en cours) a priorité.
    const merge = (p: BotProfile): BotProfile => ({
      ...p,
      texts: refresh ? {...p.texts, ...found.texts} : {...found.texts, ...p.texts},
      commands: refresh
        ? {...p.commands, ...found.commands}
        : {...found.commands, ...p.commands},
    });
    const saved = merge(now.saved);
    set({
      saved,
      draft: now.draft ? merge(now.draft) : now.draft,
      langLoading: false,
      languagesLoaded: found.complete,
    });
    await writeProfileCache(botId, saved, found.complete);
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
    await writeProfileCache(botId, current, get().languagesLoaded);
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
      languagesLoaded: false,
      langLoading: false,
      generation: s.generation + 1,
    })),
}));

registerMemberDataCleaner(async () => {
  useBotProfileStore.getState().clear();
  await clearProfileCache();
});
