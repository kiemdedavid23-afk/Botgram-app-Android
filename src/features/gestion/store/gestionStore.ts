/**
 * Store Gestion : sessions Worker + fuseau local (MMKV).
 * Notifications reportées étape 8.
 */
import {create} from 'zustand';
import {
  listSessions,
  revokeSession as apiRevoke,
  logoutAllSessions as apiLogoutAll,
  type Session,
} from '../../../core/api/endpoints/sessions';
import {
  cacheGetString,
  cacheSetString,
  cacheDelete,
} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {applySignedOut} from '../../auth';

const TZ_KEY = 'gestion.timezone';

type GestionStore = {
  sessions: Session[];
  sessionsLoaded: boolean;
  sessionsLoading: boolean;
  timezone: string;
  generation: number;
  loadSessions: () => Promise<'ok' | 'error'>;
  revokeSession: (id: string) => Promise<'ok' | 'error'>;
  logoutAllSessions: () => Promise<'ok' | 'error'>;
  setTimezone: (tz: string) => void;
  hydrateTimezone: () => Promise<void>;
  clear: () => void;
};

export const useGestionStore = create<GestionStore>((set, get) => ({
  sessions: [],
  sessionsLoaded: false,
  sessionsLoading: false,
  timezone: 'auto',
  generation: 0,

  hydrateTimezone: async () => {
    const raw = await cacheGetString(TZ_KEY);
    if (raw) set({timezone: raw});
  },

  setTimezone: tz => {
    set({timezone: tz});
    cacheSetString(TZ_KEY, tz).catch(() => {});
  },

  loadSessions: async () => {
    const gen = get().generation;
    set({sessionsLoading: true});
    const res = await listSessions();
    if (get().generation !== gen) return 'error';
    set({sessionsLoading: false});
    if (!res.ok) return 'error';
    set({sessions: res.data.items, sessionsLoaded: true});
    return 'ok';
  },

  revokeSession: async id => {
    const gen = get().generation;
    const res = await apiRevoke(id);
    if (get().generation !== gen) return 'error';
    if (!res.ok) return 'error';
    set({
      sessions: get().sessions.filter(s => s.id !== id),
    });
    return 'ok';
  },

  logoutAllSessions: async () => {
    const gen = get().generation;
    const res = await apiLogoutAll();
    if (get().generation !== gen) return 'error';
    if (!res.ok) return 'error';
    await applySignedOut();
    set({sessions: [], sessionsLoaded: true});
    return 'ok';
  },

  clear: () =>
    set(s => ({
      sessions: [],
      sessionsLoaded: false,
      sessionsLoading: false,
      timezone: 'auto',
      generation: s.generation + 1,
    })),
}));

registerMemberDataCleaner(() => {
  useGestionStore.getState().clear();
  cacheDelete(TZ_KEY).catch(() => {});
});
