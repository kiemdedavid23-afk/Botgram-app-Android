/**
 * Store profil membre : PATCH /me, suppression en deux temps.
 * authStore.member est la référence ; setMember synchronise ici.
 * Génération anti-fuite après clear().
 * code_length vient de POST /me/delete/request (jamais 6 en dur).
 */
import {create} from 'zustand';
import {
  patchMe,
  requestDelete,
  confirmDelete,
  type PatchMeFields,
} from '../../../core/api/endpoints/member';
import type {Member} from '../../../core/api/endpoints/auth';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {applySignedOut, useAuthStore} from '../../auth';

export type FieldErrors = Partial<Record<keyof PatchMeFields, string>>;

export type DeletePhase = 'idle' | 'code_sent' | 'deleting' | 'done';

type MemberStore = {
  member: Member | null;
  fieldErrors: FieldErrors;
  saving: boolean;
  deletePhase: DeletePhase;
  deleteError: string | null;
  /** Longueur du code renvoyée par le Worker (POST /me/delete/request). */
  deleteCodeLength: number;
  generation: number;
  setMember: (m: Member | null) => void;
  updateProfile: (
    fields: PatchMeFields,
  ) => Promise<'ok' | 'validation' | 'error'>;
  requestAccountDelete: (
    uiLanguage?: 'fr' | 'en',
  ) => Promise<'ok' | 'error'>;
  confirmAccountDelete: (
    code: string,
  ) => Promise<'ok' | 'code_invalid' | 'cleanup_pending' | 'error'>;
  /** Remet la phase suppression à idle et efface le code côté UI. */
  resetDelete: () => void;
  clear: () => void;
};

export const useMemberStore = create<MemberStore>((set, get) => ({
  member: null,
  fieldErrors: {},
  saving: false,
  deletePhase: 'idle',
  deleteError: null,
  deleteCodeLength: 6,
  generation: 0,

  setMember: m => set({member: m}),

  updateProfile: async fields => {
    const gen = get().generation;
    set({saving: true, fieldErrors: {}});
    try {
      const res = await patchMe(fields);
      if (get().generation !== gen) return 'error';
      if (res.ok) {
        set({member: res.data.member, saving: false});
        useAuthStore.getState().setMember(res.data.member);
        return 'ok';
      }
      if (res.error.code === 'VALIDATION_ERROR') {
        const details = res.error.details as
          | {fields?: Record<string, string>}
          | undefined;
        const fe: FieldErrors = {};
        if (details?.fields) {
          for (const [k, v] of Object.entries(details.fields)) {
            if (
              k === 'display_name' ||
              k === 'country' ||
              k === 'usage' ||
              k === 'phone' ||
              k === 'organization'
            ) {
              fe[k] = v;
            }
          }
        }
        set({fieldErrors: fe, saving: false});
        return 'validation';
      }
      set({saving: false});
      return 'error';
    } catch {
      if (get().generation === gen) set({saving: false});
      return 'error';
    }
  },

  requestAccountDelete: async (uiLanguage = 'fr') => {
    const gen = get().generation;
    set({deleteError: null});
    const res = await requestDelete(uiLanguage);
    if (get().generation !== gen) return 'error';
    if (res.ok) {
      const len =
        typeof res.data.code_length === 'number' && res.data.code_length > 0
          ? res.data.code_length
          : 6;
      set({deletePhase: 'code_sent', deleteCodeLength: len});
      return 'ok';
    }
    set({deleteError: res.error.code, deletePhase: 'idle'});
    return 'error';
  },

  confirmAccountDelete: async code => {
    const gen = get().generation;
    set({deletePhase: 'deleting', deleteError: null});
    const res = await confirmDelete(code);
    if (get().generation !== gen) return 'error';
    if (res.ok) {
      if (res.data.deleted) {
        await applySignedOut();
        set({
          member: null,
          deletePhase: 'done',
          deleteError: null,
          deleteCodeLength: 6,
        });
        return 'ok';
      }
      set({deletePhase: 'code_sent', deleteError: null});
      return 'error';
    }
    if (res.error.code === 'CODE_INVALID') {
      set({deletePhase: 'code_sent', deleteError: 'CODE_INVALID'});
      return 'code_invalid';
    }
    if (res.error.code === 'ACCOUNT_CLEANUP_PENDING') {
      set({deletePhase: 'code_sent', deleteError: 'ACCOUNT_CLEANUP_PENDING'});
      return 'cleanup_pending';
    }
    set({deletePhase: 'code_sent', deleteError: res.error.code});
    return 'error';
  },

  resetDelete: () =>
    set({
      deletePhase: 'idle',
      deleteError: null,
      deleteCodeLength: 6,
    }),

  clear: () =>
    set(s => ({
      member: null,
      fieldErrors: {},
      saving: false,
      deletePhase: 'idle',
      deleteError: null,
      deleteCodeLength: 6,
      generation: s.generation + 1,
    })),
}));

registerMemberDataCleaner(() => {
  useMemberStore.getState().clear();
});
