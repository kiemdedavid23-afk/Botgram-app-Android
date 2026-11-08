/**
 * Couleur de marque de l'entreprise, choisie par la personne et gardée sur cet appareil
 * (cache MMKV). Une entrée par espace : { [workspaceId]: BrandId }.
 * Aucun appel réseau : le Worker n'a pas (encore) de champ « couleur » pour l'espace.
 */
import {create} from 'zustand';
import {cacheGetString, cacheSetString, cacheDelete} from '../../../core/storage';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {isBrandId, type BrandId} from '../company/companyPalette';

const CACHE_KEY = 'company.brand';

type BrandStore = {
  byWorkspace: Record<string, BrandId>;
  hydrated: boolean;
  generation: number;
  hydrate: () => Promise<void>;
  setBrand: (workspaceId: string, id: BrandId) => void;
  clear: () => void;
};

let hydrateInflight: Promise<void> | null = null;

/** Lit le cache en ignorant toute entrée invalide ; jamais d'exception. */
export function parseBrandCache(raw: string | undefined): Record<string, BrandId> {
  if (!raw) return {};
  try {
    const p: unknown = JSON.parse(raw);
    if (typeof p !== 'object' || p === null || Array.isArray(p)) return {};
    const out: Record<string, BrandId> = {};
    for (const [key, value] of Object.entries(p as Record<string, unknown>)) {
      if (isBrandId(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export const useBrandStore = create<BrandStore>((set, get) => ({
  byWorkspace: {},
  hydrated: false,
  generation: 0,

  hydrate: async () => {
    if (get().hydrated) return;
    if (hydrateInflight) return hydrateInflight;
    const gen = get().generation;
    hydrateInflight = (async () => {
      const parsed = parseBrandCache(await cacheGetString(CACHE_KEY));
      if (get().generation !== gen) return;
      // Un choix fait pendant la lecture l'emporte sur le cache.
      set({byWorkspace: {...parsed, ...get().byWorkspace}, hydrated: true});
    })().finally(() => {
      hydrateInflight = null;
    });
    return hydrateInflight;
  },

  setBrand: (workspaceId, id) => {
    const next = {...get().byWorkspace, [workspaceId]: id};
    set({byWorkspace: next});
    fireAndForget(cacheSetString(CACHE_KEY, JSON.stringify(next)));
  },

  clear: () => {
    set(s => ({byWorkspace: {}, hydrated: false, generation: s.generation + 1}));
    hydrateInflight = null;
    fireAndForget(cacheDelete(CACHE_KEY));
  },
}));

registerMemberDataCleaner(() => {
  useBrandStore.getState().clear();
});
