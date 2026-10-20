/**
 * Store quota : lecture, cache MMKV validé, TTL 3 min.
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

const CACHE_KEY = 'quota';
const TTL_MS = 3 * 60 * 1000;

type QuotaStore = {
  quota: Quota | null;
  lastFetch: number;
  loading: boolean;
  offline: boolean;
  load: (force?: boolean) => Promise<void>;
  /** ratio used/limit, 0 si limit = 0 */
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

  load: async (force = false) => {
    if (loadInflight) {
      return loadInflight;
    }
    loadInflight = (async () => {
      const now = Date.now();
      const {lastFetch, quota} = get();
      if (!force && quota && now - lastFetch < TTL_MS) {
        return;
      }
      set({loading: true});
      if (!quota) {
        const cached = await cacheGetString(CACHE_KEY);
        const parsed = parseQuota(cached);
        if (parsed) {
          set({quota: parsed});
        }
      }
      const res = await getQuota();
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
    if (!q || q.limit === 0) {
      return 0;
    }
    return q.used / q.limit;
  },

  clear: () => {
    set({quota: null, lastFetch: 0, offline: false, loading: false});
    loadInflight = null;
    void cacheDelete(CACHE_KEY);
  },
}));

registerMemberDataCleaner(() => {
  useQuotaStore.getState().clear();
});
