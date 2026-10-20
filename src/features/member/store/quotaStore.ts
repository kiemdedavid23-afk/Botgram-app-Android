/**
 * Store quota.
 */
import {create} from 'zustand';
import {getQuota, type Quota} from '../../../core/api/endpoints/quota';
import {cacheGetString, cacheSetString, cacheDelete} from '../../../core/storage';

const CACHE_KEY = 'quota';
const TTL = 3 * 60 * 1000;

type QuotaStore = {
  quota: Quota | null;
  lastFetch: number;
  load: (force?: boolean) => Promise<void>;
  clear: () => void;
};

export const useQuotaStore = create<QuotaStore>((set, get) => ({
  quota: null,
  lastFetch: 0,

  load: async (force = false) => {
    const now = Date.now();
    if (!force && now - get().lastFetch < TTL && get().quota) return;
    const cached = await cacheGetString(CACHE_KEY);
    if (cached && !get().quota) {
      try {
        set({quota: JSON.parse(cached) as Quota});
      } catch {
        // ignore
      }
    }
    const res = await getQuota();
    if (res.ok) {
      set({quota: res.data, lastFetch: now});
      cacheSetString(CACHE_KEY, JSON.stringify(res.data));
    }
  },

  clear: () => {
    set({quota: null, lastFetch: 0});
    cacheDelete(CACHE_KEY);
  },
}));
