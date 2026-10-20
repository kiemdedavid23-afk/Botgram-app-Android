/**
 * Store bots : single-flight, cache < 3 min, remplacement de fiche.
 */
import {create} from 'zustand';
import {listBots, type Bot} from '../../../core/api/endpoints/bots';
import {cacheGetString, cacheSetString, cacheDelete} from '../../../core/storage';

const CACHE_KEY = 'bots.list';
const TTL = 3 * 60 * 1000;

type BotsStore = {
  bots: Bot[];
  loading: boolean;
  offline: boolean;
  lastFetch: number;
  load: (force?: boolean) => Promise<void>;
  replace: (bot: Bot) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useBotsStore = create<BotsStore>((set, get) => ({
  bots: [],
  loading: false,
  offline: false,
  lastFetch: 0,

  load: async (force = false) => {
    const now = Date.now();
    if (!force && now - get().lastFetch < TTL && get().bots.length > 0) return;
    if (get().loading) return;
    set({loading: true});
    const cached = await cacheGetString(CACHE_KEY);
    if (cached && get().bots.length === 0) {
      try {
        set({bots: JSON.parse(cached) as Bot[]});
      } catch {
        // ignore
      }
    }
    const res = await listBots();
    if (res.ok) {
      set({bots: res.data.bots, lastFetch: now, offline: false, loading: false});
      cacheSetString(CACHE_KEY, JSON.stringify(res.data.bots));
    } else if (res.status === 0 || res.status >= 500) {
      set({offline: true, loading: false});
    } else {
      set({loading: false});
    }
  },

  replace: bot => {
    set(s => ({bots: s.bots.map(b => (b.id === bot.id ? bot : b))}));
    cacheSetString(CACHE_KEY, JSON.stringify(get().bots));
  },

  remove: id => {
    set(s => ({bots: s.bots.filter(b => b.id !== id)}));
    cacheSetString(CACHE_KEY, JSON.stringify(get().bots));
  },

  clear: () => {
    set({bots: [], lastFetch: 0});
    cacheDelete(CACHE_KEY);
  },
}));
