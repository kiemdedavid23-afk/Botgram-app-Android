/** Notification touchée, en attente d'une session ouverte et de la navigation. */
import {create} from 'zustand';
import type {PushPayload} from '../core/push';

type PushTargetStore = {
  target: PushPayload | null;
  setTarget: (p: PushPayload | null) => void;
};

export const usePushTargetStore = create<PushTargetStore>(set => ({
  target: null,
  setTarget: target => set({target}),
}));
