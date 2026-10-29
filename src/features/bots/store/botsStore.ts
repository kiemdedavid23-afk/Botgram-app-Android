/** Store bots : single-flight, cache TTL 3 min, génération anti-fuite. */
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
import {useBotPhotoStore} from '../../../shared/botPhoto/botPhotoStore';

const CACHE_KEY = 'bots.list';
/** Bot choisi hors ligne, à confirmer auprès du serveur dès le retour du réseau. */
const PENDING_SELECT_KEY = 'bots.pendingSelect';
const TTL_MS = 3 * 60 * 1000;

type BotsStore = {
  bots: Bot[];
  loading: boolean;
  offline: boolean;
  lastFetch: number;
  generation: number;
  busy: Record<string, boolean>;
  /** Charge la liste depuis le cache local uniquement (aucun réseau). */
  hydrate: () => Promise<void>;
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

const inflight = new Map<string, Promise<unknown>>();

function parseBotsCache(raw: string | undefined): Bot[] | null {
  if (!raw) return null;
  try {
    const p: unknown = JSON.parse(raw);
    return Array.isArray(p) ? (p as Bot[]) : null;
  } catch {
    return null;
  }
}

async function withSingleFlight<T>(
  key: string,
  run: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = run().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}

async function persistBots(bots: Bot[]): Promise<void> {
  await cacheSetString(CACHE_KEY, JSON.stringify(bots));
}

export const useBotsStore = create<BotsStore>((set, get) => {
  const current = (gen: number) => get().generation === gen;

  const markBusy = (key: string, on: boolean) => {
    set(s => {
      const busy = {...s.busy};
      if (on) busy[key] = true;
      else delete busy[key];
      return {busy};
    });
  };

  async function runBotAction(
    key: string,
    request: () => Promise<HttpResult<{bot: Bot}>>,
    mapList?: (bots: Bot[], bot: Bot) => Bot[],
  ): Promise<HttpResult<{bot: Bot}>> {
    return withSingleFlight(key, async () => {
      const gen = get().generation;
      markBusy(key, true);
      try {
        const res = await request();
        if (!current(gen)) return res;
        if (res.ok) {
          const bot = res.data.bot;
          const next = mapList
            ? mapList(get().bots, bot)
            : get().bots.map(b => (b.id === bot.id ? bot : b));
          set({bots: next});
          if (current(gen)) await persistBots(next);
        }
        return res;
      } finally {
        if (current(gen)) markBusy(key, false);
      }
    });
  }

  return {
    bots: [],
    loading: false,
    offline: false,
    lastFetch: 0,
    generation: 0,
    busy: {},

    hydrate: async () => {
      if (get().bots.length > 0) return;
      const gen = get().generation;
      const parsed = parseBotsCache(await cacheGetString(CACHE_KEY));
      if (!current(gen) || get().bots.length > 0) return;
      if (parsed?.length) set({bots: parsed});
    },

    load: async (force = false) => {
      await withSingleFlight('load', async () => {
        const gen = get().generation;
        const now = Date.now();
        const {lastFetch, bots} = get();
        if (!force && bots.length > 0 && now - lastFetch < TTL_MS) return;
        if (!current(gen)) return;
        set({loading: true});
        if (bots.length === 0) {
          const cached = await cacheGetString(CACHE_KEY);
          if (!current(gen)) return;
          const parsed = parseBotsCache(cached);
          if (parsed?.length) set({bots: parsed});
        }
        const res = await listBots();
        if (!current(gen)) return;
        if (res.ok) {
          let list = res.data.bots;
          // Choix fait hors ligne : il prime sur la valeur du serveur, puis on le lui envoie.
          const pending = await cacheGetString(PENDING_SELECT_KEY);
          if (!current(gen)) return;
          if (pending && list.some(b => b.id === pending)) {
            list = list.map(b => ({...b, selected: b.id === pending}));
            fireAndForget(
              apiSelectBot(pending).then(r => {
                if (r.ok || (r.status > 0 && r.status < 500)) {
                  fireAndForget(cacheDelete(PENDING_SELECT_KEY));
                }
              }),
            );
          } else if (pending) {
            fireAndForget(cacheDelete(PENDING_SELECT_KEY));
          }
          set({bots: list, lastFetch: Date.now(), offline: false, loading: false});
          await persistBots(list);
        } else if (res.status === 0 || res.status >= 500) {
          set({offline: true, loading: false});
        } else set({loading: false});
      });
    },

    setMuted: (id, muted) =>
      runBotAction(`muted:${id}:${muted}`, () => apiSetMuted(id, muted)),

    /**
     * Sélection locale d'abord (instantanée, fonctionne hors ligne), puis
     * confirmation serveur. Sans réseau, le choix est gardé et renvoyé plus tard.
     */
    select: id =>
      withSingleFlight(`select:${id}`, async () => {
        const key = `select:${id}`;
        const gen = get().generation;
        const previous = get().bots;
        const target = previous.find(b => b.id === id);
        if (!target) return apiSelectBot(id);
        const optimistic = previous.map(b => ({...b, selected: b.id === id}));
        markBusy(key, true);
        try {
          set({bots: optimistic});
          await persistBots(optimistic);
          const res = await apiSelectBot(id);
          if (!current(gen)) return res;
          if (res.ok) {
            const next = get().bots.map(b =>
              b.id === res.data.bot.id ? res.data.bot : {...b, selected: false},
            );
            set({bots: next});
            await persistBots(next);
            await cacheDelete(PENDING_SELECT_KEY);
            return res;
          }
          if (res.status === 0 || res.status >= 500) {
            await cacheSetString(PENDING_SELECT_KEY, id);
            return {
              ok: true as const,
              data: {bot: {...target, selected: true}},
              requestId: null,
              status: 0,
              headers: new Headers(),
            };
          }
          // Refus réel du serveur : on annule le choix local.
          set({bots: previous});
          await persistBots(previous);
          return res;
        } finally {
          if (current(gen)) markBusy(key, false);
        }
      }),

    retryWebhook: id =>
      runBotAction(`retry:${id}`, () => apiRetryWebhook(id)),

    resyncWebhook: id =>
      runBotAction(`resync:${id}`, () => apiResyncWebhook(id)),

    disconnect: (id, dropPending = false) =>
      runBotAction(`disconnect:${id}`, () =>
        apiDisconnectBot(id, dropPending),
      ),

    deleteBot: id =>
      withSingleFlight(`delete:${id}`, async () => {
        const gen = get().generation;
        const key = `delete:${id}`;
        markBusy(key, true);
        try {
          const res = await apiDeleteBot(id);
          if (!current(gen)) return res;
          if (res.ok && res.data.deleted) {
            const next = get().bots.filter(b => b.id !== id);
            set({bots: next});
            // Bot supprimé : sa photo en cache disparaît aussi.
            fireAndForget(useBotPhotoStore.getState().forget(id));
            if (current(gen)) await persistBots(next);
          }
          return res;
        } finally {
          if (current(gen)) markBusy(key, false);
        }
      }),

    clear: () => {
      set(s => ({
        bots: [], lastFetch: 0, offline: false, loading: false, busy: {},
        generation: s.generation + 1,
      }));
      inflight.clear();
      fireAndForget(cacheDelete(CACHE_KEY));
      fireAndForget(cacheDelete(PENDING_SELECT_KEY));
    },
  };
});

registerMemberDataCleaner(() => {
  useBotsStore.getState().clear();
});
