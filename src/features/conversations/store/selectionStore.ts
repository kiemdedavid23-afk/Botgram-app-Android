/**
 * Mode sélection de la liste des échanges (comme Telegram) : barre d'actions en haut,
 * lignes cochées. Activé depuis le menu ⋮ « Sélectionner ».
 */
import {create} from 'zustand';

type SelectionStore = {
  active: boolean;
  ids: Record<string, true>;
  /** Entre dans le mode (aucune ligne cochée au départ). */
  enter: () => void;
  /** Coche / décoche ; décocher la dernière ligne quitte le mode. */
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  exit: () => void;
};

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  active: false,
  ids: {},

  enter() {
    set({active: true, ids: {}});
  },

  toggle(id) {
    const ids = {...get().ids};
    if (ids[id]) delete ids[id];
    else ids[id] = true;
    if (Object.keys(ids).length === 0) {
      set({active: false, ids: {}});
    } else {
      set({active: true, ids});
    }
  },

  selectAll(list) {
    const ids: Record<string, true> = {};
    for (const id of list) ids[id] = true;
    set({active: true, ids});
  },

  exit() {
    set({active: false, ids: {}});
  },
}));
