/**
 * Store profil membre : PATCH /me, suppression en deux temps.
 * Champs inconnus non envoyés. ACCOUNT_CLEANUP_PENDING → réessayer même code.
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
import {clearMemberData} from '../../../core/utils/memberData';
import {clearTokens} from '../../../core/storage';

export type FieldErrors = Partial<
  Record<keyof PatchMeFields, string>
>;

export type DeletePhase = 'idle' | 'code_sent' | 'deleting' | 'done';

type MemberStore = {
  member: Member | null;
  fieldErrors: FieldErrors;
  saving: boolean;
  deletePhase: DeletePhase;
  deleteError: string | null;
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
  clear: () => void;
};

export const useMemberStore = create<MemberStore>(set => ({
  member: null,
  fieldErrors: {},
  saving: false,
  deletePhase: 'idle',
  deleteError: null,

  setMember: m => set({member: m}),

  updateProfile: async fields => {
    set({saving: true, fieldErrors: {}});
    try {
      const res = await patchMe(fields);
      if (res.ok) {
        set({member: res.data.member, saving: false});
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
      set({saving: false});
      return 'error';
    }
  },

  requestAccountDelete: async (uiLanguage = 'fr') => {
    set({deleteError: null});
    const res = await requestDelete(uiLanguage);
    if (res.ok) {
      set({deletePhase: 'code_sent'});
      return 'ok';
    }
    set({deleteError: res.error.code, deletePhase: 'idle'});
    return 'error';
  },

  confirmAccountDelete: async code => {
    set({deletePhase: 'deleting', deleteError: null});
    const res = await confirmDelete(code);
    if (res.ok && res.data.deleted) {
      await clearTokens();
      await clearMemberData();
      set({
        member: null,
        deletePhase: 'done',
        deleteError: null,
      });
      return 'ok';
    }
    if (res.error.code === 'CODE_INVALID') {
      set({deletePhase: 'code_sent', deleteError: 'CODE_INVALID'});
      return 'code_invalid';
    }
    if (res.error.code === 'ACCOUNT_CLEANUP_PENDING') {
      // même code reste valable : réessayer
      set({deletePhase: 'code_sent', deleteError: 'ACCOUNT_CLEANUP_PENDING'});
      return 'cleanup_pending';
    }
    set({deletePhase: 'code_sent', deleteError: res.error.code});
    return 'error';
  },

  clear: () =>
    set({
      member: null,
      fieldErrors: {},
      saving: false,
      deletePhase: 'idle',
      deleteError: null,
    }),
}));

registerMemberDataCleaner(() => {
  useMemberStore.getState().clear();
});
