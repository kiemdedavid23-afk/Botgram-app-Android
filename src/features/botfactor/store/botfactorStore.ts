/** Store Botfactor : fil de messages, bot ciblé et flux en cours (mémoire seulement). */
import {create} from 'zustand';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import type {FactorAction, FactorMessage, FlowData} from '../types';

let seq = 0;
const nextId = (): string => `bf${++seq}`;

type BotfactorStore = {
  messages: FactorMessage[];
  /** Bot ciblé ; null = bot sélectionné dans l'app. */
  targetBotId: string | null;
  action: FactorAction | null;
  stepIndex: number;
  data: FlowData;
  busy: boolean;
  /** Dernière activité, pour la position dans la liste Échanges. */
  lastAt: number;
  lastText: string | null;
  push: (m: Omit<FactorMessage, 'id'>) => void;
  setTarget: (id: string | null) => void;
  startFlow: (action: FactorAction) => void;
  goToStep: (index: number, data: FlowData) => void;
  endFlow: () => void;
  setBusy: (busy: boolean) => void;
  reset: () => void;
};

export const useBotfactorStore = create<BotfactorStore>(set => ({
  messages: [],
  targetBotId: null,
  action: null,
  stepIndex: 0,
  data: {},
  busy: false,
  lastAt: 0,
  lastText: null,
  push: m =>
    set(s => ({
      messages: [...s.messages, {...m, id: nextId()}],
      lastAt: Date.now(),
      lastText: m.text,
    })),
  setTarget: id => set({targetBotId: id}),
  startFlow: action => set({action, stepIndex: 0, data: {}}),
  goToStep: (stepIndex, data) => set({stepIndex, data}),
  endFlow: () => set({action: null, stepIndex: 0, data: {}}),
  setBusy: busy => set({busy}),
  reset: () =>
    set({
      messages: [],
      targetBotId: null,
      action: null,
      stepIndex: 0,
      data: {},
      busy: false,
      lastAt: 0,
      lastText: null,
    }),
}));

registerMemberDataCleaner(() => {
  useBotfactorStore.getState().reset();
});
