/** Ouverture de l'écran Botfactor depuis la liste ou le profil (action facultative). */
import {create} from 'zustand';
import type {FactorAction} from '../types';

type Launcher = {
  open: boolean;
  /** Action à démarrer à l'ouverture (consommée par l'écran). */
  pending: FactorAction | null;
  openWith: (action?: FactorAction) => void;
  consumePending: () => FactorAction | null;
  close: () => void;
};

export const useBotfactorLauncher = create<Launcher>((set, get) => ({
  open: false,
  pending: null,
  openWith: action => set({open: true, pending: action ?? null}),
  consumePending: () => {
    const p = get().pending;
    if (p) set({pending: null});
    return p;
  },
  close: () => set({open: false, pending: null}),
}));
