/**
 * Store bots : single-flight partagé, cache MMKV validé TTL 3 min,
 * actions qui remplacent la fiche par la réponse Worker.
 * Aucun plafond de bots codé en dur.
 */
import {create} from 'zustand';
import {
  listBots,
  setMuted as apiSetMuted,
  selectBot as apiSelectBot,
  retryWebhook as apiRetryWebhook,
  resyncWebhook as apiResyncWebhook,
  disconnectBot as apiDisconnectBot,
  deleteBot as apiDeleteBot,
  type Bot,
} from '../../../core/api/endpoints/bots';
import {
  cacheGetString,
  cacheSetString,
  cacheDelete,
} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {HttpResult} from '../../../core/api/session';

const CACHE_KEY = 'bots.list';
const TTL_MS = 3 * 60 * 1000;

type ActionKey =
  | 'load'
  | `muted:${string}`
  | `select:${string}`
  | `retry:${string}`
  | `resync:${string}`
  | `disconnect:${string}`
  | `delete:${string}`;

type BotsStore = {
  bots: Bot[];
  loading: boolean;
  offline: boolean;
  lastFetch: number;
  /** true tant qu'une action est en cours pour cette ressource */
  busy: Record<string, boolean>;
  load: (force?: boolean) => Promise<void>;
  setMuted: (id: string, muted: boolean) => Promise<HttpResult<{bot: Bot}>>;
  select: (id: string) => Promise<HttpResult<{bot: Bot}>>;
  retryWebhook: (id: string) => Promise<HttpResult<{bot: Bot}>>;
  resyncWebhook: (id: string) => Promise<HttpResult<{bot: Bot}>>;
  disconnect: (
    id: string,
    dropPending?: boolean,
  ) => Promise<HttpResult<{bot: Bot}>>;
  deleteBot: (id: string) => Promise<HttpResult<{deleted: boolean}>>;
  clear: () => void;
};

const inflight = new Map<ActionKey, Promise<unknown>>();

function parseBotsCache(raw: string | undefined): Bot[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Bot[];
  } catch {
    return null;
  }
}

async function withSingleFlight<T>(
  key: ActionKey,
  run: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const p = run().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}

export const useBotsStore = create<BotsStore>((set, get) => ({
  bots: [],
  loading: false,
  offline: false,
  lastFetch: 0,
  busy: {},

  load: async (force = false) => {
    await withSingleFlight('load', async () => {
      const now = Date.now();
      const {lastFetch, bots} = get();
      if (!force && bots.length > 0 && now - lastFetch < TTL_MS) {
        return;
      }
      set({loading: true});
      if (bots.length === 0) {
        const cached = await cacheGetString(CACHE_KEY);
        const parsed = parseBotsCache(cached);
        if (parsed && parsed.length > 0) {
          set({bots: parsed});
        }
      }
      const res = await listBots();
      if (res.ok) {
        set({
          bots: res.data.bots,
          lastFetch: Date.now(),
          offline: false,
          loading: false,
        });
        await cacheSetString(CACHE_KEY, JSON.stringify(res.data.bots));
      } else if (res.status === 0 || res.status >= 500) {
        set({offline: true, loading: false});
      } else {
        set({loading: false});
      }
    });
  },

  setMuted: async (id, muted) => {
    const key: ActionKey = `muted:${id}`;
    return withSingleFlight(key, async () => {
      set(s => ({busy: {...s.busy, [key]: true}}));
      try {
        const res = await apiSetMuted(id, muted);
        if (res.ok) {
          const bot = res.data.bot;
          set(s => ({
            bots: s.bots.map(b => (b.id === bot.id ? bot : b)),
          }));
          await cacheSetString(CACHE_KEY, JSON.stringify(get().bots));
        }
        return res;
      } finally {
        set(s => {
          const next = {...s.busy};
          delete next[key];
          return {busy: next};
        });
      }
    });
  },

  select: async id => {
    const key: ActionKey = `select:${id}`;
    return withSingleFlight(key, async () => {
      set(s => ({busy: {...s.busy, [key]: true}}));
      try {
        const res = await apiSelectBot(id);
        if (res.ok) {
          const bot = res.data.bot;
          set(s => ({
            bots: s.bots.map(b =>
              b.id === bot.id ? bot : {...b, selected: false},
            ),
          }));
          await cacheSetString(CACHE_KEY, JSON.stringify(get().bots));
        }
        return res;
      } finally {
        set(s => {
          const next = {...s.busy};
          delete next[key];
          return {busy: next};
        });
      }
    });
  },

  retryWebhook: async id => {
    const key: ActionKey = `retry:${id}`;
    return withSingleFlight(key, async () => {
      set(s => ({busy: {...s.busy, [key]: true}}));
      try {
        const res = await apiRetryWebhook(id);
        if (res.ok) {
          const bot = res.data.bot;
          set(s => ({
            bots: s.bots.map(b => (b.id === bot.id ? bot : b)),
          }));
          await cacheSetString(CACHE_KEY, JSON.stringify(get().bots));
        }
        return res;
      } finally {
        set(s => {
          const next = {...s.busy};
          delete next[key];
          return {busy: next};
        });
      }
    });
  },

  resyncWebhook: async id => {
    const key: ActionKey = `resync:${id}`;
    return withSingleFlight(key, async () => {
      set(s => ({busy: {...s.busy, [key]: true}}));
      try {
        const res = await apiResyncWebhook(id);
        if (res.ok) {
          const bot = res.data.bot;
          set(s => ({
            bots: s.bots.map(b => (b.id === bot.id ? bot : b)),
          }));
          await cacheSetString(CACHE_KEY, JSON.stringify(get().bots));
        }
        return res;
      } finally {
        set(s => {
          const next = {...s.busy};
          delete next[key];
          return {busy: next};
        });
      }
    });
  },

  disconnect: async (id, dropPending = false) => {
    const key: ActionKey = `disconnect:${id}`;
    return withSingleFlight(key, async () => {
      set(s => ({busy: {...s.busy, [key]: true}}));
      try {
        const res = await apiDisconnectBot(id, dropPending);
        if (res.ok) {
          const bot = res.data.bot;
          set(s => ({
            bots: s.bots.map(b => (b.id === bot.id ? bot : b)),
          }));
          await cacheSetString(CACHE_KEY, JSON.stringify(get().bots));
        }
        return res;
      } finally {
        set(s => {
          const next = {...s.busy};
          delete next[key];
          return {busy: next};
        });
      }
    });
  },

  deleteBot: async id => {
    const key: ActionKey = `delete:${id}`;
    return withSingleFlight(key, async () => {
      set(s => ({busy: {...s.busy, [key]: true}}));
      try {
        const res = await apiDeleteBot(id);
        if (res.ok && res.data.deleted) {
          set(s => ({bots: s.bots.filter(b => b.id !== id)}));
          await cacheSetString(CACHE_KEY, JSON.stringify(get().bots));
        }
        return res;
      } finally {
        set(s => {
          const next = {...s.busy};
          delete next[key];
          return {busy: next};
        });
      }
    });
  },

  clear: () => {
    set({bots: [], lastFetch: 0, offline: false, loading: false, busy: {}});
    inflight.clear();
    fireAndForget(cacheDelete(CACHE_KEY));
  },
}));

registerMemberDataCleaner(() => {
  useBotsStore.getState().clear();
});
