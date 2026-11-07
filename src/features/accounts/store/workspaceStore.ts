/**
 * Store des espaces : un seul espace par compte. Cache MMKV, TTL 3 min,
 * single-flight, génération anti-fuite (comme botsStore et quotaStore).
 * `serverLoaded` ne passe à vrai qu'après une réponse du Worker (jamais depuis le cache).
 */
import {create} from 'zustand';
import {
  listWorkspaces,
  type Workspace,
} from '../../../core/api/endpoints/workspaces';
import {onSessionEvent} from '../../../core/api/session';
import {
  cacheGetString,
  cacheSetString,
  cacheDelete,
} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {fireAndForget} from '../../../core/utils/fireAndForget';

const CACHE_KEY = 'workspaces.list';
const TTL_MS = 3 * 60 * 1000;
/** Évite de relire en boucle quand plusieurs requêtes reçoivent 403 d'affilée. */
const MIN_FORCE_GAP_MS = 2000;

type WorkspaceStore = {
  workspaces: Workspace[];
  serverLoaded: boolean;
  loading: boolean;
  offline: boolean;
  lastFetch: number;
  generation: number;
  hydrate: () => Promise<void>;
  load: (force?: boolean) => Promise<void>;
  /** L'espace de la personne (le premier, il n'y en a qu'un). */
  current: () => Workspace | null;
  /** Remplace un espace par la version renvoyée par le Worker (modification, transfert). */
  upsert: (ws: Workspace) => void;
  clear: () => void;
};

let loadInflight: Promise<void> | null = null;

export function parseWorkspacesCache(
  raw: string | undefined,
): Workspace[] | null {
  if (!raw) return null;
  try {
    const p: unknown = JSON.parse(raw);
    if (!Array.isArray(p)) return null;
    const ok = p.every(
      w =>
        typeof w === 'object' &&
        w !== null &&
        typeof (w as {id?: unknown}).id === 'string' &&
        typeof (w as {role?: unknown}).role === 'string',
    );
    return ok ? (p as Workspace[]) : null;
  } catch {
    return null;
  }
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  serverLoaded: false,
  loading: false,
  offline: false,
  lastFetch: 0,
  generation: 0,

  hydrate: async () => {
    if (get().workspaces.length > 0) return;
    const gen = get().generation;
    const parsed = parseWorkspacesCache(await cacheGetString(CACHE_KEY));
    if (get().generation !== gen || get().workspaces.length > 0) return;
    if (parsed?.length) set({workspaces: parsed});
  },

  load: async (force = false) => {
    if (loadInflight) return loadInflight;
    const now = Date.now();
    const {lastFetch, serverLoaded} = get();
    if (!force && serverLoaded && now - lastFetch < TTL_MS) return;
    if (force && serverLoaded && now - lastFetch < MIN_FORCE_GAP_MS) return;
    const gen = get().generation;
    loadInflight = (async () => {
      set({loading: true});
      const res = await listWorkspaces();
      if (get().generation !== gen) return;
      if (res.ok) {
        const list = res.data.workspaces;
        set({
          workspaces: list,
          serverLoaded: true,
          lastFetch: Date.now(),
          offline: false,
          loading: false,
        });
        await cacheSetString(CACHE_KEY, JSON.stringify(list));
      } else if (res.status === 0 || res.status >= 500) {
        set({offline: true, loading: false});
      } else {
        set({loading: false});
      }
    })().finally(() => {
      loadInflight = null;
    });
    return loadInflight;
  },

  current: () => get().workspaces[0] ?? null,

  upsert: ws => {
    const list = get().workspaces.some(w => w.id === ws.id)
      ? get().workspaces.map(w => (w.id === ws.id ? ws : w))
      : [ws, ...get().workspaces];
    set({workspaces: list});
    fireAndForget(cacheSetString(CACHE_KEY, JSON.stringify(list)));
  },

  clear: () => {
    set(s => ({
      workspaces: [],
      serverLoaded: false,
      loading: false,
      offline: false,
      lastFetch: 0,
      generation: s.generation + 1,
    }));
    loadInflight = null;
    fireAndForget(cacheDelete(CACHE_KEY));
  },
}));

registerMemberDataCleaner(() => {
  useWorkspaceStore.getState().clear();
});

// Un 403 FORBIDDEN laisse penser que le rôle a changé : on relit les espaces.
onSessionEvent(event => {
  if (event.type === 'forbidden' && useWorkspaceStore.getState().serverLoaded) {
    fireAndForget(useWorkspaceStore.getState().load(true));
  }
});
