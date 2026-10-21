/**
 * Store quota : lecture, cache MMKV validé, TTL 3 min, génération anti-fuite.
 * Pas de division par zéro si limit = 0.
 */
import {create} from 'zustand';
import {getQuota, type Quota} from '../../../core/api/endpoints/quota';
import {
  cacheGetString,
  cacheSetString,
  cacheDelete,
} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {fireAndForget} from '../../../core/utils/fireAndForget';

const CACHE_KEY = 'quota';
const TTL_MS = 3 * 60 * 1000;

type QuotaStore = {
  quota: Quota | null;
  lastFetch: number;
  loading: boolean;
  offline: boolean;
  generation: number;
  load: (force?: boolean) => Promise<void>;
  usageRatio: () => number;
  clear: () => void;
};

let loadInflight: Promise<void> | null = null;

function parseQuota(raw: string | undefined): Quota | null {
  if (!raw) return null;
  try {
    const p: unknown = JSON.parse(raw);
    if (
      typeof p === 'object' &&
      p !== null &&
      'limit' in p &&
      'used' in p &&
      'remaining' in p
    ) {
      return p as Quota;
    }
    return null;
  } catch {
    return null;
  }
}

export const useQuotaStore = create<QuotaStore>((set, get) => ({
  quota: null,
  lastFetch: 0,
  loading: false,
  offline: false,
  generation: 0,

  load: async (force = false) => {
    if (loadInflight) return loadInflight;
    loadInflight = (async () => {
      const gen = get().generation;
      const now = Date.now();
      const {lastFetch, quota} = get();
      if (!force && quota && now - lastFetch < TTL_MS) return;
      set({loading: true});
      if (!quota) {
        const cached = await cacheGetString(CACHE_KEY);
        if (get().generation !== gen) return;
        const parsed = parseQuota(cached);
        if (parsed) set({quota: parsed});
      }
      const res = await getQuota();
      if (get().generation !== gen) return;
      if (res.ok) {
        set({
          quota: res.data,
          lastFetch: Date.now(),
          offline: false,
          loading: false,
        });
        await cacheSetString(CACHE_KEY, JSON.stringify(res.data));
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

  usageRatio: () => {
    const q = get().quota;
    if (!q || q.limit === 0) return 0;
    return q.used / q.limit;
  },

  clear: () => {
    set(s => ({
      quota: null,
      lastFetch: 0,
      offline: false,
      loading: false,
      generation: s.generation + 1,
    }));
    loadInflight = null;
    fireAndForget(cacheDelete(CACHE_KEY));
  },
}));

registerMemberDataCleaner(() => {
  useQuotaStore.getState().clear();
});
